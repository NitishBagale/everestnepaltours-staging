# Repository Guidelines

## Project Structure & Module Organization
- `client/` is the Next.js frontend (App Router). Pages live in `client/src/app`, shared UI in `client/src/components`, hooks in `client/src/hooks`, and utilities in `client/src/lib`.
- `client/public/` holds static assets (images, logos).
- `server/` is the Express backend. Core logic sits in `server/src` with `routes/`, `controller/`, `services/`, `models/`, `validator/`, and `lib/`.
- Database migrations are in `server/migrations` and use timestamped filenames.
- API request examples live in `server/src/api/**/*.rest` and `TEST-BOOKING.rest`.

## Build, Test, and Development Commands
Frontend (from `client/`):
- `npm run dev` — start the Next.js dev server.
- `npm run build` — build the production bundle.
- `npm start` — run the production server after a build.

Backend (from `server/`):
- `npm run dev` — start the API with nodemon.
- `npm start` — run the API server.

Docker:
- `docker-compose up` — starts PostgreSQL plus a prebuilt backend image (see `docker-compose.yaml`).

## Coding Style & Naming Conventions
- Use 2-space indentation (match existing files).
- React components: `PascalCase` filenames and exports (e.g., `client/src/components/Hero.jsx`).
- Next.js routes follow App Router conventions: `page.js`, `page.jsx`, `layout.js` inside `client/src/app/...`.
- Backend modules use functional names and suffixes: `*.route.js`, `*.controller.js`, `*.service.js`, `*.validate.js`.
- No explicit lint/format scripts are defined; keep changes consistent with nearby code.

## Testing Guidelines
- No automated test framework is currently configured. If you add tests, place them alongside modules or in a new `tests/` folder and document the new commands here.

## Commit & Pull Request Guidelines
- This workspace has no git history available, so commit conventions are unknown. Follow your team standard; if unsure, use short imperative messages (e.g., "Add booking validation").
- PRs should include: a concise summary, linked issues (if any), and screenshots for UI changes. Call out any API contract changes and how to test them.

## Configuration Tips
- Backend configuration is loaded from environment variables (see `server/config`). Ensure a valid `server/.env` is present for local runs.
