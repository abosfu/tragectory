# WASL (wasl-app)

A provenance-first Islamic history navigator (no AI).  
**Stack:** Next.js (T3), Prisma, Postgres, Tailwind, tRPC, Leaflet.

## Status
Bootstrap phase. Setting up schema (Eras, Events, Places, Sources, Citations) and three pages (Timeline → Era → Event).

## Roadmap (short)
- [ ] DB schema + seed (small set of eras/events/sources)
- [ ] API routes: `/api/eras`, `/api/eras/[slug]`, `/api/events/[slug]`
- [ ] Pages: `/`, `/era/[slug]`, `/event/[slug]`
- [ ] Map pins for events with coordinates
- [ ] Faceted search (era/place/source type)

## Dev (coming soon)
After scaffolding:
```bash
pnpm install
pnpm prisma migrate dev
pnpm dev
