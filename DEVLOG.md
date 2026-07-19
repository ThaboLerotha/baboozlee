# Developer Changelog

Internal log of what changed and why, kept for whoever (human or AI) picks
this project back up later and needs to know why something works the way
it does. Not user-facing.

---

## Entry 1 — Phase 1: EventExecutor implementation + Phase 2: Target Selection + Board Event System

### Files changed

- `gnite/js/managers/eventExecutor.js`
- `gnite/js/managers/score.js`
- `gnite/js/ui/targetSelector.js` (new)
- `gnite/js/ui/popup.js`
- `gnite/js/game/board.js`
- `gnite/js/data/eventDatabase.js`
- `gnite/index.html`
- `gnite/style.css`

### Architectural changes

- **EventExecutor is the single place event logic lives.** It never
  touches the DOM and never owns board data directly — it calls named
  methods on `Board` (for board mutations) or `TargetSelector` (for
  picking a player) and applies the resulting effect.
- **`execute()` is `async`.** Targeted events (Bomb, Freeze, Steal, Gift)
  must wait for the host to click a player in the `TargetSelector` modal
  before the effect can apply. `Popup.correct()`/`Popup.wrong()` now
  `await EventExecutor.execute(...)` before advancing the turn, so turn
  order can never race ahead of an event that hasn't resolved yet.
  Non-targeted handlers are unaffected — awaiting a non-Promise value is
  a no-op in JS, so `execute()` didn't need two code paths.
- **`TargetSelector` is a standalone, rule-agnostic UI component.** It
  knows how to show a list of players and report which one was clicked —
  nothing else. Any future targeted mechanic (Contracts, etc.) can reuse
  it without modification.
- **`Board` owns all board mutation.** Five generic primitives
  (`getUnrevealedTiles`, `getTilesByPoints`, `getRandomTiles`,
  `markTilesUsed`, `convertTilesToStale`) are composed into four named
  mutation methods (`removeLowValueTiles`, `convertRandomEventTiles`,
  `shuffleHiddenEvents`, `destroyRandomTiles`). `EventExecutor`'s board
  event handlers (`jackpot`, `badJackpot`, `chaos`, `cleanup`, `meteor`)
  are now one-line calls into these.

### Gameplay effects now implemented

| Event | Effect |
|---|---|
| BOMB_SELF | Current player loses 200 points |
| DOUBLE_POINTS | Current player's next points are doubled |
| BONUS_TURN | Current player goes again |
| SHIELD | Blocks the next negative targeted effect against the holder |
| BOMB_OTHER | Host-picked target loses 200 points, unless shielded |
| FREEZE | Host-picked target skips their next turn, unless shielded |
| STEAL | 150 points move from host-picked target to current player, unless shielded |
| GIFT | Current player gives 100 of their own points to host-picked target (ignores shields — it's positive) |
| JACKPOT | Removes 3 unrevealed low-value tiles from play (100-pt tier first, moving up tiers only if needed) |
| BAD_JACKPOT | Converts 3 random unrevealed event-bearing tiles into ordinary stale/question tiles |
| CLEANUP | Same as Bad Jackpot but only 1 tile |
| CHAOS | Shuffles hidden events among all unrevealed event tiles (event count preserved, only locations change) |
| METEOR | Destroys ~30% of remaining unrevealed tiles (any type), marked used without being revealed |
| TIME_WARP | Halves the remaining timer if one is running |
| NO_ESCAPE | Strips shields from all players (placeholder — see Deferred Work) |

### Known issues

- `powerups.js` (`gnite/js/game/powerups.js`) is dead code — not loaded
  in `index.html`, not referenced anywhere, operates on a `tile.powerup`
  field the board never creates. Its point values were used as a
  reference for balancing but the file itself is untouched. Should
  eventually be deleted once someone confirms nothing depends on it.
- Only 10 questions exist in `questionDatabase.js` against a 30-tile
  board where ~85% of tiles need one. `QuestionManager` reshuffles once
  exhausted rather than crashing, but expect visible repeats in a single
  game.
- Three home-screen buttons (`loadGameBtn`, `settingsBtn`, `statsBtn`)
  exist in `index.html` with no listeners — inert, not broken.

### Future hooks added

- `TargetSelector.open(players, onSelect, promptText)` accepts an
  optional prompt string so future targeted mechanics can reuse it with
  different framing (e.g. "Choose someone to Curse") without touching
  its internals.
- `EventExecutor.getEligibleTargets()` already excludes `player.eliminated`
  even though no mechanic sets that flag today — a future elimination
  system can plug in without changing targeting logic anywhere.
- `Board`'s five primitives (`getUnrevealedTiles`, `getTilesByPoints`,
  `getRandomTiles`, `markTilesUsed`, `convertTilesToStale`) are generic
  on purpose. A future board event should almost always be composable
  from these rather than needing new board-traversal code.

### Deferred work / technical debt

- **NO_ESCAPE is a placeholder.** It currently strips all shields
  because the Pass System (which it's actually meant to interact with,
  per the original design notes) doesn't exist yet. Revisit once Passes
  are built.
- **Shield is a plain boolean** (`player.shield`), not part of a general
  status system. Fine for now with only one status that behaves this
  way; revisit if 2-3 more statuses need the same shape.
- **Contracts, Pass System, Board Inventory Panel, Awards Ceremony,
  Audio** — none of these exist yet. Explicitly out of scope for this
  entry.
- Point values (Bomb 200, Steal 150, Gift 100, etc.) are still literals
  scattered through `EventExecutor` rather than a central `GameEconomy`
  config. Flagged for a future refinement pass, intentionally deferred
  per instruction — do not change without explicit approval.

---

## Entry 2 — Phase 4: Pass System

### Files changed

- `gnite/js/game/players.js`
- `gnite/index.html`
- `gnite/js/ui/popup.js`
- `gnite/js/ui/ui.js`
- `gnite/js/managers/score.js`

### Architectural changes

- **`passesRemaining` lives on the player object**, not a global counter
  (`player.passesRemaining`, starts at 2), per instruction — this keeps
  it consistent with every other player-level status (`shield`,
  `skipTurns`, `doublePoints`, `bonusTurn`) and means future events or
  Contracts that grant/remove a Pass just read/write one field on one
  player, no new bookkeeping structure needed.
- **`Popup.pass()` mirrors `correct()`/`wrong()` almost exactly** —
  same tile lookup, same `await EventExecutor.execute(tile.event, tile)`,
  same `Board.markUsed()` + `Score.nextPlayer()` + `close()` sequence.
  The only difference is no `Score.addPoints()` call and the
  `passesRemaining` decrement. This means a tile's event fires on Pass
  exactly the same way it does on Correct/Wrong, satisfying "the tile's
  event still activates" from the spec without any special-casing in
  `EventExecutor`.
- **The Pass button is revealed conditionally.** `reveal()` only
  unhides `passBtn` if `Players.getCurrentPlayer().passesRemaining > 0`;
  at 0 it's hidden, so a host can't attempt an invalid Pass through the
  UI. `Popup.pass()` still guards against `passesRemaining <= 0` itself
  in case that's ever called some other way.

### Gameplay effects now implemented

| Rule | Behavior |
|---|---|
| Pass timing | Only available after the question is revealed (button hidden until then) |
| Pass availability | Hidden once a player's `passesRemaining` reaches 0 |
| Passing | No points awarded; tile still marked used; tile's event (if any) still fires; turn advances normally via `Score.nextPlayer()` |
| Pass count | Starts at 2 per player, decremented by 1 per use, never regained automatically |
| Visibility | Each player's remaining passes shown on the scoreboard (🔁 icon) at all times, not just when the popup is open |

### Known issues

- None introduced by this phase. Verified with a standalone bookkeeping
  simulation (decrement-and-guard logic in isolation) and a DOM ID
  cross-reference check before committing.

### Future hooks added

- `player.passesRemaining` is a plain number a future event/Contract can
  increment or decrement directly (e.g. a "Gain a Pass" event, or a
  Contract reward like "Never Pass → +500") without touching
  `EventExecutor`'s targeting or board-mutation machinery at all.

### Deferred work / technical debt

- No pass-interaction *events* exist yet (Lose Pass, Gain Pass, Forced
  Pass, Pass Shield, Pass Theft from the original design notes). Those
  depend on the Pass System existing first, which it now does — but
  they weren't in scope for this phase and weren't added.
- No UI currently celebrates or announces a Pass differently from a
  wrong answer (no distinct message/sound). Left as-is; Audio phase is
  still pure polish, out of scope.

---

## Entry 3 — Question System robustness (pre-playtest stabilization)

Scope: this entry covers Part 1 only (Question System fix). Part 2
(30 new questions) is a separate commit, logged separately once done.

### Files changed

- `gnite/js/managers/questionManager.js`
- `gnite/js/ui/popup.js`

### Architectural changes

- **`getQuestion()` no longer auto-reshuffles on exhaustion.** It used
  to silently call `this.reset()` and keep going the moment the pool
  ran dry, which meant a question could repeat within the same game
  with no way to tell. It now returns `null` and logs a warning
  instead. `reset()` itself is unchanged and still only runs
  explicitly at the start of a new game, from `startGameBtn`'s handler
  in `ui.js` (confirmed this was already correct -- the bug was only
  inside `getQuestion()`).
- **`Popup.open()` now handles a `null` tile.question gracefully.**
  This was a necessary consequence of the fix above, not scope creep:
  with only 10 questions in the database against a 30-tile board where
  ~85% of tiles need one, the pool exhausting mid-build is the normal
  case today, not an edge case -- every game would have hit `null`
  and crashed on `q.category` without this. The fallback shows a clear
  message and lets the host resolve the tile with Correct/Wrong/Pass
  manually; none of those three methods read `tile.question`, so
  scoring and event-firing are unaffected.

### Known issues

- None introduced. This entry exists specifically because the previous
  question pool size (10) made exhaustion the common case, not the
  exception -- Part 2 addresses that directly.

### Future hooks added

- None -- this was a bug fix, not new surface area.

### Deferred work / technical debt

- Existing 10 questions in `questionDatabase.js` have no `explanation`
  field (`popup.js` already falls back to "No explanation available.").
  Part 2's new questions will include explanations; the original 10
  were left untouched, per "preserve the existing QuestionDatabase
  structure."

### Verification performed

- Full syntax check across every JS file.
- DOM-id cross-reference check (no orphaned `getElementById` calls).
- Standalone Node simulation against a synthetic 10-question database:
  confirmed all 10 questions are drawn exactly once with no duplicates,
  confirmed the exhausted pool returns `null` repeatedly without
  silently reshuffling, and confirmed calling `reset()` again (as a new
  game would) correctly rebuilds and reshuffles a fresh, independently-
  ordered pool.

---

## Entry 4 — 30 new questions (pre-playtest stabilization, Part 2)

### Files changed

- `gnite/js/data/questionDatabase.js`

### What changed

- Added 30 new medium-difficulty True/False questions (ids 11-40),
  spanning Science, Geography, History, Technology, Nature, General
  Knowledge, Sports, and Entertainment (4 each in the first six
  categories, 3 each in Sports/Entertainment -- a natural mix, not
  forced to an exact even split).
- Each new question includes an `explanation` field, which the
  original 10 didn't have. `popup.js` already had a fallback
  (`q.explanation || "No explanation available."`) ready for this, so
  no UI changes were needed. The original 10 questions were left
  completely untouched, per "preserve the existing QuestionDatabase
  structure."
- Total question count: 10 -> 40.

### Verification performed

- Syntax check on `questionDatabase.js`.
- Programmatic check: exactly 40 total questions, all 40 ids unique,
  all 30 new questions have every required field (`category`,
  `question`, `answer`, `explanation`), and no duplicate question text
  anywhere in the database (old or new).
- Ran the actual `QuestionManager` (from Entry 3) against the real,
  now-40-question database end-to-end: drew all 40 questions with zero
  duplicates, then confirmed the pool correctly returns `null` with a
  warning on the 41st draw rather than repeating.

### Known issues

- None.

### Deferred work / technical debt

- The original 10 questions still have no `explanation` field. Not
  touched in this entry, out of scope ("preserve the existing
  QuestionDatabase structure" / "do not duplicate existing
  questions" -- editing them wasn't requested).
- With 40 questions against a 30-tile board needing ~25, pool
  exhaustion should now be rare-to-nonexistent in a single game, but
  the graceful `null` fallback from Entry 3 remains in place regardless.

---

## Entry 5 — UI/UX polish: event descriptions, timer/points on Event Tiles, Pass timing

Scope: UI/UX only, based on playtesting feedback. Event System logic
was assumed correct and not touched.

### Files changed

- `gnite/js/data/eventDatabase.js`
- `gnite/js/ui/popup.js`

### What changed

**Priority 1 -- Event descriptions.** Every entry in `eventDatabase.js`
now has a `name` (e.g. "Bomb Other") and `description` (e.g. "Choose
another player. They lose 200 points.") field. `popup.js` renders
`tile.event.name`/`tile.event.description` directly -- no event text is
hardcoded in the popup. The database remains the single source of
truth.

**Priority 2 -- No timer on pure Event Tiles.** `startTimerBtn` and
`timerDisplay` are hidden for `tileType === "event"` tiles, shown for
everything else. `muteBtn` (a global sound toggle, not a per-tile
timer control) was left untouched.

**Priority 3 -- No points banner on pure Event Tiles.** The `⭐ N
Points` line is omitted entirely from a pure Event tile's popup.
Question, Mixed, and Stale tiles are unchanged.

**Priority 4 -- Pass timing + reveal flow (spec revised mid-phase).**
The interaction flow changed from the original Pass System design:
Pass is now visible the moment the popup opens (for every tile type,
including pure Event tiles), before the Answer or the Hidden Event is
revealed. Clicking Reveal shows the Answer and the Hidden Event's name
+ description together. A "Hidden Event / ❓ ???" teaser appears
immediately on open() for any tile carrying a real event (Event or
Mixed), replaced with the actual name/description once revealed.

### A decision I made without asking (flagged, not hidden)

The spec said pure Event Tiles should let the host choose "Pass (if
desired), Close, or whatever controls are appropriate" after reveal.
Taken literally, "Correct" was already wired to every tile via the
shared reveal() flow, including Event tiles -- meaning a host could
click Correct on an Event tile and silently receive `tile.points`
despite Priority 3 explicitly saying Event tiles aren't worth points.
I hid the Correct button entirely for pure Event tiles (there's no
question to be correct about) and relabeled the existing Wrong button
to "Continue" for that tile type only. `wrong()`'s underlying logic
was not changed -- it already awarded no points and already fired the
tile's event, marked it used, and advanced the turn, which is exactly
the behavior an Event tile's "resolve" action needs. No new DOM
elements or new methods were added.

### Known issues

- None found. See verification below.

### Future hooks added

- None -- this was UI/UX polish on existing data and existing button
  plumbing, not new surface area.

### Deferred work / technical debt

- Not addressed in this phase (explicitly out of scope): Event System
  redesign/rebalancing, Contracts, Awards, sounds, scoreboard changes,
  cosmetic GUI polish beyond what the four priorities required.

### Verification performed

- Syntax check across every JS file.
- DOM-id cross-reference check (no orphaned `getElementById` calls).
- Programmatic check on `eventDatabase.js`: all 15 events have both
  `name` and `description`, total count unchanged at 15.
- DOM-mock functional simulation of `Popup.open()`/`reveal()` across
  three tile types (pure Event, Mixed, plain Question):
  confirmed Pass visibility on open (immediate, and correctly hidden
  when `passesRemaining` is 0), timer/points banner shown or hidden
  correctly per tile type, the "❓ ???" teaser appearing only when a
  real event exists, Correct staying hidden through reveal on Event
  tiles while Wrong/Continue becomes visible, and the event
  name/description appearing correctly in the DOM after reveal.
- Separately confirmed the actual concealment mechanism (the `hidden`
  CSS class on `popupAnswer`) toggles correctly before/after reveal --
  content being pre-built into the DOM before reveal is pre-existing
  architecture from before this phase, not something introduced here.

---

## Entry 6 — Playtest fixes: dedicated continueEvent(), Pass expiry, Stale tile display

### Files changed

- `gnite/index.html`
- `gnite/js/ui/ui.js`
- `gnite/js/ui/popup.js`

### What changed

**Code quality fix (queued from Entry 5).** Replaced the "relabel
Wrong's button text to Continue" hack with a real, dedicated
`continueBtn` in the HTML, wired to a new `Popup.continueEvent()`
method. `correct()`, `wrong()`, `continueEvent()`, and `pass()` now all
call a shared private `_resolveTile(awardPoints)` helper -- the
underlying steps (fire event, mark used, advance turn) are still
shared, but every public method's name now honestly describes why it
was called instead of `wrong()` firing when nothing was actually
judged wrong.

**Playtest fix 1 -- Stale tile display.** The old hardcoded "🍃 This is
a Stale Tile. No special effects." paragraph is gone. Stale tiles now
render through the same Name + Description visual pattern as every
real event, sourced from a local `STALE_TILE_INFO` constant in
`popup.js` (not `eventDatabase.js` -- a Stale tile's `event.type` stays
`"none"` on purpose, so it can't be given a real database entry
without becoming a false positive for Chaos/Cleanup/Bad Jackpot's
"has a real event" targeting filters, which all check
`event.type !== "none"`).

**Playtest fix 2 -- Pass expires after reveal.** `passBtn` is now
explicitly hidden inside `reveal()`, for every tile type. Previously
Pass stayed visible after reveal on some paths; now the gamble is
strictly "choose to Pass before you know what you're getting into,"
matching the intended design.

### Known issues

- None found. See verification below.

### Future hooks added

- `Popup._resolveTile()` is now the one place that fires an event,
  marks a tile used, and advances the turn. Any future action that
  needs to resolve a tile (a Contract effect, for example) has one
  clear internal method to call rather than needing to duplicate that
  sequence again.

### Deferred work / technical debt

- None introduced by this entry.

### Verification performed

- Full syntax sweep across every JS file.
- DOM-id cross-reference check (no orphaned `getElementById` calls,
  confirms `continueBtn` is correctly wired on both sides).
- DOM-mock functional simulation covering all three fixes: confirmed
  `continueEvent()` fires the tile's event without awarding points and
  without touching the old `wrongBtn` label; confirmed Pass is hidden
  immediately after `reveal()` on both a pure Event tile and a Mixed
  tile; confirmed a Stale tile's revealed content no longer contains
  the old hardcoded message and instead contains the new Name +
  Description block under a "Tile Info" heading.
