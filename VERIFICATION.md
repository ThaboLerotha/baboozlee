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

**Verified against commit:** `bb404a1` (corrected — this entry
originally recorded the pre-amend hash `2e1e8a3`; `bb404a1` is the
actual commit that landed on `origin/main`)

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

## VERIFIED — Threat Engine, Step 4: harmful-event integration (eventExecutor.js)

**Verified against commit:** `2642da8`

**Systems/files involved:** `js/managers/eventExecutor.js` only —
purely additive (94 new lines, zero lines removed/changed, confirmed
via `git diff --stat`). New `registerThreatHarm(playerId)` helper, plus
one call site added inside each of the 8 Harmful-category handlers
(`bombSelf`, `bombOther` ×2 branches, `freeze` ×2 branches, `steal` ×2
branches, `badJackpot`, `meteor`, `timeWarp` ×2 branches, `noEscape`).
Reads `ThreatManager.registerHarmfulEvent()`'s return value and
conditionally calls `ThreatConsequences.apply()`; makes no Threat
decisions itself. `threatManager.js`, `threatConsequences.js`,
`threatDatabase.js`, `popup.js`, `engine/app.js`, `contractManager.js`,
`informationBoard.js`, `notificationManager.js` — all confirmed
unmodified (`git status --short` showed only `eventExecutor.js`
touched).

**What was tested (36-part Node test against the real files, run
through `vm` — `threatDatabase.js`, `contractDatabase.js`,
`contractManager.js`, `threatManager.js`, `threatConsequences.js`, and
the modified `eventExecutor.js` all loaded as the actual project
files, spies wrapped around the real `ThreatManager.registerHarmfulEvent`
and `ThreatConsequences.apply` rather than reimplementing either):**
- A Beneficial event (`DOUBLE_POINTS`) and a Neutral event (`CLEANUP`)
  each never call `registerHarmfulEvent`.
- `BOMB_SELF` calls it exactly once, against the correct (self)
  `playerId`; existing point-loss behavior unchanged (regression).
- `BOMB_OTHER` calls it exactly once against the target/victim (not
  the activator), in both its normal-damage branch and its
  Shield-blocked branch — the game's own Shield still blocks the
  actual point loss in that branch (regression), but the harmful event
  still registers, since it fully resolved (only its damage was
  nullified).
- `BOMB_OTHER` with zero eligible targets (a genuine cancellation — no
  player or outcome was ever determined) never registers.
- `STEAL` calls it exactly once, against the victim specifically, not
  the thief `recordOutcome()` names in its History message; point
  transfer still correct (regression).
- `FREEZE` calls it exactly once against the target; `skipTurns` still
  applied (regression).
- `BAD_JACKPOT` and `METEOR` each call it exactly once against the
  activating player (board-wide effects, no individual victim).
- `TIME_WARP` calls it exactly once in **both** branches — timer
  running (timer still correctly halved, regression) and no active
  timer (a real, recorded outcome, not a cancellation).
- `NO_ESCAPE` calls it exactly once total against the activating
  player, not once per affected player, even though every player's
  Shield is stripped (still correct, regression) — "exactly once per
  harmful event resolution" holds even for board-wide effects.
- With `ThreatManager` at NORMAL (0% punishment chance),
  `ThreatConsequences.apply` is never called.
- With the roll forced to guarantee a hit, `ThreatConsequences.apply`
  is called exactly once, with the exact `playerId` and exact
  punishment key `ThreatManager.selectPunishment` actually chose
  (confirmed for both a Shield-eligible pick, `SHIELD_BREAK`, and a
  no-Shield pick, `CONTRACT_LOCK`) — `eventExecutor.js` never
  special-cases or inspects Shield state itself; it forwards
  unconditionally and lets `ThreatConsequences` own that entirely.
- Cooldown: after a forced punishment sets a player's cooldown to 2,
  the next harmful event from that same player still registers (the
  call happens) but produces no `apply()` call and decrements the
  cooldown — confirmed this is `ThreatManager`'s own behavior, not
  anything `eventExecutor.js` does, by a source-text check that
  `eventExecutor.js` contains no `playerCounts`/`getCooldown(`/
  `isOnCooldown(` reference at all.
- Source-text checks confirming `eventExecutor.js` contains no
  `ThreatLevels`/`ThreatPunishments`/`punishmentChance`/`.weight`
  reference — no decision logic duplicated from `ThreatManager`.
- Source-text checks confirming `popup.js`, `engine/app.js`,
  `informationBoard.js`, and `notificationManager.js` each contain
  zero `Threat` references — no Pass/UI/notification/initialization
  integration was accidentally introduced.
- Regression: two untouched Beneficial handlers (`DOUBLE_POINTS`,
  `BONUS_TURN`) still behave exactly as before.

**Would require rerun if:** any Harmful handler in `eventExecutor.js`
changes its resolution logic or player attribution, a new event is
added or an existing event's `category` changes in
`eventDatabase.js`, `ThreatManager.registerHarmfulEvent()`'s return
shape changes, or `ThreatConsequences.apply()`'s signature changes.

**Known, intentionally deferred (not a defect):** Threat state
(`currentLevelIndex`, `harmfulEventsResolved`, `playerCooldowns`)
persists across a "New Game" click within the same browser session,
since `ThreatManager.initialize()`/`.reset()` still isn't called from
`engine/app.js` — out of scope for this step by explicit instruction.

---

## VERIFIED — Threat Engine, Step 5: initialize/reset lifecycle wiring (ui.js, gameEndManager.js)

**Verified against commit:** `12d1088`

**Systems/files involved:** `js/ui/ui.js` (Start Game button click
handler — 12 additive lines, one `ThreatManager.initialize()` call),
`js/managers/gameEndManager.js` (`newGameWithSamePlayers()` — 11
additive lines, same call). `engine/app.js` deliberately NOT
modified — traced and confirmed its `GameNight.initialize()` only
runs once, on `window.onload`, and is never re-invoked by either real
new-game click path, so it was the wrong lifecycle point despite being
the "preferred" file named in the task. `threatManager.js`,
`threatConsequences.js`, `threatDatabase.js`, `eventExecutor.js`,
`popup.js`, `informationBoard.js`, `notificationManager.js`,
`contractManager.js` all confirmed unmodified.

**What was tested (20-part Node test against the real files, run
through `vm`):**
- Traced every `Board.build()`/`QuestionManager.reset()` call site in
  the codebase first (`grep` across all JS files) to confirm exactly
  two genuine "new game" boundaries exist (`ui.js`'s Start Game
  handler, `gameEndManager.js`'s `newGameWithSamePlayers()`) and that
  a third `QuestionManager.reset()` call (inside
  `nextSuddenDeathQuestion()`) is an unrelated mid-game pool-refill
  fallback, not a new-game boundary — confirmed by reading its
  surrounding code and comment before ruling it out.
- Simulated "game 1 happened, dirtying Threat state via its own real
  public API" (drove board progress to CRITICAL and called
  `registerHarmfulEvent` several times against a real player), then
  extracted and ran the **actual** Start Game click handler body
  straight out of `ui.js` (regex-extracted from the real file, not
  hand-copied logic) against the real `ThreatManager` — confirmed
  level back to `NORMAL`, harmful-event counter back to 0, and the
  previous game's cooldown for that player gone.
- Same dirty-then-reset simulation against the **actual**
  `GameEndManager.newGameWithSamePlayers()` method, called directly
  (real function, not extracted/reimplemented) — same three
  confirmations, plus confirmed the method's existing player
  score/shield reset behavior is unchanged (regression).
- Confirmed via regex count that `ui.js` and `gameEndManager.js` each
  contain **exactly one** `ThreatManager.initialize()` call — no
  accidental duplicate registration of the reset.
- Confirmed via source-text check that `engine/app.js` contains zero
  `ThreatManager` references — the page-load path was correctly left
  alone rather than adding a redundant third call (the manager's own
  object-literal defaults already equal what `initialize()`/`reset()`
  produce, so a page-load call would have been a pure no-op anyway).
- Confirmed via source-text check that `eventExecutor.js` contains no
  `ThreatManager.initialize`/`ThreatManager.reset` reference — Step 4's
  harmful-event registration wiring is completely unrelated to and
  unaffected by this step.
- Confirmed via source-text checks that `popup.js`,
  `informationBoard.js`, and `notificationManager.js` each contain
  zero `Threat` references — no Pass/UI/notification work was
  introduced.
- Confirmed via `git diff --stat` on each file individually that
  `threatManager.js`, `threatConsequences.js`, `threatDatabase.js`,
  and `contractManager.js` all have zero diff from this step.

**Would require rerun if:** either hook site's surrounding new-game
setup sequence is restructured, a third genuine new-game boundary is
added anywhere in the codebase, or `ThreatManager.initialize()`'s
behavior changes.

**Known, intentionally deferred (not a defect):** Pass still doesn't
skip the punishment roll; Information Board doesn't show Threat Level
yet; no Threat notifications exist yet.

---

## VERIFIED — Threat Engine, Step 6: Pass skips the punishment roll (popup.js)

**Verified against commit:** `c6b4226`

**Systems/files involved:** `js/ui/popup.js` only — `pass()` modified
(44 additive lines net). `eventExecutor.js` confirmed zero diff via
`git diff --stat` (checked, not assumed) — no outcome parameter or
flag was added there; `threatManager.js`, `threatConsequences.js`,
`threatDatabase.js`, `ui.js`, `gameEndManager.js`,
`informationBoard.js`, `notificationManager.js`, `contractManager.js`
all confirmed zero diff too.

**Semantic finding (traced from real code, not assumed):** `Popup.pass()`
calls the exact same shared `_resolveTile()` helper as `correct()`/
`wrong()`, with `awardPoints=false, outcome="pass"` — the tile's own
existing comment states explicitly that "the tile is still consumed
and its event (if any) still fires." `EventExecutor.execute(event, tile)`
has no `outcome` parameter at all, so nothing inside any Harmful
handler could previously distinguish a Pass resolution from a Wrong
one. This confirms interpretation B (event resolves; player escapes
the punishment roll specifically), and that closing the gap correctly
requires *some* signal to cross from `popup.js` into the Threat
registration path for that one resolution.

**How it's implemented:** rather than threading a new parameter
through `execute()` and its 11 `registerThreatHarm` call sites (which
would have required editing `eventExecutor.js`), `pass()` temporarily
replaces the live `ThreatManager.registerHarmfulEvent` function
reference with a no-op returning `{ punished: false, reason: "pass" }`,
only for the duration of its own `_resolveTile()` call, inside a
`try`/`finally` that unconditionally restores the original — including
if `_resolveTile()` throws. `EventExecutor`'s `registerThreatHarm()`
still calls `ThreatManager.registerHarmfulEvent(playerId)` exactly as
written; it has no idea anything is different. This keeps
`eventExecutor.js` at zero diff while fully reusing the existing
Threat Engine API (no decision logic duplicated).

**What was tested (28-part Node test against the real files, run
through `vm` — `threatDatabase.js`, `contractDatabase.js`,
`contractManager.js`, `threatManager.js`, `threatConsequences.js`,
`eventExecutor.js`, and the modified `popup.js` all loaded together):**
- Passing a harmful event with `ThreatManager` forced into DANGEROUS
  and the roll forced to guarantee a hit if it ran: confirmed
  `registerHarmfulEvent` is never called, `ThreatConsequences.apply`
  is never called, Threat Level unchanged, harmful-event counter
  unchanged, cooldown unchanged (`getCooldown` stayed 0), and the
  player's Shield untouched.
- Confirmed `ThreatManager.registerHarmfulEvent` is genuinely restored
  to the real function afterward (called it directly post-Pass and
  confirmed the counter actually incremented).
- Confirmed existing Pass behavior is completely unchanged:
  `passesRemaining` still decrements, no points awarded (`"Answered
  Correctly"` never recorded, `"Pass Used"` is), tile still resolves
  through to `Score.update()`/turn advance (regression).
- Same tile, same forced-punish setup, but via `wrong()` instead of
  `pass()`: confirmed `registerHarmfulEvent` still fires exactly once
  and `ThreatConsequences.apply` still fires — proving the swap is
  correctly scoped to the Pass call only and doesn't leak into or
  suppress the normal path.
- Passing a Beneficial event (`DOUBLE_POINTS`): confirmed
  `registerHarmfulEvent` still isn't called (matches existing
  behavior — Beneficial events were never wired to the Threat Engine
  in Step 4) and the event's own effect (`doublePoints = true`) still
  applies despite Pass — Pass only changes points/History label, never
  the event itself (regression).
- Two sequential Pass turns on two different harmful tiles: zero
  `registerHarmfulEvent` calls total across both, confirming no
  leaked/stuck stub state between resolutions.
- Forced `_resolveTile()` to throw mid-resolution during a Pass:
  confirmed the exception still propagates (not silently swallowed)
  AND `ThreatManager.registerHarmfulEvent` is still correctly restored
  to the real function afterward — the `finally` guarantee holds even
  on failure.
- Individual `git diff --stat` checks confirming zero diff on all 9
  other Threat-Engine-adjacent files listed above.
- Source-text checks confirming `popup.js` contains no
  `ThreatLevels`/`ThreatPunishments`/`punishmentChance`/`.weight`
  reference (no decision logic duplicated) and no new Threat-Level/
  Information-Board/Notification-shaped additions.

**Would require rerun if:** `_resolveTile()`'s shared resolution
sequence changes, `pass()`'s own logic changes, or
`ThreatManager.registerHarmfulEvent`'s name/signature changes (which
would break the swap silently rather than loudly — worth flagging as
a fragility this technique has that a formal parameter wouldn't).

**Known, intentionally deferred (not a defect):** Information Board
doesn't show Threat Level yet; no Threat notifications exist yet.

**Could not verify:** actual browser/UI behavior (no visual
confirmation was performed or is claimed) — this was a Node-level
test against the real files, not a rendered-browser test.

---

## VERIFIED — Threat Engine, Step 6 CORRECTION: overlapping-Pass concurrency/state-leak fix (popup.js)

**Verified against commit:** `3c7985c`

**This is a correction/hardening of Step 6's existing implementation,
not a new Threat feature.** No new Threat decision logic, levels,
punishments, probabilities, weights, or cooldown rules were added.

**Systems/files involved:** `js/ui/popup.js` only (32 additive lines —
a `_passInProgress` guard flag plus one early-return check at the top
of `pass()`). `eventExecutor.js` confirmed zero diff — the fix did not
require touching it; `threatManager.js`, `threatConsequences.js`,
`threatDatabase.js`, `ui.js`, `gameEndManager.js`,
`informationBoard.js`, `notificationManager.js`, `contractManager.js`
all confirmed zero diff too.

**The bug (confirmed by tracing, not assumed):** nothing in `ui.js`
disables the Pass button while a resolution is in flight — its click
handler just calls `Popup.pass()` directly, unconditionally, every
click. `_resolveTile()` genuinely yields at real await points (a
targeted harmful event's `promptTarget()`, then a deliberate double
`requestAnimationFrame`), so a second `pass()` call arriving during
that window would have started a second swap of the same shared
`ThreatManager.registerHarmfulEvent` reference. Whichever call's
`finally` ran first would restore the OTHER call's in-flight no-op
instead of the real function — permanently disabling Threat
registration for the rest of the game after any accidental Pass
double-click.

**The fix:** a `_passInProgress` boolean on `Popup`, checked at the
very top of `pass()` before anything else runs. A second `pass()`
call arriving while one is already active returns immediately —
before touching `passesRemaining`, before touching
`ThreatManager.registerHarmfulEvent` at all. This makes overlapping
swap cycles structurally impossible (only one can ever be active), and
incidentally also fixes the more general "double-click Pass = double
tile resolution" bug the same race would have caused independent of
the Threat Engine. Scoped to `pass()` only, not the shared
`_resolveTile()` other actions (`correct`/`wrong`/`continueEvent`)
use — their own concurrency was out of scope for this correction.

**Why `eventExecutor.js` was not touched:** the Popup-level guard
fully and provably eliminates the race at its root (no overlapping
`pass()` execution is possible at all), so no signal needs to cross
into `eventExecutor.js` beyond what Step 6 already established. This
was a genuine architectural choice, not an attempt to preserve a
zero-diff metric for its own sake — the guard is simpler, self-
contained, and fixes a broader latent issue than a `eventExecutor.js`
change would have.

**What was tested (38-part Node test against the real files, run
through `vm` — `threatDatabase.js`, `contractDatabase.js`,
`contractManager.js`, `threatManager.js`, `threatConsequences.js`,
`eventExecutor.js`, and the corrected `popup.js` loaded together):**

*New overlapping-Pass regression (the correction's primary target):*
- Used a real targeted Harmful event (`BOMB_OTHER`) with a
  `TargetSelector.open(eligible, resolve, promptText)` stub that
  deliberately withholds calling `resolve` — creating a genuine
  suspension inside the real `bombOther()`'s `await this.promptTarget(...)`,
  itself inside the real `EventExecutor.execute()`, itself inside the
  real `_resolveTile()`, itself inside the real `pass()`'s `try` block.
  This is a real overlap window produced by actual production code
  paths, not a simulated/reimplemented race.
- Confirmed Pass #1 is genuinely suspended mid-resolution before
  attempting Pass #2 (drained the microtask queue first).
- Confirmed the swap was already active and `passesRemaining` already
  decremented at that point (proving genuine overlap, not two
  sequential completed calls).
- Started Pass #2 while Pass #1 was still suspended: confirmed
  `passesRemaining` was NOT decremented a second time.
- Let Pass #1 complete: confirmed neither overlapping call ever
  triggered `registerHarmfulEvent` (0 calls total), confirmed
  `passesRemaining` decremented exactly once total across both calls,
  confirmed `ThreatManager.registerHarmfulEvent` is genuinely restored
  to the real function afterward (called it directly and confirmed it
  still increments the counter), and confirmed `Popup._passInProgress`
  correctly resets to `false`.
- Confirmed a subsequent, separate, normal harmful-event resolution
  (`wrong()` on a different tile) still calls the real
  `registerHarmfulEvent` exactly once and still produces a real
  `ThreatConsequences.apply()` call — the guard doesn't leave anything
  disabled afterward.
- Confirmed a later, non-overlapping Pass call still works normally
  after an earlier (separate) test's overlap was handled — no
  permanent lockout from the guard flag itself.

*Existing Step 6 tests, re-run against the corrected file (all
originally-passing behavior confirmed still passing):* Pass never
calls `registerHarmfulEvent`/`ThreatConsequences.apply`, no Level/
counter/cooldown/Shield change, the real function is restored
correctly, existing Pass behavior (passesRemaining, no points, History
label, tile resolution) unchanged; a normal `wrong()` on the same
setup still produces real Threat behavior; passing a Beneficial event
still applies its own effect; two purely *sequential* (non-overlapping)
Pass turns still produce zero leaked state; a forced mid-resolution
exception during Pass still propagates, still restores the real
function, AND now also still correctly resets `_passInProgress`
(a new assertion added to this pre-existing test, since the guard flag
needed the same crash-safety the swap already had); `git diff --stat`
confirmed zero diff on all 9 other Threat-adjacent files; source-text
check confirmed no decision logic duplicated into `popup.js`.

**Would require rerun if:** `pass()`'s guard/swap logic changes again,
`_resolveTile()`'s await structure changes in a way that changes where
genuine suspension points occur, or `ThreatManager.registerHarmfulEvent`'s
name/signature changes.

**Could not verify:** actual browser/UI double-click behavior (no
visual or real-browser confirmation was performed or is claimed) —
this was Node-level verification against the real files, using a
controlled/simulated overlap window (via a stubbed `TargetSelector.open`
that withholds `resolve`) rather than a literal double mouse-click in
a running browser.

---

## VERIFIED — Threat Engine, Step 7: Information Board Threat display (informationBoard.js)

**Verified against commit:** `b56cf2b`

**Systems/files involved:** `js/managers/informationBoard.js` only
(23 additive lines — a `threatSummary` lookup plus two new
`<p class="infoBoardLine">` lines and one new `<h3>` in the existing
template literal). No new HTML/CSS — reuses `#infoBoard`/`.infoBoardLine`/
`<h3>` exactly as the existing Treasure/Hidden Event sections already
do. `threatManager.js`, `eventExecutor.js`, `popup.js`,
`threatConsequences.js`, `threatDatabase.js` all confirmed zero diff.

**What was tested (18-part Node test against the real files, run
through `vm` — `threatDatabase.js`, `eventDatabase.js`,
`threatManager.js`, and the modified `informationBoard.js` loaded
together):**
- Existing functionality preserved: Treasure Status and Hidden Event
  Status sections still render correctly with the same counts as
  before (regression).
- Fresh/reset game (`ThreatManager.initialize()`): confirmed "Threat
  Level: NORMAL" and "Harmful Events Resolved: 0" both render
  correctly.
- Drove the real `ThreatManager.registerHarmfulEvent()` three times
  (via its actual public API, not a stub), re-rendered, and confirmed
  the panel shows "Harmful Events Resolved: 3" and "Threat Level:
  DANGEROUS" (3 harmful events crosses that real threshold) — proving
  the display reads live `ThreatManager` state, not a fabricated or
  hardcoded value.
- Source-text check confirming `informationBoard.js` contains no local
  increment/assignment resembling a harmful-event counter of its own,
  and does call `ThreatManager.getSummary()` — the single source of
  truth.
- Drove 6 harmful events and re-called `render()` a second time on the
  same board object: confirmed the panel updates from NORMAL/0 to
  CRITICAL/6, proving the display is live on every render call, not
  cached or stale.
- `git diff --stat` confirmed zero diff on all 5 other Threat-Engine
  files.
- Source-text checks confirming `informationBoard.js` never references
  `ThreatLevels`/`ThreatPunishments`/`punishmentChance`/`.weight`
  (no decision logic duplicated) and never reads/writes cooldown state
  (`playerCooldowns`/`getCooldown(`/`isOnCooldown(`) — the display
  shows only what `getSummary()` deliberately exposes.

**Would require rerun if:** `ThreatManager.getSummary()`'s return
shape changes, or `InformationBoard.render()`'s template structure
changes.

**Known, intentionally deferred (not a defect):** Threat notifications
(level-change/punishment events via `NotificationManager`) still don't
exist.

**Could not verify:** actual browser rendering/visual layout — this
was a Node-level test confirming the generated HTML string contains
the correct text, not a rendered-browser or visual confirmation.

---

## VERIFIED — Threat Engine, Step 8: Threat notifications (eventExecutor.js)

**Verified against commit:** `5dc79cc`

**Systems/files involved:** `js/managers/eventExecutor.js` only (62
additive lines in `registerThreatHarm()`). `threatManager.js`,
`threatConsequences.js`, `threatDatabase.js`, `popup.js`,
`informationBoard.js`, `contractManager.js`, `gameEndManager.js`,
`ui.js` all confirmed zero diff via individual `git diff --stat`
checks.

**Integration point and reasoning:** `EventExecutor.registerThreatHarm()`
— the same orchestration hub Step 4 built that already sees both
`ThreatManager`'s and `ThreatConsequences`' actual results without
being either of them. Notifications are fired purely by observing
already-computed results (a before/after level comparison via
`ThreatManager.getCurrentLevelKey()`, and `ThreatConsequences.apply()`'s
own `applied` flag) — no threshold, probability, weight, or cooldown
logic was re-derived or duplicated anywhere.

**What was tested (28-part Node test against the real files, run
through `vm` — `threatDatabase.js`, `eventDatabase.js`,
`contractDatabase.js`, `contractManager.js`, `threatManager.js`,
`threatConsequences.js`, the modified `eventExecutor.js`,
`informationBoard.js`, and `popup.js` loaded together):**
- A single harmful event while Threat stays NORMAL: zero Threat
  notifications.
- Driving harmful events one at a time: confirmed zero level
  notifications after 2 (below the 3-event DANGEROUS threshold), then
  exactly one level-increase notification on the 3rd (mentioning
  DANGEROUS specifically).
- Continuing to 5 events: still exactly one level notification total;
  on the 6th (CRITICAL threshold), exactly one NEW level-increase
  notification (mentioning CRITICAL), two total — no duplicates at
  either transition.
- A forced-miss punishment roll (37%/70% chance, guaranteed-fail
  random): zero punishment notifications.
- A forced-hit punishment roll: exactly one punishment notification,
  its text containing the actual selected punishment's real
  `description` field from `threatDatabase.js` (not a hardcoded
  string), with the underlying Shield removal confirmed as a
  regression check.
- **The Shield-blocked-punishment edge case explicitly named in the
  task:** forced `ThreatManager` to select `POINT_DRAIN` specifically
  (a Shield-protectable punishment, not `SHIELD_BREAK`) against a
  shielded player — confirmed the punishment was genuinely blocked
  inside `ThreatConsequences` (no additional point loss beyond the
  harmful event's own unrelated effect, Shield consumed) and confirmed
  **zero** punishment notification fired, since `ThreatManager`
  selected it but `ThreatConsequences.apply()` never reported
  `applied: true`.
- Pass, under forced-guaranteed-punish conditions: zero Threat
  notifications of any kind — this test caught a real bug during
  development (the level-increase check initially fired a false
  positive on Pass, since Pass's no-op stub returns a result object
  with no `level` field at all; fixed with an explicit truthy-guard
  before ever shipping).
- Confirmed `InformationBoard`'s Threat display still reads correct
  state via `ThreatManager.getSummary()` (regression).
- Confirmed harmful-event registration/counting and `BOMB_SELF`'s own
  unrelated point-loss behavior are both unchanged (regression).
- Source-text checks confirming `notificationManager.js` contains no
  Threat-specific decision logic, and that `threatManager.js`/
  `threatConsequences.js` contain no `NotificationManager` reference
  at all — neither decision-maker nor applier calls into notifications
  themselves.
- An end-to-end CRITICAL-plus-guaranteed-punishment scenario (level
  already CRITICAL before the call, so no level notification is
  expected) confirmed exactly one notification total (the punishment
  one) — no duplicate firing when both a level check and a punishment
  check run in the same `registerThreatHarm()` call.
- `git diff --stat` confirmed zero diff on all 8 other Threat-adjacent
  files.

**Would require rerun if:** `ThreatManager.registerHarmfulEvent()`'s
return shape changes, `ThreatConsequences.apply()`'s `applied` field
semantics change, `threatDatabase.js`'s punishment `description` field
changes, or the Pass stub's return shape changes (which the
`result.level` truthy-guard depends on staying "no `level` field",
not "a specific value").

**Could not verify:** actual browser rendering of the notification
cards (fade-in/fade-out animation, visual stacking) — this was
Node-level verification confirming `NotificationManager.notify()` is
called with correct title/description/type at correct times, not a
rendered-browser or visual confirmation.

---

## VERIFIED — Player Departure, Step 1: removal primitive (js/game/players.js)

**Verified against commit:** `ac61d3a`

**Systems/files involved:** `js/game/players.js` only (35 additive
lines — `removePlayer(playerId)`). No other file touched or read from
in a new way.

**Why `Players` is the correct owner:** it already owns
`GameNight.players` creation (`createPlayers()`) and lookup
(`getCurrentPlayer()`) and is the sole manager that mutates that
array; no other manager touches `GameNight.players` structurally
anywhere in the codebase (confirmed by a full-codebase search before
writing any code). No existing removal method existed to reuse.

**What was tested (20-part Node test against the real file):**
- A valid player can be removed; confirmed absent from
  `GameNight.players` afterward, list length correctly decremented.
- Remaining players keep their existing relative order after removing
  from the middle, the first position, and the last position (three
  separate cases).
- Removing a nonexistent id (999), an empty player list, and
  `undefined`/`null` ids all return `null` / do nothing, without
  throwing.
- Three sequential removals on a 5-player list leave no duplicate ids
  and the exact correct two survivors in the exact correct order;
  every remaining player object's fields are still structurally
  intact (not corrupted by the splice).
- `createPlayers()` still works exactly as before (regression) —
  names, default-name fallback for blank inputs, sequential `id`
  assignment, and `GameNight.currentPlayer` reset to 0 all unchanged.
- `getCurrentPlayer()` still correctly resolves to the same actual
  remaining player after removing someone else from the list
  (regression).
- Source-text checks scoped specifically to `removePlayer`'s own
  function body (not the whole file, since the explanatory comment
  above it legitimately mentions Treasure Chest/History/turn-rotation
  to explain what it deliberately does NOT do): no chest-status
  assignment, no DOM manipulation/confirmation dialog, no reference to
  `GameNight.currentPlayer` or `GameEndManager`, no reference to
  `HistoryManager`/`NotificationManager`.
- `git diff --name-only` confirmed exactly one file in the entire
  working tree was modified.

**Would require rerun if:** `removePlayer`'s logic changes, or
anything begins actually calling it (a later step, which would need
its own new verification for whatever it adds — turn-rotation,
History recording, chest creation, etc.).

**Known limitation, explicitly out of scope for this step (not a
defect):** `GameNight.currentPlayer` is an array index, not a player
id. Removing a player positioned before the current index will shift
the current index onto the wrong player once something actually calls
`removePlayer` during a real game — this step deliberately does not
address that, per instruction, and it remains for whichever future
step wires the primitive into real gameplay.

**Could not verify:** nothing browser/UI-related applies here — there
is no UI in this step to verify.

---

## VERIFIED — Player Departure, Step 2: currentPlayer index fixup (js/game/players.js)

**Verified against commit:** `b2f1545`

**Systems/files involved:** `js/game/players.js` only (41 net
additive lines inside the existing `removePlayer` method — no new
method, no other file touched or read from in a new way).

**Behavior implemented:** `GameNight.currentPlayer` (a array index —
confirmed by re-reading `score.js`'s `nextPlayer()`, the existing
turn-advancement code, which uses the same increment/wrap-at-length
convention) is now kept structurally valid across a removal:
- removed index `<` current index → decrement current index (same
  actual player stays current).
- removed index `>` current index → current index untouched.
- removed index `===` current index → left numerically the same
  (whoever was next now occupies that slot) unless it was the last
  index, in which case clamp to `max(0, newLength - 1)`.
- Invalid/nonexistent id → early return before touching
  `GameNight.currentPlayer` at all.

**What was tested (27-part Node test against the real file):**
- Removing before the current index: index decrements, `getCurrentPlayer()`
  still resolves to the exact same actual player object as before.
- Removing after the current index: index unchanged, same actual
  player still current.
- Removing the current player (not at the last index): index stays
  numerically the same, now correctly resolving to whoever was next in
  order; confirmed within valid bounds.
- Removing the current player who IS at the last index: clamps to the
  new last index, confirmed not out of bounds and resolving to a real
  player (not `undefined`).
- Removing the only remaining player (a 1-player list): no throw, the
  removed player is correctly returned, the list is empty afterward,
  `GameNight.currentPlayer` clamps to a safe `0` (not negative), and
  `getCurrentPlayer()` returns `undefined` without throwing — the same
  safe behavior an out-of-range index has always had, not a new
  special case.
- An additional case beyond the minimum requested: removing the
  current player down to exactly one remaining player, confirming the
  clamp lands correctly on index `0`.
- Invalid player id: returns `null`, `GameNight.currentPlayer` and the
  full player list both completely untouched.
- `createPlayers()` and `getCurrentPlayer()` regression-checked and
  confirmed unchanged.
- Source-text checks scoped to `removePlayer`'s own function body: no
  chest-status assignment, no DOM/UI code, no `HistoryManager`/
  `NotificationManager` reference, no `GameEndManager` reference, no
  `DepartureManager` anywhere in the file.
- `git diff --name-only` confirmed exactly one file in the entire
  working tree was modified.

**Would require rerun if:** `removePlayer`'s index-adjustment logic
changes, or the turn-advancement convention in `score.js` changes in a
way that redefines what a "valid" `GameNight.currentPlayer` value
means.

**Known, still-deferred (not a defect, per this step's explicit
scope):** nothing calls `removePlayer()` yet — no UI, no History
recording, no Legacy Chest creation, no game-ending checks triggered
by a departure.

**Could not verify:** nothing browser/UI-related applies here — there
is no UI in this step to verify.

---

## VERIFIED — Player Departure, Step 3: departure entry point (js/game/players.js)

**Verified against commit:** `bcc5cc1`

**Systems/files involved:** `js/game/players.js` only (39 additive
lines — a new `departPlayer(playerId)` method; `removePlayer` itself
untouched).

**Entry point created:** `Players.departPlayer(playerId)` — validates
the player exists via `GameNight.players.find()`, then delegates the
actual mutation entirely to the existing `removePlayer(playerId)`
(inheriting its Step 2 `currentPlayer` safeguards for free, no logic
duplicated). Returns `{ success: false, reason: "invalid-player",
playerId }` without ever calling `removePlayer()` if the player
doesn't exist, or `{ success: true, player: <removed player object> }`
on success — matching this codebase's existing decision/outcome-object
convention (`ThreatManager.registerHarmfulEvent()`,
`ThreatConsequences.apply()`) rather than a bare boolean.

**What was tested (24-part Node test against the real file):**
- Valid player: `success: true`, the actual removed player object
  returned, confirmed absent from `GameNight.players` afterward.
- Invalid/nonexistent id (999, and separately `undefined`/`null`): no
  throw, `success: false` with `reason: "invalid-player"`, player list
  and `currentPlayer` both completely untouched.
- Spied on `removePlayer()` and confirmed `departPlayer()` calls it
  exactly once for a valid player, and **not at all** for an invalid
  one (rejected before delegation, not after) — proving
  `removePlayer()` remains the actual removal primitive, not
  reimplemented.
- Source-text check confirming `departPlayer()`'s own body only
  references `GameNight.players` (via the existence check) and never
  a second list.
- `GameNight.currentPlayer` correctly decrements/clamps through
  `departPlayer()` exactly as it would through `removePlayer()`
  directly — exercised both the before-current-index case and the
  removed-at-last-index clamp case, both via `departPlayer()`.
- Player ordering preserved after a `departPlayer()` call.
- `createPlayers()` and `getCurrentPlayer()` regression-checked
  unchanged, including `getCurrentPlayer()` correctly resolving to the
  next player after `departPlayer()` removes the current one.
- Source-text checks confirming no chest-status assignment, no DOM/UI
  code, no `HistoryManager`/`NotificationManager`/`GameEndManager`
  reference, and no `DepartureManager` anywhere in the file; also
  confirmed `departPlayer()`'s own body contains no `.splice(` call or
  `GameNight.currentPlayer` assignment (no duplicate removal/index
  logic).
- `git diff --name-only` confirmed exactly one file in the entire
  working tree was modified.

**Would require rerun if:** `departPlayer()`'s validation or
delegation logic changes, or `removePlayer()`'s own behavior changes
(since `departPlayer()` inherits it entirely).

**Known, still-deferred (not a defect, per this step's explicit
scope):** nothing calls `departPlayer()` yet — no UI, no History
recording, no Legacy Chest creation, no game-ending checks.

**Could not verify:** nothing browser/UI-related applies here — there
is no UI in this step to verify.

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
