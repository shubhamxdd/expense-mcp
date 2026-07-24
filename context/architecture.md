# Architecture Context

## Stack

| Layer          | Technology                     | Role                                        |
| -------------- | ------------------------------ | ------------------------------------------- |
| Frontend       | React (Vite) + TypeScript      | SPA: expense entry, dashboard, summaries    |
| UI Styling     | Tailwind CSS                   | Utility-first styling with CSS custom props |
| Routing        | React Router v6                | Client-side navigation                      |
| Charts         | Recharts                       | Bar, pie, line charts for summaries         |
| Backend        | Node.js + Express + TypeScript | REST API, OAuth, Sheets proxy               |
| Database       | SQLite (better-sqlite3)        | Auth/plumbing: users, tokens, keys, tags    |
| Expense Store  | Google Sheets API              | Each user's expense data in their own sheet |
| Auth (Web)     | Google OAuth 2.0 + JWT         | Sign-in, session management                 |
| Auth (MCP)     | API key (hashed in SQLite)     | Machine-to-machine auth for MCP server      |
| MCP Server     | Node + @modelcontextprotocol/sdk | MCP tools layer over expense service        |
| Icons          | Lucide React                   | Stroke-based icons                          |

## System Boundaries

- `client/` — React SPA. Owns: pages, UI components, React Router config, API client hooks, local state. Talks to the backend REST API only.
- `server/` — Express API + SQLite. Owns: route handlers, Google OAuth flow, JWT session management, Google Sheets API calls. Exposes REST endpoints consumed by the frontend.
- `mcp/` — MCP server process. Owns: MCP tool definitions (`add_expense`, `list_expenses`, etc.), API-key validation middleware. Thin layer — delegates all data logic to `shared/`.
- `shared/` — Shared data-access layer. Owns: `expenseService.js` — the single source of truth for reading/writing expenses in Google Sheets. Imported by both `server/` and `mcp/` so CRUD logic is never duplicated.

## Storage Model

- **Google Sheets (per user)**: Expense data only. Each user gets exactly one spreadsheet (`Expense Tracker — <user name>`). Sheet layout: columns `id | date | amount | tags | note | created_at | deleted_at`. Never replicated or cached long-term in SQLite. Short-lived in-memory cache per user to respect Sheets API rate limits (60 read req/min/user default).
- **SQLite (`server/db/`)**: Auth and metadata only.
  - `users` — id, email, name, created_at
  - `google_tokens` — user_id (FK), refresh_token (encrypted), access_token, expires_at
  - `sheets` — user_id (FK), spreadsheet_id, sheet_name
  - `api_keys` — id, user_id (FK), key_hash, label, created_at, last_used_at, revoked_at
  - `tags` — id, user_id (FK), name, created_at (for autocomplete)

## Auth and Access Model

- Web app: User signs in via Google OAuth. Backend exchanges auth code for tokens, stores refresh token (encrypted at rest). Issues a JWT session cookie/token to the frontend. Every subsequent API request authenticates via JWT.
- Data ownership: Every expense row in a sheet belongs to the spreadsheet's owner user. The backend resolves the user from the JWT and only operates on that user's sheet. One user, one sheet — no sharing.
- MCP auth: User generates an API key from Settings. The key is hashed (bcrypt) and stored in `api_keys`. MCP server validates the key on each request, resolves to user_id, and uses that user's stored Google tokens to access their sheet.
- Access control invariant: A user can never read or mutate another user's expense data. Sheet access is gated by OAuth tokens, not by spreadsheet IDs being secret.

## Invariants

1. Expense data never lives in SQLite — the Google Sheet is the single source of truth for all expense rows. SQLite stores only account plumbing and tag metadata.
2. Sheet row schema is fixed at `id | date | amount | tags | note | created_at | deleted_at`. The header row must always match this exactly. Row 1 is always the header.
3. Deleted expenses are never physically removed from the sheet — the `deleted_at` column is set to the current timestamp, and reads filter out rows where `deleted_at` is non-empty.
4. Every REST or MCP mutation must authenticate the user first, then resolve to their stored Google tokens, before any Sheets API call.
5. Short-lived in-memory cache per user for sheet reads — TTL of 30 seconds max — to stay within Sheets API quota without serving stale data for too long.
6. All CSS colors must use CSS custom property tokens defined in `ui-context.md`. No hardcoded hex values in component code.