# Obligo · 0.1.2

**What needs my attention today?** A private, offline-first personal obligation tracker by Validacore. This is a standalone client application: no backend, accounts, analytics, push notifications, or cloud synchronization. The Android APK checks public GitHub Releases at startup for available updates; it never includes obligation data.

## Android APK distribution

Signed APK packaging and startup update notices are available. See [Android release instructions](docs/ANDROID-RELEASE.md) for the build command, release asset names, signing-key backup, GitHub publishing steps, and Android/iPhone limitations. The latest APK is `artifacts/obligo-0.1.2.apk`. See [0.1.2 release notes](docs/RELEASE-0.1.2.md). Keep `.signing/` private and backed up so future releases can update existing installations.

## Run locally

Use Node.js 22.12+ (Node 24 recommended) and pnpm 11.

```sh
pnpm install
pnpm dev
```

To exercise the PWA, use the production build, not the development server:

```sh
pnpm build
pnpm preview
```

Open the printed localhost URL. Default builds produce `dist/` for an HTTPS origin root. For the hosted `/obligo/` web app, use `pnpm run build:cloudflare`; see [Cloudflare deployment](docs/CLOUDFLARE.md). No server API or environment secrets are required. Keep the origin stable: IndexedDB and service-worker caches are origin-specific.

```sh
pnpm test
pnpm lint
pnpm format:check
```

## Delivered

- Category create, rename, color selection, and guarded delete; case-insensitive duplicate names are rejected.
- Monthly obligation creation and editing, optional amount and currency, priority, required category, and due-day validation.
- Archive and restore; obligation records are never deleted through the UI.
- Dashboard totals, active/high-priority counts, rolling seven-day count, ordered current-month attention list, and next five occurrences.
- IndexedDB persistence, reactive updates, light/dark/system theme, empty states, keyboard-accessible native dialogs, search, and card layouts.
- PWA manifest, 192/512px icons, maskable icon, Apple touch icon, generated service worker, precached app assets, and user-initiated update prompt.
- Monthly completion and undo, prominent ValidaCore.tech branding, and corrected first due dates.
- JSON Backup & Restore with file preview, confirmation, validation, atomic replacement, and Android file saving. See [backup instructions](docs/BACKUP-RESTORE.md).

## Dependencies

Runtime: React 19, React DOM, Dexie, dexie-react-hooks, date-fns, lucide-react, react-error-boundary, workbox-window, Radix Slot, class-variance-authority, clsx, and tailwind-merge. UUIDs use the browser's `crypto.randomUUID()` rather than an extra package.

Tooling: strict TypeScript, Vite, Tailwind CSS 4 with its Vite plugin, vite-plugin-pwa, Vitest, Testing Library, fake-indexeddb, jsdom, ESLint, and Prettier. The lockfile records the exact installed versions. `pnpm-workspace.yaml` explicitly permits esbuild's required installation script.

`components.json` configures shadcn aliases and Tailwind v4. The local Button follows the shadcn Radix Slot/CVA composition pattern; dialogs and form inputs use native HTML controls to keep the foundation small and accessible.

## Structure and responsibilities

```text
public/                 Install icons (all local)
src/
  components/
    common/             Native modal and functional error boundary wrapper
    layout/             App shell, navigation, PWA update UI
    ui/                 Reusable shadcn-style Button
  db/db.ts              ObligoDB and versioned schema
  features/
    categories/         Category management
    dashboard/          Summary and date projections UI
    obligations/        Form, cards, filtering, archive/restore
    settings/           Theme, installation, privacy information
  hooks/useObligo.ts     Reactive reads, date refresh, system theme
  lib/utils.ts          Class composition and error messages
  models/types.ts       Shared domain contracts
  services/             Validated, transactional writes and pure date logic
  test/                 Storage, date-boundary, and failed-save UI tests
  App.tsx               Hash navigation and screen composition
  main.tsx              Bootstrap and error boundary
  styles.css            Responsive design tokens and component styles
vite.config.ts          Build, Tailwind, PWA, test configuration
```

UI components do not write directly to IndexedDB. Services validate and transact mutations; hooks provide live queries. The dashboard service is pure and accepts an explicit clock for deterministic tests. No global state library is needed: Dexie owns persistent data and React owns transient UI state. Components remain below 250 lines after formatting.

## Data model decisions

- Database: `ObligoDB`, schema version 1. Future migrations should add a new `version(...).stores(...).upgrade(...)` declaration without changing the existing version.
- Category, obligation, and status IDs are UUIDs. Settings retain the requested `id: 'default'` singleton exception.
- `isActive` remains a boolean but is deliberately **not indexed**: booleans are not valid IndexedDB keys. Active filtering runs on the local collection.
- Monthly statuses have a unique compound index `&[obligationId+year+month]`; month is intended to be 1–12. Completion and undo now write one record per monthly occurrence. Completion does not archive the recurring obligation.
- `overdue` is currently derived from the current local calendar date, never persisted. The status type retains the requested union for later migration review.
- Due days 29–31 clamp to the month's final day, including leap years. Dates use local calendar arithmetic, not UTC or elapsed milliseconds.
- “Due this week” means today plus the next six days, using each active obligation's next occurrence. “Upcoming” includes today, skips completed months, and rolls passed dates to next month.
- The attention list shows pending eligible monthly dates, ordered overdue, today, then upcoming. New obligations start this month if their due date has not passed; otherwise next month. The optional startMonth field persists that first eligible month. Legacy records derive it from createdAt without a destructive migration. Completed months are excluded; missed months are not accumulated as historical arrears.
- Total includes archived records; all other KPIs exclude them. A category referenced by active **or archived** obligations cannot be deleted. Category checks and writes are transactional to avoid dangling references.
- `createdAt` is preserved on edits; `updatedAt` changes on edits, archive, and restore. Stable IDs and the service boundary prepare future synchronization, but conflict resolution and tombstones must be designed before enabling sync.

## Offline and installation

The app loads all scripts, CSS, icons, and fonts locally (system fonts). Initial installation and app updates download static assets from the same origin; personal data is not sent to a server. After the first successful load and precache, normal operation and subsequent launches work offline. New versions prompt before reloading, avoiding silent loss of an open form.

On Android, use the browser's Install app / Add to Home screen command. On iPhone, use Safari → Share → Add to Home Screen. Production installation requires HTTPS; localhost is allowed for development. Browser support and install UI vary. Embedded browsers may not expose service workers or installation controls; validate using standalone Chrome and Safari.

Data is browser/device-specific. Clearing site data or uninstalling with data removal can erase it; private mode may be temporary. Browser storage eviction is possible. Use Settings → Backup & restore to save a JSON file outside the app before clearing data or moving devices. Backups are manual, unencrypted snapshots; restore replaces existing data after confirmation. Theme preferences are saved in IndexedDB and system mode responds to OS changes.

## Verification

Automated tests cover creation/edit/archive/restore and reopen persistence, category reference protection, category validation, invalid obligation inputs, unique monthly keys, saved theme, month-end/leap-year clamping, ordering, year rollover, rolling-week bounds, and preserving form values after a failed save. TypeScript, ESLint, and production build are also checked.

Before a public release, run on physical Android and iPhone devices:

1. Load the production app over HTTPS; wait for Ready offline.
2. Create a category and obligation, edit it, and reload.
3. Install to the home screen, close it, enable airplane mode, reopen, and edit records.
4. Archive/restore, verify KPIs and category deletion protection, and reload again.
5. Check light/dark/system themes, keyboard focus, and screen-reader labels.
6. Reconnect and deploy an updated build; confirm that the update prompt waits for user action and existing records survive.

The user confirmed the Android update from 0.1.0 to 0.1.1 preserved data and the completion/date/branding changes work. Version 0.1.2 backup saving and restoring still need physical Android and iPhone picker testing. Calendar and historical completion browsing remain future work. Push notifications remain unimplemented.

Implementation references: [Dexie compound indexes](https://dexie.org/docs/Compound-Index) and [Vite PWA service-worker registration](https://vite-pwa-org.netlify.app/guide/register-service-worker).
