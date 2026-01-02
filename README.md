# WASL App (T3 Stack)

Bootstrapped with **Create T3 App** (Next.js + TypeScript + Tailwind + tRPC + Prisma).

## Dev setup
1. Copy env: `cp .env.example .env` (fill any keys later)
2. Install: `npm install`
3. DB migrate (SQLite by default): `npx prisma migrate dev --name init`
4. Generate Prisma client: `npx prisma generate`
5. Run dev: `npm run dev` (visit http://localhost:3000)

## Prisma tips
- Open DB UI: `npx prisma studio`
- Default client output lives in `node_modules/@prisma/client` (we do **not** commit generated/).

## Project notes
- Repo ignores `/generated` to keep Git clean.
- Use feature branches for new work (`git checkout -b feature/<thing>`), open PRs to `main`.
