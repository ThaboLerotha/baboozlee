# ARCHITECTURE.md

**Accurate as of commit:** `171859a` (2026-08-09)

No build step. No modules/imports. Every file defines one global
`const` object (a "manager" or "system") and attaches it to the global
scope by load order. `gnite/index.html` load order is the dependency
graph — a manager can only assume an earlier-loaded manager already
exists.

## Load order (index.html) — earlier = depended-upon, later = dependent

```
1.  data/QuestionPack_v1.js      question content
2.  data/eventDatabase.js        event content (15 events, categorized)
3.  data/contractDatabase.js     contract content (25 contracts)
4.  managers/questionManager.js
5.  managers/eventManager.js
6.  managers/eventExecutor.js
7.  managers/boardGenerator.js
8.  managers/timer.js
9.  managers/score.js
10. managers/contractManager.js
11. ui/contractOffer.js
12. managers/contractTypes.js
13. managers/historyManager.js
14. managers/notificationManager.js
15. managers/informationBoard.js
16. managers/gameEndManager.js
17. engine/app.js                 defines GameNight, orchestrates init
18. game/players.js
19. game/board.js
20. ui/targetSelector.js
21. ui/popup.js
22. ui/ui.js                      top-level UI, calls UI.initialize() last
```

## Who owns what

| System | File | Owns |
|---|---|---|
| `GameNight` | `engine/app.js` | Central game state: `settings`, `players`, `currentPlayer`, `board`, plus loosely-typed extra fields (`rewardChestStatus`, `legacyChestStatus`, future `threatLevel`). Calls `.initialize()` on every other manager in sequence. |
| `QuestionManager` | `managers/questionManager.js` | Question pool, shuffling, `getQuestion()`. |
| `EventManager` | `managers/eventManager.js` | Event inventory/shuffle (`getInventory`, `addEvent`, `removeActiveEvent`). |
| `EventExecutor` | `managers/eventExecutor.js` | Executing a specific event's effect (jackpot, bombSelf, chaos, etc.) once triggered. Async — waits on `TargetSelector` for targeted effects. |
| `BoardGenerator` | `managers/boardGenerator.js` | Deciding tile *type* when the board is built. |
| `Board` | `game/board.js` | The actual board/tile array — build, mark used, convert to stale, query tiles. |
| `Players` | `game/players.js` | Player list creation, current-player lookup. |
| `Score` | `managers/score.js` | Points — add/subtract, scoreboard render, turn advance. |
| `Timer` | `managers/timer.js` | Per-turn countdown, beep, timeout handling. |
| `ContractManager` | `managers/contractManager.js` | Contract lifecycle: assign, offer, progress, complete/fail. Dispatches to `ContractTypes` hooks. Also owns the per-player Optional-Contract lock/wipe punishment surface (`isOptionalContractsBlocked`/`blockOptionalContracts`/`wipeOptionalContracts`), used by `ThreatConsequences` — not yet called by anything in real gameplay. |
| `ContractTypes` | `managers/contractTypes.js` | Per-contract-type `onHook` behavior, registered into `ContractManager`. |
| `ContractOffer` (UI) | `ui/contractOffer.js` | The contract-offer popup panel. |
| `HistoryManager` | `managers/historyManager.js` | Turn-by-turn game history log — generic `record()`/`render()`. |
| `NotificationManager` | `managers/notificationManager.js` | Toast notifications (`notify()`). Any system can call this; it owns no other system's state. |
| `InformationBoard` | `managers/informationBoard.js` | Read-only 4th UI column. Derives all counts from `Board`/`GameNight` state on `render()` — owns no state of its own. |
| `GameEndManager` | `managers/gameEndManager.js` | End-game detection, stats, sudden death flow, new-game replay. |
| `TargetSelector` (UI) | `ui/targetSelector.js` | Host picks a target player for targeted events. |
| `Popup` (UI) | `ui/popup.js` | Tile-click popup: open/reveal/close, answerable-state tracking. |
| `UI` | `ui/ui.js` | Top-level UI bootstrap, called last in `initialize()`. |

## Communication pattern

- No event bus / pub-sub. Managers call each other's methods directly
  by global name (e.g. `HistoryManager.record(...)`,
  `NotificationManager.notify(...)`).
- Optional managers are called through an existence guard:
  `if (typeof X !== "undefined") { X.method() }` — this pattern exists
  in `GameNight.initialize()` and should be followed for any new
  manager that isn't guaranteed to always be present.
- `InformationBoard` and `NotificationManager` are **read/report only**
  — they derive from or announce other systems' state changes, they do
  not own or mutate game state themselves. Do not have other systems
  reach into `InformationBoard`'s internals; only call `.render()`.

## Do-not-bypass rules

- **Don't mutate `Board` tile state directly from UI or event code.**
  Go through `Board.markUsed()` / `Board.markTilesUsed()` /
  `Board.convertTilesToStale()` — `InformationBoard` re-renders are
  wired to these specific entry points, not to raw array mutation.
  Bypassing them silently desyncs the Information Board (this already
  happened once with `convertTilesToStale()` — see DEVLOG, fixed by
  adding explicit render calls in `badJackpot()`/`cleanup()`, not by
  changing `Board`).
- **Don't add new "current game state" fields ad hoc on other objects.**
  `GameNight` is the established single home for cross-cutting state
  (`rewardChestStatus`, `legacyChestStatus`, future `threatLevel`).
  Keep using it so there's one place to look, not several.
- **Don't call `EventExecutor` effect functions synchronously expecting
  an immediate result** — they're async pending `TargetSelector`
  input for targeted effects. Await them.
- **Contract type-specific logic belongs in `ContractTypes`**, dispatched
  via `ContractManager`, not inlined into `ContractManager` itself.
