# Expense Tracker — Project Plan

## 1. Overview

A multi-user expense tracker with three parts:

1. **Web app** (React) — manual entry, browsing, tagging, summaries
2. **Backend API** (Express + SQLite) — auth, Google Sheets integration, expense logic
3. **MCP server** (Node, built later) — lets any MCP-compatible client (Claude, ChatGPT, etc.) log/query expenses via natural language

Each user's expense data lives in **their own Google Sheet**, auto-created on first login. SQLite stores only account plumbing: user identity, Google OAuth tokens, spreadsheet ID, and API keys — never the expense data itself.

Currency is fixed to **INR** for now. Categories are **free-form tags** (not a locked dropdown), so a user can add "coffee", "rent", "flight" etc. on the fly, with previously-used tags suggested for reuse.

---

## 2. Core Data Model

### Expense (stored as a row in the user's Google Sheet)
| Field       | Type          | Notes                                  |
|-------------|---------------|-----------------------------------------|
| id          | string (uuid) | Generated on create                     |
| date        | ISO date      | Defaults to today                       |
| amount      | number        | INR, positive number                    |
| tags        | string[]      | Comma-separated in the sheet cell       |
| note        | string        | Optional free text                      |
| created_at  | ISO datetime  | For audit/order                         |

Sheet layout (row 1 = header):
```
id | date | amount | tags | note | created_at
```

### SQLite tables (backend, auth/plumbing only)
```
users
  id, email, name, created_at

google_tokens
  user_id (FK), refresh_token (encrypted), access_token, expires_at

sheets
  user_id (FK), spreadsheet_id, sheet_name

api_keys
  id, user_id (FK), key_hash, label, created_at, last_used_at, revoked_at
```

---

## 3. Web App (Phase 1 — building now)

### Stack
- React (Vite) + React Router
- Recharts for summary charts
- Design direction: ledger/receipt-inspired (ink/paper palette, serif+mono type) — already scoped

### Pages / Views
1. **Login** — "Sign in with Google" button
2. **Dashboard**
   - Add-expense entry line (amount, date, tag input w/ autocomplete from past tags, note)
   - Running total for current month, shown ledger-style
   - Expense list, most recent first
   - Filters: date range, tag(s)
3. **Summary**
   - Totals by tag (bar/pie)
   - Totals by month (line/bar)
   - Simple date-range picker
4. **Settings**
   - Connected Google account info
   - View/regenerate/revoke API key(s) — with a copyable key shown once
   - (Later) instructions for connecting to Claude/ChatGPT via MCP

### Key Frontend Behaviors
- Tag input: multi-tag chip entry, autocompletes from tags the user has used before (fetched from backend)
- All amounts formatted as INR (`₹`), no currency selector for now
- Optimistic UI on add-expense (row appears instantly, rolls back on failure)

---

## 4. Backend API (Phase 2 — building next)

### Stack
- Node.js + Express
- SQLite (via `better-sqlite3` or `sqlite3`)
- `googleapis` npm package for Sheets + OAuth

### Auth Flow
1. Frontend redirects to Google OAuth consent (scopes: `spreadsheets`, basic profile/email)
2. Google redirects back to backend with auth code
3. Backend exchanges code → tokens, stores refresh token (encrypted at rest)
4. On **first login only**: backend creates a new spreadsheet named `Expense Tracker — <user>`, writes header row, stores `spreadsheet_id`
5. Backend issues a session (JWT or signed cookie) to the frontend

### REST Endpoints
```
GET  /auth/google              → redirect to Google consent
GET  /auth/google/callback      → handles code exchange, creates sheet if new user, sets session

GET  /api/me                    → current user info

GET  /api/expenses              → list, supports ?from=&to=&tags=
POST /api/expenses               → create { date, amount, tags[], note }
PUT  /api/expenses/:id           → update
DELETE /api/expenses/:id          → delete

GET  /api/tags                  → distinct tags user has used (for autocomplete)

GET  /api/summary?by=tag|month&from=&to=   → aggregated totals

POST /api/apikeys                → generate new API key (returns raw key once)
GET  /api/apikeys                → list keys (masked)
DELETE /api/apikeys/:id           → revoke
```

### Google Sheets as datastore — implementation notes
- All expense CRUD = reading/writing rows via Sheets API (`values.get`, `values.append`, `values.update`, `values.batchUpdate` for deletes)
- Backend keeps a short-lived in-memory cache per user to avoid hammering Sheets API on every read (Sheets API has quota limits — 60 read requests/min/user is the default cap)
- Row deletion: Sheets API doesn't support deleting a single row cheaply — approach: mark row as deleted (soft-delete column) or rewrite the sheet range without that row. Plan to soft-delete for simplicity, filter out in reads.

---

## 5. MCP Server (Phase 3 — later, after web app + backend are solid)

### Purpose
Let a user connect their expense tracker to Claude, ChatGPT, or any MCP client, so they can say "log ₹450 for lunch" and have it land in their sheet.

### Auth (initial version)
- Each user generates an **API key** from the Settings page (already built in Phase 2 backend)
- User pastes that key into their MCP client's connector config
- MCP server validates the key against `api_keys` table → resolves to `user_id` → uses that user's stored Google tokens to act on their sheet

### Tools Exposed
```
add_expense(amount, tags[], note?, date?)
list_expenses(from?, to?, tags?)
get_summary(by: "tag"|"month", from?, to?)
delete_expense(id)
```

### Transport
- Deployed as a standalone Node service (same repo, separate deploy) on Render/Railway
- Reuses the backend's data-access layer (shared module, not duplicated logic) — MCP server and REST API both call the same `expenseService.js` functions

### Future upgrade: OAuth 2.1
- Swap API-key validation for full MCP OAuth 2.1 flow (dynamic client registration, per-client tokens)
- Data layer underneath doesn't change — only the auth middleware in front of the MCP server

---

## 6. Build Order

1. ✅ Scaffold React app (done)
2. **Frontend UI** with mock/local data first (no backend dependency yet) — validates design and flows fast
3. **Backend**: Express skeleton, SQLite schema, Google OAuth flow
4. **Google Sheets integration**: create-sheet-on-signup, expense CRUD against Sheets API
5. **Wire frontend to real backend**, replace mock data
6. **API key management** (Settings page + backend endpoints)
7. **MCP server** — thin layer over the same expense service, API-key auth
8. **(Later)** OAuth 2.1 for MCP, CSV import

---

## 7. Open Items / Assumptions Going In
- Single currency: **INR**, hardcoded (`₹`), no conversion
- Tags: free-form, multi-tag per expense, no fixed taxonomy
- One sheet per user, auto-created, not user-renameable for now
- Soft-delete strategy for removing expense rows from Sheets
- You will provide Google Cloud OAuth credentials when ready (backend built against env vars in the meantime)
- You are deploying both backend and MCP server yourself (Render/Railway or similar)

---

## 8. What's Next
Continuing with **Phase 1: Frontend UI** using local mock data, so you can see and react to the actual app before backend/Sheets wiring goes in.
