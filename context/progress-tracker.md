# Progress Tracker

## Current Phase

Phase 3 — MCP Server (complete)

## Current Goal

MCP server running end-to-end: authenticates via API key from the shared SQLite DB, exposes 4 tools that operate on the user's Google Sheet via the same expenseService.

## Completed

- **Phase 1** — Frontend UI with mock data (Vite + React + Tailwind + Recharts)
- **Phase 2** — Backend API (Express + SQLite + Google OAuth + Sheets CRUD + frontend wiring)
- **Phase 3** — MCP Server (this phase)

**MCP Server specifics:**
- `mcp/` directory scaffolded with `@modelcontextprotocol/sdk` v1.29.0
- Self-contained auth module: opens the shared SQLite DB file, validates API key via SHA-256 hash against `api_keys` table
- 4 tools exposed:
  - `add_expense(amount, tags[], note?, date?)` — creates expense in user's Google Sheet
  - `list_expenses(from?, to?, tags?)` — lists expenses with optional filters
  - `get_summary(by: "tag"|"month", from?, to?)` — aggregated totals with percentages
  - `delete_expense(id)` — soft-deletes expense
- All tools dynamically import `server/src/services/expenseService.ts` at runtime (reuses same data-access layer)
- API key passed via `EXPENSE_API_KEY` environment variable
- StdioServerTransport for local MCP client integration (Claude Desktop, etc.)
- Verified end-to-end: authenticates test key, starts and listens on stdio

## In Progress

- None

## Next Up

- **(Later)** OAuth 2.1 for MCP (dynamic client registration, per-client tokens)
- **(Later)** CSV/PDF import
- **(Later)** Token encryption at rest in SQLite

## Open Questions

- **Deployment**: MCP server uses relative path imports to `server/src/services/expenseService.ts`. For standalone deployment (Render/Railway), need to either bundle both as a monorepo or extract expenseService into a shared package.
- **MCP over HTTP**: Currently only stdio transport. For remote access, need SSE or HTTP transport with the API key passed as Bearer token.

## Architecture Decisions

(Previous decisions remain unchanged.)

**New decision — MCP imports from server source**: The MCP server dynamically imports expenseService from `server/src/services/` at runtime using tsx. This avoids duplicating the Sheets CRUD logic and keeps the architecture consistent with PLAN.md §5 ("Reuses the backend's data-access layer").

## Session Notes

- All 3 phases implemented. Project is fully functional end-to-end: React frontend → Express API → Google Sheets ↔ MCP server. Both `npm run build` pass (client and server). MCP server verified at runtime with tsx.