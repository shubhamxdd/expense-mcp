# Expense Tracker

Multi-user expense tracker with a React web app, Google Sheets storage, and a remote MCP server for AI assistant integration (Claude.ai, ChatGPT).

Each user's expenses live in their own private Google Sheet (auto-created on first login). SQLite stores only account plumbing — users, OAuth tokens, API keys, and tag autocomplete data.

---

## Architecture

```
expense-mcp/
├── apps/
│   ├── client/          # React SPA (Vite + Tailwind + Recharts)
│   └── server/          # Express REST API + MCP OAuth server
├── packages/
│   └── expense-service/ # Shared DB + Google Sheets CRUD
├── package.json         # Bun workspaces + Turborepo
└── turbo.json
```

| Layer | Tech | Role |
|-------|------|------|
| Frontend | React + Vite + Tailwind | Dashboard, summaries, settings |
| Backend | Express + TypeScript | REST API, OAuth, MCP server |
| Database | SQLite (sql.js) | Users, tokens, MCP clients, tags |
| Expense Store | Google Sheets API | Per-user expense spreadsheets |
| Auth (Web) | Google OAuth 2.0 + JWT | Sign-in, session management |
| Auth (MCP Remote) | OAuth 2.1 + PKCE (S256) | AI assistant authorization |
| MCP Transport | Streamable HTTP | Remote MCP via HTTP POST |

---

## Prerequisites

- **Bun** 1.3+ ([install](https://bun.sh))
- **Google Cloud Project** with the following APIs enabled:
  - Google Sheets API
  - Google People API (for user profile info)
- **OAuth 2.0 credentials** (Web application type) with:
  - Authorized redirect URI: `http://localhost:3001/auth/google/callback`
- **ngrok** (or any tunnel) for connecting AI assistants (Claude.ai, ChatGPT)

---

## Setup

```sh
git clone <repo-url> && cd expense-mcp
bun install
```

### 1. Configure Google OAuth

```sh
cp apps/server/.env.example apps/server/.env
```

Edit `apps/server/.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
JWT_SECRET=generate-a-random-secret-here
```

---

## Running

### Development

```sh
# Start the server (serves both API + built frontend)
cd apps/server && USE_MOCK_DATA=true PORT=3000 bun run src/index.ts
```

Open `http://localhost:3000` and sign in with Google.

> Use `USE_MOCK_DATA=true` for development — generates sample expenses without a Google Sheet.

---

## Connecting AI Assistants (Claude.ai / ChatGPT)

The server includes an embedded OAuth 2.1 authorization server + MCP Streamable HTTP endpoint so cloud AI assistants can manage your expenses through natural language.

### 1. Expose your server

```sh
ngrok http 3000
```

Copy your ngrok URL (e.g. `https://abc123.ngrok.io`).

### 2. Start the server with your public URL

```sh
cd apps/server && USE_MOCK_DATA=true PORT=3000 PUBLIC_URL=https://abc123.ngrok.io bun run src/index.ts
```

### 3. Open the app and generate credentials

Open `https://abc123.ngrok.io` in your browser → Login → **Settings** → **AI Assistant Access**.

Click **Claude.ai** or **ChatGPT** — a modal shows all 5 values with copy buttons:

| Field | Example |
|-------|---------|
| Authorization URL | `https://abc123.ngrok.io/authorize` |
| Token URL | `https://abc123.ngrok.io/token` |
| MCP Server URL | `https://abc123.ngrok.io/mcp` |
| Client ID | `550e8400-...` |
| Client Secret | `abc123def...` |

### 4. Configure in your AI assistant

Paste the copied values into the assistant's MCP / OAuth settings. When the assistant opens the authorize page, sign in with Google to complete the connection.

> **No curl or terminal needed.** The authorize page auto-registers unknown clients on first visit.

### Tools available to AI assistants

| Tool | Description |
|------|-------------|
| `add_expense` | Add expense with amount, tags, optional note/date |
| `list_expenses` | List expenses with optional date/tag filters |
| `get_summary` | Spending totals grouped by tag or month |
| `delete_expense` | Soft-delete an expense by ID |

---

## Web App

### Dashboard
- Add expense: enter amount, date, tags (chip input with autocomplete), optional note
- Click the row's **pencil icon** to edit, **trash icon** to delete
- Filter by date range and tags

### Summary
- Charts grouped by tag (bar + pie) or by month
- Date-range picker narrows the period

### Settings
- View connected Google account
- Generate and manage API keys
- **Generate MCP credentials** for Claude.ai / ChatGPT with one click
- View and revoke connected AI assistant clients

---

## Seed Script (development)

Creates a test user with API key + sample tags:

```sh
bun run seed
```

---

## Tech Stack

- React 19 + Vite 8 + Tailwind CSS 4
- Express 4 + TypeScript
- SQLite (sql.js)
- Google Sheets API
- @modelcontextprotocol/sdk (MCP OAuth + Streamable HTTP)
- Recharts
- Lucide React (icons)
- Turborepo + Bun workspaces

---

## License

MIT
