# VERIFICATION.md

A test entry stays VERIFIED until a change could plausibly affect what
it tested — it is not auto-expired by unrelated work. See TESTING RULE
in project conventions (Thabo's process instructions) for how to decide
whether to rerun something.

Backfilled entries below are transcribed from DEVLOG.md's own
"Verification performed" (or equivalent) notes, in chronological order.
Nothing here was re-tested to produce this file — see "Could not
confidently establish" at the bottom for the one gap.

---

## VERIFIED — Phase 4: Pass System

**Verified against commit:** `5a4e215`

**Systems/files involved:** `game/players.js`, `ui/popup.js`, `ui/ui.js`,
`managers/score.js` (`player.passesRemaining`, `Popup.pass()`).

**What was tested (per DEVLOG Entry 2):**
- Standalone bookkeeping simulation of the decrement-and-guard logic
  (Pass count starts at 2, decrements by 1, never regains) in isolation.
- DOM-id cross-reference check before committing.

**Would require rerun if:** `passesRemaining` bookkeeping changes, the
Pass button visibility logic changes, or `Popup.pass()`'s
resolve/decrement sequence changes.

---

## VERIFIED — Question System robustness fix (no silent reshuffle)

**Verified against commit:** `721e294`

**Systems/files involved:** `managers/questionManager.js`, `ui/popup.js`
(`getQuestion()` returning `null` on exhaustion instead of
auto-reshuffling).

**What was tested (per DEVLOG Entry 3):**
- Full syntax check across every JS file.
- DOM-id cross-reference check.
- Standalone Node simulation against a synthetic 10-question database:
  all 10 questions drawn exactly once with no duplicates; exhausted
  pool returns `null` repeatedly without silently reshuffling; calling
  `reset()` again correctly rebuilds an independently-ordered pool.

**Would require rerun if:** `getQuestion()`'s exhaustion behavior
changes, or `reset()`'s rebuild/shuffle logic changes.

---

## VERIFIED — 30 new questions added (10 → 40 total)

**Verified against commit:** `1dd168d`

**Systems/files involved:** `data/questionDatabase.js` (now dead — see
PROJECT_STATE.md/DEVLOG Entry 8; superseded by `QuestionPack_v1.js`).

**What was tested (per DEVLOG Entry 4):**
- Syntax check on the file.
- Programmatic check: exactly 40 questions, all ids unique, all 30 new
  entries have every required field, no duplicate question text.
- Ran the real `QuestionManager` against the full 40-question database
  end-to-end: all 40 drawn with zero duplicates, 41st draw correctly
  returns `null` with a warning.

**Would require rerun if:** N/A — this database file is no longer
loaded by `index.html` as of Entry 8. Superseded, not currently
re-verifiable-in-place.

---

## VERIFIED — UI/UX polish: event descriptions, timer/points on Event Tiles, Pass timing

**Verified against commit:** `2fd8c7e`

**Systems/files involved:** `data/eventDatabase.js` (added `name`/
`description` per event), `ui/popup.js` (`Popup.open()`/`reveal()`
rendering, Pass visibility, Correct button hidden on pure Event tiles).

**What was tested (per DEVLOG Entry 5):**
- Full JS syntax sweep; DOM-id cross-reference check.
- Programmatic check: all 15 events have `name` and `description`,
  count unchanged at 15.
- DOM-mock functional simulation of `Popup.open()`/`reveal()` across
  pure Event, Mixed, and plain Question tiles: Pass visibility on open
  (and correctly hidden at 0 passes), timer/points banner shown/hidden
  correctly per tile type, "❓ ???" teaser only when a real event
  exists, Correct hidden through reveal on Event tiles while
  Wrong/Continue becomes visible, event name/description appears
  correctly post-reveal.
- Confirmed the `hidden` CSS class toggle mechanism for pre/post-reveal
  content.

**Would require rerun if:** `eventDatabase.js` event text fields change
structurally, or `Popup.open()`/`reveal()`'s tile-type branching logic
changes.

---

## VERIFIED — Playtest fixes: dedicated `continueEvent()`, Pass expiry, Stale tile display

**Verified against commit:** `d89bcc1`

**Systems/files involved:** `ui/popup.js` (`continueBtn`,
`Popup.continueEvent()`, shared `_resolveTile()` helper, Stale tile
rendering via `STALE_TILE_INFO`), `ui/ui.js`, `index.html`.

**What was tested (per DEVLOG Entry 6):**
- Full JS syntax sweep.
- DOM-id cross-reference check (confirms `continueBtn` wired correctly
  on both sides).
- DOM-mock functional simulation: `continueEvent()` fires the tile's
  event without awarding points and without touching the old label;
  Pass hidden immediately after `reveal()` on both pure Event and
  Mixed tiles; Stale tile's revealed content contains the new Name +
  Description block, not the old hardcoded message.

**Would require rerun if:** `_resolveTile()`'s shared resolution
sequence changes, or Stale tile rendering source changes.

---

## VERIFIED — Modal layout fix + Time Warp bug fix

**Verified against commit:** `305ad50`

**Systems/files involved:** `index.html`, `style.css`, `ui/popup.js`
(`#popupScrollArea` flex layout; `_resolveTile()`'s double-`requestAnimationFrame`
await between `EventExecutor.execute()` and `Board.markUsed()`).

**What was tested (per DEVLOG Entry 7):**
- Installed `jsdom` temporarily to parse the real `index.html`: confirmed
  `popupButtons` is a sibling of `popupScrollArea` (not nested), all six
  popup buttons present inside `popupButtons`, question/answer/timer
  content correctly inside `popupScrollArea`.
- CSS brace balance and HTML div-tag balance checks.
- Node simulation loading the actual `timer.js` and fixed `popup.js`
  with a real 1-second `setInterval`: confirmed Time Warp correctly
  halves `remaining` and that two `requestAnimationFrame` calls occur
  (proving a real paint gap) before the tile-close sequence runs.
  Contrasted against the pre-fix `popup.js` from the previous commit,
  which reproduced the reported bug exactly (zero yield points).

**Explicitly flagged limitation (from DEVLOG, not a pass):** this
sandbox has no real browser — verification was DOM-structure parsing
and execution-order/timing simulation, not literal rendering. DEVLOG
itself flags a manual browser check (narrow-window scroll test; watch
Time Warp's number visibly drop) as still worth doing. No record in
DEVLOG that this manual check was subsequently performed or confirmed.

**Would require rerun if:** the popup's flex/scroll structure changes
again, or `_resolveTile()`'s paint-yield timing changes. The manual
browser check remains an open item regardless of future code changes,
since this environment still can't confirm it.

---

## VERIFIED — Content integration: QuestionPack_v1 (as runtime question database)

**Verified against commit:** `408cd20`

**Systems/files involved:** `content/questions/QuestionPack_v1.js` (new),
`managers/questionManager.js` (`reset()` now sources from
`QuestionPackV1.questions`), `index.html` (script swap).

**What was tested (per DEVLOG Entry 8):**
- Fixed a truncation in the uploaded pack (missing closing `]`/`}`),
  then confirmed via `node --check` that it parses.
- Programmatic check: `questions.length` matches declared
  `totalQuestions` (250), all ids unique, every question has required
  fields, no duplicate question text.
- Full JS syntax sweep including the new folder.
- DOM-id cross-reference check after the script-tag swap.
- Ran the real `QuestionManager` against the fixed pack end-to-end: all
  250 drawn with zero duplicates, exhausted pool returns `null` with a
  warning, `reset()` rebuilds a fresh 250-question pool.
- Confirmed via search that nothing else in the codebase still
  references the old `QuestionDatabase` global.

**Would require rerun if:** `QuestionPack_v1.js`'s structure changes,
`QuestionManager.reset()`'s source reference changes, or the pack is
swapped for a different one.

---

## VERIFIED — Contract System framework (architecture only, no content)

**Verified against commit:** `791fb17`

**Systems/files involved:** `data/contractDatabase.js` (new, 2
placeholders only), `managers/contractManager.js` (new — `registerType`,
`_assign`, `onTileResolved`/`onScoreChange`/`onTurnEnd` hooks),
integration points in `ui/ui.js`, `engine/app.js`, `ui/popup.js`,
`managers/score.js`, `index.html`.

**What was tested (per DEVLOG Entry 9):**
- Full JS syntax sweep including the two new files.
- CSS brace balance and HTML div-tag balance checks.
- DOM-id cross-reference check (`contractsEnabled`, `contractPanel`
  wired correctly).
- 8-group functional simulation of `ContractManager`: disabled = true
  no-op (zero state change across all three hooks); Starting Contracts
  assigned to every player; Optional Contract offer pipeline; progress
  tracking with auto-completion at target; fail-state tracking;
  `getActiveContracts()` excludes completed/failed; point-reward
  payout on completion; runtime registration of a brand-new contract
  type receiving hooks with zero change to `ContractManager` itself.
- Second simulation loading the actual `popup.js` end-to-end: disabled
  → resolves exactly as before with zero `ContractManager` state
  created; enabled → `tileResolved` hook reaches a registered handler
  with correct `playerId`/`outcome`.

**Would require rerun if:** `ContractManager`'s hook dispatch
(`registerType`/`_dispatch`), the enabled/disabled guard on any public
method, or any of its three integration call sites (`popup.js`
`_resolveTile()`, `score.js` `addPoints()`/`subtractPoints()`/
`nextPlayer()`) change.

---

## VERIFIED — First 25 production contracts

**Verified against commit:** `ad94199`

**Systems/files involved:** `data/contractDatabase.js` (25 real
contracts replacing the 2 placeholders), `managers/contractTypes.js`
(new — 8 contract types). `contractManager.js` itself was NOT modified
(confirmed via `git diff --stat` showing zero changes, per DEVLOG).

**What was tested (per DEVLOG Entry 10):**
- Full JS syntax sweep including the two new/changed files.
- Confirmed `contractManager.js` has zero diff.
- DOM-id cross-reference check after the script-tag addition.
- Structural check: exactly 25 contracts, ids 1–25 with no gaps/
  duplicates, all keys unique, every required field present, every
  `category` valid, every `type` has a registered handler, difficulty
  distribution exactly 10 Easy / 10 Medium / 5 Hard.
- Functional simulation covering all 8 contract types against the real
  database: `countOutcome`/`turnsPlayed`/`scoreThreshold`/
  `singleTileScore` each complete correctly at target; `correctStreak`
  doesn't complete early, resets on wrong answer, treats Pass as
  neutral; `countAboveThreshold` requires the qualifying gain the
  specified number of separate times; both combo types track partial
  progress and complete only once both conditions are met, in either
  order; `failContract()` still works against the new content.

**Would require rerun if:** `contractDatabase.js`'s 25 entries change,
`contractTypes.js`'s 8 type handlers change, or `ContractManager`'s
progress/completion logic changes.

---

## VERIFIED — Game History Log

**Verified against commit:** `10f123f`

**Systems/files involved:** `managers/historyManager.js` (new —
`record()`, `advanceTurn()`, `open()`/`close()`/`render()`), hook call
sites added across `ui.js`, `score.js`, `popup.js`, `eventExecutor.js`,
`contractManager.js`.

**What was tested (per DEVLOG Entry 11):**
- Full JS syntax sweep; CSS brace balance and HTML div-tag balance
  checks; DOM-id cross-reference check.
- 10-part integration test loading the real files together (not
  reimplementations), driving actual `Popup.open() → reveal() →
  correct()/wrong()/pass()` calls:
  - Contracts disabled: exactly one entry each for correct answer (with
    correct point figure), wrong answer, Pass, Double-Points-affected
    correct answer (doubled amount reported correctly), Bomb Self
    (exactly one Event Activated + one Points Lost, correct final
    score math) — no duplicates.
  - Contracts enabled: Contract Assigned fires exactly once per
    starting contract per player (20 for a 2-player/10-contract game);
    Contract Completed/Progress Updated appear on cascading completion;
    Contract Failed fires correctly.
  - Sequence numbers strictly increasing, no gaps/duplicates across a
    33-entry mixed run.
  - `open()`/`close()` toggle visibility correctly; newest entry
    renders before oldest.
- A real bug (double-counted points in "Answered Correctly" when a
  Contract reward completed synchronously in the same call) was caught
  by this testing before commit and fixed by computing the tile's own
  point contribution directly instead of a before/after score snapshot.

**Known documented gap (not a defect):** Contract Accepted/Declined
entry types are not wired to any real code path — no accept/decline
flow exists yet in the game. `HistoryManager.record()` can represent
them the moment that flow exists.

**Would require rerun if:** any hook call site listed above changes,
`_resolveTile()`'s point-computation-before-`addPoints()` pattern
changes, or `HistoryManager.record()`'s sequencing changes.

---

## VERIFIED — Version 1.0 Milestone 1: Core Gameplay Completion (6 parts)

**Verified against commit:** `92ecd6f`

**Systems/files involved:** `managers/contractManager.js` (revised —
one random Starting Contract per player, `maxActiveContracts = 2`,
trigger-driven Optional Contract engine), `data/contractDatabase.js`
(trigger fields), `ui/contractOffer.js` (new), `managers/eventExecutor.js`,
`game/board.js` (true Stale tile handling), `ui/popup.js`,
`managers/gameEndManager.js` (new), `engine/app.js`, `ui/ui.js`,
`index.html`, `style.css`. Deleted: `game/powerups.js`,
`data/questionDatabase.js` (both pre-confirmed dead in earlier entries,
re-confirmed via search immediately before deletion).

**What was tested (per DEVLOG Entry 12):**
- Full JS syntax sweep after every part; CSS brace balance and HTML
  div-tag balance checks after every markup change.
- DOM-id cross-reference check (only "missing" ids are the two
  dynamically-built Sudden Death buttons, expected).
- Confirmed via `grep` that the two deleted files were genuinely
  unreferenced before deletion, and no file assumes a hardcoded tile
  count.
- 7-part functional test (Parts 1–3): exactly one random Starting
  Contract per player; trigger fires once per player respecting the
  2-contract cap; Accept/Decline both produce correct History entries;
  true Stale tile draws zero questions; `Popup.open()` on Stale shows
  Continue immediately with no Reveal/Pass/Timer; resolving a Stale
  tile produces no "Answered" entry; `convertTilesToStale()` clears an
  existing question.
- 6-part functional test (Parts 5–6): single-winner detection the
  moment (and only the moment) no unused tiles remain, independent of
  tile count; a tie correctly triggers Sudden Death; Sudden Death
  resolves exactly per the brief's documented example (A correct, B
  correct, A wrong, B correct → B wins); real player scores untouched
  by Sudden Death; question pool resets rather than stalling if
  exhausted mid-tiebreak.
- 3-part follow-up test: stats correctly derived from real History
  entries with no separate counters; zero-answers edge case produces
  `null` accuracy, not `NaN`; "New Game" correctly resets scores,
  `gameEnded`, and `firedTriggers` (a real bug — `firedTriggers` wasn't
  being reset — caught and fixed during this testing).
- Full end-to-end smoke test: built an actual 30-tile board with every
  system enabled, played every tile to completion with zero thrown
  errors, reached End Game correctly, confirmed 98 History entries with
  strictly increasing sequence numbers, no duplicates/gaps.

**Would require rerun if:** Starting Contract assignment count/cap
changes, the trigger framework (`checkTrigger()`) changes, Stale tile
handling in `Board`/`Popup` changes, `GameEndManager`'s exhaustion
check or Sudden Death resolution logic changes, or stats-derivation
from `HistoryManager.entries` changes.

---

## VERIFIED — Milestone 1.5, Parts 1 & 2 (player count bug, popup layout redesign)

**Verified against commit:** `aacd783`

**Systems/files involved:** `ui/ui.js` (missing `change` listener on
`#playerCount`, now added), `game/players.js` (`buildInputs()` preserves
names across a count change), `style.css` (all six modals switched to
sticky header/footer + single scroll container: popup, History window,
End Game window, TargetSelector, ContractOffer, Sudden Death box),
`index.html` (`#timerArea` moved to be a proper sticky-header sibling).

**What was tested (per DEVLOG Entry 13):**
- Part 1: a DOM simulation exercising the actual event flow (not just
  downstream logic) reproduced the exact reported bug scenario (open
  at 4, change to 12 → confirm 12 inputs with prior names preserved,
  confirm 12 players created), then confirmed 2, 4, 6, 10, 20 players
  all produce correct input/player counts.
- Part 2: confirmed via a real DOM-tree check against the actual
  `index.html` that header/scroll-area/footer are correctly ordered as
  direct sibling children of the single scrolling container, for all
  three major modals. CSS brace balance and full JS syntax sweep clean.

**Explicitly flagged limitation (from DEVLOG, not a pass):** same as
the Entry 7 Time Warp/layout verification — this sandbox cannot render
actual layout. Part 2 is verified structurally/by CSS reasoning only;
DEVLOG explicitly flags it for the user to confirm visually before
considering Part 2 fully closed. No record in DEVLOG that this visual
confirmation was subsequently done.

**Would require rerun if:** `#playerCount`'s change-handling changes,
`buildInputs()`'s name-preservation logic changes, or any modal's
scroll/sticky CSS structure changes again. The visual confirmation
remains an open item regardless of future code changes.

**Not yet started as of this commit (per DEVLOG):** Milestone 1.5
Parts 3 (Contracts Panel UX), 4 (Contract Architecture Audit), 5 (Full
Architecture Audit), 6 (Regression Testing).

---

## VERIFIED — Contract System UX Polish

**Verified against commit:** `83b06af`

**Systems/files involved:** `ui/contractOffer.js` (reward line added),
`managers/contractManager.js` (`renderPanel()` only — hierarchy
redesign), `style.css`.

**What was tested (per DEVLOG Entry 14):**
- Full syntax sweep, CSS brace balance, DOM-id cross-reference check.
- 5-part functional test against the real files: offer popup's
  title/description/reward match the database entry exactly; panel
  renders name/description/reward/progress/status for an active
  contract; a completed contract shows "Completed" instead of a stale
  progress fraction; mutating the database mid-run automatically
  updates both the offer popup and the panel on next render (the
  single-source-of-truth requirement, verified directly rather than
  assumed); Accept/Decline buttons still created and wired identically
  to before.

**Would require rerun if:** `ContractOffer`'s rendering source changes,
`renderPanel()`'s field lookups change, or contract data no longer
comes from a single `ContractDatabase` source of truth.

---

## VERIFIED — Information Architecture milestone (Notifications, Information Board, Event Categories)

**Verified against commit:** `171859a`

**What was tested:**
1. Full static sweep: JS syntax across every file, CSS brace balance,
   HTML div-tag balance, DOM-id cross-reference check (every
   `getElementById`/`querySelector` target exists).
2. Confirmed by search that no other file hardcodes an event-category
   list — `data/eventDatabase.js` is the single source for event
   `category` values.
3. Functional test (synthetic board), 5 parts:
   - `NotificationManager.notify()` creates a correctly-styled card.
   - All 15 events have a valid `category` with no gaps.
   - `InformationBoard.render()` derives correct counts from a
     synthetic board, correctly excluding a used tile and a tile with
     no real event.
   - Counts update correctly when a tile is marked used
     (`Board.markUsed()`).
   - Counts update correctly when a tile converts to Stale
     (`Board.convertTilesToStale()` — the Cleanup/Bad Jackpot path).
4. Focused test against real (non-synthetic) `contractManager.js` and
   `eventExecutor.js`:
   - `completeContract()` / `failContract()` each fire exactly one
     notification with the correct title.
   - A shield blocking a real `bombOther()` call fires a "Shield
     Broken" notification and correctly consumes the shield.

**Would require rerun if:**
- `eventDatabase.js` event categories change, or an event is
  added/removed.
- `Board.markUsed()`, `Board.markTilesUsed()`, or
  `Board.convertTilesToStale()` change how/when they're called, or a
  new code path mutates tile "used"/"stale" state outside them.
- `InformationBoard.render()`'s counting logic changes.
- `NotificationManager.notify()`'s card-building logic changes.
- `contractManager.js`'s `completeContract()`/`failContract()` change
  what they call on success/failure.
- `eventExecutor.js`'s shield-consumption logic
  (`consumeShieldIfPresent`) changes.

**Would NOT require rerun for:**
- Changes confined to unrelated systems (Timer, Players, Score, Popup
  UI styling, question content) that don't touch the board/tile
  mutation entry points or notification/info-board rendering.

---

## VERIFIED — Threat Engine, Step 1: threatDatabase.js (data layer only)

**Verified against commit:** `816dde6`

**Systems/files involved:** `js/data/threatDatabase.js` (new, data
only — no logic, reads no game state), `index.html` (one script tag
added, directly after `contractDatabase.js`).

**What was tested:**
- `node --check` syntax validation.
- Structural/value checks against the approved spec: exactly 3
  `ThreatLevels` in order (NORMAL/DANGEROUS/CRITICAL) with punishment
  chances 0/0.37/0.70; DANGEROUS trigger is 50% board progress OR 3
  harmful events; CRITICAL trigger is 80% OR 6 harmful events; exactly
  5 `ThreatPunishments` with unique keys, weights summing to 100
  (30/25/25/12/8), correct `minLevel` per punishment (3x Dangerous+, 2x
  Critical-only), correct `bypassesShield`/`requiresShield` flags per
  punishment (SHIELD_BREAK bypasses Shield and requires the target to
  actually have one; CONTRACT_LOCK and CONTRACT_WIPE bypass Shield;
  POINT_DRAIN and LOSE_ALL_POINTS are Shield-protectable);
  `ThreatCooldownLength === 2`.
- `index.html` div-tag balance check after the one-line insertion
  (unchanged, 27/27).
- No functional/integration testing — nothing yet reads this file.

**Would require rerun if:** any value in `ThreatLevels` or
`ThreatPunishments` changes, or a punishment/level is added or removed.

**Not yet tested (because nothing exists to test it against yet):**
level-transition logic, punishment roll/selection, cooldown behavior,
Shield interaction, Contract integration, board-progress/harmful-event
counting. These become testable as each dependent piece
(`ThreatManager`, `ThreatConsequences`, the three modified-file
integrations) is actually built.

---

## VERIFIED — Threat Engine, Step 2: threatManager.js (decision logic, no execution)

**Verified against commit:** `cc61d44`

**Systems/files involved:** `js/managers/threatManager.js` (new —
level tracking, harmful-event counting, cooldown, punishment roll and
weighted selection), `index.html` (one script tag, no other changes).
Reads `GameNight.board` and `GameNight.players` (existing globals);
does not modify either. Not called from `eventExecutor.js`, `popup.js`,
`contractManager.js`, `engine/app.js`, or anywhere else — this step is
intentionally not integrated into the game loop.

**What was tested (19-part Node test against the real files, run
through `vm`, not reimplementations):**
- Level transitions: NORMAL→DANGEROUS at exactly 50% board progress;
  NORMAL→DANGEROUS at exactly 3 harmful events with 0% board progress
  (and confirmed still NORMAL at 2); NORMAL→CRITICAL directly at 80%
  board progress in one evaluation (both thresholds crossed at once);
  DANGEROUS→CRITICAL at exactly 6 harmful events (confirmed still
  DANGEROUS at 5).
- Harmful-event counting: confirmed it's a single global running
  total across multiple different players, not per-player.
- No downgrade: forced the level to CRITICAL, then reset board
  progress and harmful count back to zero-equivalent conditions and
  re-ran `evaluateLevel()` — level stayed CRITICAL.
- Cooldown: a forced punishment hit sets the cooldown to
  `ThreatCooldownLength` (2); a subsequent harmful event against that
  player is blocked from rolling and decrements the cooldown instead;
  after 2 qualifying harmful events the cooldown reaches 0; the next
  harmful event rolls normally again. Also confirmed cooldown is
  strictly per-player — punishing player 1 left player 2's cooldown at
  0.
- Punishment selection: level gating (CRITICAL-only punishments never
  selected at DANGEROUS, over 200 trials); `requiresShield` correctly
  blocks SHIELD_BREAK for a player with no Shield (300 trials, zero
  hits) and allows it for a player who has one; a 20,000-trial
  distribution check confirmed the weighted selection matches
  `threatDatabase.js`'s weights (30/25/25/12/8) within 3 percentage
  points per punishment.
- Player-count independence: `getBoardProgress()` is a plain
  used/total ratio; confirmed via source-text check that
  `threatManager.js` contains no `players.length` reference anywhere.
- NORMAL level: confirmed `rollPunishment()` never fires even on a
  forced `Math.random() = 0.0`, since `punishmentChance` is 0.

**Explicitly NOT tested (because nothing exists yet to test it
against):** actual punishment execution/application to a player
(ThreatConsequences doesn't exist yet), any interaction with
`eventExecutor.js`/`popup.js`/`contractManager.js` (unmodified, not
called), calling this manager from the real game loop (`app.js`
doesn't call `ThreatManager.initialize()` yet).

**Would require rerun if:** any `ThreatLevels`/`ThreatPunishments`/
`ThreatCooldownLength` value in `threatDatabase.js` changes,
`evaluateLevel()`'s upgrade-only logic changes, `registerHarmfulEvent()`
or `rollPunishment()`'s sequencing changes, `selectPunishment()`'s
eligibility filtering or weighting changes, or `getBoardProgress()`'s
source of tile data changes.

---

## VERIFIED — Threat Engine, Step 3: threatConsequences.js (punishment application, no integration)

**Verified against commit:** `2e1e8a3`

**Systems/files involved:** `js/managers/threatConsequences.js` (new —
single entry point `apply(playerId, punishmentKey)`, five per-punishment
handlers, shared `_shieldBlocks()` helper), `js/managers/contractManager.js`
(additive — new `contractsLocked` state reset in `initialize()`/
`startGame()`; three new public methods
`isOptionalContractsBlocked`/`blockOptionalContracts`/
`wipeOptionalContracts`; one guard line added to each of
`offerOptionalContract()` and `checkTrigger()`), `index.html` (one
script tag). Reads `GameNight.players`, `player.shield`, `player.score`
(existing globals); reads and calls the new `ContractManager` public
methods; reads (does not modify) `EventExecutor.consumeShieldIfPresent`.
Not called from `eventExecutor.js`, `popup.js`, `engine/app.js`, or
`ThreatManager` — no gameplay integration in this step.

**What was tested (31-part Node test against the real files, run
through `vm` — `threatDatabase.js`, `contractDatabase.js`,
`eventExecutor.js`, `contractManager.js`, `threatManager.js`, and
`threatConsequences.js` all loaded as the actual project files, not
reimplementations):**
- Invalid player ID and unknown punishment key both fail safely
  (`applied: false` with a reason, zero state change, no exception).
- SHIELD_BREAK: removes the Shield and reports success when the
  player has one; fails safely with `requires-shield-but-player-has-none`
  when they don't (validated independently inside
  `threatConsequences.js`, not just trusted from the caller).
- POINT_DRAIN: removes exactly `floor(score * 0.5)` (verified 101 →
  drains 50, leaves 51); fully blocked and Shield consumed when the
  player has one (score unchanged, shield now false); does not throw
  and stays at 0 when the player already has 0 points.
- LOSE_ALL_POINTS: zeroes the score and reports the previous value;
  fully blocked and Shield consumed when the player has one; succeeds
  as a no-op when already at 0.
- CONTRACT_LOCK: calls the real `ContractManager.blockOptionalContracts`
  (confirmed via `isOptionalContractsBlocked` afterward); leaves the
  player's existing active contract count unchanged; still applies
  with `shield: true` (bypasses Shield, per the database); confirmed
  `offerOptionalContract()` now actually returns `null` for a locked
  player.
- CONTRACT_WIPE: after a real `startGame()` assigns one Starting
  contract and a real Optional contract is assigned via
  `ContractManager._assign()`, wiping leaves the Starting contract
  active and untouched, marks only the Optional instance with status
  `"wiped"` (not `"completed"`/`"failed"`), pays no reward, and a
  subsequent `updateProgress()` call with a huge amount against the
  wiped instance has no effect (still `"wiped"`, score unchanged) —
  confirming the terminal state actually prevents reuse. Also
  confirmed it succeeds (`applied: true`, empty wiped list) rather
  than failing when the player has no Optional contracts at all, and
  that it applies with `shield: false` (bypasses Shield).
- Both contract punishments fail safely with `contracts-disabled` when
  `ContractManager.enabled` is false.
- Applying a punishment to one player leaves a second player's score
  and Shield completely untouched.
- Confirmed via a spy that POINT_DRAIN's Shield check actually calls
  through to the real `EventExecutor.consumeShieldIfPresent`, not a
  reimplementation.
- Confirmed `ThreatManager`'s level/harmful-counter/cooldown state is
  completely unchanged after `ThreatConsequences.apply()` runs, and by
  source-text check that `threatConsequences.js` never calls into
  `ThreatManager` at all — the two files stay decision/execution-split
  as designed.
- Confirmed by source-text check that `engine/app.js` references
  neither `ThreatManager` nor `ThreatConsequences`, and that
  `eventExecutor.js`/`popup.js` contain no `Threat` reference at all —
  no gameplay integration was accidentally introduced.
- `index.html` div-tag balance unchanged (27/27) after the script-tag
  insertion.
- Separate targeted regression check against the real (unmodified
  logic) `contractManager.js`: the disabled-Contracts no-op guard still
  holds for the three new methods exactly like every existing method,
  and the normal enabled Starting-Contract assignment flow from
  `startGame()` is unaffected by the additions.

**Explicitly NOT tested (because nothing exists yet to test it
against):** anything about *when* a punishment gets applied during
real play (no `eventExecutor.js`/`popup.js` hook exists), Pass
interaction with the punishment roll, Information Board or
Notification display of Threat state, or `ThreatManager.initialize()`
being called from the real game loop.

**Would require rerun if:** any `ThreatPunishments` entry's
`bypassesShield`/`requiresShield` value changes, any handler in
`threatConsequences.js` changes, `ContractManager`'s new
lock/wipe methods or their guard lines change, `_getDefinition()`'s
`category` field semantics change, or
`EventExecutor.consumeShieldIfPresent()`'s behavior changes.

---

## Could not confidently establish

- **Entry 1** — "Phase 1: EventExecutor implementation + Phase 2:
  Target Selection + Board Event System" (commits `24308b2`, `f7838cb`,
  `cab688a`). DEVLOG's "Known issues" section for this entry lists
  pre-existing dead code and content gaps, but records no explicit
  verification/testing claim the way every later entry does. Not
  backfilled here rather than inventing one — if this system needs
  re-verification confidence, it would need actual (re-)testing, not a
  DEVLOG transcription.
- Two items are recorded in DEVLOG as flagged-but-not-confirmed, not as
  passed: the visual (real-browser) confirmation of the Entry 7 Time
  Warp/modal-scroll fix, and the visual confirmation of the Entry 13
  Part 2 sticky-header/footer layout. Both are noted above under their
  respective entries as open, not marked fully VERIFIED-by-rendering.
