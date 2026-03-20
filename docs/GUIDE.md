# Guide global — commandes et explications

Document unique pour développer, tester, déployer et présenter le monorepo. **Gestionnaire de paquets : Bun** (voir `packageManager` à la racine).

---

## Sommaire

1. [Prérequis](#1-prérequis)
2. [Variables d’environnement](#2-variables-denvironnement)
3. [Commandes monorepo (racine)](#3-commandes-monorepo-racine)
4. [Développement local par application](#4-développement-local-par-application)
5. [Qualité de code (lint, types, format)](#5-qualité-de-code-lint-types-format)
6. [Base de données et migrations](#6-base-de-données-et-migrations)
7. [Tester l’API (ex. Postman)](#7-tester-lapi-ex-postman)
8. [Déploiement manuel (AWS)](#8-déploiement-manuel-aws)
9. [CI / CD (GitHub Actions)](#9-ci--cd-github-actions)
10. [Environnements (staging / production)](#10-environnements-staging--production)
11. [Fonctionnalités à démontrer](#11-fonctionnalités-à-démontrer)
12. [Backups et cron (local et AWS)](#12-backups-et-cron-local-et-aws)
13. [Logs](#13-logs)
14. [Auth : Cognito vs ce projet](#14-auth--cognito-vs-ce-projet)
15. [Dev Container](#15-dev-container)
16. [Références docs](#16-références-docs)

---

## 1. Prérequis

| Outil | Rôle |
|-------|------|
| **Bun** (≥ version du `package.json` racine) | Install, scripts, build API Lambda |
| **Node** ≥ 20 | Compatibilité déclarée dans le repo |
| **PostgreSQL** | Données applicatives + Better Auth |
| **`psql`** | Script de migrations shell (`infrastructure/scripts/migrate.sh`) |
| **AWS CLI** (`aws configure`) | Déploiements Lambda, S3, CloudFront |
| **Docker** (optionnel) | Dev Container (VS Code / Cursor) |

**Installation des dépendances** (depuis la racine du clone) :

```bash
bun install
```

---

## 2. Variables d’environnement

L’API charge la config depuis `apps/api/src/env.ts`. En pratique, un fichier **`.env` à la racine** est pris en charge via `dotenv` dans `apps/api/src/index.ts`.

### Obligatoires (API)

| Variable | Rôle |
|----------|------|
| `DATABASE_URL` | Connexion PostgreSQL |
| `BETTER_AUTH_SECRET` | Secret Better Auth |
| `BETTER_AUTH_URL` | URL de base du service d’auth (souvent l’URL publique de l’API, ex. `http://localhost:3001`) |
| `MIGRATE_PASSWORD` | **Obligatoire au chargement de `env.ts`** (l’API refuse de démarrer sans cette variable) |
| `S3_ASSETS_BUCKET` | Bucket S3 pour les fichiers (presign upload pièces jointes) |

### Optionnelles / courantes

| Variable | Défaut / note |
|----------|----------------|
| `PORT` | `3001` |
| `CORS_ORIGINS` | `http://localhost:3000` (liste séparée par virgules si plusieurs origines) |
| `FRONTEND_URL` | `http://localhost:3000` — utilisé pour les liens d’invitation |
| `SES_FROM_EMAIL` | Expéditeur emails (invitations) si SES configuré |
| `BACKUP_DATABASE_URL` | Si non défini, retombe sur `DATABASE_URL` |
| `BACKUP_S3_BUCKET` | Destination des backups SQL gzip (données, requêtes natives — pas `pg_dump`) ; peut être vide en dev minimal |
| `S3_REGION` | `eu-west-3` par défaut dans `env.ts` |
| `CRON_SECRET` | Vide en local : active **node-cron** dans l’API. **Défini en prod** : désactive le scheduler local ; les backups planifiés passent par **EventBridge → Lambda** → `POST /api/cron/backup` (voir [aws-backup-cron.md](./aws-backup-cron.md)) |

### Frontends (`apps/web`, `apps/admin`)

En **build** production, la CI injecte typiquement :

- `VITE_API_URL` — URL de l’API accessible depuis le navigateur.

En local, la valeur dépend de votre fichier env Vite (souvent `.env` / `.env.local` avec préfixe `VITE_`).

---

## 3. Commandes monorepo (racine)

À lancer depuis **`/`** (racine du repo) :

| Commande | Explication |
|----------|-------------|
| `bun install` | Installe toutes les workspaces (`apps/*`, `packages/*`) |
| `bun dev` | Lance **turbo dev** : tous les paquets qui exposent un script `dev` (utile si tout est câblé dans `turbo.json`) |
| `bun run build` | Build de tout le monorepo via Turbo |
| `bun run lint` | ESLint sur les paquets configurés |
| `bun run typecheck` | Vérification TypeScript |
| `bun run format` | Prettier |

**Filtrer un seul paquet** (exemples) :

```bash
bunx turbo run dev --filter=web
bunx turbo run dev --filter=api
bunx turbo run dev --filter=admin
bunx turbo run build --filter=web
```

---

## 4. Développement local par application

### API (`apps/api`)

```bash
cd apps/api
bun run dev
```

- **Explication :** démarre le serveur Hono avec `@hono/node-server` en mode watch (`tsx watch`).
- **URL :** [http://localhost:3001](http://localhost:3001) (sauf si `PORT` est changé).

### Site utilisateur (`apps/web`)

```bash
cd apps/web
bun run dev
```

- **Explication :** Vite sur le **port 3000** (voir `package.json` du paquet `web`).
- **URL :** [http://localhost:3000](http://localhost:3000)

### Site admin (`apps/admin`)

```bash
cd apps/admin
bun run dev
```

- **Explication :** Vite sur le **port 3002**.
- **URL :** [http://localhost:3002](http://localhost:3002)

### Ordre conseillé pour une démo locale

1. PostgreSQL démarré + migrations appliquées (section 6).  
2. `bun run dev` dans `apps/api`.  
3. `bun run dev` dans `apps/web` (et éventuellement `apps/admin`).

---

## 5. Qualité de code (lint, types, format)

```bash
# Racine
bun run lint
bun run typecheck
bun run format
```

**Explication :** même contrôle que la CI (voir `.github/workflows/ci.yml` : `bun run lint` puis `bun run typecheck`).

Par paquet, vous pouvez aussi :

```bash
cd apps/web && bun run lint
cd apps/api && bun run build    # tsc — vérifie la compilation API
```

---

## 6. Base de données et migrations

### Script shell (SQL dans `apps/api/migrations`)

Utilise `psql` et une table `_migrations` pour ne pas réappliquer les fichiers `.sql`.

```bash
export DATABASE_URL="postgresql://utilisateur:motdepasse@localhost:5432/nom_base"
chmod +x infrastructure/scripts/migrate.sh
./infrastructure/scripts/migrate.sh
```

**Explication :** parcourt les `*.sql` triés, applique ceux non enregistrés, idéal pour aligner une base locale ou une RDS avec le dépôt.

### Drizzle (génération / outils)

Depuis `apps/api` :

```bash
cd apps/api
bun run db:generate   # génère des migrations Drizzle à partir du schéma
bun run db:migrate    # Drizzle Kit migrate
bun run db:studio     # UI Drizzle Studio
```

**Quand utiliser quoi :** le déploiement CI exécute **`migrate.sh`** avant le deploy Lambda ; en local, choisissez **soit** le shell **soit** le flux Drizzle selon la convention de l’équipe, en évitant de mélanger sans documenter.

---

## 7. Tester l’API (ex. Postman)

| Étape | Commande / action |
|-------|-------------------|
| Démarrer l’API | `cd apps/api && bun run dev` |
| Santé simple | `GET http://localhost:3001/` → `{"message":"API is running"}` |

**Explication :** les routes métier sous `/api/*` sont en général **protégées** (session Better Auth). Pour les tester dans Postman, il faut reproduire les **cookies** de session après login, ou utiliser des routes publiques documentées côté Better Auth selon votre config.

---

## 8. Déploiement manuel (AWS)

Tous ces scripts sont faits pour être lancés **en local** (ta machine avec AWS CLI configurée), comme le font les workflows GitHub en automatisé.

### Migrations sur une base distante

```bash
export DATABASE_URL="postgresql://…"
./infrastructure/scripts/migrate.sh
```

### API — package ZIP + mise à jour Lambda

```bash
chmod +x infrastructure/scripts/deploy-api.sh
# Optionnel : JSON fusionné avec les variables existantes de la fonction
export LAMBDA_ENV_VARS='{"S3_ASSETS_BUCKET":"mon-bucket","FRONTEND_URL":"https://…"}'
./infrastructure/scripts/deploy-api.sh <nom-fonction-lambda>
```

**Explication :** `cd apps/api`, `bun run build:lambda`, zip de `dist/index.js`, puis `aws lambda update-function-code` et éventuellement `update-function-configuration` pour les variables.

### Front (user ou admin) — S3 + invalidation CloudFront

```bash
# Build avec l’URL d’API vue par le navigateur
cd apps/web
VITE_API_URL="https://votre-api.example.com" bun run build
cd ../..

chmod +x infrastructure/scripts/deploy-frontend.sh
./infrastructure/scripts/deploy-frontend.sh \
  apps/web/dist \
  <nom-bucket-s3-web> \
  <id-distribution-cloudfront>
```

Même chose pour l’admin en remplaçant `apps/web/dist` par `apps/admin/dist` et les identifiants **admin**.

**Explication :** synchronise `dist/assets` avec cache long, racine du `dist` avec `no-cache`, puis `cloudfront create-invalidation /*`.

### Fichiers statiques (logo, branding) — `deploy-assets.sh`

Déploie un dossier local vers un **préfixe** du bucket S3 (souvent le même que `S3_ASSETS_BUCKET`, ex. préfixe `static/`), sans passer par le build Vite.

```bash
chmod +x infrastructure/scripts/deploy-assets.sh

# Exemple : dossier fourni dans le repo + préfixe S3 "static"
./infrastructure/scripts/deploy-assets.sh \
  infrastructure/static-assets \
  nom-de-votre-bucket-assets \
  static
```

**Explication :** `aws s3 sync` avec `Cache-Control` public. Un exemple de logo est dans `infrastructure/static-assets/logo.svg`. Pour le site, préférez aussi intégrer le logo dans `apps/web` + `deploy-frontend.sh` si il doit être versionné avec l’app.

### Crons AWS (backup) — `deploy-crons.sh` / `deploy-backup-cron.sh`

Déploie la Lambda **backup-cron** et le schedule **EventBridge** (CloudFormation). Négociez le même `CRON_SECRET` que sur l’API Lambda principale.

```bash
chmod +x infrastructure/scripts/deploy-crons.sh
# ou : infrastructure/scripts/deploy-backup-cron.sh (même comportement)

./infrastructure/scripts/deploy-crons.sh \
  staging \
  https://api.staging.example.com \
  "$(openssl rand -hex 32)" \
  "rate(1 hour)"
```

**Explication :** empaquette `infrastructure/lambda/backup-cron/index.mjs`, envoie le zip sur S3, déploie `infrastructure/cloudformation/backup-cron.yml`. Détails : [aws-backup-cron.md](./aws-backup-cron.md).

**Test manuel de l’endpoint** (API avec `CRON_SECRET` défini) :

```bash
curl -X POST "$API_URL/api/cron/backup" \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

## 9. CI / CD (GitHub Actions)

| Fichier | Déclencheur | Rôle |
|---------|--------------|------|
| `.github/workflows/ci.yml` | Push / PR sur `main` et `dev` | `bun install`, `lint`, `typecheck` |
| `.github/workflows/deploy-production.yml` | Push sur **`main`** | Après CI : deploy web + admin + API (migrations + Lambda) |
| `.github/workflows/deploy-staging.yml` | Push sur **`dev`** | Idem pour staging |

**Démo « preuve par un push » :** pousser une branche cible, ouvrir l’onglet **Actions** du dépôt GitHub, montrer le graphe des jobs.

---

## 10. Environnements (staging / production)

- **Descripteurs** : `infrastructure/environments/staging/config.json` et `production/config.json` (buckets, CloudFront, nom Lambda — souvent des **placeholders** ; les vraies valeurs sont dans **GitHub Secrets**).
- **Secrets typiques** : `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `DATABASE_URL`, `PROD_*` / `STAGING_*` (URLs API, buckets, IDs CloudFront, nom Lambda), **`PROD_CRON_SECRET`** / **`STAGING_CRON_SECRET`** (même valeur que passée à `deploy-crons.sh`, pour `POST /api/cron/backup`).

---

## 11. Fonctionnalités à démontrer

| Sujet | Où / comment |
|-------|----------------|
| **Invitations** | Lien `FRONTEND_URL/invitations/accept?invitationId=…` ; membre / org dans **Paramètres** (`SettingsMembersPage`) ; email envoyé depuis `apps/api/src/auth.ts` si SES OK. |
| **Pièces jointes** | Issue détail : bouton d’ajout de fichier ; API `/api/assets` (presign S3 puis confirm). |
| **Site user en ligne** | URL CloudFront après deploy du bucket **web**. |
| **Site admin en ligne** | URL CloudFront bucket **admin**. |

---

## 12. Backups et cron (local et AWS)

### Local (sans `CRON_SECRET`)

```bash
cd apps/api
bun run dev
```

**Explication :** `startBackupCron()` utilise **node-cron** selon la table `backup_config` (modifiable directement en base). Backup immédiat : `POST /api/cron/backup` avec le header `x-cron-secret` (voir section **Production** ci‑dessous ; en local, définir `CRON_SECRET` pour utiliser le même endpoint).

### Production (avec `CRON_SECRET`)

Quand `CRON_SECRET` est défini sur l’API, **node-cron est désactivé** ; les sauvegardes planifiées sont déclenchées par **EventBridge → Lambda** → `POST /api/cron/backup` avec le header `x-cron-secret`. Déploiement infra : **section 8** (`deploy-crons.sh`) et [aws-backup-cron.md](./aws-backup-cron.md).

---

## 13. Logs

| Contexte | Où regarder |
|----------|-------------|
| API locale | Sortie terminal (`console.log` / erreurs, préfixe `[backup-cron]` possible). |
| Lambda déployée | **Amazon CloudWatch Logs** pour la fonction concernée. |

---

## 14. Auth : Cognito vs ce projet

**Résumé court :** Cognito = identité managée AWS ; ce projet utilise **Better Auth + PostgreSQL**. Détail pédagogique : [cognito-overview.md](./cognito-overview.md).

---

## 15. Dev Container

Le dossier **`.devcontainer/`** fournit Bun, client PostgreSQL, `zip` et `jq`, plus un service **Postgres 16** (docker-compose).

| Action | Commande / menu |
|--------|------------------|
| Ouvrir dans le conteneur | **Dev Containers: Reopen in Container** |
| Rebuild complet | **Dev Containers: Rebuild Container** |
| Rebuild sans cache | **Dev Containers: Rebuild Container Without Cache** |

Variables d’exemple dans le compose : `DATABASE_URL=postgresql://postgres:postgres@db:5432/notion` (hôte `db`, pas `localhost`, depuis le conteneur **app**).

Après ouverture : à la racine `/workspace`, `bun install` (ou **postCreateCommand** déjà défini), puis migrations et `bun run dev` dans les apps.

---

## 16. Références docs

| Fichier | Contenu |
|---------|---------|
| [aws-backup-cron.md](./aws-backup-cron.md) | EventBridge, Lambda backup, `CRON_SECRET`, test `curl` |
| [cognito-overview.md](./cognito-overview.md) | Cognito et comparaison avec Better Auth |

---

## Checklist rapide avant une démo

- [ ] `bun install` à la racine  
- [ ] `DATABASE_URL` et secrets Better Auth définis  
- [ ] `./infrastructure/scripts/migrate.sh` exécuté au moins une fois  
- [ ] API + web (+ admin si besoin) démarrés  
- [ ] Pour déploiement manuel : AWS CLI et noms de ressources (bucket, CloudFront, Lambda)  
