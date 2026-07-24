# Code Standards

## General

- Keep modules small and single-purpose. If a file grows beyond 200 lines, consider splitting it.
- Fix root causes, do not layer workarounds. If a bug originates in a shared module, fix it there.
- Do not mix unrelated concerns in one component, route, or module.
- Prefer named exports over default exports for better refactoring and import clarity.

## TypeScript

- Strict mode is required throughout the project (`strict: true` in tsconfig).
- Avoid `any` — use explicit interfaces, types, or narrowly scoped generics.
- Validate all unknown external input (API request bodies, query params, MCP tool args) at system boundaries before trusting it. Use Zod schemas for runtime validation.
- Define shared types in `shared/types.ts` and import them in both `client/` and `server/`.

## React

- Default to functional components with hooks. No class components.
- Keep page components thin — extract reusable UI into `components/` and data-fetching logic into `hooks/`.
- Use React Router v6 with route-level code splitting via `React.lazy`.
- Optimistic UI for expense creation: insert the row optimistically, roll back on API failure.
- Forms use controlled components with local state. No form library for now.

## CSS & Styling

- Use Tailwind utility classes for all styling. No plain CSS files except for CSS custom property definitions and Tailwind config.
- Use the CSS custom property tokens defined in `ui-context.md` exclusively — no hardcoded hex values.
- Follow the border radius scale defined in `ui-context.md`.
- Responsive design: mobile-first, single-column on small screens, wider on md+.

## API Routes

- Validate and parse request input with Zod schemas before any logic runs. Return 400 with structured error message on failure.
- Enforce auth (JWT for web, API key for MCP) and ownership before any mutation.
- Return consistent response shapes: `{ data: ... }` for success, `{ error: { message, code } }` for errors.
- REST endpoints follow the resource naming convention from PLAN.md §4.

## Data and Storage

- Google Sheets is the single source of truth for expense data. SQLite stores only auth/plumbing and tag metadata.
- Shared data-access layer lives in `shared/expenseService.ts` — both REST API and MCP server import from here. Never duplicate expense CRUD logic.
- Sheets API calls are wrapped with a short-lived in-memory cache (30s TTL) per user to stay within quota.
- Soft-delete: set `deleted_at` to current ISO timestamp. Reads filter out non-empty `deleted_at`. Never physically delete sheet rows.
- **(Planned)** Encrypt Google refresh tokens at rest in SQLite using a server-side encryption key from environment variables.

## File Organization

```
expense-mcp/
├── client/                  # React SPA (Vite)
│   ├── public/
│   ├── src/
│   │   ├── pages/           # Route-level page components
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks (data fetching, etc.)
│   │   ├── services/        # API client (api.ts), mock data (mockData.ts)
│   │   ├── types/           # Frontend-specific types
│   │   ├── App.tsx          # Router setup with auth handling
│   │   └── main.tsx         # Entry point
│   ├── index.html
│   └── vite.config.ts
├── server/                  # Express API
│   ├── src/
│   │   ├── routes/          # Express route handlers
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── services/        # OAuth, Sheets API wrappers, expenseService
│   │   ├── db/              # SQLite init (sql.js), schema, queries
│   │   ├── types/           # Type declarations (sql.js)
│   │   └── index.ts         # Entry point
│   ├── data/                # SQLite database file (gitignored)
│   └── .env
├── mcp/                     # MCP Server (Phase 3)
├── shared/                  # Shared type definitions
│   └── types.ts             # Expense, User, ApiKey interfaces
├── context/                 # Project context files
├── PLAN.md
└── AGENTS.md
```