# Expense Tracker

Multi-user expense tracker with a React web app, Google Sheets storage, and an MCP server for AI client integration.

Each user's expenses live in their own private Google Sheet (auto-created on first login). SQLite stores only account plumbing — users, OAuth tokens, API keys, and tag autocomplete data.

---

## Architecture

```
expense-mcp/
├── apps/
│   ├── client/          # React SPA (Vite + Tailwind + Recharts)
│   ├── server/          # Express REST API + Google OAuth
│   └── mcp/             # MCP server (stdio transport)
├── packages/
│   └── expense-service/ # Shared DB + Google Sheets CRUD
├── package.json         # Bun workspaces + Turborepo
└── turbo.json
```

| Layer | Tech | Role |
|-------|------|------|
| Frontend | React + Vite + Tailwind | Dashboard, summaries, settings |
| Backend | Express + TypeScript | REST API, OAuth, Sheets proxy |
| Database | SQLite (sql.js) | Users, tokens, API keys, tags |
| Expense Store | Google Sheets API | Per-user expense spreadsheets |
| Auth (Web) | Google OAuth 2.0 + JWT | Sign-in, session management |
| Auth (MCP) | API key (SHA-256 in SQLite) | Machine-to-machine |
| MCP Server | @modelcontextprotocol/sdk | AI client tools (stdio) |

---

## Prerequisites

- **Bun** 1.3+ ([install](https://bun.sh))
- **Google Cloud Project** with the following APIs enabled:
  - Google Sheets API
  - Google People API (for user profile info)
- **OAuth 2.0 credentials** (Web application type) with:
  - Authorized redirect URI: `http://localhost:3001/auth/google/callback`

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

> `GOOGLE_REDIRECT_URI` and `FRONTEND_URL` default to `http://localhost:3001` and `http://localhost:5173` — change only if you run on different ports.

### 2. (Optional) Configure client URL

```sh
cp apps/client/.env.example apps/client/.env
```

Update if needed:

```env
VITE_API_URL=http://localhost:3001
```

> Note: `.env.example` defaults to port `3000` — change to `3001` to match the server default.

---

## Running

### Development

```sh
# Start everything (server + client)
bun run dev

# Or individually:
bun run --filter @expense/server dev
bun run --filter @expense/client dev
```

Open `http://localhost:5173` and sign in with Google.

### Production build

```sh
bun run build
```

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
- **Generate API keys** — type a label, click Generate, copy the key (shown once)
- Revoke keys as needed

---

## MCP Server

The MCP server lets AI clients (VS Code Copilot, Claude Desktop, etc.) log and query expenses via natural language.

### Tools

| Tool | Description |
|------|-------------|
| `add_expense` | Add expense with amount, tags, optional note/date |
| `list_expenses` | List expenses with optional date/tag filters |
| `get_summary` | Spending totals grouped by tag or month |
| `delete_expense` | Soft-delete an expense by ID |

### VS Code / GitHub Copilot

Create `.vscode/mcp.json` in the project root:

```json
{
  "servers": {
    "expense-tracker": {
      "type": "stdio",
      "command": "tsx",
      "args": ["src/index.ts"],
      "cwd": "${workspaceFolder}/apps/mcp",
      "env": {
        "EXPENSE_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

1. Open the project in VS Code
2. Switch Copilot Chat to **Agent** mode
3. Click **Start** on the MCP server (or run MCP: List Servers from the command palette)
4. Try: *"Add a coffee expense of ₹150"*

### Other MCP Clients (Claude Desktop, etc.)

```json
{
  "mcpServers": {
    "expense-tracker": {
      "command": "tsx",
      "args": ["apps/mcp/src/index.ts"],
      "env": {
        "EXPENSE_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

### Getting an API Key

1. Sign into the web app
2. Go to **Settings**
3. Type a label (e.g. "VS Code") and click **Generate**
4. Copy the key shown in the green banner

---

## Seed Script (development)

Creates a test user with API key + sample tags:

```sh
bun run seed
```

Outputs a JWT token and API key for local testing.

---

## Tech Stack

- React 19 + Vite 8 + Tailwind CSS 4
- Express 4 + TypeScript
- SQLite (sql.js)
- Google Sheets API
- @modelcontextprotocol/sdk
- Recharts
- Lucide React (icons)
- Turborepo + Bun workspaces

---

## License

MIT
