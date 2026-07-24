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
                this.shield(tile);
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

    // =========================================
    // Self Events
    // =========================================

    bombSelf(tile){

        Score.subtractPoints(200);

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

    shield(tile){

        const player = Players.getCurrentPlayer();

        player.shield = true;

        this.recordOutcome(player.id, `${player.name} is now shielded from the next negative effect.`);

        Score.update();

    },

    // =========================================
    // Targeted Events
    // =========================================

    async bombOther(tile){

        const eligible = this.getEligibleTargets();

        if(eligible.length === 0){

            console.warn("Bomb Other: no eligible target players.");

            return;

        }

        const target = await this.promptTarget(

            eligible,

            "Choose someone to Bomb"

        );

        if(this.consumeShieldIfPresent(target)){

            this.recordOutcome(target.id, `${target.name}'s shield blocked a Bomb.`);

            Score.update();

            return;

        }

        target.score -= 200;

        this.recordOutcome(target.id, `${target.name} lost 200 points to a Bomb.`);

        Score.update();

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

            Score.update();

            return;

        }

        target.skipTurns += 1;

        this.recordOutcome(target.id, `${target.name} will skip their next turn.`);

        Score.update();

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

            Score.update();

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

    }

};
