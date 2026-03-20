# Démo présentation

Deux façons de l’exécuter :

1. **Pas à pas (manuel)** — [demo-pas-a-pas.md](./demo-pas-a-pas.md) : commandes une par une, checklist et dépannage.
2. **Orchestré** — depuis la racine du dépôt :
   ```bash
   chmod +x infrastructure/scripts/demo-presentation.sh
   ./infrastructure/scripts/demo-presentation.sh
   ```
   Options utiles : `--quiet` pour moins de sortie ; le script affiche chaque commande avant exécution.

**Variables** : `infrastructure/scripts/demo-local.env` (modèle : `demo-local.env.example`). Inclure notamment `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` pour les déploiements via [`deploy-aws.ts`](../infrastructure/scripts/deploy-aws.ts).

**Postgres en devcontainer** : hôte `127.0.0.1:5433` (voir `.devcontainer/docker-compose.yml`).
