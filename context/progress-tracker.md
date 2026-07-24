# Progress Tracker

## Current Phase

Phase 2 — Backend API with SQLite, OAuth, and Sheets integration (complete)

## Current Goal

Backend wired to frontend, working end-to-end.

## Completed

- **Express skeleton** with CORS, cookie-parser, JSON body parsing, error handling
- **SQLite database** using `sql.js` (pure JS, no native deps), with auto-save on mutation
- **Tables created**: `users`, `google_tokens`, `sheets`, `api_keys`, `tags`
- **Google OAuth flow**: `/auth/google` redirect → `/auth/google/callback` exchanges code → stores tokens → creates sheet on first login → issues JWT
- **REST endpoints**:
  - `GET /health` — health check
  - `GET /auth/google`, `GET /auth/google/callback` — OAuth
  - `GET /api/me` — current user
  - `GET/POST /api/expenses`, `PUT/DELETE /api/expenses/:id` — expense CRUD
  - `GET /api/tags` — distinct tags for autocomplete
  - `GET /api/summary?by=tag|month` — aggregated totals
  - `GET/POST /api/apikeys`, `DELETE /api/apikeys/:id` — API key management
- **expenseService** in `server/src/services/`: Google Sheets CRUD with 30s in-memory cache, soft-delete via `deleted_at` column, tag syncing to SQLite
- **JWT auth middleware** with Bearer token parsing
- **Zod validation middleware** for request body/query validation
- **Frontend API client** (`client/src/services/api.ts`) — replaces mock data, talks to real backend
- **Auth flow in frontend**: `App.tsx` reads token from URL params on OAuth callback, stores in localStorage
- **All pages updated** to call real backend: Dashboard, Summary, Settings, Login
- **Login page** redirects to backend's `/auth/google`
- **Environment config**: `.env.example` files for both client and server

## In Progress

- None

## Next Up

Phase 3 — MCP Server (Node + @modelcontextprotocol/sdk)

## Open Questions

- **CORS**: Backend is configured for `http://localhost:5173` (Vite dev). For production, need to update `FRONTEND_URL`.
- **Token encryption**: Refresh tokens are stored as-is in SQLite. Should add encryption using `JWT_SECRET` or a separate `ENCRYPTION_KEY`.

## Architecture Decisions

(Previous decisions remain unchanged.)

**New decision — expense service location**: The expense service lives in `server/src/services/expenseService.ts` (not `shared/`). The MCP server will import from this same path. The `shared/` directory now holds only shared type definitions (`shared/types.ts`).

## Session Notes

- Phase 2 complete: Express server with SQLite, Google OAuth, Sheets CRUD, and frontend wiring. Both `npm run build` pass in client and server.