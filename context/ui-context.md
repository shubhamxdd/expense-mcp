# UI Context

## Theme

Paper/ink monochrome, inspired by physical ledgers and receipt books. The design language is minimal, text-heavy, and print-like — near-white page backgrounds, dark ink text, subtle borders, and no gratuitous colour. Interactive elements use a slightly darker ink shade rather than a bright accent. Amounts and tabular data use monospace type. The experience should feel like looking at a well-kept paper ledger.

## Colors

All components must use these CSS custom properties — no hardcoded hex values in component code.

| Role              | CSS Variable         | Value       | Notes                          |
| ----------------- | -------------------- | ----------- | ------------------------------ |
| Page background   | `--bg-base`          | `#F5F0E8`   | Warm off-white, paper-like     |
| Surface           | `--bg-surface`       | `#EBE5D9`   | Slightly darker for cards      |
| Hover surface     | `--bg-hover`         | `#DFD8CA`   | Card/row hover state           |
| Primary text      | `--text-primary`     | `#1A1A1A`   | Near-black ink                 |
| Muted text        | `--text-muted`       | `#7A756D`   | Subtle ink for secondary info  |
| Border            | `--border-default`   | `#D4CDC0`   | Faint ledger-line border       |
| Accent            | `--accent-ink`       | `#2B2B2B`   | Slightly lighter than primary  |
| Error             | `--state-error`      | `#B33A3A`   | Muted red for errors           |
| Success           | `--state-success`    | `#3A7B4A`   | Muted green for success        |

## Typography

| Role              | Font                         | CSS Variable         |
| ----------------- | ---------------------------- | -------------------- |
| Headings          | Playfair Display (serif)     | `--font-heading`     |
| UI / body text    | Inter (sans-serif)           | `--font-sans`       |
| Amounts / mono    | JetBrains Mono (monospace)   | `--font-mono`       |

## Border Radius

| Context                | Value  |
| ---------------------- | ------ |
| Inline / small UI      | 2px    |
| Cards / panels         | 4px    |
| Modals / overlays      | 8px    |

All radii use Tailwind's arbitrary value syntax: `rounded-[2px]`, `rounded-[4px]`, etc.

## Component Library

No external UI component library. All components are custom-built to match the ledger aesthetic. Common patterns (buttons, inputs, chips, cards, modals) live in `client/src/components/` and follow the conventions below:

- Buttons: ink-filled or ink-outlined, minimal padding, monospace for action text
- Inputs: bottom-border only (ledger-line style), no full border boxes
- Chips/tags: small pill with subtle border, removable via ×
- Tables: alternating row background, ledger-style horizontal lines only
- Modals: centered overlay with backdrop, minimal border

## Layout Patterns

- **Dashboard:** Single-column centred layout, max-w-4xl. Top row: add-expense form. Below: current month running total (ledger-style). Below: filter bar. Below: expense list.
- **Summary:** Centred single column. Date-range picker at top. Charts stacked vertically (bar by tag, pie by tag, bar by month).
- **Settings:** Centred single column. Sections stacked: connected account, API keys list, generate key form.
- **Navbar:** Top bar with app name (serif, left), nav links (Dashboard, Summary, Settings) and user avatar (right). Bottom border only.
- **Login page:** Centred card on empty page background. "Sign in with Google" button.
- **Modals:** Confirmation modals (delete, revoke key) — centred overlay with backdrop blur, minimal styling.

## Icons

Lucide React. Stroke-based icons only. Sizes: `h-4 w-4` for inline, `h-5 w-5` for buttons. Colour inherits from parent text colour by default. Commonly used: `Plus`, `Trash2`, `Filter`, `X`, `ChevronDown`, `PieChart`, `BarChart3`, `Calendar`, `Key`, `User`, `LogOut`.

## Shadows

No box-shadows. The paper/ink aesthetic is flat. Use border and background colour changes for depth and hierarchy instead.