# Amazon Cognito — rappel pour la présentation

## Rôle

**Cognito** est le service AWS qui gère l’**identité** des utilisateurs finaux et, avec les *identity pools*, des **credentials AWS temporaires** pour accéder à d’autres services (S3, API Gateway, etc.).

- **User pool** : inscription, connexion (mot de passe, MFA, fournisseurs sociaux), tokens JWT, flux OAuth/OIDC.
- **Identity pool (federated identities)** : échange des tokens du user pool contre des clés AWS limitées (utile pour apps mobiles qui écrivent directement dans S3 par exemple).

## Lien avec ce dépôt

Ici l’application utilise **Better Auth** et **PostgreSQL** pour les comptes et les sessions : pas de User Pool Cognito dans le code. En démo AWS, vous pouvez présenter Cognito comme l’**option standard** pour centraliser l’auth sur du serverless, puis expliquer le **choix Better Auth** (multi-organisation, invitations, contrôle fin du schéma en base).

## Quand choisir Cognito plutôt qu’une auth maison

- Équipe peu exposée à la sécurité auth et besoin de MFA / fédération rapide.
- Écosystème API Gateway + authorizers JWT Cognito déjà en place.
- Apps mobiles avec identity pools pour accès S3 direct.

Quand garder Better Auth (ou équivalent) : modèle **multi-tenant / organisations**, logique métier d’auth très intégrée, ou souci de **vendor lock-in** réduit sur la couche identité.
