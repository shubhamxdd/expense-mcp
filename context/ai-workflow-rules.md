# AI Workflow Rules

## Approach

Build this project incrementally using a spec-driven workflow. The context files define what to build, how to build it, and the current state of progress. Always implement against these specs — do not infer or invent behavior from scratch. If a requirement is missing or ambiguous, resolve it in the relevant context file before writing code.

## Build Order

1. **Frontend UI with mock data** (Phase 1) — Scaffold Vite+React, build Dashboard (add expense form, expense list, filters), Summary page (Recharts), Settings page (API key UI), Login page. All data from local mock/service stubs. No backend dependency yet.
2. **Backend skeleton + SQLite** — Express server, SQLite schema and migrations, health endpoint.
3. **Google OAuth flow** — OAuth consent redirect, code exchange, token storage (encrypted), session/JWT issuance.
4. **Google Sheets integration** — Create sheet on signup, expense CRUD against Sheets API via `shared/expenseService`.
5. **Wire frontend to real backend** — Replace mock data, connect all pages to live REST endpoints.
6. **API key management** — Settings page key generation + backend endpoints.
7. **MCP server** — Thin layer over `shared/expenseService`, API-key auth using `@modelcontextprotocol/sdk`.
8. **(Later)** OAuth 2.1 for MCP, CSV import.

## Scoping Rules

- Work on one build-order step at a time. Do not jump ahead.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated system boundaries in a single implementation step (e.g., don't build frontend and backend in the same step).
- Each step must be end-to-end verifiable within its own scope before moving on.

## When to Split Work

Split an implementation step if it combines:

- UI changes and backend/API changes
- Multiple unrelated API routes (e.g., auth routes and expense routes)
- Behaviour not clearly defined in the context files

If a change cannot be verified end to end quickly (within a few minutes), the scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behaviour not defined in the context files. If the plan doesn't specify it, don't build it.
- If a requirement is ambiguous, resolve it in the relevant context file before implementing.
- If a requirement is missing, add it as an open question in `progress-tracker.md` before continuing.

## Protected Files

The following files and directories must not be modified unless explicitly instructed:

- None currently. All files are fair game for implementation.
- Note: If a future dependency installs generated files (e.g., `node_modules/`, build output), those are never committed or modified.

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:

- System architecture or boundaries → update `architecture.md`
- Storage model decisions → update `architecture.md`
- Code conventions or standards → update `code-standards.md`
- UI theme, colours, or components → update `ui-context.md`
- Feature scope → update `project-overview.md`
- Current phase, completed work, open questions → update `progress-tracker.md`

## Before Moving to the Next Build Step

1. The current step works end to end within its defined scope
2. No invariant defined in `architecture.md` was violated
3. `progress-tracker.md` reflects the completed work
4. `npm run build` (or equivalent) passes for the relevant workspace