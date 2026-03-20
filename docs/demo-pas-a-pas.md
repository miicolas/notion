# Démo et déploiement — guide pas à pas

Tu enchaînes **les commandes à la main**, dans l’ordre.

## Avant de commencer

**Racine du dépôt** = dossier qui contient `apps/`, `infrastructure/`, `package.json`. Dans les blocs ci‑dessous, on la pose une fois au début de chaque étape qui utilise des chemins `infrastructure/…` ou `apps/…` :

```bash
cd "$(git rev-parse --show-toplevel)"
```

**Pourquoi** : si tu restes dans `apps/api` après l’étape 3, `./infrastructure/...` n’existe pas (erreur *No such file or directory*). Les scripts `deploy-*.sh` font un `cd` vers la racine **une fois lancés** ; il faut quand même pouvoir **les atteindre** avec un chemin valide (depuis la racine, ou `bash ../../infrastructure/scripts/....sh` depuis `apps/api`).

**Variables** : copie [demo-local.env.example](../infrastructure/scripts/demo-local.env.example) vers `infrastructure/scripts/demo-local.env`, puis :

```bash
cd "$(git rev-parse --show-toplevel)"
set -a && source infrastructure/scripts/demo-local.env && set +a
```

[`deploy-aws.ts`](../infrastructure/scripts/deploy-aws.ts) charge aussi `.env` à la racine et `infrastructure/scripts/demo-local.env`.

**Tout automatiser** (orchestration) :

```bash
chmod +x infrastructure/scripts/demo-presentation.sh
./infrastructure/scripts/demo-presentation.sh
```

**Raccourcis racine** (voir `package.json`) : `bun run deploy:api -- <nom-lambda>`, `bun run deploy:frontend -- …`, `bun run deploy:assets -- …`, `bun run deploy:backup-cron -- …`.

---

## Sommaire

| # | Étape | Obligatoire |
|---|--------|-------------|
| 0 | [Préparation](#0-préparation) | oui |
| 1 | [Dev container](#1-dev-container-optionnel) | non |
| 2 | [Migrations](#2-migrations) | si nouvelle base / schéma |
| 3 | [API locale + curl](#3-api-locale--test-http) | recommandé |
| 4 | [Deploy API (Lambda)](#4-deploy-api-lambda) | si tu mets à jour le backend |
| 5 | [Deploy assets S3](#5-deploy-assets-statiques) | optionnel |
| 6 | [Front utilisateur](#6-front-utilisateur) | si tu as `WEB_*` |
| 7 | [Front admin](#7-front-admin) | si tu as `ADMIN_*` |
| 8 | [Backup en local (curl)](#8-backup-via-curl-local) | optionnel |
| 9 | [Deploy crons AWS](#9-deploy-crons-backup--eventbridge) | optionnel |
| — | [Pannes fréquentes](#pannes-fréquentes) | aide |

---

## 0. Préparation

- [ ] **Bun**, **Docker** (si étape 1), **`curl`**, **`git`**, **`zip`**, **`psql`** (migrations).
- [ ] `bun install` à la racine du monorepo.
- [ ] `infrastructure/scripts/demo-local.env` avec au minimum ce qui sert **l’API** :  
  `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `MIGRATE_PASSWORD`, buckets S3 si besoin, etc. (voir `apps/api/src/env.ts`).
- [ ] Pour les **déploiements AWS** : `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` (ou profil utilisable par le process).

---

## 1. Dev container (optionnel)

Postgres du compose : hôte **`127.0.0.1:5433`** → adapte `DATABASE_URL` (`...@127.0.0.1:5433/...`).

```bash
cd "$(git rev-parse --show-toplevel)"
docker compose -f .devcontainer/docker-compose.yml down
docker compose -f .devcontainer/docker-compose.yml build --no-cache
docker compose -f .devcontainer/docker-compose.yml up -d
```

**Vérification :** `docker compose -f .devcontainer/docker-compose.yml ps`

---

## 2. Migrations

`DATABASE_URL` doit être exportée (souvent via `demo-local.env` + `source` comme en haut de ce guide).

```bash
cd "$(git rev-parse --show-toplevel)"
bash infrastructure/scripts/migrate.sh
```

*(Le bit `+x` / `./migrate.sh` est optionnel : `bash …` suffit.)*

**Attendu :** `Migrations complete.` sans erreur.

---

## 3. API locale + test HTTP

**Terminal A** (laisser tourner) :

```bash
cd "$(git rev-parse --show-toplevel)/apps/api"
bun run --env-file="../../infrastructure/scripts/demo-local.env" dev
```

**Terminal B** :

```bash
curl -sS "http://127.0.0.1:3001/"
```

**Attendu :** JSON avec `"API is running"`. **Postman :** `GET http://127.0.0.1:3001/`.

Puis `Ctrl+C` dans le terminal A.

---

## 4. Deploy API (Lambda)

**Racine** (recommandé) :

```bash
cd "$(git rev-parse --show-toplevel)"
bash infrastructure/scripts/deploy-api.sh api-stg
```

**Toujours sous `apps/api`** :

```bash
bash ../../infrastructure/scripts/deploy-api.sh api-stg
```

Remplace `api-stg` par le nom réel de ta Lambda. Ne colle pas `chmod` et la ligne suivante sans saut de ligne ni `;`.

**Brut :** `bun infrastructure/scripts/deploy-aws.ts api api-stg` (depuis la racine).

---

## 5. Deploy assets statiques

Fichiers statiques (hors build Vite), souvent avec préfixe S3 `static/`.

```bash
cd "$(git rev-parse --show-toplevel)"
bash infrastructure/scripts/deploy-assets.sh \
  infrastructure/static-assets \
  "$S3_ASSETS_BUCKET" \
  static
```

---

## 6. Front utilisateur

Besoin de **`VITE_API_URL`**, **`WEB_S3_BUCKET`**, **`WEB_CLOUDFRONT_ID`** dans l’environnement (souvent `demo-local.env`).

```bash
cd "$(git rev-parse --show-toplevel)"
set -a && source infrastructure/scripts/demo-local.env && set +a
env VITE_API_URL="$VITE_API_URL" bunx turbo run build --filter=web

bash infrastructure/scripts/deploy-frontend.sh \
  apps/web/dist \
  "$WEB_S3_BUCKET" \
  "$WEB_CLOUDFRONT_ID"
```


## 7. Front admin

Même idée avec **`ADMIN_S3_BUCKET`** et **`ADMIN_CLOUDFRONT_ID`**.

```bash
cd "$(git rev-parse --show-toplevel)"
set -a && source infrastructure/scripts/demo-local.env && set +a
env VITE_API_URL="$VITE_API_URL" bunx turbo run build --filter=admin

bash infrastructure/scripts/deploy-frontend.sh \
  apps/admin/dist \
  "$ADMIN_S3_BUCKET" \
  "$ADMIN_CLOUDFRONT_ID"
```

**Ou :** `bun run deploy:frontend -- apps/admin/dist "$ADMIN_S3_BUCKET" "$ADMIN_CLOUDFRONT_ID"`.

---

## 8. Backup via curl (local)

**Terminal A** — API avec `CRON_SECRET` (déjà dans `demo-local.env` si tu utilises `--env-file`) :

```bash
cd "$(git rev-parse --show-toplevel)/apps/api"
bun run --env-file="../../infrastructure/scripts/demo-local.env" dev
```

**Terminal B** — pour que `$CRON_SECRET` soit défini dans **ce** shell :

```bash
cd "$(git rev-parse --show-toplevel)"
set -a && source infrastructure/scripts/demo-local.env && set +a
curl -sS -X POST "http://127.0.0.1:3001/api/cron/backup" \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json"
```

**Attendu :** `HTTP 201` et JSON avec `filename`, `sizeBytes`. L’upload S3 suit la config vue par le **processus API** (DB + repli env type `BACKUP_S3_BUCKET` si présent).

---

## 9. Deploy crons (backup + EventBridge)

Adapte **environnement**, **URL publique HTTPS** de l’API et **`CRON_SECRET`**.

```bash
cd "$(git rev-parse --show-toplevel)"
bash infrastructure/scripts/deploy-crons.sh \
  staging \
  "https://api-staging.example.com" \
  "$CRON_SECRET" \
  "rate(1 hour)"
```

**Ou :**

```bash
bun run deploy:backup-cron -- \
  staging \
  "https://api-staging.example.com" \
  "$CRON_SECRET" \
  "rate(1 hour)"
```

**Équivalent :** `deploy-backup-cron.sh` (même entrée que `deploy-crons.sh`).

---

## Pannes fréquentes

| Symptôme | Piste |
|----------|--------|
| `No such file or directory` sur `infrastructure/scripts/...` | Tu n’es pas à la **racine** : `cd "$(git rev-parse --show-toplevel)"`, ou depuis `apps/api` : `bash ../../infrastructure/scripts/<script>.sh …`. |
| Port **5432** déjà pris | Compose expose **5433** sur l’hôte ; mets `...@127.0.0.1:5433/...` dans `DATABASE_URL`. |
| **Could not load credentials** (deploy) | Renseigne `AWS_*` dans `demo-local.env` ou exporte-les avant `bun run deploy:*`. |
| **Front / Admin skip** (script auto) | Variables manquantes : `WEB_*` / `ADMIN_*` + `VITE_API_URL` selon le cas. |
| **bash : bad substitution** `${var,,` | Ancien Bash macOS : scripts à jour utilisent `tr` pour la casse. |

---

## Liens utiles

- [postman/README.md](../postman/README.md) — collection Postman pour l’API
- [docs/presentation-demo.md](./presentation-demo.md) — vue d’ensemble
- [infrastructure/scripts/demo-presentation.sh](../infrastructure/scripts/demo-presentation.sh) — orchestration
- [infrastructure/scripts/demo-local.env.example](../infrastructure/scripts/demo-local.env.example)
- [infrastructure/scripts/deploy-aws.ts](../infrastructure/scripts/deploy-aws.ts)
