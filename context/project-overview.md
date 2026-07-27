# Expense Tracker — Project Overview

## Overview

A multi-user expense tracker composed of three parts: a React web app for manual entry and review, a Node/Express backend API with Google Sheets integration, and an MCP server that lets AI clients (Claude, ChatGPT, etc.) log and query expenses via natural language. Each user's expense data lives in their own private Google Sheet, auto-created on first login. The SQLite database stores only account plumbing — user identity, OAuth tokens, spreadsheet metadata, API keys, and tag references — never the expense data itself.

## Goals

1. A signed-in user can add, view, filter, and delete expenses through a clean ledger-style web UI
2. A user can view spending summaries by tag and by month with charts
3. A user can generate an API key and connect any MCP-compatible client (Claude, ChatGPT) to log/query expenses by natural language
4. Zero setup burden — sign in with Google, sheet is created automatically, no manual spreadsheet configuration

## Core User Flow

1. User visits the app and clicks "Sign in with Google"
2. Backend handles OAuth exchange; on first login, creates a new Google Sheet named "Expense Tracker — <user's name>" with the header row
3. User lands on the Dashboard — sees a single-line expense entry form and their recent expenses
4. User types an amount, selects tags (autocompleted from past usage), optionally adds a note, and submits
5. Expense is written to the user's Google Sheet and appears instantly in the list
6. User navigates to Summary to see charts by tag or month
7. User goes to Settings to view their connected Google account and manage API keys
8. User copies an API key, configures it in Claude/ChatGPT MCP settings, and can then say "log ₹450 for lunch" to create an expense

## Features

### Expense Management
- Add expense with amount, date, tags (multi-tag chip input with autocomplete), and optional note
- View expenses in reverse-chronological list
- Filter by date range and/or tags
- Edit and delete existing expenses (soft-delete with `deleted_at`)

### Summaries & Insights
- Totals grouped by tag (bar chart + pie chart)
- Totals grouped by month (line/bar chart)
- Date-range picker to narrow summary period

### Authentication & Account
- Google OAuth sign-in
- One Google Sheet auto-created per user
- Session management via JWT

### API Key Management
- Generate API keys from Settings page (key shown once, then masked)
- List existing keys (masked)
- Revoke keys
- Keys used for MCP server auth

### MCP Integration (Phase 3)
- Natural-language expense logging via MCP-compatible clients
- Tools: `add_expense`, `list_expenses`, `get_summary`, `delete_expense`
- Auth via user-generated API key

### Mobile App (Phase 6)
- React Native Expo app with file-based routing (Expo Router)
- Native platform look and feel (Material You on Android, HIG on iOS)
- Full feature parity with web client
- Google OAuth via `expo-auth-session` + `expo-web-browser`
- API communication via TanStack React Query with JWT from SecureStore
- Android: NotificationListenerService captures UPI/banking notifications, prompts user to tag the expense
- iOS: SMS detection (limited, falls back to manual entry)
- Three tabs: Dashboard, Summary, Settings
- Dashboard: add/view/edit/delete expenses, filters, current month total, auto-capture setup
- Summary: toggle by-tag/by-month, date range picker, bar charts, distribution list, data table
- Settings: account info, API key CRUD, MCP assistant registration (Claude.ai, ChatGPT)

## Scope

### In Scope
- Single currency: INR (₹), hardcoded
- Free-form tags (no fixed taxonomy), stored in a SQLite tags table for autocomplete
- Google Sheets as the sole expense data store (one sheet per user)
- Soft-delete strategy for expense removal (using a `deleted_at` column in the sheet)
- REST API for all CRUD operations
- MCP server reusing the same data-access layer as the REST API
- JWT-based session auth for the web app
- API-key-based auth for the MCP server

### Out of Scope
- Multi-currency support or currency conversion
- Predefined expense categories/taxonomy
- Shared/family sheets
- CSV/PDF import or export (could be added later)
- OAuth 2.1 for MCP (planned as future upgrade)
- Mobile apps (responsive web only)

## Success Criteria

1. A new user can sign in with Google and have a spreadsheet auto-created with the correct header row
2. A user can add 5 expenses through the UI and see them persisted in their Google Sheet
3. A user can filter expenses by date range and tag
4. The Summary page shows correct totals by tag and by month for a selected date range
5. A user can generate an API key from Settings and use it with an MCP client to add and list expenses
6. Deleting an expense sets `deleted_at` and the expense no longer appears in the list or summaries