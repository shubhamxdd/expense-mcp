# Progress Tracker

## Current Phase

Phase 6 — Mobile App (Expo React Native)

## Current Goal

Full-featured React Native Expo mobile app for iOS and Android with native UI, payment notification auto-capture on Android, and full web feature parity.

## Completed

- **Phase 1** — Frontend UI with mock data (Vite + React + Tailwind + Recharts)
- **Phase 2** — Backend API (Express + SQLite + Google OAuth + Sheets CRUD + frontend wiring)
- **Phase 3** — MCP Stdio Server (local MCP client integration)
- **Phase 4** — MCP OAuth 2.1 + Streamable HTTP (cloud chatbot support)
- **Phase 5** — PostgreSQL migration + Docker Compose deployment
- **Phase 6** — Mobile App scaffold + full feature implementation

**Phase 6 specifics:**

### Scaffold & Config
- `apps/mobile/` created with Expo SDK 57 (`create-expo-app` blank-typescript)
- Dependencies installed: `expo-router`, `@expo/ui`, `@tanstack/react-query`, `expo-secure-store`, `expo-auth-session`, `expo-web-browser`, `react-native-svg`, `expo-modules-core`
- Project structure follows expo-project-structure skill: `src/app/` (routes), `src/screens/` (screen bodies), `src/components/` (reusable UI), `src/hooks/`, `src/services/`, `src/utils/`
- `app.json` configured with `scheme: "expenseapp"`, iOS/Android package names, permissions for notification listener and SMS

### Navigation
- Expo Router file-based routing with `(tabs)` group
- Bottom tab bar with 3 tabs: Dashboard, Summary, Settings
- Login screen shown when unauthenticated (no tabs)
- Root `_layout.tsx` checks auth state, conditionally renders login or tab layout

### Auth
- Google OAuth via `expo-auth-session` + `expo-web-browser` with custom scheme (`expenseapp://auth/callback`)
- JWT stored in `expo-secure-store` (device keychain/keystore)
- User info fetched from `/api/me` and cached in SecureStore
- Server `auth.ts` route modified to accept `redirect_uri` param for mobile OAuth flow

### API Layer
- Base `request<T>()` wrapper with JWT Bearer auth
- Typed API client (`api.ts`) matching all server endpoints: expenses CRUD, tags, summary, API keys, MCP clients/register
- TanStack React Query hooks for data fetching and mutations
- Query invalidation on mutations (refetch expenses/summary/tags on write)

### Dashboard Screen
- Expense form: amount (decimal), date picker, multi-tag chip input with autocomplete from existing tags, optional note
- Current month total card (blue accent)
- Filter panel: date range (from/to), tag chips, clear button
- Expense list with date, amount (monospaced), tag chips, note preview; edit (pencil) and delete (trash with confirmation) actions
- Edit expense presented as iOS form sheet modal

### Summary Screen
- Segmented toggle: By Tag / By Month
- Date range inputs (from/to)
- Bar chart (SVG) with color-coded bars and legend
- Distribution section showing percentage breakdown + amount per tag/month
- Data table with totals row

### Settings Screen
- Connected account section (avatar + email)
- API key management: generate with label, copy raw key once, list existing keys (preview), revoke with button
- Connected MCP assistants list with revoke
- AI Assistant Access section: buttons for Claude.ai and ChatGPT MCP registration
- MCP credentials modal showing URLs, client ID, and secret

### Payment Auto-Capture (Android)
- Local Expo module (`modules/notification-listener/`) with:
  - `NotificationListenerModule.kt` — JS bridge exposing `startListening`, `stopListening`, `hasPermission`, `openSettings`
  - `PaymentNotificationService.kt` — Android `NotificationListenerService` that detects UPI/banking notifications by pattern matching (keywords + amount regex)
  - `NotificationListener.ts` — JS API with `addPaymentListener` callback
  - `NotificationListenerModule.swift` — iOS stub (returns false, as iOS doesn't allow reading other apps' notifications)
- Config plugin (`plugins/withNotificationListener.js`) adds the service to AndroidManifest.xml
- Payment capture sheet: when a payment is detected, a form sheet modal appears pre-filled with the amount, allowing the user to pick tags and add the expense
- Dashboard shows an "Auto-capture Payments" button to guide users through enabling notification access

### iOS Payment Capture
- iOS SMS reading stub created (not feasible for third-party apps without system-level entitlements)
- iOS users can use manual entry on the Dashboard

### Server Modification
- `apps/server/src/routes/auth.ts`: `/auth/google` now accepts `redirect_uri` query parameter for mobile OAuth
- Callback recognizes mobile redirect in state and redirects to the custom scheme URL with JWT token

### Monorepo Integration
- `apps/mobile/` added to root workspace array `["apps/*", "packages/*"]`
- Root `package.json` updated with `mobile` script
- `apps/mobile/.gitignore` set up for Expo projects

## Next Up

- **Test** — Run the mobile app on device/emulator, verify end-to-end flow
- **Deploy** — EAS Build for TestFlight (iOS) and Play Store (Android)
- **(Later)** — CSV/PDF import
- **(Later)** — Token encryption at rest in PostgreSQL

## Architecture Decisions

- **Native UI approach**: React Native core components with Platform-specific styling rather than `@expo/ui` universal components — simpler, no `Host` wrapper needed, full control over native look
- **Navigation pattern**: Standard Expo Router `Tabs` (not `NativeTabs`) for stability across platforms
- **OAuth flow**: `expo-auth-session` with `openAuthSessionAsync` and custom scheme redirect; server modified to accept `redirect_uri` param
- **Auto-capture strategy**: Android `NotificationListenerService` parses notification text with regex patterns for UPI/banking keywords; detected payments trigger a form sheet for tag selection before persisting
- **iOS limitation**: SMS reading via third-party apps is not permitted by Apple; iOS uses manual entry only

## Session Notes

- Phase 6 built in one session. Full Expo app scaffold with all screens, auth, API layer, and Android notification listener. Server patched for mobile OAuth. Context files updated.
