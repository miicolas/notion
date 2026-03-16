# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Monorepo for a Notion-like app using TanStack Start (frontend), Hono (backend API), and Better Auth (authentication), orchestrated with Turborepo. The goal of the projet is to create a Saas product that allows users to create and manage tasks, projects, and notes in a flexible and intuitive way with teams. 

## Monorepo Structure

- `apps/web` — Frontend: TanStack Start + React 19 + Vite + Tailwind CSS v4
- `apps/api` — Backend: Hono API server + Better Auth
- `packages/ui` — Shared UI library: shadcn/ui (Radix + CVA + tailwind-merge)

## Commands

Package manager is **Bun**. Run from the root:

```bash
bun dev          # Start all apps in dev mode (turbo)
bun run build    # Build all packages
bun run lint     # ESLint across all packages
bun run format   # Prettier across all packages
bun run typecheck # TypeScript checking across all packages
```

Individual app commands:

```bash
# Frontend (apps/web)
cd apps/web && bun dev        # Dev server on port 3000
cd apps/web && bun run build  # Production build

# Run a single package script
bunx turbo run dev --filter=web
bunx turbo run typecheck --filter=ui
```

## Tech Stack

- **Runtime**: Bun, Node >= 20
- **Frontend**: TanStack Start with file-based routing (`@tanstack/react-router`), Nitro server functions, Vite
- **Backend**: Hono, Better Auth
- **Database**: PostgreSQL via `pg`, Drizzle ORM, Drizzle Kit for migrations
- **UI**: shadcn/ui components in `packages/ui`, Radix primitives, Tailwind CSS v4
- **Auth**: Better Auth with secret/URL configured via `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` env vars

## Key Patterns

- **Shared UI imports**: Components from `packages/ui` are imported as `@workspace/ui` (e.g., `import { Button } from "@workspace/ui/components/button"`)
- **CN utility**: Use `cn()` from `@workspace/ui/lib/utils` for merging Tailwind classes
- **shadcn components**: Configured in both `apps/web/components.json` and `packages/ui/components.json`
- **TypeScript**: Strict mode enabled, ES2022 target, bundler module resolution
- **Formatting**: Prettier with `prettier-plugin-tailwindcss`
- **Linting**: Uses `@tanstack/eslint-config`

## Environment Variables

Required in `.env` at root:
- `BETTER_AUTH_SECRET` — Auth encryption secret
- `BETTER_AUTH_URL` — Auth server URL (default: `http://localhost:3000`)
