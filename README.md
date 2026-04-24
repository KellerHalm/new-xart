# OpenXart

Anime catalog and watch client built with `Nuxt 4`, `Vite`, `Vue 3 Composition API`, `Tailwind CSS` and `UnoCSS`.

The UI sits on top of a Nuxt server proxy that talks to the OpenAnix community API and normalizes payloads for the frontend.

## Stack

- `Nuxt 4` with Vite build pipeline
- `Vue 3` with Composition API and file-based routing
- `Tailwind CSS` for utility styling
- `UnoCSS` for shortcuts and additional utility ergonomics
- `Nitro` server routes as the API proxy layer

## Source API

- Docs: `https://openanix.ru/anixart-api-docs/`
- OpenAPI schema: `https://openanix.ru/anixart-api-docs/openapi.yaml`
- Base server used by the app: `https://api-s.anixsekai.com`

## Features

- Home page with spotlight, quick picks and catalog presets
- Search flow through the OpenAnix release search endpoint
- Release detail pages with metadata, related titles and recommendations
- Watch page with:
  - dubber selection
  - source selection
  - episode list
  - embedded iframe playback when available
  - query-driven state in the URL
- SSR-friendly data loading through Nuxt `useAsyncData`

## Routes

- `/`
  - catalog surface
  - search, presets, sorting and pagination
- `/releases/:id`
  - release metadata
  - related and recommended titles
- `/watch/:id`
  - player flow
  - query params: `dubberId`, `sourceId`, `episode`

## Internal API routes

Frontend pages only talk to local Nuxt server routes:

- `/api/home`
- `/api/catalog`
- `/api/search`
- `/api/search/*`
- `/api/releases/:id`
- `/api/releases/:id/player`

Mirror proxy groups already added for broader OpenAnix coverage:

- `/api/auth/*`
- `/api/config/*`
- `/api/notification/*`
- `/api/collection/*`
- `/api/collectionFavorite/*`
- `/api/collectionMy/*`
- `/api/filter/*`
- `/api/discover/*`
- `/api/type/*`
- `/api/release/*`
- `/api/related/*`
- `/api/video/*`
- `/api/episode/*`
- `/api/profile/*`
- `/api/favorite/*`
- `/api/history/*`
- `/api/channel/*`
- `/api/role/*`
- `/api/export/*`
- `/api/achivement/*`

These routes normalize OpenAnix responses into stable frontend contracts from [`shared/types/anix.ts`](shared/types/anix.ts).

Part of the mirrored surface is auth-gated upstream, so some routes intentionally preserve upstream `401`, `404`, or empty `200` responses when called anonymously.

Protected proxy routes also forward auth context from `token` query param, `Authorization: Bearer <token>`, `x-anix-token`, `x-auth-token`, or common token cookies.

## Local development

Install dependencies:

```bash
npm install
```

Start dev server:

```bash
npm run dev
```

Build production bundle:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Project structure

- [`app/pages`](app/pages)
  - UI routes for catalog, release and watch pages
- [`app/components`](app/components)
  - shared presentation components
- [`server/api`](server/api)
  - Nuxt/Nitro proxy endpoints
- [`server/utils/anix.ts`](server/utils/anix.ts)
  - request helpers and response normalization
- [`shared/types/anix.ts`](shared/types/anix.ts)
  - shared API contracts between server and client
- [`shared/constants/catalog.ts`](shared/constants/catalog.ts)
  - preset and sort parsing helpers

## Notes

- The app currently uses anonymous OpenAnix endpoints that are available without user auth.
- Player data is resolved through the endpoint chain:
  - `/episode/:id`
  - `/episode/:id/:episodeDubberId`
  - `/episode/:id/:episodeDubberId/:sourceId`
- Some releases exist in the catalog but may have no playable episode chain yet. The watch page handles that case explicitly.
