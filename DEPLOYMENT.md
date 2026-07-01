# Deployment Guide (Vercel + Render + Neon)

## Overview
- Frontend: `client/` (Next.js) on Vercel
- Backend: `server/` (Express + Sequelize) on Render (Web Service)
- Database: Neon Postgres (managed) using TLS via `sslmode=require`

## Vercel (Frontend)
- Project root: `client`
- Framework: Next.js
- Node.js: 20.x
- Build command: `vercel build` (CI uses Vercel CLI)
- Output: Vercel prebuilt deployment (`vercel deploy --prebuilt`)

Environment variables (Vercel):
- `NEXT_PUBLIC_API_URL` (public API base URL)
- `NEXT_API_BASED_URL` (legacy/admin usage if still referenced)
- `NEXT_PUBLIC_SITE_URL` (public site origin for HBL callback URLs)
- `HBL_MERCHANT_ID`
- `HBL_API_KEY`
- `HBL_CURRENCY`
- `HBL_THREE_D_SECURE`
- `HBL_ENCRYPTION_KEY_ID`
- `HBL_MERCHANT_SIGNING_PRIVATE_KEY`
- `HBL_MERCHANT_DECRYPTION_PRIVATE_KEY`
- `HBL_PACO_ENCRYPTION_PUBLIC_KEY`
- `HBL_PACO_SIGNING_PUBLIC_KEY`

## Render (Backend)
- Service type: Web Service
- Root directory: `server`
- Build command: `npm ci`
- Start command: `npm start`
- Health check path: `/health`
- Node.js: 20.x
- Auto-deploy: optional (recommended true if using deploy hook)

Environment variables (Render):
- `NODE_ENV=production`
- `PORT` (Render provides automatically)
- `DATABASE_URL` (Neon pooled URL with `sslmode=require`)
- `DIRECT_DATABASE_URL` (optional, non-pooled direct URL for migrations)
- `CORS_ORIGIN`, `JWT_SECRET`, `SECRET_KEY`
- `ADMIN_MAIL`, `SMTP_EMAIL`, `SMTP_PASSWORD`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## Neon (Database)
Use the pooled connection string for runtime (Render) and include `sslmode=require`.

Example pooled URL:
```
postgresql://USER:PASSWORD@HOST/DB_NAME?sslmode=require
```

If migrations need a direct (non-pooled) endpoint, set `DIRECT_DATABASE_URL` and use it only for migrations.

## GitHub Actions Secrets
Required:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `DATABASE_URL` (Neon pooled)
- `RENDER_DEPLOY_HOOK`

Optional (recommended if Neon requires direct connections for migrations):
- `DIRECT_DATABASE_URL`
- `RUN_DB_SYNC` (set to `true` only for a one-time schema sync if migrations are empty)

## Migrations
- Run via `npm run db:migrate` in `server/` (uses `sequelize-cli`).
- CI chooses `DIRECT_DATABASE_URL` if present; otherwise uses `DATABASE_URL`.
- App startup no longer performs schema sync in production; set `ENABLE_DB_SYNC=true` for local-only sync.
- One-time emergency sync: set GitHub secret `RUN_DB_SYNC=true` to run `npm run db:sync` on deploy.

## Notes
- Ensure `client/.env.example` and `server/.env.example` are copied to `.env` for local development.
- `DATABASE_URL` is the preferred single source of truth for DB connections.
- Never commit real database URLs or credentials; use GitHub/Render/Vercel secrets only.
