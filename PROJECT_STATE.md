# PROJECT_STATE.md

**Last updated against commit:** `816dde6` — "Threat Engine: data layer
(`threatDatabase.js`) — step 1 of N"

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

## Systems: in progress

- **Threat Engine** — approved design (see BACKLOG.md for the full
  spec: threat levels, punishments, weights, cooldown, contract
  integration contract). Building incrementally, one dependency at a
  time.
  - DONE: `js/data/threatDatabase.js` — data only (3 `ThreatLevels`
    with order/punishmentChance/trigger; 5 `ThreatPunishments` with
    minLevel/weight/bypassesShield/requiresShield;
    `ThreatCooldownLength = 2`). No logic, no game-state reads. Wired
    into `index.html` load order directly after `contractDatabase.js`
    (data files load together, before any manager).
  - NOT STARTED: `ThreatManager` (level tracking, board-progress/
    harmful-event counting, punishment roll+selection, cooldown
    tracking), `ThreatConsequences` (executing a selected punishment's
    effect), integration into `eventExecutor.js` (harmful-event
    counting hook), `popup.js` (Pass skips the punishment roll),
    `contractManager.js` (`blockOptionalContracts()` /
    `wipeOptionalContracts()` + a wiped-contract terminal state),
    `informationBoard.js` (show current Threat Level + hidden-event
    count, no location hints), `notificationManager.js` calls for
    level-change/punishment events.

## Systems: prepared but intentionally NOT implemented (architecture only)

- **Treasure Chests** — `GameNight.rewardChestStatus` /
  `GameNight.legacyChestStatus` fields exist as the contract a future
  system would write into. `InformationBoard.render()` already reads
  them and shows "Not yet available" / "Not Created" since nothing
  sets them yet. No chest creation/merge/turn-rotation logic exists.
  Approved design: exactly two possible chests per game (default
  hidden chest from game start; a Legacy/Departure chest that only
  exists if a player leaves). Never a collection of multiple chests.
- **Player Departure** — `HistoryManager.record()` is generic enough to
  log a departure directly; no departure/removal logic is written.
- **Malicious Contracts** — approved as future work. Contracts whose
  purpose can be to harm another player, even if the holder gains
  nothing. Not implemented. The Threat Engine's `ContractManager`
  integration is being built through the public methods
  `blockOptionalContracts()`/`wipeOptionalContracts()` specifically so
  Malicious Contracts can be added later without redesigning the
  Threat Engine.

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

Threat Engine — data layer complete, manager not started. Next step:
`ThreatManager` (level tracking + trigger evaluation), the first piece
that actually reads game state.
