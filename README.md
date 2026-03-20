# Future Self Projection (Web + Desktop)

Desktop wrapper is implemented without changing UI/markup/styles/components.

## Architecture

- Frontend: existing Next.js App Router app (unchanged UI).
- Backend: existing Next.js API routes (`app/api/*`) remain the source of business logic.
- Desktop shell: Electron (`electron/main.cjs` + `electron/preload.cjs`).
- Desktop production runtime:
  - Electron starts bundled Next standalone server.
  - BrowserWindow opens local URL (`http://127.0.0.1:<port>`).
- Data persistence:
  - Web mode: `./data/mvp-db.json`.
  - Desktop mode: `%APPDATA%/<AppName>/data/mvp-db.json` via `APP_DATA_DIR`.

## Why Electron

- Best fit for existing Next.js app with server routes and file-backed storage.
- Production-friendly Windows installer pipeline (`electron-builder` + NSIS).
- Cross-platform packaging available in same config (Windows/macOS/Linux).
- No frontend rewrite required.

## Project Structure

```text
app/
  api/
    habits/route.ts
    goals/route.ts
    day-planner/route.ts
build/
  .gitkeep
components/
data/
electron/
  main.cjs
  preload.cjs
hooks/
lib/
  server/
    storage.ts
    validators.ts
scripts/
  prepare-standalone.cjs
  generate-icons.cjs
next.config.mjs
package.json
```

## Electron Security

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- `preload` bridge only exposes non-sensitive runtime info.
- DevTools disabled in production.
- External links are opened in system browser (`shell.openExternal`).

## Desktop Build Configuration

Configured in `package.json` (`build` section):

- `appId`: `com.futureself.projection`
- `productName`: `Future Self Projection`
- `win.target`: `nsis` (`x64`)
- `win.icon`: `build/icon.ico`
- `asar: true` with standalone server unpacked
- output directory: `dist-desktop/`

## Commands

Install dependencies:

```bash
npm install
```

Web dev:

```bash
npm run dev
```

Desktop dev (Next dev server + Electron window):

```bash
npm run desktop:dev
```

Prepare desktop production assets:

```bash
npm run build:desktop:prep
```

Build Windows installer (`.exe`):

```bash
npm run build:desktop
```

Build all platforms (on matching host/toolchain):

```bash
npm run build:desktop:all
```

## Where `.exe` Is Generated

After `npm run build:desktop`, installer is generated in:

```text
dist-desktop/
```

Typical file:

```text
Future Self Projection-Setup-0.1.0.exe
```

## Notes

- UI is intentionally untouched.
- If desktop runtime issues happen, fix container/runtime only, not frontend design.
