# BACKLOG.md

Approved-for-later only. **Do not implement anything here unless Thabo
explicitly says to build it now.**

## Treasure Chests (Player Departure related)

- Reward Chest / Legacy Chest system for players who leave a game
  early or finish.
- Architecture already prepared (see PROJECT_STATE.md /
  ARCHITECTURE.md): `GameNight.rewardChestStatus` and
  `GameNight.legacyChestStatus` are the two fields a real
  implementation would set. `InformationBoard.render()` already reads
  them and will start showing real values the moment something writes
  to them — no changes needed to `informationBoard.js` itself.
- Explicitly NOT implemented yet: turn-rotation removal, chest
  creation/merging logic, event-protection rules for a departed
  player's chest.

## Threat Level / Threat Engine

- A "Threat Level" concept that would likely live on
  `GameNight.threatLevel` (same pattern as the chest fields above).
- `NotificationManager.notify(..., "info")` is ready to receive a
  "Threat Level changed" call once this exists.
- `InformationBoard` has an established one-section-per-state-category
  pattern, re-rendered from its single `render()` call, that a Threat
  Level section could slot into.
- No field, logic, or UI section exists yet.

## Player Departure

- Handling a player leaving mid-game.
- `HistoryManager.record()` is generic enough to log a departure event
  directly, but no departure/removal logic has been written.
