/*
=========================================
CONTRACT TYPES
Version 1.0
=========================================

Handlers for the contract `type` values used in contractDatabase.js's
first 25 real contracts. Every handler is registered via
ContractManager.registerType() -- none of this required any change to
contractManager.js itself, which is exactly the extension point it was
built to support.

Each handler reads whatever it needs directly from the global game
state (GameNight.players, etc.) rather than relying on the hook
payload alone -- payloads intentionally stay small and generic, and
handlers are free to look up anything else they need.

Design note (why every contract avoids certain patterns): with 2-20
players sharing a single 30-tile board, per-player turn count varies
enormously, so every contract here is calibrated to be realistic
within a normal-sized game rather than the extreme end of that range.
None of these are tied to a specific board event occurring (which
event types even appear on a given board is random -- see
BoardGenerator/EventManager) and none require detecting "the game has
ended" (no such hook exists, and adding one was avoided rather than
treated as necessary for this batch).
*/

// Counts tile resolutions matching a specific outcome
// ("correct" / "wrong" / "pass" / "continue").
// config: { outcome: "correct" }
ContractManager.registerType("countOutcome", {

    onHook(instance, def, hookName, payload, manager) {

        if(hookName !== "tileResolved"){

            return;

        }

        if(payload.outcome !== def.config.outcome){

            return;

        }

        manager.updateProgress(instance.playerId, instance.instanceId, 1);

    }

});

// Counts turns completed, regardless of outcome.
ContractManager.registerType("turnsPlayed", {

    onHook(instance, def, hookName, payload, manager) {

        if(hookName !== "turnEnd"){

            return;

        }

        manager.updateProgress(instance.playerId, instance.instanceId, 1);

    }

});

// Completes the moment the player's total score reaches the target.
// Not a counter -- checked directly against the live score on every
// change, so it fires as soon as the threshold is crossed even if the
// score later drops.
ContractManager.registerType("scoreThreshold", {

    onHook(instance, def, hookName, payload, manager) {

        if(hookName !== "scoreChange"){

            return;

        }

        if(instance.status !== "active"){

            return;

        }

        if(payload.newScore >= instance.target){

            manager.completeContract(instance.playerId, instance.instanceId);

        }

    }

});

// Completes the moment a single score change (one tile's worth of
// points) is large enough on its own to meet the target.
ContractManager.registerType("singleTileScore", {

    onHook(instance, def, hookName, payload, manager) {

        if(hookName !== "scoreChange"){

            return;

        }

        if(instance.status !== "active"){

            return;

        }

        if(payload.delta >= instance.target){

            manager.completeContract(instance.playerId, instance.instanceId);

        }

    }

});

// Counts how many separate score changes have individually met a
// minimum size (config.minDelta), completing once that's happened
// `target` times. A repeatable version of singleTileScore.
// config: { minDelta: 300 }
ContractManager.registerType("countAboveThreshold", {

    onHook(instance, def, hookName, payload, manager) {

        if(hookName !== "scoreChange"){

            return;

        }

        if(payload.delta >= def.config.minDelta){

            manager.updateProgress(instance.playerId, instance.instanceId, 1);

        }

    }

});

// Tracks consecutive correct answers. A wrong answer resets the
// streak to zero. Pass/Continue are neutral -- they don't break a
// streak, so a strategic Pass on a tough question doesn't cost a
// player their progress here.
ContractManager.registerType("correctStreak", {

    onHook(instance, def, hookName, payload, manager) {

        if(hookName !== "tileResolved"){

            return;

        }

        if(payload.outcome === "wrong"){

            instance.currentStreak = 0;

            return;

        }

        if(payload.outcome !== "correct"){

            return;

        }

        instance.currentStreak = (instance.currentStreak || 0) + 1;

        if(instance.currentStreak >= instance.target){

            manager.completeContract(instance.playerId, instance.instanceId);

        }

    }

});

// Requires reaching a score threshold AND a number of correct answers,
// in either order. Each condition, the first time it becomes true,
// counts as one point of progress toward a target of 2 -- so
// ContractManager's own "progress reaches target" completion logic
// handles this naturally, with no direct completeContract() call
// needed here. Demonstrates a handler tracking a compound condition
// using its own instance-level fields, with no new ContractManager
// support required.
// config: { scoreTarget: 400, correctTarget: 3 }
ContractManager.registerType("scoreAndCorrectCombo", {

    onHook(instance, def, hookName, payload, manager) {

        if(instance.status !== "active"){

            return;

        }

        if(hookName === "tileResolved" && payload.outcome === "correct"){

            instance.correctCount = (instance.correctCount || 0) + 1;

        }

        const player = GameNight.players.find(

            p => p.id === instance.playerId

        );

        if(!instance.scoreConditionMet && player && player.score >= def.config.scoreTarget){

            instance.scoreConditionMet = true;

            manager.updateProgress(instance.playerId, instance.instanceId, 1);

        }

        if(!instance.correctConditionMet && (instance.correctCount || 0) >= def.config.correctTarget){

            instance.correctConditionMet = true;

            manager.updateProgress(instance.playerId, instance.instanceId, 1);

        }

    }

});

// Requires using at least one Pass AND reaching a number of correct
// answers -- a different flavor of compound condition (a usage event
// rather than a score threshold), using the same one-point-per-
// condition pattern as above.
// config: { correctTarget: 3 }
ContractManager.registerType("passAndCorrectCombo", {

    onHook(instance, def, hookName, payload, manager) {

        if(instance.status !== "active"){

            return;

        }

        if(hookName !== "tileResolved"){

            return;

        }

        if(payload.outcome === "correct"){

            instance.correctCount = (instance.correctCount || 0) + 1;

        }

        if(!instance.passConditionMet && payload.outcome === "pass"){

            instance.passConditionMet = true;

            manager.updateProgress(instance.playerId, instance.instanceId, 1);

        }

        if(!instance.correctConditionMet && (instance.correctCount || 0) >= def.config.correctTarget){

            instance.correctConditionMet = true;

            manager.updateProgress(instance.playerId, instance.instanceId, 1);

        }

    }

});
