# Postman — API Notion (`apps/api`)

## Import

1. Postman → **Import** → fichiers :
   - `Notion-API.postman_collection.json`
   - `Local.postman_environment.json` (recommandé)
2. Choisir l’environnement **Notion API — local**.
3. Renseigner **`authEmail`**, **`authPassword`** (et optionnellement `cronSecret`, `issueId`, etc.).

## Session (cookies)

L’API utilise **Better Auth** en **cookie** sur `/api/auth/*`, comme le front.

1. Exécuter **Auth → Sign in (email)**.  
2. Postman enregistre les cookies pour `127.0.0.1` (cookie jar activé par défaut).  
3. Ensuite les dossiers **App** et **Admin** envoient la session automatiquement.

Si tu as une erreur CORS / origine en local, ajoute un header  
`Origin: http://localhost:3000` (ou une valeur listée dans `CORS_ORIGINS` côté API).

## Références

- Santé API : `GET {{baseUrl}}/`
- Better Auth : [email & password](https://www.better-auth.com/docs/authentication/email-password)
- Code des routes : `apps/api/src/app.ts` et `apps/api/src/routes/*.ts`
