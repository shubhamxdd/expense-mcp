# Progress Tracker

## Current Phase

Phase 1 — Frontend UI with mock data (not started)

## Current Goal

Scaffold the React (Vite) project with Tailwind, React Router, and Recharts, then build the Dashboard page with mock data.

## Completed

- None yet. All context files have been populated from PLAN.md.

## In Progress

- None yet.

## Next Up

1. Scaffold Vite + React project (`client/`): install Tailwind, React Router, Recharts, Lucide React
2. Configure Tailwind with the paper/ink theme tokens (CSS custom properties)
3. Build page skeletons and routing: Login, Dashboard, Summary, Settings
4. Implement Dashboard with mock data: add-expense form (amount, date, tag chips with autocomplete, note), expense list, current month total, filter bar
5. Implement Summary page with mock data: bar chart by tag, pie chart by tag, bar chart by month, date-range picker
6. Implement Settings page layout (no backend yet): connected account section, API key management UI
7. Implement Login page with "Sign in with Google" button (placeholder, non-functional)

## Open Questions

- None currently.

## Architecture Decisions

- **Google Sheets as expense store**: All expense data lives in the user's Google Sheet, not SQLite. SQLite holds only auth/plumbing. (From PLAN.md §1)
- **Soft-delete via `deleted_at`**: Instead of physically deleting sheet rows, the `deleted_at` column is set to the current timestamp. Reads filter out deleted rows. (From PLAN.md §4)
- **Tags stored in SQLite**: A `tags` table in SQLite (user_id, name, created_at) is synced on expense creation and used for autocomplete. Derived from scanning the sheet would be too slow/quota-heavy. (Decision made 2025-07-24)
- **Paper/ink monochrome theme**: Off-white page background (#F5F0E8), near-black text (#1A1A1A), no box-shadows, flat aesthetic inspired by physical ledgers. (Decision made 2025-07-24)
- **MCP SDK**: Use `@modelcontextprotocol/sdk` for MCP server (Phase 3). (Decision made 2025-07-24)
- **No external UI library**: All components are custom-built to match the ledger aesthetic. No shadcn, MUI, or similar. (From PLAN.md §3 + ui-context.md)

## Session Notes

- Initial session: All 6 context files populated from PLAN.md and clarified decisions. Ready to begin Phase 1 (Frontend UI with mock data).