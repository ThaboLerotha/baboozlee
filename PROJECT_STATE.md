# PROJECT_STATE.md

**Last updated against commit:** `2e1e8a3` — "Threat Engine:
ThreatConsequences (`threatConsequences.js`) — step 3 of N"

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
  - DONE: `js/managers/threatManager.js` — decides, doesn't act.
    Global `currentLevelIndex` (never decreases) and
    `harmfulEventsResolved` counter; per-player `playerCooldowns`
    map. Public API: `getCurrentLevel()`/`getCurrentLevelKey()`,
    `getHarmfulEventsResolved()`, `getCooldown(playerId)`/
    `isOnCooldown(playerId)`, `getBoardProgress()` (used-tiles /
    `GameNight.board.length`, player-count independent),
    `getSummary()` (level/harmfulEventsResolved/boardProgress
    snapshot, deliberately excludes cooldowns and anything
    location-revealing), `evaluateLevel()` (upgrade-only check
    against the next level's trigger), `registerHarmfulEvent(playerId)`
    (the intended future single entry point: increments the counter,
    evaluates level, then either decrements cooldown or calls
    `rollPunishment`), `rollPunishment(playerId)` (chance roll against
    the current level, then delegates to `selectPunishment` and sets
    cooldown on a hit), `selectPunishment(playerId, levelKey)`
    (weighted random among level- and Shield-eligible punishments).
    Selection only — never mutates a player's score/shield/contracts,
    never calls any other manager. Wired into `index.html` (script tag
    only, directly after `gameEndManager.js`); `GameNight.initialize()`
    does NOT call `ThreatManager.initialize()` yet — that's part of
    real game-loop integration, a later step.
  - DONE: `js/managers/threatConsequences.js` — acts, doesn't decide.
    Single public entry point `apply(playerId, punishmentKey)`:
    validates the player exists and the punishment key is real,
    independently re-checks `requiresShield` against the target's
    actual Shield status, then dispatches to one of five handlers.
    `SHIELD_BREAK` sets `player.shield = false` directly (it bypasses
    Shield by design — its purpose IS to destroy it). `CONTRACT_LOCK`
    calls the new `ContractManager.blockOptionalContracts(playerId)`.
    `CONTRACT_WIPE` calls the new
    `ContractManager.wipeOptionalContracts(playerId)`. `POINT_DRAIN`
    (`floor(score * 0.5)`) and `LOSE_ALL_POINTS` (`score = 0`) each
    first check Shield via a shared `_shieldBlocks()` helper that
    reuses `EventExecutor.consumeShieldIfPresent()` (existing public
    method, not duplicated) — a Shield fully blocks and consumes
    itself against these two, matching each punishment's
    `bypassesShield` flag in `threatDatabase.js`. Every path returns a
    `{ applied, punishment, playerId, ... }` result; nothing throws on
    bad input. Never reads or writes any `ThreatManager` state — purely
    an executor of what it's told. Wired into `index.html` (script tag
    only, directly after `threatManager.js`); not called from anywhere.
  - `js/managers/contractManager.js` gained three small additive public
    methods to support the two contract punishments, following its
    existing `if(!this.enabled) return;` no-op guard convention exactly
    like every other public method in the file:
    `isOptionalContractsBlocked(playerId)`,
    `blockOptionalContracts(playerId)` (sets a per-player
    `contractsLocked` flag; existing active contracts are completely
    untouched), `wipeOptionalContracts(playerId)` (marks each active
    contract whose *definition* has `category === "optional"` — not
    `"starting"` — with a new terminal status `"wiped"`, distinct from
    `"completed"`/`"failed"`, so `completeContract()`/
    `updateProgress()`/`_dispatch()` — all gated on
    `status === "active"` — can never act on it again; no reward can be
    accidentally paid). `offerOptionalContract()` and `checkTrigger()`
    were each given one extra guard line so they respect the lock.
    `contractsLocked` resets alongside `firedTriggers` in both
    `initialize()` and `startGame()`.
  - NOT STARTED: integration into `eventExecutor.js` (calling
    `registerHarmfulEvent()` when a harmful event resolves, then
    `ThreatConsequences.apply()` on a hit), `popup.js` (Pass skips the
    roll), `informationBoard.js` (show current Threat Level +
    hidden-event count, no location hints), `notificationManager.js`
    calls for level-change/punishment events, and calling
    `ThreatManager.initialize()`/`.reset()` from the real game loop.
    Nothing in normal gameplay calls `ThreatManager` or
    `ThreatConsequences` yet.

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

Threat Engine — data layer, `ThreatManager` (decision logic), and
`ThreatConsequences` (application logic) all complete in isolation.
Still nothing calls either manager from real gameplay. Next step:
wiring `eventExecutor.js` to call `ThreatManager.registerHarmfulEvent()`
when a harmful event resolves, and `ThreatConsequences.apply()` when
that call reports a punishment.
