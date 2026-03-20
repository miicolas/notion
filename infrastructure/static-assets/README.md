# Fichiers statiques (branding)

Placez ici des fichiers servis depuis S3 (logo, images de marque, etc.), puis déployez avec :

```bash
chmod +x infrastructure/scripts/deploy-assets.sh
./infrastructure/scripts/deploy-assets.sh infrastructure/static-assets "$S3_ASSETS_BUCKET" static
```

Les URLs publiques dépendent de la politique du bucket et éventuellement de CloudFront (`…/static/logo.svg`).

Pour le site principal, les assets du build Vite restent déployés avec `deploy-frontend.sh` ; ce dossier sert surtout à des **fichiers hors build** ou partagés entre apps.
