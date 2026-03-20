#!/usr/bin/env bash
#
# Démo : enchaîne uniquement des commandes réelles (scripts / docker / build / curl).
# À la fin : résumé [OK] / [SKIP] / [FAIL] pour chaque étape.
#
# Usage :
#   ./infrastructure/scripts/demo-presentation.sh
#   ./infrastructure/scripts/demo-presentation.sh --dry-run
#   ./infrastructure/scripts/demo-presentation.sh --quiet   # n’affiche pas les lignes $ avant chaque commande
#
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DRY_RUN=0
STEPS_LOG=()
SHOW_COMMANDS=1
FORCE_QUIET=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --quiet) FORCE_QUIET=1 ;;
    -h | --help)
      echo "Usage: $0 [--dry-run] [--quiet]"
      echo "  --dry-run   Affiche les commandes sans les exécuter."
      echo "  --quiet     N’affiche pas le préfixe \$ sur les commandes (SHOW_COMMANDS=0)."
      echo "  Par défaut : chaque commande exécutée est affichée (ligne commençant par \$)."
      exit 0
      ;;
  esac
done

if [[ -f "$SCRIPT_DIR/demo-local.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/demo-local.env"
  set +a
fi

[[ "$FORCE_QUIET" == 1 ]] && SHOW_COMMANDS=0
: "${SHOW_COMMANDS:=1}"

: "${REQUIRE_DEPLOY_CONFIRM:=1}"
: "${DEMO_API_MODE:=background}"
: "${API_PORT:=3001}"
: "${STATIC_PREFIX:=static}"

# Fichier d’env pour bun (priorité : demo-local.env à côté du script, puis .env racine)
api_env_file() {
  if [[ -f "$SCRIPT_DIR/demo-local.env" ]]; then
    echo "$SCRIPT_DIR/demo-local.env"
  elif [[ -f "$REPO_ROOT/.env" ]]; then
    echo "$REPO_ROOT/.env"
  else
    echo ""
  fi
}

C_OK=$'\033[0;32m'
C_SKIP=$'\033[0;33m'
C_FAIL=$'\033[0;31m'
C_DIM=$'\033[0;2m'
C_CMD=$'\033[1;36m'
C_RST=$'\033[0m'

# Affiche la commande comme dans un terminal (pour suivre ce qui est réellement exécuté).
echo_cmd() {
  [[ "${SHOW_COMMANDS}" == "1" ]] || return 0
  printf '%s' "${C_CMD}\$${C_RST} ${C_DIM}"
  printf '%q ' "$@"
  echo "${C_RST}"
}

log_step() {
  local status=$1
  local title=$2
  local detail=$3
  STEPS_LOG+=("${status}|${title}|${detail}")
  case "$status" in
    ok)   echo "${C_OK}[OK]${C_RST}   ${title}${C_DIM} — ${detail}${C_RST}" ;;
    skip) echo "${C_SKIP}[SKIP]${C_RST} ${title}${C_DIM} — ${detail}${C_RST}" ;;
    fail) echo "${C_FAIL}[FAIL]${C_RST} ${title}${C_DIM} — ${detail}${C_RST}" ;;
  esac
}

print_summary() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Résumé"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  local okc=0 skc=0 flc=0
  local line status _t _d
  for line in "${STEPS_LOG[@]}"; do
    IFS='|' read -r status _t _d <<< "$line"
    case "$status" in
      ok) okc=$((okc + 1)) ;;
      skip) skc=$((skc + 1)) ;;
      fail) flc=$((flc + 1)) ;;
    esac
  done
  echo "  ${C_OK}OK${C_RST}: $okc   ${C_SKIP}SKIP${C_RST}: $skc   ${C_FAIL}FAIL${C_RST}: $flc"
  echo "  Détail produit / CI / logs : docs/GUIDE.md (§11–13)."
  echo ""
  if [[ "$flc" -gt 0 ]]; then
    exit 1
  fi
}

require_cmds() {
  local missing=()
  for c in docker bun curl git; do
    command -v "$c" &>/dev/null || missing+=("$c")
  done
  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "${C_FAIL}Outils manquants : ${missing[*]}${C_RST} (voir docs/GUIDE.md §1)"
    exit 1
  fi
}

run_sh() {
  local s="$1"
  shift
  if [[ "$DRY_RUN" == 1 ]]; then
    echo_cmd bash "$SCRIPT_DIR/$s" "$@"
    printf '%s' "${C_DIM}[dry-run] pas d’exécution${C_RST}"; echo
    return 0
  fi
  echo_cmd bash "$SCRIPT_DIR/$s" "$@"
  bash "$SCRIPT_DIR/$s" "$@"
}

run_cmd() {
  if [[ "$DRY_RUN" == 1 ]]; then
    echo_cmd "$@"
    printf '%s' "${C_DIM}[dry-run] pas d’exécution${C_RST}"; echo
    return 0
  fi
  echo_cmd "$@"
  "$@"
}

# Attend que l’API réponde sur GET / (évite un POST backup avant que le serveur soit prêt).
wait_api_http_ready() {
  local i
  local max="${API_READY_MAX_WAIT:-45}"
  for ((i = 0; i < max; i++)); do
    local code
    code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 3 "http://127.0.0.1:${API_PORT}/" 2>/dev/null || echo "000")
    if [[ "$code" == "200" ]]; then
      return 0
    fi
    sleep 1
  done
  return 1
}

confirm() {
  local msg="$1"
  if [[ "$DRY_RUN" == 1 ]]; then
    return 0
  fi
  if [[ "${REQUIRE_DEPLOY_CONFIRM}" != "1" ]]; then
    return 0
  fi
  local buf=""
  read -r -p "$msg Continuer ? [y/N] " buf || true
  # Bash 3.2 (macOS) ne supporte pas ${buf,,} ; tr reste portable.
  local yn
  yn=$(printf '%s' "$buf" | tr '[:upper:]' '[:lower:]')
  [[ "$yn" == "y" || "$yn" == "yes" ]]
}

# --- Étapes ---

step_devcontainer_rebuild() {
  echo ""
  echo "━━ 1/9 Dev container (Compose : down, build --no-cache, up -d) ━━"
  if [[ "$DRY_RUN" == 1 ]]; then
    run_cmd docker compose -f "$REPO_ROOT/.devcontainer/docker-compose.yml" down
    run_cmd docker compose -f "$REPO_ROOT/.devcontainer/docker-compose.yml" build --no-cache
    run_cmd docker compose -f "$REPO_ROOT/.devcontainer/docker-compose.yml" up -d
    log_step ok "Dev container" "dry-run"
    return 0
  fi
  if run_cmd docker compose -f "$REPO_ROOT/.devcontainer/docker-compose.yml" down \
    && run_cmd docker compose -f "$REPO_ROOT/.devcontainer/docker-compose.yml" build --no-cache \
    && run_cmd docker compose -f "$REPO_ROOT/.devcontainer/docker-compose.yml" up -d; then
    log_step ok "Dev container" "containers recréés"
  else
    log_step fail "Dev container" "docker compose a échoué"
  fi
}

step_api_health() {
  echo ""
  echo "━━ 2/9 API locale — GET / (équivalent Postman) ━━"
  local ef
  ef="$(api_env_file)"
  if [[ -z "$ef" ]]; then
    log_step skip "API locale" "aucun demo-local.env ni .env racine pour bun --env-file"
    return 0
  fi

  local api_pid=""
  if [[ "$DEMO_API_MODE" == "manual" ]]; then
    echo "Lancez : cd apps/api && bun run --env-file=\"$ef\" dev"
    read -r -p "Entrée quand l’API écoute sur le port ${API_PORT}… " || true
  else
    if [[ "$DRY_RUN" == 1 ]]; then
      log_step ok "API locale" "dry-run (démarrage omis)"
      return 0
    fi
    echo_cmd bash -c "cd $(printf '%q' "$REPO_ROOT/apps/api") && exec bun run --env-file=$(printf '%q' "$ef") dev"
    [[ "${SHOW_COMMANDS}" == "1" ]] && echo "${C_DIM}   (processus en arrière-plan, puis arrêt après le test)${C_RST}"
    (cd "$REPO_ROOT/apps/api" && exec bun run --env-file="$ef" dev) &
    api_pid=$!
    sleep 5
  fi

  if [[ "$DRY_RUN" == 1 ]]; then
    return 0
  fi

  local body http_code
  echo_cmd curl -sS --max-time 10 "http://127.0.0.1:${API_PORT}/"
  body=$(curl -sS --max-time 10 "http://127.0.0.1:${API_PORT}/" || true)
  echo_cmd curl -sS -o /dev/null -w "%{http_code}" --max-time 10 "http://127.0.0.1:${API_PORT}/"
  http_code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 "http://127.0.0.1:${API_PORT}/" || echo "000")

  if [[ -n "$api_pid" ]]; then
    kill "$api_pid" 2>/dev/null || true
    wait "$api_pid" 2>/dev/null || true
  fi

  if [[ "$http_code" == "200" ]] && [[ "$body" == *"API is running"* ]]; then
    log_step ok "API locale" "GET / → 200, message attendu"
  elif [[ "$http_code" == "200" ]]; then
    log_step ok "API locale" "GET / → 200 (corps : ${body:0:80}…)"
  else
    log_step fail "API locale" "GET / → HTTP $http_code — vérifiez l’env et le port ${API_PORT}"
  fi
}

step_migrate() {
  echo ""
  echo "━━ 3/9 Migrations (migrate.sh) ━━"
  if [[ -z "${DATABASE_URL:-}" ]]; then
    log_step skip "Migrations" "DATABASE_URL non défini"
    return 0
  fi
  if ! command -v psql &>/dev/null; then
    log_step skip "Migrations" "psql introuvable"
    return 0
  fi
  if [[ "$DRY_RUN" == 1 ]]; then
    run_sh migrate.sh
    log_step ok "Migrations" "dry-run (non exécuté)"
    return 0
  fi
  if run_sh migrate.sh; then
    log_step ok "Migrations" "migrate.sh terminé"
  else
    log_step fail "Migrations" "migrate.sh a échoué"
  fi
}

step_deploy_api() {
  echo ""
  echo "━━ 4/9 Deploy API (deploy-api.sh) ━━"
  if [[ -z "${API_LAMBDA_NAME:-}" ]]; then
    log_step skip "Deploy API" "API_LAMBDA_NAME vide dans demo-local.env"
    return 0
  fi
  if ! confirm "Lambda ${API_LAMBDA_NAME}"; then
    log_step skip "Deploy API" "refus confirmation"
    return 0
  fi
  [[ -n "${LAMBDA_ENV_VARS:-}" ]] && export LAMBDA_ENV_VARS
  if [[ "$DRY_RUN" == 1 ]]; then
    run_sh deploy-api.sh "$API_LAMBDA_NAME"
    log_step ok "Deploy API" "dry-run — $API_LAMBDA_NAME"
    return 0
  fi
  if run_sh deploy-api.sh "$API_LAMBDA_NAME"; then
    log_step ok "Deploy API" "$API_LAMBDA_NAME"
  else
    log_step fail "Deploy API" "deploy-api.sh a échoué (AWS / build)"
  fi
}

step_deploy_assets() {
  echo ""
  echo "━━ 5/9 Deploy assets statiques (deploy-assets.sh, ex. demo-asset-card.png) ━━"
  if [[ -z "${S3_ASSETS_BUCKET:-}" ]]; then
    log_step skip "Deploy assets" "S3_ASSETS_BUCKET vide"
    return 0
  fi
  if ! confirm "S3 s3://${S3_ASSETS_BUCKET}/${STATIC_PREFIX}/"; then
    log_step skip "Deploy assets" "refus confirmation"
    return 0
  fi
  if [[ "$DRY_RUN" == 1 ]]; then
    run_sh deploy-assets.sh "$REPO_ROOT/infrastructure/static-assets" "$S3_ASSETS_BUCKET" "$STATIC_PREFIX"
    log_step ok "Deploy assets" "dry-run — $S3_ASSETS_BUCKET/$STATIC_PREFIX"
    return 0
  fi
  if run_sh deploy-assets.sh "$REPO_ROOT/infrastructure/static-assets" "$S3_ASSETS_BUCKET" "$STATIC_PREFIX"; then
    log_step ok "Deploy assets" "bucket=$S3_ASSETS_BUCKET prefix=$STATIC_PREFIX"
  else
    log_step fail "Deploy assets" "SDK S3 / credentials (voir demo-local.env.example)"
  fi
}

step_build_deploy_web() {
  echo ""
  echo "━━ 6/9 Build + deploy front user (turbo web + deploy-frontend.sh) ━━"
  if [[ -z "${VITE_API_URL:-}" || -z "${WEB_S3_BUCKET:-}" || -z "${WEB_CLOUDFRONT_ID:-}" ]]; then
    miss=()
    [[ -z "${VITE_API_URL:-}" ]] && miss+=("VITE_API_URL")
    [[ -z "${WEB_S3_BUCKET:-}" ]] && miss+=("WEB_S3_BUCKET")
    [[ -z "${WEB_CLOUDFRONT_ID:-}" ]] && miss+=("WEB_CLOUDFRONT_ID")
    log_step skip "Front user" "manquants: ${miss[*]}"
    return 0
  fi
  if ! confirm "Web → $WEB_S3_BUCKET"; then
    log_step skip "Front user" "refus confirmation"
    return 0
  fi
  if [[ "$DRY_RUN" == 1 ]]; then
    run_cmd sh -c "cd \"$REPO_ROOT\" && env VITE_API_URL=\"$VITE_API_URL\" bunx turbo run build --filter=web"
    run_sh deploy-frontend.sh "$REPO_ROOT/apps/web/dist" "$WEB_S3_BUCKET" "$WEB_CLOUDFRONT_ID"
    log_step ok "Front user" "dry-run (build + S3 non exécutés)"
    return 0
  fi
  if ! run_cmd sh -c "cd \"$REPO_ROOT\" && env VITE_API_URL=\"$VITE_API_URL\" bunx turbo run build --filter=web"; then
    log_step fail "Front user" "turbo build web a échoué"
    return 0
  fi
  if run_sh deploy-frontend.sh "$REPO_ROOT/apps/web/dist" "$WEB_S3_BUCKET" "$WEB_CLOUDFRONT_ID"; then
    log_step ok "Front user" "déployé + invalidation CF"
  else
    log_step fail "Front user" "deploy-frontend.sh a échoué"
  fi
}

step_build_deploy_admin() {
  echo ""
  echo "━━ 7/9 Build + deploy admin (turbo admin + deploy-frontend.sh) ━━"
  if [[ -z "${VITE_API_URL:-}" || -z "${ADMIN_S3_BUCKET:-}" || -z "${ADMIN_CLOUDFRONT_ID:-}" ]]; then
    miss=()
    [[ -z "${VITE_API_URL:-}" ]] && miss+=("VITE_API_URL")
    [[ -z "${ADMIN_S3_BUCKET:-}" ]] && miss+=("ADMIN_S3_BUCKET")
    [[ -z "${ADMIN_CLOUDFRONT_ID:-}" ]] && miss+=("ADMIN_CLOUDFRONT_ID")
    log_step skip "Admin" "manquants: ${miss[*]}"
    return 0
  fi
  if ! confirm "Admin → $ADMIN_S3_BUCKET"; then
    log_step skip "Admin" "refus confirmation"
    return 0
  fi
  if [[ "$DRY_RUN" == 1 ]]; then
    run_cmd sh -c "cd \"$REPO_ROOT\" && env VITE_API_URL=\"$VITE_API_URL\" bunx turbo run build --filter=admin"
    run_sh deploy-frontend.sh "$REPO_ROOT/apps/admin/dist" "$ADMIN_S3_BUCKET" "$ADMIN_CLOUDFRONT_ID"
    log_step ok "Admin" "dry-run (build + S3 non exécutés)"
    return 0
  fi
  if ! run_cmd sh -c "cd \"$REPO_ROOT\" && env VITE_API_URL=\"$VITE_API_URL\" bunx turbo run build --filter=admin"; then
    log_step fail "Admin" "turbo build admin a échoué"
    return 0
  fi
  if run_sh deploy-frontend.sh "$REPO_ROOT/apps/admin/dist" "$ADMIN_S3_BUCKET" "$ADMIN_CLOUDFRONT_ID"; then
    log_step ok "Admin" "déployé + invalidation CF"
  else
    log_step fail "Admin" "deploy-frontend.sh a échoué"
  fi
}

step_backup_curl() {
  echo ""
  echo "━━ 8/9 Backup — POST /api/cron/backup (local, si secret dispo) ━━"
  local secret="${DEMO_CRON_SECRET:-${CRON_SECRET:-}}"
  if [[ -z "$secret" ]]; then
    log_step skip "Backup cron (curl)" "CRON_SECRET ou DEMO_CRON_SECRET non défini"
    return 0
  fi

  local ef
  ef="$(api_env_file)"
  if [[ -z "$ef" ]]; then
    log_step skip "Backup cron (curl)" "pas de fichier env pour démarrer l’API"
    return 0
  fi

  if [[ "$DRY_RUN" == 1 ]]; then
    echo_cmd bash -c "cd $(printf '%q' "$REPO_ROOT/apps/api") && CRON_SECRET=<secret> exec bun run --env-file=$(printf '%q' "$ef") dev"
    printf '%s' "${C_DIM}[dry-run] pas d’exécution${C_RST}"; echo
    log_step ok "Backup cron (curl)" "dry-run"
    return 0
  fi

  echo_cmd bash -c "cd $(printf '%q' "$REPO_ROOT/apps/api") && export CRON_SECRET='***' && exec bun run --env-file=$(printf '%q' "$ef") dev"
  [[ "${SHOW_COMMANDS}" == "1" ]] && echo "${C_DIM}   (arrière-plan : CRON_SECRET + BACKUP_S3_BUCKET depuis l’env ; credentials AWS requises pour PutObject)${C_RST}"
  (
    cd "$REPO_ROOT/apps/api"
    export CRON_SECRET="$secret"
    exec bun run --env-file="$ef" dev
  ) &
  local bp=$!
  if ! wait_api_http_ready; then
    kill "$bp" 2>/dev/null || true
    wait "$bp" 2>/dev/null || true
    log_step fail "Backup cron (curl)" "API non prête sur le port ${API_PORT} après ${API_READY_MAX_WAIT:-45}s"
    return 0
  fi
  [[ "${SHOW_COMMANDS}" == "1" ]] && echo "${C_DIM}   API prête — POST /api/cron/backup${C_RST}"
  local code
  echo_cmd curl -sS -o /tmp/demo-backup-body.json -w "%{http_code}" -X POST "http://127.0.0.1:${API_PORT}/api/cron/backup" \
    -H "x-cron-secret:<masqué>" -H "Content-Type: application/json"
  code=$(curl -sS -o /tmp/demo-backup-body.json -w "%{http_code}" -X POST "http://127.0.0.1:${API_PORT}/api/cron/backup" \
    -H "x-cron-secret: $secret" -H "Content-Type: application/json" || echo "000")
  kill "$bp" 2>/dev/null || true
  wait "$bp" 2>/dev/null || true

  if [[ "$code" == "201" ]] || [[ "$code" == "200" ]]; then
    log_step ok "Backup cron (curl)" "POST → HTTP $code ; objet dans s3://${BACKUP_S3_BUCKET:-<BACKUP_S3_BUCKET>}/backups/ (réponse JSON ci-dessous)"
    [[ "${SHOW_COMMANDS}" == "1" ]] && echo "${C_DIM}   Réponse:${C_RST}" && sed 's/^/   /' /tmp/demo-backup-body.json 2>/dev/null || true
  else
    log_step fail "Backup cron (curl)" "POST → HTTP $code"
    echo "${C_FAIL}Corps réponse ou erreur (bucket vide en base ? BACKUP_S3_BUCKET dans l’env ? credentials AWS locale ?) :${C_RST}"
    cat /tmp/demo-backup-body.json 2>/dev/null || echo "(vide)"
  fi
}

step_deploy_crons() {
  echo ""
  echo "━━ 9/9 Deploy crons AWS (deploy-crons.sh) ━━"
  if [[ -z "${BACKUP_ENVIRONMENT:-}" || -z "${API_PUBLIC_URL:-}" || -z "${CRON_SECRET:-}" ]]; then
    log_step skip "Deploy crons" "BACKUP_ENVIRONMENT / API_PUBLIC_URL / CRON_SECRET incomplets"
    return 0
  fi
  if ! confirm "Stack backup-cron ($BACKUP_ENVIRONMENT)"; then
    log_step skip "Deploy crons" "refus confirmation"
    return 0
  fi
  if [[ "$DRY_RUN" == 1 ]]; then
    run_sh deploy-crons.sh "$BACKUP_ENVIRONMENT" "$API_PUBLIC_URL" "$CRON_SECRET" "${BACKUP_SCHEDULE:-rate(1 hour)}"
    log_step ok "Deploy crons" "dry-run — $BACKUP_ENVIRONMENT"
    return 0
  fi
  if run_sh deploy-crons.sh "$BACKUP_ENVIRONMENT" "$API_PUBLIC_URL" "$CRON_SECRET" "${BACKUP_SCHEDULE:-rate(1 hour)}"; then
    log_step ok "Deploy crons" "$BACKUP_ENVIRONMENT"
  else
    log_step fail "Deploy crons" "deploy-crons.sh / CloudFormation"
  fi
}

main() {
  require_cmds

  if [[ "$DRY_RUN" == 1 ]]; then
    echo "${C_DIM}Mode --dry-run : les commandes sont listées ; le résumé marque OK (simulation).${C_RST}"
  fi

  run_cmd chmod +x \
    "$SCRIPT_DIR/migrate.sh" \
    "$SCRIPT_DIR/deploy-api.sh" \
    "$SCRIPT_DIR/deploy-frontend.sh" \
    "$SCRIPT_DIR/deploy-assets.sh" \
    "$SCRIPT_DIR/deploy-crons.sh" \
    "$SCRIPT_DIR/deploy-backup-cron.sh" || true

  step_devcontainer_rebuild
  step_api_health
  step_migrate
  step_deploy_api
  step_deploy_assets
  step_build_deploy_web
  step_build_deploy_admin
  step_backup_curl
  step_deploy_crons

  print_summary
}

main "$@"
