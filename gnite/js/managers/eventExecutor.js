/*
=========================================
EVENT EXECUTOR
Version 2.1
=========================================
*/

const EventExecutor = {

    // execute() is async because targeted events must wait for the host
    // to pick a player in TargetSelector before the effect can be applied.
    // Non-targeted events simply return once their (synchronous) handler
    // finishes -- awaiting a non-Promise value is a safe no-op in JS, so
    // every handler can be called the same way here regardless of type.
    async execute(event, tile){

        // Question-only tiles (and any tile with no real event) carry a
        // placeholder event of {type:"none"} and no "key". These are not
        // errors, so they should not fall through to the "unknown event"
        // warning below.
        if(!event || event.type === "none" || !event.key){

            return;

        }

        if(typeof HistoryManager !== "undefined"){

            const activatingPlayer = Players.getCurrentPlayer();

            HistoryManager.record(

                activatingPlayer.id,

                "Event Activated",

                `${activatingPlayer.name} activated ${event.name}.`

            );

        }

        if(typeof ContractManager !== "undefined"){

            const activatingPlayer = Players.getCurrentPlayer();

            await ContractManager.checkTrigger("FIRST_EVENT_TRIGGERED", activatingPlayer.id);

        }

        switch(event.key){

            case "BOMB_SELF":
                this.bombSelf(tile);
                break;

            case "BOMB_OTHER":
                await this.bombOther(tile);
                break;

            case "DOUBLE_POINTS":
                this.doublePoints(tile);
                break;

            case "BONUS_TURN":
                this.bonusTurn(tile);
                break;

            case "SHIELD":
                await this.shield(tile);
                break;

            case "FREEZE":
                await this.freeze(tile);
                break;

            case "STEAL":
                await this.steal(tile);
                break;

            case "GIFT":
                await this.gift(tile);
                break;

            case "JACKPOT":
                this.jackpot(tile);
                break;

            case "BAD_JACKPOT":
                this.badJackpot(tile);
                break;

            case "CHAOS":
                this.chaos(tile);
                break;

            case "CLEANUP":
                this.cleanup(tile);
                break;

            case "METEOR":
                this.meteor(tile);
                break;

            case "TIME_WARP":
                this.timeWarp(tile);
                break;

            case "NO_ESCAPE":
                this.noEscape(tile);
                break;

            default:
                console.warn("Unknown event:", event);
                break;

        }

    },

    // =========================================
    // Helpers
    // =========================================

    // Every player who can legally be targeted right now. Currently this
    // is "everyone except the current player", but it also excludes
    // p.eliminated so a future elimination mechanic can plug in without
    // any changes here -- no player has that flag set today, so this is
    // a no-op filter for now, not a new mechanic.
    getEligibleTargets(){

        const current = Players.getCurrentPlayer();

        return GameNight.players.filter(p =>

            p !== current && !p.eliminated

        );

    },

    // Wraps TargetSelector's callback style in a Promise so handlers can
    // simply `await` the host's choice.
    promptTarget(eligible, promptText){

        return new Promise(resolve => {

            TargetSelector.open(eligible, resolve, promptText);

        });

    },

    // Shielded players absorb one negative targeted effect instead of
    // suffering it. Returns true if a shield absorbed the effect.
    consumeShieldIfPresent(player){

        if(player && player.shield){

            player.shield = false;

            return true;

        }

        return false;

    },

    // Records what an event actually did, distinct from the generic
    // "Event Activated" entry execute() already records. Guarded the
    // same way every other HistoryManager call site in this codebase
    // is, so this is a safe no-op if History isn't loaded.
    recordOutcome(playerId, description){

        if(typeof HistoryManager !== "undefined"){

            HistoryManager.record(playerId, "Event Outcome", description);

        }

    },

    // A temporary, decision-relevant notification -- distinct from
    // the permanent History entry recordOutcome() already writes.
    notifyShieldBroken(player, blockedEvent){

        if(typeof NotificationManager !== "undefined" && player){

            NotificationManager.notify(

                "🛡️ Shield Broken",

                `${player.name}'s shield blocked ${blockedEvent}.`,

                "info"

            );

        }

    },

    // =========================================
    // Threat Engine connection
    // =========================================
    //
    // Step 4 of the Threat Engine. Every Harmful-category event
    // handler below calls this exactly once, at the point it has
    // already determined who the event's outcome belongs to -- the
    // same player recordOutcome() attributes the event to (see each
    // call site's own comment for which player that is and why).
    //
    // This function makes zero decisions of its own: it forwards to
    // ThreatManager.registerHarmfulEvent(), and if that reports a
    // punishment was selected, forwards that exact result to
    // ThreatConsequences.apply(). It never inspects Shield state,
    // Threat Level, cooldowns, or punishment weights -- those stay
    // entirely owned by ThreatManager/ThreatConsequences. Guarded the
    // same way every other optional-manager call in this codebase is.
    //
    // Step 8: this is also the one place that fires Threat
    // notifications, for the same reason it's the one place that
    // forwards to ThreatConsequences -- it's the orchestration point
    // that sees both systems' actual results, without being either of
    // them. Neither ThreatManager nor ThreatConsequences calls
    // NotificationManager themselves; this only ever reports what they
    // already decided/did, never recalculates anything:
    //   - Level-increase: compares the level immediately before this
    //     call to result.level (the level immediately after) via
    //     ThreatManager's own getCurrentLevelKey()/registerHarmfulEvent()
    //     -- a before/after read, not a re-derivation of the threshold
    //     rules that produced it. Guarded on result.level being present
    //     at all, since Pass's temporary no-op stub (popup.js) returns
    //     a result with no `level` field -- this guard is what keeps
    //     Pass from ever firing a false level-increase notification,
    //     with zero changes needed to popup.js itself.
    //   - Punishment: only fires if ThreatConsequences.apply() itself
    //     reports applied:true -- a punishment ThreatManager selected
    //     but that ThreatConsequences then blocked (e.g. absorbed by
    //     Shield) never notifies, since it never actually happened.
    registerThreatHarm(playerId){

        if(typeof ThreatManager === "undefined"){

            return;

        }

        const levelBefore = ThreatManager.getCurrentLevelKey();

        const result = ThreatManager.registerHarmfulEvent(playerId);

        if(result && result.level && result.level !== levelBefore && typeof NotificationManager !== "undefined"){

            NotificationManager.notify(

                "⚠️ Threat Level Rising",

                `The Threat Level has risen to ${result.level}.`,

                "info"

            );

        }

        if(result && result.punished && typeof ThreatConsequences !== "undefined"){

            const consequence = ThreatConsequences.apply(playerId, result.punishment);

            if(consequence && consequence.applied && typeof NotificationManager !== "undefined"){

                const player = GameNight.players.find(p => p.id === playerId);

                const punishmentDef = (typeof ThreatPunishments !== "undefined")

                    ? ThreatPunishments.find(p => p.key === consequence.punishment)

                    : null;

                const description = punishmentDef ? punishmentDef.description : consequence.punishment;

                NotificationManager.notify(

                    "☠️ Threat Punishment",

                    `${player ? player.name : "A player"}: ${description}`,

                    "failure"

                );

            }

        }

    },

    // =========================================
    // Self Events
    // =========================================

    // Harmful. Self-inflicted, so the affected player is always the
    // one who drew the tile. No recordOutcome() call exists here
    // today (Score.subtractPoints() already writes its own "Points
    // Lost" History entry) -- Players.getCurrentPlayer() is fetched
    // here purely to identify who the Threat Engine should register
    // this resolution against.
    bombSelf(tile){

        Score.subtractPoints(200);

        this.registerThreatHarm(Players.getCurrentPlayer().id);

    },

    doublePoints(tile){

        const player = Players.getCurrentPlayer();

        player.doublePoints = true;

        this.recordOutcome(player.id, `${player.name}'s next points will be doubled.`);

        Score.update();

    },

    bonusTurn(tile){

        const player = Players.getCurrentPlayer();

        player.bonusTurn = true;

        this.recordOutcome(player.id, `${player.name} will take another turn.`);

        Score.update();

    },

    async shield(tile){

        const player = Players.getCurrentPlayer();

        player.shield = true;

        this.recordOutcome(player.id, `${player.name} is now shielded from the next negative effect.`);

        Score.update();

        if(typeof ContractManager !== "undefined"){

            await ContractManager.checkTrigger("FIRST_SHIELD_USED", player.id);

        }

    },

    // =========================================
    // Targeted Events
    // =========================================

    async bombOther(tile){

        const eligible = this.getEligibleTargets();

        if(eligible.length === 0){

            // Cancelled: no target could ever be determined, no
            // outcome was recorded. Not a Threat Engine registration.
            console.warn("Bomb Other: no eligible target players.");

            return;

        }

        const target = await this.promptTarget(

            eligible,

            "Choose someone to Bomb"

        );

        if(this.consumeShieldIfPresent(target)){

            this.recordOutcome(target.id, `${target.name}'s shield blocked a Bomb.`);

            this.notifyShieldBroken(target, "a Bomb");

            Score.update();

            if(typeof ContractManager !== "undefined"){

                await ContractManager.checkTrigger("FIRST_BOMB_SURVIVED", target.id);

            }

            // The Bomb still resolved -- the Shield absorbed its
            // damage, but the harmful event itself completed and
            // produced a real outcome. Registered against the target,
            // the player the event was actually about, matching
            // recordOutcome() above. This is the game's own Shield
            // mechanic (EventExecutor.consumeShieldIfPresent), a
            // separate thing from any Shield check ThreatConsequences
            // performs later for its own punishment -- eventExecutor.js
            // does not special-case that downstream Shield at all.
            this.registerThreatHarm(target.id);

            return;

        }

        target.score -= 200;

        this.recordOutcome(target.id, `${target.name} lost 200 points to a Bomb.`);

        Score.update();

        this.registerThreatHarm(target.id);

    },

    async freeze(tile){

        const eligible = this.getEligibleTargets();

        if(eligible.length === 0){

            console.warn("Freeze: no eligible target players.");

            return;

        }

        const target = await this.promptTarget(

            eligible,

            "Choose someone to Freeze"

        );

        if(this.consumeShieldIfPresent(target)){

            this.recordOutcome(target.id, `${target.name}'s shield blocked a Freeze.`);

            this.notifyShieldBroken(target, "a Freeze");

            Score.update();

            this.registerThreatHarm(target.id);

            return;

        }

        target.skipTurns += 1;

        this.recordOutcome(target.id, `${target.name} will skip their next turn.`);

        Score.update();

        this.registerThreatHarm(target.id);

    },

    async steal(tile){

        const eligible = this.getEligibleTargets();

        if(eligible.length === 0){

            console.warn("Steal: no eligible target players.");

            return;

        }

        const target = await this.promptTarget(

            eligible,

            "Choose someone to Steal from"

        );

        if(this.consumeShieldIfPresent(target)){

            this.recordOutcome(target.id, `${target.name}'s shield blocked a Steal.`);

            this.notifyShieldBroken(target, "a Steal");

            Score.update();

            this.registerThreatHarm(target.id);

            return;

        }

        const amount = 150;

        const thief = Players.getCurrentPlayer();

        target.score -= amount;

        thief.score += amount;

        this.recordOutcome(

            thief.id,

            `${thief.name} stole ${amount} points from ${target.name}.`

        );

        Score.update();

        // Registered against the victim (target), not the thief that
        // recordOutcome() above names -- recordOutcome's message is
        // about who did the stealing, but the Threat Engine's harmful-
        // event registration is about who the harm actually happened
        // to. Steal has one clear victim here (the person who lost
        // points), unlike the thief, who benefited.
        this.registerThreatHarm(target.id);

    },

    // Gift is positive for the target, so shields (which only guard
    // against negative effects) are intentionally ignored here.
    async gift(tile){

        const eligible = this.getEligibleTargets();

        if(eligible.length === 0){

            console.warn("Gift: no eligible target players.");

            return;

        }

        const target = await this.promptTarget(

            eligible,

            "Choose someone to Gift"

        );

        const amount = 100;

        const giver = Players.getCurrentPlayer();

        giver.score -= amount;

        target.score += amount;

        this.recordOutcome(

            giver.id,

            `${giver.name} gave ${amount} points to ${target.name}.`

        );

        Score.update();

    },

    // =========================================
    // Board Events
    // =========================================
    //
    // Every handler below just triggers a named Board mutation and lets
    // Board own the actual tile manipulation -- EventExecutor doesn't
    // touch GameNight.board directly anywhere in this section.

    // Removes the board's cheapest remaining tiles from play, making the
    // rest of the board worth more on average.
    jackpot(tile){

        const removed = Board.removeLowValueTiles(3);

        const player = Players.getCurrentPlayer();

        this.recordOutcome(

            player.id,

            `Jackpot removed ${removed.length} low-value tile(s) from the board.`

        );

    },

    // Strips the hidden event from a few random event-bearing tiles,
    // turning them into ordinary stale/question tiles.
    badJackpot(tile){

        const converted = Board.convertRandomEventTiles(3);

        const player = Players.getCurrentPlayer();

        this.recordOutcome(

            player.id,

            `Bad Jackpot converted ${converted.length} hidden event tile(s) into ordinary tiles.`

        );

        // Board-wide effect, no individual victim to target -- follows
        // this codebase's existing convention (see recordOutcome()
        // above) of attributing board-wide events to the activating
        // player.
        this.registerThreatHarm(player.id);

        // convertRandomEventTiles() -> convertTilesToStale() changes
        // which events remain hidden, but doesn't mark tiles used, so
        // it doesn't go through Board's markUsed()/markTilesUsed()
        // hooks -- rendered explicitly here instead.
        if(typeof InformationBoard !== "undefined"){

            InformationBoard.render();

        }

    },

    // Shuffles hidden events among the other unrevealed event/mixed
    // tiles, so previously-suspected event locations are no longer
    // reliable.
    chaos(tile){

        const shuffled = Board.shuffleHiddenEvents(tile.id);

        const player = Players.getCurrentPlayer();

        this.recordOutcome(

            player.id,

            `Chaos shuffled ${shuffled.length} hidden event(s) around the board.`

        );

    },

    // A smaller Bad Jackpot: strips the hidden event from just one
    // random event-bearing tile.
    cleanup(tile){

        const converted = Board.convertRandomEventTiles(1);

        const player = Players.getCurrentPlayer();

        // Board.convertRandomEventTiles() already clears the tile's
        // event before returning, so the specific event that was
        // removed isn't recoverable here without modifying Board's
        // own methods -- out of scope for this feature. The count is
        // still accurate.
        this.recordOutcome(

            player.id,

            converted.length > 0

                ? "Cleanup removed a hidden event from the board."

                : "Cleanup found no hidden events to remove."

        );

        if(typeof InformationBoard !== "undefined"){

            InformationBoard.render();

        }

    },

    // Destroys roughly 30% of the remaining unrevealed tiles without
    // revealing them. Rare and severe by design.
    meteor(tile){

        const destroyed = Board.destroyRandomTiles(0.30, tile.id);

        const player = Players.getCurrentPlayer();

        this.recordOutcome(

            player.id,

            `Meteor destroyed ${destroyed.length} tile(s) on the board.`

        );

        // Board-wide effect, same attribution convention as Bad
        // Jackpot above.
        this.registerThreatHarm(player.id);

    },

    // =========================================
    // Global Events
    // =========================================

    // "Warps" the current round's timer by cutting whatever time remains
    // in half, raising urgency. If no timer is running there is nothing to
    // warp.
    timeWarp(tile){

        const player = Players.getCurrentPlayer();

        if(typeof Timer !== "undefined" && Timer.running){

            Timer.remaining = Math.max(

                1,

                Math.floor(Timer.remaining / 2)

            );

            Timer.updateDisplay();

            this.recordOutcome(player.id, "Time Warp cut the remaining time in half.");

        } else {

            console.log("Time Warp: no active timer to affect.");

            this.recordOutcome(player.id, "Time Warp found no active timer to affect.");

        }

        // Both branches above call recordOutcome() -- this is a real,
        // complete resolution either way (a no-op timer is a valid
        // outcome, not a cancellation), so both register. Affects the
        // current player's own timer, so they're the affected player.
        this.registerThreatHarm(player.id);

    },

    // TODO (Phase: Pass System): once the pass system exists, No Escape
    // should actually prevent passing for a turn. Until then it strips
    // every player's shield, so nobody can currently hide from board
    // effects.
    noEscape(tile){

        const player = Players.getCurrentPlayer();

        GameNight.players.forEach(p => {

            p.shield = false;

        });

        this.recordOutcome(player.id, "No Escape removed every player's shield.");

        Score.update();

        // Board-wide (every player's Shield is stripped), same
        // attribution convention as Bad Jackpot/Meteor above -- one
        // registration, against the activating player, matching
        // recordOutcome().
        this.registerThreatHarm(player.id);

    }

};
