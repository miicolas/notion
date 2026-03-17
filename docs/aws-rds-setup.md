# Configuration AWS RDS PostgreSQL

Guide pour configurer une base de données AWS RDS PostgreSQL pour le projet Notion.

## Prérequis

- Un compte AWS
- AWS CLI installé (optionnel)
- `psql` installé localement (`brew install libpq && brew link --force libpq`)

## 1. Créer l'instance RDS

1. Aller sur **AWS Console** > **RDS** > **Create database**
2. Remplir la configuration :

| Paramètre | Valeur |
|-----------|--------|
| Engine | PostgreSQL 15 ou 16 |
| Template | Free tier (dev) / Production (prod) |
| DB instance identifier | `notion-db` |
| Master username | `postgres` |
| Master password | Un mot de passe fort |
| Instance class | `db.t3.micro` (free tier) ou `db.t3.small`+ |
| Storage | 20 Go gp3 |
| Storage autoscaling | Activé |

3. Section **Connectivity** :

| Paramètre | Valeur |
|-----------|--------|
| VPC | Default ou VPC custom |
| Public access | Yes (dev) / No (prod) |
| Security group | Nouveau ou existant |
| Port | `5432` |

4. Section **Additional configuration** :
   - **Initial database name** : `notion`
   - Backups automatiques : désactiver en dev, activer en prod

5. Cliquer **Create database** et attendre ~5 minutes.

## 2. Configurer le Security Group

Le security group doit autoriser les connexions entrantes sur le port PostgreSQL.

1. Aller dans **EC2** > **Security Groups** > sélectionner le SG du RDS
2. **Inbound rules** > **Edit** > **Add rule** :

| Type | Port | Source |
|------|------|--------|
| PostgreSQL | 5432 | `My IP` (dev local) |
| PostgreSQL | 5432 | SG de l'app server (prod) |

> **Sécurité** : ne jamais ouvrir le port 5432 à `0.0.0.0/0` en production.

## 3. Récupérer l'endpoint

Une fois l'instance disponible :

1. Aller dans **RDS** > **Databases** > `notion-db`
2. Copier l'**Endpoint**, par exemple :

```
notion-db.xxxxxxxxxxxx.eu-west-3.rds.amazonaws.com
```

## 4. Configurer le projet

Modifier le fichier `apps/api/.env` :

```bash
# Remplacer la DATABASE_URL locale
DATABASE_URL=postgresql://postgres:MOT_DE_PASSE@ENDPOINT:5432/notion
```

Exemple concret :

```bash
DATABASE_URL=postgresql://postgres:SuperSecret123@notion-db.abcdefghijkl.eu-west-3.rds.amazonaws.com:5432/notion
```

### Format de la connection string

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?options
```

## 5. Tester la connexion

```bash
# Via psql
psql "$DATABASE_URL"

# Ou directement
psql "postgresql://postgres:MOT_DE_PASSE@notion-db.xxxx.eu-west-3.rds.amazonaws.com:5432/notion"
```

## 6. Lancer les migrations

Depuis le dossier `apps/api` :

```bash
# Appliquer les migrations existantes
bunx drizzle-kit migrate

# Ou pousser le schema directement (dev)
bunx drizzle-kit push
```

## 7. Lancer le projet

```bash
# Depuis la racine du monorepo
bun dev
```

L'API se connecte automatiquement à RDS via la `DATABASE_URL`.

## Bonnes pratiques pour la production

### Connexion SSL

Ajouter `?sslmode=require` à la connection string :

```bash
DATABASE_URL=postgresql://postgres:PASSWORD@ENDPOINT:5432/notion?sslmode=require
```

### Checklist production

- [ ] **Public access** : désactivé — app et DB dans le même VPC
- [ ] **SSL** : `sslmode=require` activé
- [ ] **Backups** : automated backups activés (7 jours minimum)
- [ ] **Multi-AZ** : activé pour la haute disponibilité
- [ ] **Secrets** : mots de passe dans AWS Secrets Manager ou SSM Parameter Store
- [ ] **Monitoring** : Enhanced Monitoring + alertes CloudWatch
- [ ] **Security Group** : accès restreint au SG de l'app uniquement

### Estimation des coûts (eu-west-3)

| Ressource | Free tier | Production |
|-----------|-----------|------------|
| `db.t3.micro` | Gratuit 12 mois | ~15 $/mois |
| `db.t3.small` | — | ~30 $/mois |
| Storage 20 Go gp3 | Gratuit 12 mois | ~2.50 $/mois |
| Backups | 20 Go gratuits | ~0.10 $/Go/mois |
| Multi-AZ | — | x2 le coût instance |

## Dépannage

### Impossible de se connecter

1. Vérifier que **Public access** est activé (dev)
2. Vérifier le **Security Group** : ton IP est-elle autorisée ?
3. Vérifier que l'instance est dans l'état **Available**
4. Tester avec : `nc -zv ENDPOINT 5432`

### Timeout de connexion

- Le security group bloque probablement le trafic
- Vérifier qu'il n'y a pas de VPN/firewall local qui bloque le port 5432

### Erreur d'authentification

- Vérifier le mot de passe (pas de caractères spéciaux non échappés dans l'URL)
- Encoder les caractères spéciaux : `@` → `%40`, `#` → `%23`, etc.
