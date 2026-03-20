# AWS Backup Cron — EventBridge + Lambda

Système de sauvegarde automatique de la base de données PostgreSQL, déclenché par AWS EventBridge Scheduler et exécuté via une Lambda.

## Architecture

```
┌──────────────────────┐       ┌──────────────────┐       ┌──────────────┐
│  EventBridge         │       │  Lambda           │       │  API Server  │
│  Scheduler           │──────▶│  backup-cron      │──────▶│  /api/cron/  │
│  (rate/cron)         │       │  (Node.js 20)     │       │  backup      │
└──────────────────────┘       └──────────────────┘       └──────┬───────┘
                                                                  │
                                                           ┌──────▼───────┐
                                                           │  SQL natif   │
                                                           │  (SELECT +   │
                                                           │   json_agg)  │
                                                           │  + gzip      │
                                                           └──────┬───────┘
                                                                  │
                                                           ┌──────▼───────┐
                                                           │  AWS S3      │
                                                           │  (backup     │
                                                           │   storage)   │
                                                           └──────────────┘
```

### Flux

1. **EventBridge Scheduler** déclenche la Lambda selon un schedule (ex: toutes les heures)
2. **Lambda `backup-cron`** fait un `POST /api/cron/backup` avec le header `x-cron-secret`
3. **L'API** vérifie le secret, génère un fichier **SQL logique** (données uniquement : `json_agg` / `json_populate_recordset` via `pg`, sans `pg_dump`), compresse en gzip et upload sur S3
4. Le résultat est enregistré dans la table `db_backup` en base

## Variables d'environnement

### Sur l'API (apps/api)

| Variable | Description | Requis |
|----------|-------------|--------|
| `CRON_SECRET` | Secret partagé pour authentifier les requêtes cron | Oui (prod) |
| `BACKUP_DATABASE_URL` | URL de la DB à sauvegarder (défaut: `DATABASE_URL`) | Non |
| `BACKUP_S3_BUCKET` | Nom du bucket S3 pour les backups | Oui |
| `S3_REGION` | Région AWS du bucket (défaut: `eu-west-3`) | Non |

### Sur la Lambda

| Variable | Description |
|----------|-------------|
| `API_URL` | URL de base de l'API (ex: `https://api.example.com`) |
| `CRON_SECRET` | Même secret que sur l'API |

## Déploiement

### Prérequis

- AWS CLI configuré avec les bonnes permissions
- `jq` installé
- `zip` installé

### 1. Générer un CRON_SECRET

```bash
openssl rand -hex 32
```

Ajouter ce secret dans les variables d'environnement de l'API **ET** de la Lambda.

### 2. Déployer avec le script

```bash
# Staging — backup toutes les heures (défaut)
./infrastructure/scripts/deploy-backup-cron.sh \
  staging \
  https://api.staging.example.com \
  YOUR_CRON_SECRET

# Production — backup toutes les 6 heures
./infrastructure/scripts/deploy-backup-cron.sh \
  production \
  https://api.example.com \
  YOUR_CRON_SECRET \
  "rate(6 hours)"

# Production — backup quotidien à 2h du matin UTC
./infrastructure/scripts/deploy-backup-cron.sh \
  production \
  https://api.example.com \
  YOUR_CRON_SECRET \
  "cron(0 2 * * ? *)"
```

### 3. Déploiement manuel (CloudFormation)

Si tu préfères déployer manuellement :

```bash
# 1. Packager la Lambda
cd infrastructure/lambda/backup-cron
zip backup-cron.zip index.mjs

# 2. Upload sur S3
aws s3 cp backup-cron.zip s3://YOUR_BUCKET/lambda/backup-cron.zip

# 3. Déployer le stack CloudFormation
aws cloudformation deploy \
  --template-file infrastructure/cloudformation/backup-cron.yml \
  --stack-name staging-backup-cron \
  --region eu-west-1 \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    Environment=staging \
    ApiUrl=https://api.staging.example.com \
    CronSecret=YOUR_SECRET \
    ScheduleExpression="rate(1 hour)" \
    LambdaS3Bucket=YOUR_BUCKET \
    LambdaS3Key=lambda/backup-cron.zip
```

## Expressions de schedule

EventBridge supporte deux formats :

### Rate expressions

```
rate(1 hour)       # Toutes les heures
rate(6 hours)      # Toutes les 6 heures
rate(1 day)        # Tous les jours
rate(12 hours)     # Toutes les 12 heures
```

### Cron expressions (6 champs — format AWS)

Format: `cron(minutes heures jour-du-mois mois jour-de-la-semaine année)`

```
cron(0 2 * * ? *)       # Tous les jours à 2h UTC
cron(0 */6 * * ? *)     # Toutes les 6 heures
cron(0 0 * * ? *)       # Tous les jours à minuit UTC
cron(0 3 ? * MON *)     # Tous les lundis à 3h UTC
cron(0 2,14 * * ? *)    # À 2h et 14h UTC
```

> **Note** : Le format AWS utilise 6 champs (avec année) et `?` pour jour-du-mois ou jour-de-la-semaine. C'est différent du cron Unix classique (5 champs).

## Fonctionnement local (dev)

En développement (sans `CRON_SECRET`), le système utilise `node-cron` comme fallback :

- Le scheduler local se lance au démarrage du serveur API
- La config lit la table `backup_config` (mise à jour directe en base de données)
- Les backups utilisent le même service (`runBackup()`)

Quand `CRON_SECRET` est défini, `node-cron` est désactivé automatiquement et les backups sont gérés par EventBridge.

## Monitoring

### CloudWatch Logs

Les logs de la Lambda sont dans le groupe : `/aws/lambda/{environment}-backup-cron`

```bash
# Voir les logs récents
aws logs tail /aws/lambda/staging-backup-cron --follow
```

### Vérifier le schedule

```bash
# Lister les schedules EventBridge
aws scheduler list-schedules --region eu-west-1

# Voir les détails d'un schedule
aws scheduler get-schedule \
  --name staging-backup-cron-schedule \
  --region eu-west-1
```

### Tester manuellement

```bash
# Invoquer la Lambda manuellement
aws lambda invoke \
  --function-name staging-backup-cron \
  --region eu-west-1 \
  /dev/stdout

# Ou appeler directement l'API
curl -X POST https://api.staging.example.com/api/cron/backup \
  -H "x-cron-secret: YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

## Structure des fichiers

```
infrastructure/
├── cloudformation/
│   └── backup-cron.yml          # Template CloudFormation (EventBridge + Lambda)
├── lambda/
│   └── backup-cron/
│       └── index.mjs            # Code de la Lambda
├── scripts/
│   └── deploy-backup-cron.sh    # Script de déploiement automatisé
└── environments/
    ├── staging/config.json      # Config staging (inclut backupCron)
    └── production/config.json   # Config production (inclut backupCron)

apps/api/src/
├── routes/
│   └── cron-backup.ts           # Endpoint POST /api/cron/backup
├── services/
│   ├── backup.ts                # Service de backup (SQL natif + gzip + S3)
│   └── backup-cron.ts           # Scheduler local (dev) / détection EventBridge (prod)
└── env.ts                       # CRON_SECRET env var
```

## Supprimer le stack

```bash
aws cloudformation delete-stack \
  --stack-name staging-backup-cron \
  --region eu-west-1
```
