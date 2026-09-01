/*
=========================================
THREAT CONSEQUENCES
Version 1.0
=========================================

Step 3 of the Threat Engine. This manager only APPLIES a punishment --
it never decides whether one happens or which one (that's
ThreatManager entirely). Nothing in the game calls this yet; it exists
so the apply layer can be built and tested independently.

apply(playerId, punishmentKey) is the single entry point. Everything
else here is a private handler for one of the five ThreatPunishments
keys, or a shared helper.
*/

const ThreatConsequences = {

    // The only method anything outside this file should call.
    apply(playerId, punishmentKey){

        const player = GameNight.players.find(p => p.id === playerId);

        if(!player){

            return {

                applied: false,

                reason: "invalid-player",

                punishment: punishmentKey,

                playerId: playerId

            };

        }

        const punishmentDef = ThreatPunishments.find(p => p.key === punishmentKey);

        if(!punishmentDef){

            return {

                applied: false,

                reason: "unknown-punishment",

                punishment: punishmentKey,

                playerId: playerId

            };

        }

        // Re-validated here independent of whatever ThreatManager
        // already checked -- SHIELD_BREAK is the one punishment that
        // requires the target to actually have a Shield, since its
        // entire purpose is to destroy one.
        if(punishmentDef.requiresShield && !player.shield){

            return {

                applied: false,

                reason: "requires-shield-but-player-has-none",

                punishment: punishmentKey,

                playerId: playerId

            };

        }

        const handler = this.handlers[punishmentKey];

        if(!handler){

            return {

                applied: false,

                reason: "no-handler-registered",

                punishment: punishmentKey,

                playerId: playerId

            };

        }

        return handler.call(this, player);

    },

    // =========================================
    // Per-punishment handlers
    // =========================================
    // Each returns { applied, punishment, playerId, ...details }.

    handlers: {

        // Bypasses Shield by design (see threatDatabase.js) -- its
        // purpose is to destroy the Shield, so it never goes through
        // _shieldBlocks(). apply() already refused to call this at all
        // if the player has no Shield (requiresShield above).
        SHIELD_BREAK(player){

            player.shield = false;

            if(typeof Score !== "undefined"){

                Score.update();

            }

            return {

                applied: true,

                punishment: "SHIELD_BREAK",

                playerId: player.id

            };

        },

        // Bypasses Shield by design. Existing active contracts
        // (Starting or Optional) are untouched -- only future Optional
        // Contract offers are blocked.
        CONTRACT_LOCK(player){

            if(typeof ContractManager === "undefined" || !ContractManager.enabled){

                return {

                    applied: false,

                    reason: "contracts-disabled",

                    punishment: "CONTRACT_LOCK",

                    playerId: player.id

                };

            }

            ContractManager.blockOptionalContracts(player.id);

            return {

                applied: true,

                punishment: "CONTRACT_LOCK",

                playerId: player.id

            };

        },

        // Shield-protectable (bypassesShield: false in the database) --
        // a Shield fully blocks this and is consumed instead.
        POINT_DRAIN(player){

            if(ThreatConsequences._shieldBlocks(player, "POINT_DRAIN")){

                return {

                    applied: false,

                    reason: "blocked-by-shield",

                    punishment: "POINT_DRAIN",

                    playerId: player.id

                };

            }

            // "50% of current points, floored." No clamp-at-zero is
            // applied here because none exists anywhere else in the
            // codebase's scoring paths (bombSelf/bombOther/subtractPoints
            // all allow negative scores) -- this stays consistent with
            // that existing precedent rather than inventing a new rule.
            const amountDrained = Math.floor(player.score * 0.5);

            player.score -= amountDrained;

            if(typeof Score !== "undefined"){

                Score.update();

            }

            return {

                applied: true,

                punishment: "POINT_DRAIN",

                playerId: player.id,

                amountDrained: amountDrained

            };

        },

        // Shield-protectable (bypassesShield: false in the database).
        LOSE_ALL_POINTS(player){

            if(ThreatConsequences._shieldBlocks(player, "LOSE_ALL_POINTS")){

                return {

                    applied: false,

                    reason: "blocked-by-shield",

                    punishment: "LOSE_ALL_POINTS",

                    playerId: player.id

                };

            }

            const previousScore = player.score;

            player.score = 0;

            if(typeof Score !== "undefined"){

                Score.update();

            }

            return {

                applied: true,

                punishment: "LOSE_ALL_POINTS",

                playerId: player.id,

                previousScore: previousScore

            };

        },

        // Bypasses Shield by design. Only Optional Contracts are
        // removed -- Starting Contracts and this player's Contract
        // Lock status are both untouched. Succeeds even if the player
        // currently has no Optional Contracts to wipe (nothing to do,
        // not a failure).
        CONTRACT_WIPE(player){

            if(typeof ContractManager === "undefined" || !ContractManager.enabled){

                return {

                    applied: false,

                    reason: "contracts-disabled",

                    punishment: "CONTRACT_WIPE",

                    playerId: player.id

                };

            }

            const wiped = ContractManager.wipeOptionalContracts(player.id);

            return {

                applied: true,

                punishment: "CONTRACT_WIPE",

                playerId: player.id,

                wipedInstanceIds: wiped.map(i => i.instanceId)

            };

        }

    },

    // Shared Shield-protectable check for POINT_DRAIN and
    // LOSE_ALL_POINTS -- the two punishments whose database entry does
    // NOT set bypassesShield. Reuses EventExecutor's existing Shield
    // logic (a genuinely public method, unlike its underscore-prefixed
    // internal helpers) instead of duplicating the same three lines
    // here. Returns true if a Shield absorbed the effect (and consumes
    // it), false if the effect should proceed.
    _shieldBlocks(player, punishmentKey){

        const def = ThreatPunishments.find(p => p.key === punishmentKey);

        if(def && def.bypassesShield){

            return false;

        }

        if(typeof EventExecutor !== "undefined" &&
           typeof EventExecutor.consumeShieldIfPresent === "function"){

            return EventExecutor.consumeShieldIfPresent(player);

        }

        // Fallback so this file stays testable even without
        // EventExecutor loaded (shouldn't happen in the real game --
        // EventExecutor always loads first).
        if(player.shield){

            player.shield = false;

            return true;

        }

        return false;

    }

};
