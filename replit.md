# Memory Hoops

A 3D basketball pattern-memory game: the grid flashes a sequence, the player repeats it before the timer runs out, and every miss costs a letter of H-O-R-S-E.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/3d-game run dev` — run the game (proxies `/api` and `/ws` to the API server)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string; `PORT`; `BASE_PATH` (use `/` locally); optional `API_SERVER_PORT` (defaults to 8080); `VITE_API_ORIGIN` unset on web, required for mobile builds
- Mobile build: `cd artifacts/3d-game && VITE_API_ORIGIN=https://your-api-host pnpm run build:mobile && npx cap sync`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Game: React 19 + Vite, `@react-three/fiber` / `drei` / `postprocessing`, Three.js, Tailwind 4, Radix/shadcn UI
- Mobile: Capacitor 8 (Android + iOS), splash-screen plugin
- API: Express 5, `ws` WebSocket rooms, pino logging
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle) for the API server

## Where things live

- **Gameplay source of truth:** `artifacts/3d-game/src/game/`
  - `types.ts` — game phases, grid sizes, flash-speed timings, gym palettes, `getPatternLength()`
  - `useGameState.ts` — local state machine for 1P / 2P / Arcade, scoring, `getArcadeRoundConfig()`
  - `useRemoteGame.ts` — same state shape driven by WebSocket messages
  - `PatternGrid.tsx`, `GameHUD.tsx`, `MenuScreen.tsx`, `GameOverScreen.tsx`, `LeaderboardScreen.tsx`, `RemoteLobbyScreen.tsx`
  - `Court.tsx`, `Basketball.tsx` — the 3D scene
- **DB schema:** `lib/db/src/schema/leaderboard.ts` (single `leaderboard` table: name, score, round, created_at)
- **API contracts:** `lib/api-spec/openapi.yaml` — note it currently documents only `/healthz`; the leaderboard routes are not in the spec
- **API routes:** `artifacts/api-server/src/routes/`; WebSocket room logic in `src/lib/rooms.ts` and `src/lib/websocket.ts`
- **Mobile config:** `artifacts/3d-game/capacitor.config.ts`, plus `android/` and `ios/` projects
- **API origin:** `artifacts/3d-game/src/lib/api.ts` (`apiUrl`, `wsUrl`), documented in `artifacts/3d-game/.env.example`
- **Theme values:** `GYM_BG` and the per-gym lighting/bloom settings are inline in `types.ts` and `App.tsx`

## Architecture decisions

- `App.tsx` calls **both** `useGameState()` and `useRemoteGame()` on every render and swaps between them with an `isRemote` flag. This keeps hook order stable — never make either call conditional.
- Local and remote game hooks deliberately return the **same shape**, so the HUD, grid, and game-over screens are mode-agnostic.
- All gameplay timing runs through a `timeoutsRef` array with a `clearAllTimeouts()` helper, so phase changes can't leave orphaned callbacks firing into a stale phase.
- Two Vite configs by design: `vite.config.ts` (Replit — needs `PORT` and `BASE_PATH`, uses Replit plugins, absolute base) and `vite.config.capacitor.ts` (mobile — no env requirements, `base: './'`, manual chunks for three/r3f/react to keep WebView bundles reasonable).
- Sound is synthesized at runtime with the Web Audio API (`useGameSounds.ts`) — no audio files ship with the app, and each grid cell maps to its own tone.
- High score is stored in `localStorage` (`horse_game_high_score`); only Arcade mode posts to the server leaderboard.

## Product

Four modes: **1P** (solo, 100 pts/round, 1000 to win), **2P** pass-and-play on one device (players take turns setting patterns for each other), **Arcade** (3 lives, difficulty ramps by round, posts to a global leaderboard), and **Remote** (two devices over WebSocket with a 6-character room code). Configurable grid size, timer, flash speed, and three gym themes.

## Gotchas

- **All API calls must go through `src/lib/api.ts`.** `apiUrl()` and `wsUrl()` resolve against `VITE_API_ORIGIN`, which is empty on web (relative paths, same origin) and mandatory for Capacitor builds — a packaged app is served from `localhost`, so a raw `/api/...` fetch or a `location.host` socket can never reach the server. `vite.config.capacitor.ts` fails the build if the variable is missing or malformed. Don't reintroduce a bare `fetch('/api/...')`.
- **The two game hooks must return the same shape.** The shared HUD reads fields off whichever hook is active, so a field added to `useGameState` needs a counterpart in `useRemoteGame` (that is why it returns `arcadeLives: 0` and other inert placeholders) or the union type stops compiling.
- `lib/db` throws at import time if `DATABASE_URL` is unset, and `vite.config.ts` throws if `PORT` or `BASE_PATH` are unset. Nothing runs without those.
- `android/app/src/main/assets/public/` and `ios/App/App/public/` hold a **synced copy** of the built web app. It goes stale — always re-run `npx cap sync` after a web build, don't hand-edit those.
- The generated `@workspace/api-client-react` hooks aren't used by the game yet; it calls `fetch` directly. Don't assume the OpenAPI spec reflects the real API surface.
- `pnpm-workspace.yaml` sets a minimum package release age as supply-chain defense. Do not disable it.
- Root `package.json` has a `preinstall` guard that rejects npm and yarn — use pnpm.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `README.md` for the publish-readiness checklist
