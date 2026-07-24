# Progress Tracker

## Current Phase

Phase 4 — MCP OAuth 2.1 / Streamable HTTP (complete)

## Current Goal

Remote MCP connection support via OAuth 2.1 + Streamable HTTP transport for cloud AI chatbots (Claude.ai, ChatGPT).

## Completed

- **Phase 1** — Frontend UI with mock data (Vite + React + Tailwind + Recharts)
- **Phase 2** — Backend API (Express + SQLite + Google OAuth + Sheets CRUD + frontend wiring)
- **Phase 3** — MCP Stdio Server (local MCP client integration)
- **Phase 4** — MCP OAuth 2.1 + Streamable HTTP (cloud chatbot support)

**Phase 4 specifics:**
- Full OAuth 2.1 authorization server embedded in Express (`apps/server/src/mcp-oauth.ts`):
  - `GET /.well-known/oauth-authorization-server` — AS metadata
  - `GET /.well-known/oauth-protected-resource{/mcp}` — resource metadata
  - `POST /register` — Dynamic Client Registration (DCR)
  - `GET/POST /authorize` — HTML consent page + JWT-based user verification
  - `POST /token` — Authorization code + refresh token grants (PKCE S256)
  - `POST /revoke` — Token revocation
- OAuth tokens stored in SQLite with SHA-256 hashing (opaque tokens)
- Access tokens: 1 hour expiry, Refresh tokens: 30 days
- MCP endpoint at `POST /mcp` with required Bearer auth via SDK's `requireBearerAuth` middleware
- Streamable HTTP transport (`StreamableHTTPServerTransport`) with JSON response mode (`enableJsonResponse: true`)
- 4 tools exposed on remote MCP endpoint:
  - `add_expense(amount, tags[], note?, date?)`
  - `list_expenses(from?, to?, tags?)`
  - `get_summary(by: "tag"|"month", from?, to?)`
  - `delete_expense(id)`
- Single transport instance connected once to `McpServer` (Protocol limitation)
- `mcpUserStorage` AsyncLocalStorage provides user context to tool handlers
- Verified end-to-end: register → authorize → token exchange → initialize → tools/list → tools/call → tools/call

## Key Fixes

- **Timezone bug**: SQLite `datetime('now')` returns UTC, but `new Date(str)` parses as local time. Appended `'Z'` when converting for correct UTC interpretation.
- **Protocol.connect single-use**: `McpServer.connect(transport)` throws if called more than once. Fixed by using one transport instance connected at module level.
- **PKCE**: Proper code_verifier/challenge pair generation using `crypto.randomBytes(32)` and SHA-256 base64url.

## Next Up

- **(Later)** CSV/PDF import
- **(Later)** Token encryption at rest in SQLite
- **(Future)** Expose via ngrok/tunnel for actual Claude.ai/ChatGPT integration — requires `client_id` + `client_secret` from `/register` configured in chatbot's OAuth settings

## Architecture Decisions

- OAuth server shares the existing Express app + SQLite database (no separate process)
- User identity verified via existing JWT token passed into authorize form (no separate password)
- `enableJsonResponse: true` on transport simplifies testing; Claude.ai/ChatGPT SDKs also support JSON mode
- `verifyMcpToken` returns `extra: { userId }` so `requireBearerAuth` attaches user context to `req.auth`
- Exposed scopes: `expenses:read`, `expenses:write`

## Session Notes

- Phase 4 implemented in one session. OAuth server, MCP handler, and Express wiring complete. Build passes. All tools verified with curl end-to-end.