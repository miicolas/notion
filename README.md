# shadcn/ui monorepo template

This is a TanStack Start monorepo template with shadcn/ui.

## Docs internes (démo / déploiement manuel)

- **[docs/presentation-demo.md](docs/presentation-demo.md)** — entrée démo (script automatique + lien guide détaillé)
- **[docs/demo-pas-a-pas.md](docs/demo-pas-a-pas.md)** — enchaîner les commandes une par une (migrations, API, Lambda, S3, fronts, crons)

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button";
```
