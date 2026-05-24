# ModDNA

ModDNA is a Reddit Devvit application for moderation institutional memory. This repository currently contains the production-grade foundation only: app shell, server architecture, environment wiring, and reusable UI primitives.

## Requirements

- Node.js 22.2.0+
- npm
- Devvit CLI account access

## Install

```bash
npm install
```

## Environment

```bash
cp .env.example .env
```

`MODDNA_STORAGE_DRIVER` supports:

- `sqlite` (default local fallback)
- `supabase` (requires `SUPABASE_URL` and `SUPABASE_ANON_KEY`)

## Local Development

```bash
npm run dev
```

## Validation

```bash
npm run type-check
npm run lint
npm run format:check
npm run build
```

## Deploy

```bash
npm run login
npm run deploy
```
