# PROJECT_STATE.md

**Last updated against commit:** `171859a` (2026-08-09) — "Information
Architecture: Notifications, Information Board, Event Categories"

This file is a snapshot, not the source of truth. When in doubt, check the
repo. Update this file whenever a milestone lands.

## What the project is

Game Night Engine ("gnite") — a browser-based, single-page board/quiz game
(`gnite/index.html`), vanilla JS, no build step, no framework. Loaded via
a fixed `<script>` order in `index.html` (see ARCHITECTURE.md).

## Systems: complete

- **Board generation & tiles** (`boardGenerator.js`, `game/board.js`) —
  tile grid build, event/question distribution, stale/used tile states.
- **Question system** (`questionManager.js`, `QuestionPack_v1.js`) — 40
  questions, shuffle, exhausted-pool handling (no silent reshuffle bug).
- **Event system** (`eventManager.js`, `eventExecutor.js`,
  `data/eventDatabase.js`) — 15 events (Jackpot, Bad Jackpot, Bomb
  Self/Other, Freeze, Steal, Shield, Gift, Double Points, Bonus Turn,
  Chaos, Cleanup, Meteor, Time Warp, No Escape), each tagged with a
  `category` (Beneficial/Harmful/Neutral) as of this commit.
- **Contract system** (`contractManager.js`, `contractTypes.js`,
  `data/contractDatabase.js`, `ui/contractOffer.js`) — 25 production
  contracts, full offer/assign/progress/complete/fail lifecycle.
- **Scoring & players** (`score.js`, `game/players.js`).
- **Timer** (`timer.js`).
- **Game history log** (`historyManager.js`) — turn-by-turn record.
- **Game end / sudden death** (`gameEndManager.js`).
- **Popup & target selection UI** (`ui/popup.js`, `ui/targetSelector.js`).
- **Notifications** (`notificationManager.js`) — toast-style event/
  contract feedback (e.g. Shield Broken, contract complete/fail).
- **Information Board** (`informationBoard.js`) — new 4th column in the
  main layout; renders live counts derived from board state (category
  counts, correctly excludes used tiles / no-event tiles). Re-rendered
  at game start and inside `Board.markUsed()`/`markTilesUsed()`, plus
  explicit calls added inside `badJackpot()`/`cleanup()` to cover the
  Stale-tile-conversion gap (see DEVLOG for why).

## Systems: prepared but intentionally NOT implemented (architecture only)

- **Treasure Chests** — `GameNight.rewardChestStatus` /
  `GameNight.legacyChestStatus` fields exist as the contract a future
  system would write into. `InformationBoard.render()` already reads
  them and shows "Not yet available" / "Not Created" since nothing
  sets them yet. No chest creation/merge/turn-rotation logic exists.
- **Threat Levels** — no field exists yet, but `NotificationManager` is
  ready to receive a "Threat Level changed" call, and the natural home
  for the data is `GameNight.threatLevel` (same pattern as the chest
  fields above).
- **Player Departure** — `HistoryManager.record()` is generic enough to
  log a departure directly; no departure/removal logic is written.

See BACKLOG.md for the full list of approved-but-not-started features.

## Important architectural facts (should not need rediscovery)

- No build system — files are loaded directly via `<script>` tags in a
  fixed order in `gnite/index.html`. Order matters (see ARCHITECTURE.md).
- Global singletons, not classes/modules — every system is a single
  `const X = { ... }` object attached to the global scope. No imports,
  no bundler.
- Central game state lives on `GameNight` (`js/engine/app.js`) —
  `settings`, `players`, `currentPlayer`, `board`, plus ad hoc fields
  added over time (`rewardChestStatus`, `legacyChestStatus`).
- `GameNight.initialize()` guards optional managers with
  `typeof X !== "undefined"` checks — several managers are treated as
  optional/pluggable at boot even though all currently exist.
- `EventExecutor.execute()` is async because targeted events must wait
  for the host to pick a player via `TargetSelector`.
- `Popup` tracks whether the open tile is answerable, since pure Event
  tiles and true Stale tiles never show a Correct/Wrong state.

## Currently being developed

Nothing in-flight as of this commit — last commit closed out the
Information Architecture milestone. Next work should start from
BACKLOG.md or explicit instruction.
