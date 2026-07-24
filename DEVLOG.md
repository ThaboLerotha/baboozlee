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

---

## Entry 7 — Modal layout fix + Time Warp bug fix

### Files changed

- `gnite/index.html`
- `gnite/style.css`
- `gnite/js/ui/popup.js`

### Issue 1: popup buttons pushed off-screen (layout)

**Fix.** Wrapped the popup's question/answer/timer content in a new
`#popupScrollArea` div (sibling of `#popupButtons`, both direct
children of `#popupBox`). `.popupBox` is now a capped-height
(`max-height:90vh`) flex column; `#popupScrollArea` is `flex:1 1 auto`
with `overflow-y:auto` and `min-height:0` (required -- without it a
flex child won't shrink below its content's natural height, which
would silently defeat the scrolling); `.popupButtons` is
`flex:0 0 auto`, so it never shrinks and never scrolls out of view.
This is the standard "scrollable body, pinned footer, capped total
height" modal pattern. No text was shortened, no content was removed,
no font sizes were changed.

**Verification.** Installed `jsdom` temporarily (removed afterward,
not committed) to parse the real `index.html` and confirm the actual
DOM tree: `popupButtons` is a sibling of `popupScrollArea`, not nested
inside it (this is what makes it exempt from the scrolling and
pinnable via flex); all six popup buttons still exist and are still
inside `popupButtons`; `popupQuestion`/`popupAnswer`/`timerArea` are
all correctly inside `popupScrollArea`. CSS brace balance and HTML
div-tag balance were also checked. This confirms the structure is
correct; it does not confirm actual pixel-level rendering, since this
environment has no real browser -- see note below.

### Issue 2: Time Warp had no visible effect

**Root cause (confirmed by tracing the exact code path, not
guessed).** `Timer.remaining` and `Timer.updateDisplay()` were both
being correctly read/written by `EventExecutor.timeWarp()` -- the
suspicion that it was "modifying a value the live countdown doesn't
use" turned out not to be the mechanism, though the underlying
category of problem (data change with no visible effect) was right.
The actual cause: `Popup._resolveTile()` called
`EventExecutor.execute()` (which halves the timer and writes the new
value to the DOM), then *immediately*, in the same synchronous
continuation, called `Board.markUsed()` -> `Score.nextPlayer()` ->
`this.close()` -> `Timer.stop()`. There was no yield point between the
DOM write and the popup being hidden, so the browser never got a
chance to paint the halved value before it was hidden by `display:none`
-- the data was correct, but visually nothing appeared to change. This
isn't specific to Time Warp; any event that visibly changes shared UI
right before a tile resolves would hit the same gap.

**Fix.** Inserted a single `await` on a double-`requestAnimationFrame`
promise in `_resolveTile()`, between `EventExecutor.execute()` and
`Board.markUsed()`. Two animation frames reliably guarantees at least
one paint has occurred in between (a well-established technique for
this exact problem), at a cost of roughly 1/30th of a second --
imperceptible to a host, but enough for the browser to actually render
the change. Fixed at the shared resolution path (not special-cased for
Time Warp specifically), since the gap was generic.

**Verification.** Built a Node simulation that loads the *actual,
unmodified* `timer.js` and the *actual, fixed* `popup.js`, runs
`Timer.start()` with a real 1-second `setInterval` for 2.5 real
seconds, then resolves a tile carrying a `TIME_WARP` event and traces
every call in order. Confirmed: the timer was at `remaining=3` when
resolved; Time Warp correctly computed `floor(3/2)=1` and wrote it to
the mock DOM; `requestAnimationFrame` was invoked twice (confirming a
real async gap existed) *before* `Board.markUsed()` /
`Score.nextPlayer()` / `close()` / `Timer.stop()` ran. Then, for
contrast, ran the same trace against the actual pre-fix `popup.js`
(pulled from the previous commit) and confirmed it had *zero* yield
points between the DOM write and `close()` -- pure synchronous
continuation, reproducing the reported bug exactly.

### A limitation worth being explicit about

This sandbox has no real browser -- verification for both issues was
done via DOM-structure parsing (jsdom) and execution-order/timing
simulation (Node, with `requestAnimationFrame` mocked onto the real
event loop), not by literally watching a rendered page. This is strong
evidence the fixes are structurally and mechanically correct, but a
quick manual check in an actual browser (resize the window narrow
enough to force scrolling on a Mixed tile with a long question; trigger
a Time Warp mid-countdown and watch the number visibly drop) is still
worth doing before tonight, since it's the one thing this environment
genuinely cannot confirm.

### Known issues

- None found beyond the one above (which is a verification-method
  limitation, not a known code issue).

### Deferred work / technical debt

- None introduced by this entry.

---

## Entry 8 — Content integration: QuestionPack_v1

### Files changed

- `gnite/content/questions/QuestionPack_v1.js` (new -- the uploaded pack)
- `gnite/js/managers/questionManager.js`
- `gnite/index.html`

### What changed

**The uploaded file was truncated.** It ended mid-structure with no
closing `]`/`}` for the `questions` array/outer object, so it failed
`node --check` as-is. All 250 questions themselves were intact (ids
1-250 present, matching the pack's own `totalQuestions: 250`) -- only
the closing syntax at the very end was missing, almost certainly an
upload/copy artifact rather than a content problem. Appended the
missing `]` `};` and re-verified it parses. This isn't a content
critique (the questions themselves were left untouched, per
instruction) -- it was a structural fix required before the file could
be loaded at all.

**`QuestionManager.reset()`** now builds `availableQuestions` from
`QuestionPackV1.questions` instead of the old flat `QuestionDatabase`
array. Every other method (`getQuestion()`, `shuffle()`,
`initialize()`) is untouched -- the public API is identical to before.
Swapping in a future pack is a one-line change to this one reference
plus the `<script>` tag below.

**`index.html`** now loads `content/questions/QuestionPack_v1.js`
instead of `js/data/questionDatabase.js`.

**`js/data/questionDatabase.js` (the old 40-question file) was left in
the repo but is no longer loaded anywhere** -- same treatment as
`powerups.js` from earlier: dead, not deleted, flagged here so nobody
mistakes it for the active database. Confirmed nothing else in the
codebase references the `QuestionDatabase` global anymore.

### Architecture note

The pack's `type` field uses `"true_false"` instead of the old file's
`"truefalse"`, and adds a `tags` array the old format didn't have.
Neither required an adapter -- `question.type` is never actually read
anywhere in the codebase (confirmed by search), and an extra unused
`tags` field on each question object is harmless. No format
adaptation was needed beyond fixing the truncation.

### Known issues

- None in the integration itself. The source pack's truncation was
  fixed as described above.

### Future hooks added

- None new -- `QuestionManager`'s public API is unchanged, so nothing
  else needed to change to point at a different pack in the future.

### Deferred work / technical debt

- `js/data/questionDatabase.js` (old 40-question file) is now dead
  code, same status as `powerups.js`. Neither has been deleted.

### Verification performed

- Fixed the truncated pack, then confirmed via `node --check` that it
  parses.
- Programmatic check on the pack: `questions.length` matches the
  declared `totalQuestions` (250), all 250 ids unique, every question
  has `category`/`question`/`answer`/`explanation`, no duplicate
  question text.
- Full syntax sweep across every JS file including the new
  `content/questions/` folder.
- DOM-id cross-reference check after the `index.html` script-tag swap.
- Ran the actual `QuestionManager` against the real, fixed pack
  end-to-end: drew all 250 questions with zero duplicates, confirmed
  the exhausted pool returns `null` with a warning, confirmed `reset()`
  rebuilds and reshuffles a fresh 250-question pool for a new game.
- Confirmed via search that nothing else in the codebase still
  references the old `QuestionDatabase` global.

---

## Entry 9 — Contract System (framework only, no content)

Scope: architecture only, per instruction. Does not implement any of
the ~25 real contracts -- only the pipeline and two placeholder
entries used to prove it end-to-end.

### Files changed

- `gnite/js/data/contractDatabase.js` (new)
- `gnite/js/managers/contractManager.js` (new)
- `gnite/index.html`
- `gnite/js/ui/ui.js`
- `gnite/js/engine/app.js`
- `gnite/js/ui/popup.js`
- `gnite/js/managers/score.js`
- `gnite/style.css`

### Architecture

**`contractDatabase.js`** follows the same `key`/`name`/`description`
pattern as `eventDatabase.js`. Each entry also has `category`
(`"starting"` or `"optional"`), a `type` string, a generic numeric
`target`, and a `reward` object. Contains two placeholder entries
only (`EXAMPLE_STARTING_PLACEHOLDER`, `EXAMPLE_OPTIONAL_PLACEHOLDER`),
clearly commented as not-real-content.

**`contractManager.js`** owns all contract state internally, keyed by
`player.id` -- it does not add any fields to player objects, so
`players.js` was not touched at all. Key design decision: contract
*type* logic is never hardcoded inside `ContractManager`. Instead,
`ContractManager.registerType(typeKey, handler)` lets any future file
register a handler for a new `type` value; `ContractManager` just
looks up `typeHandlers[def.type]` and calls `handler.onHook(...)` --
it has no `if/else` chain over contract types anywhere. Verified this
actually works by registering a brand-new type at runtime in the test
suite and confirming its handler received a hook, without editing
`ContractManager`'s own code.

Definitions vs. instances: assigning a contract copies `target` from
the database entry onto a fresh instance object
(`{instanceId, contractId, playerId, status, progress, target}`).
Editing a database entry later can't retroactively change a contract
a player is already partway through.

**Every public method starts with `if(!this.enabled) return;`.** This
is what makes "leave existing gameplay unchanged when disabled"
actually true rather than just intended -- confirmed by a regression
test that calls every hook with contracts disabled and checks zero
state was created.

### Integration points (the "smallest set of files" from inspection)

- `ui.js`: `startGameBtn`'s handler reads the new `#contractsEnabled`
  checkbox and sets `ContractManager.enabled` before calling
  `ContractManager.startGame()`. Placed alongside the existing
  `Players.createPlayers()` / `QuestionManager.reset()` / `Board.build()`
  sequence -- no reordering of existing calls.
- `app.js`: `ContractManager.initialize()` added alongside the other
  managers' initialization, guarded with `typeof ContractManager !==
  "undefined"` for defensive consistency with how `Timer` is already
  guarded elsewhere in the codebase.
- `popup.js`: `_resolveTile()` gained one parameter (`outcome`, a
  string like `"correct"`/`"wrong"`/`"pass"`/`"continue"`) and one
  guarded call to `ContractManager.onTileResolved()`. No other change
  to tile-resolution behavior.
- `score.js`: `addPoints()`/`subtractPoints()` each gained one guarded
  call to `ContractManager.onScoreChange()`. `nextPlayer()` captures
  the ending player's id before advancing and fires
  `ContractManager.onTurnEnd()` for that player once advancement is
  done (not fired on the early-return bonus-turn path, since that's
  the same player continuing, not a turn actually ending).
- `index.html`: new `#contractsEnabled` checkbox on the Setup screen
  (defaults unchecked/off), new `#contractPanel` aside next to
  `#scoreboard` (starts hidden), two new `<script>` tags.

### UI placeholder

`ContractManager.renderPanel()` is intentionally minimal -- lists each
player with active/completed/failed contracts and a raw
`progress/target` count. It proves contracts are visible to the host;
it is not a finished design. Hidden entirely (and never populated)
when contracts are disabled.

### Known issues

- None found. See verification below.

### Future hooks added

- `ContractManager.registerType()` is the extension point for every
  future contract type -- confirmed working via the runtime
  registration test.
- `offerOptionalContract(playerId)` is a complete, working, tested
  pipeline, but nothing calls it yet -- deciding *when* during a game
  an Optional Contract should be offered is a gameplay/UX decision left
  for a future phase, not assumed here.

### Deferred work / technical debt

- Only 2 placeholder contract definitions exist. The real content (up
  to 25 contracts, per the milestone) is future work, likely following
  the same content-generation split used for the question pack
  (ChatGPT generates the data file, this integrates it).
- No automatic trigger exists yet for offering Optional Contracts
  during play.
- `renderPanel()`'s presentation is a placeholder, not a final design.

### Verification performed

- Full syntax sweep across every JS file, including the two new files.
- CSS brace balance and HTML div-tag balance checks after the
  `index.html`/`style.css` edits.
- DOM-id cross-reference check (confirms `contractsEnabled` and
  `contractPanel` are correctly wired on both sides, and nothing else
  broke).
- A standalone 8-group functional simulation of `ContractManager`
  covering: disabled = true no-op (including calling all three hooks
  and confirming zero state change); Starting Contracts assigned to
  every player; the Optional Contract offer pipeline; progress
  tracking with automatic completion at target; fail-state tracking;
  `getActiveContracts()` correctly excluding completed/failed;
  point-reward payout on completion; and runtime registration of a
  brand-new contract type whose handler correctly receives hooks
  without any change to `ContractManager`'s own code.
- A second simulation loading the *actual* `popup.js` end-to-end (not
  a reimplementation) confirming a real tile resolution: (a) with
  contracts disabled, resolves exactly as before with zero
  `ContractManager` state created; (b) with contracts enabled, the
  `tileResolved` hook reaches a registered handler with the correct
  `playerId` and `outcome`.

---

## Entry 10 — First 25 production contracts

Content only. `ContractManager` was not modified -- confirmed via
`git diff` showing zero changes to that file before committing.

### Files changed

- `gnite/js/data/contractDatabase.js` (replaced the 2 framework
  placeholders with 25 real contracts)
- `gnite/js/managers/contractTypes.js` (new)
- `gnite/index.html` (one new `<script>` tag)

### Design decisions made before writing any content

**Avoided contracts tied to a specific board event.** Which event
types even appear on a given board is random (`BoardGenerator` rolls
tile type per-tile; `EventManager` draws from a shuffled pool where
most events have only 1-2 copies). A contract requiring, say, "trigger
a Meteor" could be mathematically impossible in a given game. This
directly violates "contracts are always achievable," so none of the 25
reference a specific event.

**Avoided "avoid-doing-X-until-the-game-ends" contracts.** There's no
game-end hook in `ContractManager` (only `onTileResolved`/
`onScoreChange`/`onTurnEnd` exist). Adding one would be exactly the
kind of `ContractManager` change the instructions said to avoid unless
truly necessary -- so this batch simply doesn't include that pattern,
rather than forcing an architecture change for it.

**Calibrated every target assuming a normal-sized game, not the
extreme end of the player range.** The game supports 2-20 players
sharing one 30-tile board, so per-player turn count varies enormously
-- a 20-player game could give some players as few as 1 turn total.
Matched the instruction's own "achievable over the course of a normal
game" phrasing rather than the worst-case player count; targets are
kept modest (mostly 1-6) specifically because of this. Documented here
as an explicit assumption rather than silently designed around.

### The 8 contract types (in `contractTypes.js`)

`countOutcome`, `turnsPlayed`, `scoreThreshold`, `singleTileScore`,
`countAboveThreshold`, `correctStreak`, `scoreAndCorrectCombo`,
`passAndCorrectCombo`. Each registered via
`ContractManager.registerType()` -- none required touching
`ContractManager` itself. The two combo types are worth calling out:
rather than checking their compound condition and calling
`completeContract()` directly, each condition becoming newly true
increments progress by 1 toward a target of 2 via the normal
`updateProgress()` path -- so `ContractManager`'s existing "progress
reaches target -> auto-complete" logic handles completion naturally,
and the placeholder panel shows meaningful partial progress (e.g.
`1/2`) instead of nothing.

**Streak design note:** a wrong answer resets `correctStreak` to zero;
Pass and Continue are neutral and don't break it. This was a
deliberate choice so a strategic Pass on a question the player doesn't
know doesn't cost them contract progress -- it creates the kind of
"interesting decision" the brief asked for rather than punishing
appropriate use of an existing mechanic.

### Balance

10 Easy / 10 Medium / 5 Hard, as requested. 10 Starting / 15 Optional.
Easy contracts complete in effectively 1 action (answer once, pass
once, reach a modest score). Medium raises counts modestly (2-4) or
adds a compound condition. Hard raises counts further (4-6) or raises
score/single-tile thresholds, without ever requiring double-digit
repetitions.

### Known issues

- None found. See verification below.

### Deferred work / technical debt

- Nothing new introduced by this entry. The two items already noted in
  Entry 9 (no automatic Optional Contract offer trigger; placeholder
  panel presentation) remain unchanged.

### Verification performed

- Full syntax sweep across every JS file including the two new/changed
  files.
- Confirmed via `git diff --stat` on `contractManager.js` that it has
  zero changes.
- DOM-id cross-reference check after the `index.html` script-tag
  addition.
- Structural check on the database: exactly 25 contracts, ids exactly
  1-25 with no gaps or duplicates, all keys unique, every contract has
  every required field, every `category` is `starting` or `optional`,
  every `type` referenced has a registered handler in
  `ContractManager.typeHandlers`, and difficulty distribution is
  exactly 10 Easy / 10 Medium / 5 Hard.
- Functional simulation covering all 8 types against the real 25-entry
  database: confirmed Starting Contracts are assigned to every player
  (10 each); confirmed `countOutcome`, `turnsPlayed`, `scoreThreshold`,
  and `singleTileScore` each complete correctly at their target;
  confirmed `correctStreak` does NOT complete early on a partial
  streak, correctly resets to 0 on a wrong answer, and correctly
  treats a Pass as neutral (doesn't break an in-progress streak);
  confirmed `countAboveThreshold` requires the qualifying gain to
  happen the specified number of separate times, not just once;
  confirmed both combo types track partial progress correctly (1/2
  after only one condition is met) and complete only once both
  conditions are satisfied, in either order; confirmed the generic
  `failContract()` still works correctly against the new content.

---

## Entry 11 — Game History Log

### Files changed

- `gnite/js/managers/historyManager.js` (new)
- `gnite/index.html`
- `gnite/style.css`
- `gnite/js/ui/ui.js`
- `gnite/js/engine/app.js`
- `gnite/js/managers/score.js`
- `gnite/js/ui/popup.js`
- `gnite/js/managers/eventExecutor.js`
- `gnite/js/managers/contractManager.js`

### Architecture

`HistoryManager` contains no gameplay logic -- every other system
constructs its own human-readable title/description text and calls
the single generic `HistoryManager.record(playerId, title,
description)`. The only other public "structural" methods are
`advanceTurn()` (the relative, in-game clock entries are stamped with
-- not real time) and `open()`/`close()`/`render()` for the read-only
viewer. No calling system ever touches the DOM directly for history
display; they only ever call `record()`.

Every hook call site follows the same `typeof HistoryManager !==
"undefined"` guard already used throughout this codebase for
`ContractManager`/`Timer`, so History is a safe no-op if the file
somehow failed to load.

### Where each required entry type is actually produced

| Entry type | Where |
|---|---|
| Turn started | `ui.js` (very first turn) and `score.js`'s `nextPlayer()` (every subsequent turn) |
| Answered correctly / incorrectly | `popup.js`'s `_resolveTile()` |
| Points gained | `eventExecutor.js` (Steal's gaining side, Gift's receiving side) and `contractManager.js`'s `completeContract()` (reward payout) |
| Points lost | `score.js`'s `subtractPoints()` (its only caller is Bomb Self) and folded into `eventExecutor.js`'s outcome text for Bomb Other/Steal's losing side/Gift's giving side |
| Pass used | `popup.js`'s `_resolveTile()` |
| Event activated | `eventExecutor.js`'s `execute()`, one hook covering all 15 event types uniformly |
| Event outcome | `eventExecutor.js`, one call per handler (13 of 14 -- Bomb Self relies on `subtractPoints`'s own hook instead of a redundant second entry) |
| Contract assigned | `contractManager.js`'s `_assign()` -- the single point both Starting and Optional assignment funnel through |
| Contract accepted / declined | **Not wired to any real code path** -- see note below |
| Contract progress updated | `contractManager.js`'s `updateProgress()`, skipped specifically on the increment that also completes the contract (avoids a redundant entry next to Completed) |
| Contract completed | `contractManager.js`'s `completeContract()` |
| Contract failed | `contractManager.js`'s `failContract()` |
| Turn ended | `score.js`'s `nextPlayer()` |

Neither "Turn Ended"/"Turn Started" nor Contract-hook recording fires
on the bonus-turn early-return path in `nextPlayer()` -- consistent
with `ContractManager.onTurnEnd()`'s existing behavior, which already
treats a bonus turn as a continuation, not a new turn.

### Honest gap: Contract Accepted / Contract Declined

There's no accept/decline flow anywhere in the game -- confirmed via
search, zero matches. `offerOptionalContract()` (from Entry 9) still
has no automatic trigger and, even when called, assigns a contract
directly with no accept/decline step at all. `HistoryManager.record()`
is fully generic and can represent these two entry types the moment
that flow exists, but there's genuinely nothing to hook into yet. Not
invented here, since building an accept/decline flow would be Contract
System work, out of scope for a History feature.

### A real bug this feature's own testing caught (in new code, not
pre-existing)

The first version of `_resolveTile()`'s "Answered Correctly" entry
computed the point figure as `player.score` before vs. after
`Score.addPoints()`. Since a Contract reward can be awarded
synchronously as a side effect of that same call (via
`ContractManager`'s `onScoreChange` hook, which can trigger
`completeContract()` mid-call), that before/after delta could include
points that already get their own separate "Contract Completed"
entry -- e.g. a 200-point tile that also completes a 100-point reward
contract showed "Answered Correctly (+300 points)" instead of +200,
double-counting the same 100 points across two log lines. Fixed by
computing the tile's own contribution directly (`tile.points`, doubled
if Double Points was active, captured before `Score.addPoints()` runs)
instead of trusting a score snapshot that other systems can
legitimately mutate in between. Caught by the integration test before
committing, not after.

### Known issues

- None beyond the documented Contract Accepted/Declined gap above.

### Deferred work / technical debt

- Cleanup/Bad Jackpot's Event Outcome entries are generic ("removed a
  hidden event from the board") rather than naming the specific event
  removed. `Board.convertRandomEventTiles()` clears `tile.event` before
  returning the affected tiles, so the name isn't recoverable without
  modifying `Board`'s own methods, which was out of scope ("Do NOT
  modify Board generation").
- Contract Accepted/Declined, as noted above.

### Verification performed

- Full syntax sweep across every JS file.
- CSS brace balance and HTML div-tag balance checks.
- DOM-id cross-reference check.
- A 10-part integration test loading the real `historyManager.js`,
  `board.js`, `eventExecutor.js`, `score.js`, `contractDatabase.js`,
  `contractManager.js`, `contractTypes.js`, and `popup.js` together
  (not reimplementations) and driving them through actual `Popup.open()
  -> reveal() -> correct()/wrong()/pass()` calls:
  - Isolated (contracts disabled): confirmed exactly one entry each
    for a correct answer (with the precise point figure), a wrong
    answer, a Pass, a Double-Points-affected correct answer (reporting
    the doubled amount correctly), and a Bomb Self event (exactly one
    Event Activated + one Points Lost entry, with exactly correct
    final score math) -- no duplicates in any case.
  - Enabled: confirmed Contract Assigned fires exactly once per
    starting contract per player (20 for a 2-player game with 10
    starting contracts), confirmed Contract Completed/Progress Updated
    entries appear when a correct answer cascades into contract
    completion, confirmed Contract Failed fires correctly.
  - Confirmed sequence numbers are strictly increasing with no gaps or
    duplicates across a 33-entry run mixing every entry type together.
  - Confirmed `open()`/`close()` correctly toggle visibility and that
    rendered HTML shows the newest entry before the oldest.
