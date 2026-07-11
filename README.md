# TalentFlow AI

Plateforme de recrutement avec matching CV/offre assisté par IA.
Voir [`docs/`](./docs) pour le cahier des charges, les personas, les cas
d'utilisation, l'architecture fonctionnelle et la roadmap.

## Structure

```
apps/
  web/      # Next.js (front)
  api/      # NestJS (back, Prisma, PostgreSQL)
packages/
  types/    # types partagés front/back
docker/
  docker-compose.yml  # PostgreSQL local
docs/       # conception (cahier des charges, personas, architecture...)
```

## Prérequis

- Node.js >= 20
- pnpm 10.32.1 (`corepack enable` ou `npm i -g pnpm@10.32.1`)
- Docker Desktop (pour PostgreSQL en local)

## Démarrage

```bash
pnpm install

# Base de données locale
docker compose -f docker/docker-compose.yml up -d

# Copier apps/api/.env.example vers apps/api/.env et ajuster si besoin
cp apps/api/.env.example apps/api/.env

# Appliquer le schéma Prisma
pnpm --filter api exec prisma migrate dev

# Lancer le front et l'API
pnpm dev:web   # http://localhost:3000
pnpm dev:api   # http://localhost:3001 (par défaut Nest: 3000, à ajuster si conflit)
```

## Scripts racine

- `pnpm dev:web` / `pnpm dev:api` — lancer chaque app en dev
- `pnpm lint` — lint sur tout le monorepo
- `pnpm build` — build sur tout le monorepo
