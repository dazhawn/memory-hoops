# Memory Hoops

A 3D basketball pattern-memory game. The grid lights up, you repeat the sequence before the clock runs out. Miss, and you take a letter — spell **H-O-R-S-E** and you're done.

Built as a web game with React Three Fiber, wrapped with Capacitor for iOS and Android.

- **App ID:** `com.millionaireblueprint.memoryhoops`
- **Publisher:** Millionaire Blueprint
- **Version:** 1.0 (Android `versionCode 1`)

---

## Gameplay

Four modes, chosen from the menu:

| Mode | How it works |
| --- | --- |
| **1P** | Solo. Repeat the flashed pattern. 100 pts per round, 5 misses spells HORSE, 1000 pts wins. |
| **2P** | Pass-and-play on one device. Player 1 sets a pattern by tapping cells, Player 2 repeats it, then roles swap. First to 5 letters loses. |
| **Arcade** | Escalating difficulty on a 3-life budget. Grid, flash speed and timer ramp by round (Normal → Fast → Pro → Blitz → Master, 100–500 pts per round). Scores post to a server leaderboard. |
| **Remote** | Two devices over WebSocket. Host creates a 6-character room code, guest joins, then the same setter/repeater loop runs across the network. |

**Settings:** grid size 2×2 / 3×3 / 4×4 (3, 4 or 5 cells to remember), timer 3s / 5s / 10s, flash speed Relaxed / Normal / Fast / Blitz, and three gym themes — Classic (wood floor), Outdoor (night street court), Arcade (neon).

The timer doesn't start until the first tap, so you're never punished for reaction time. Sound is synthesized in the browser with the Web Audio API — each cell has its own tone, so patterns are audible as well as visual.

---

## Stack

- **Game:** React 19, TypeScript, Vite, `@react-three/fiber` + `drei` + `postprocessing` (bloom, vignette, SMAA), Three.js
- **UI:** Tailwind CSS 4, shadcn/Radix component library
- **Mobile:** Capacitor 8 (`@capacitor/android`, `@capacitor/ios`, splash-screen plugin)
- **API:** Express 5, `ws` for WebSocket rooms, pino logging
- **DB:** PostgreSQL + Drizzle ORM, Zod validation via `drizzle-zod`
- **Monorepo:** pnpm workspaces, Node 24, TypeScript 5.9, Orval codegen from an OpenAPI spec

---

## Repo map

```
artifacts/
  3d-game/           The game itself (Vite app)
    src/game/        All gameplay code — see below
    src/lib/api.ts   API origin resolution (apiUrl / wsUrl)
    android/         Capacitor Android project
    ios/             Capacitor iOS project (SPM-based)
    scripts/         Icon + splash generation (sharp)
    public/          favicon, opengraph image, privacy-policy.html
  api-server/        Express API + WebSocket room server
  mockup-sandbox/    Scratch space for UI mockups, not shipped
lib/
  db/                Drizzle schema + client (leaderboard table)
  api-spec/          OpenAPI spec + Orval config
  api-zod/           Generated Zod schemas
  api-client-react/  Generated React Query hooks (not yet used by the game)
attached_assets/     Reference screenshots and notes from development
```

**Source of truth for gameplay** lives in `artifacts/3d-game/src/game/`:

- `types.ts` — phases, grid sizes, flash-speed timings, gym backgrounds, `HORSE_LETTERS`
- `useGameState.ts` — the whole local state machine (1P, 2P, Arcade), scoring, arcade round config
- `useRemoteGame.ts` — the same shape of state, driven by WebSocket messages
- `Court.tsx` / `Basketball.tsx` — 3D scene and ball animation
- `PatternGrid.tsx` — the tap grid, including 2P setter mode
- `GameHUD.tsx`, `MenuScreen.tsx`, `GameOverScreen.tsx`, `LeaderboardScreen.tsx`, `RemoteLobbyScreen.tsx`

`App.tsx` calls both `useGameState` and `useRemoteGame` unconditionally and swaps between them, so hook order stays stable — don't make either call conditional. The two hooks must also keep returning the *same shape*; the shared HUD reads fields from whichever is active.

---

## Running it

**Requirements:** Node 24, pnpm, a PostgreSQL database.

```bash
pnpm install
```

Environment variables:

| Variable | Used by | Notes |
| --- | --- | --- |
| `DATABASE_URL` | `lib/db` | Postgres connection string. Required — the module throws without it. |
| `PORT` | api-server, vite dev | Required, no default. |
| `BASE_PATH` | `vite.config.ts` | Required, no default. Use `/` locally. |
| `API_SERVER_PORT` | vite dev proxy | Defaults to `8080`. |
| `VITE_API_ORIGIN` | `src/lib/api.ts` | **Leave unset for web.** Required for mobile builds — see below. |

```bash
# API server
pnpm --filter @workspace/api-server run dev

# Game (dev server proxies /api and /ws to the API server)
pnpm --filter @workspace/3d-game run dev

# Checks
pnpm run typecheck
pnpm run build

# DB schema push (dev only)
pnpm --filter @workspace/db run push

# Regenerate API hooks + Zod schemas from the OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

---

## Mobile builds

Mobile uses a **separate Vite config** (`vite.config.capacitor.ts`) that drops the Replit plugins and the `PORT` / `BASE_PATH` requirements, and builds with `base: './'` so the WebView can load assets from the filesystem.

**`VITE_API_ORIGIN` is mandatory here.** On the web the game is served from the same origin as the API, so relative `/api` and `/ws` paths work. A packaged app is served from `capacitor://localhost` (iOS) or `https://localhost` (Android), so those same relative paths point at the app bundle and never reach the server — the Arcade leaderboard and Online multiplayer would fail silently. `vite.config.capacitor.ts` refuses to build without it, and rejects a value that isn't `http://` or `https://`. Android sets `allowMixedContent: false`, so real device builds need `https`. The WebSocket URL is derived automatically (`https` → `wss`).

```bash
cd artifacts/3d-game
VITE_API_ORIGIN=https://your-api-host pnpm run build:mobile
npx cap sync
npx cap open android    # or: npx cap open ios
```

Or put the value in `artifacts/3d-game/.env.production.local` — see `.env.example`.

Icons and splash screens are generated from `assets-source/icon.png` and `assets-source/splash.png` via `scripts/generate-assets.mjs` and `scripts/place-assets.mjs`.

---

## Before shipping to the stores

Known gaps, roughly in priority order:

1. **You need to generate an upload keystore.** The build is wired for it — `app/build.gradle` reads credentials from a gitignored `android/keystore.properties` or from `MH_KEYSTORE_*` environment variables, and falls back to an unsigned build with a loud warning. Follow `android/RELEASE_SIGNING.md`; the key itself is yours to create and back up. (`minifyEnabled` is still `false` — R8 can break a WebView app, so test on a device before enabling it.)
2. **iOS version fields** are still Xcode variables (`MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`) and the bundle ID needs registering in the Apple Developer portal.
3. **The privacy policy needs a public URL.** `public/privacy-policy.html` exists (last updated June 2026) but both stores require a hosted, reachable link in the listing.
4. **The API server needs a deployment** with a provisioned Postgres before the leaderboard or remote play work at all — and its origin is what goes in `VITE_API_ORIGIN`. Replit autoscale is configured in `.replit`.
5. **No tests.** There is no test runner in the workspace.
6. **Store assets** — screenshots, feature graphic, and listing copy don't exist yet. The 1024px icon and splash source art do.

---

## Developing on Windows

The workspace was built on Replit (Linux) and two things bite on Windows:

- The root `preinstall` script uses `sh`. Put Git's bin directory on `PATH` (`C:\Program Files\Git\bin`) before running `pnpm install`, or the script fails at the end of an otherwise successful install.
- pnpm blocks build scripts for `canvas`, `esbuild` and `sharp` by default and then makes `pnpm run <script>` fail its pre-run dependency check. Run `pnpm approve-builds` to decide which to allow. Nothing but the icon-generation scripts needs `sharp` or `canvas`, so the Vite builds work without approving them — invoke the local binaries directly (`node_modules\.bin\vite`) if you want to skip the check.

---

## License

MIT (declared in the root `package.json`; no `LICENSE` file has been added yet).
