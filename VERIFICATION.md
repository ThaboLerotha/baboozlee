# VERIFICATION.md

A test entry stays VERIFIED until a change could plausibly affect what
it tested — it is not auto-expired by unrelated work. See TESTING RULE
in project conventions (Thabo's process instructions) for how to decide
whether to rerun something.

This file is being built incrementally. Only the most recent milestone's
verification has been transcribed so far (from DEVLOG); earlier
milestones' verification will be backfilled on a later pass if/when
needed, not reconstructed all at once.

---

## VERIFIED — Information Architecture milestone (Notifications,
Information Board, Event Categories)

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

## Not yet backfilled (pre-existing, presumed still valid, not reverified)

These milestones predate this documentation system and have not been
individually re-transcribed into structured entries yet. Per DEVLOG,
each had its own "Verification performed" section at the time:

- Contract System framework + first 25 production contracts
- Milestone 1.5 (player count bug, popup layout redesign)
- Version 1.0 Milestone 1: Core Gameplay Completion
- Game History Log
- QuestionPack_v1 integration
- Popup overflow / Time Warp fix
- Question System reshuffle/exhaustion fix
- Pass System (Phase 4)
- Board Event System (Jackpot, Bad Jackpot, Cleanup, Chaos, Meteor)

**Do not assume these are unverified** — DEVLOG.md has the original
verification notes for each, dated and tied to its commit. Pull the
relevant DEVLOG section on demand when a change touches one of these
systems, rather than re-testing blind or reconstructing all of them
into this file speculatively.
