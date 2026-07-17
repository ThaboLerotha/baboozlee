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

    // =========================================
    // Self Events
    // =========================================

    bombSelf(tile){

        Score.subtractPoints(200);

    },

    doublePoints(tile){

        Players.getCurrentPlayer().doublePoints = true;

        Score.update();

    },

    bonusTurn(tile){

        Players.getCurrentPlayer().bonusTurn = true;

        Score.update();

    },

    shield(tile){

        Players.getCurrentPlayer().shield = true;

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

            Score.update();

            return;

        }

        target.score -= 200;

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

            Score.update();

            return;

        }

        target.skipTurns += 1;

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

            Score.update();

            return;

        }

        const amount = 150;

        target.score -= amount;

        Players.getCurrentPlayer().score += amount;

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

        Score.update();

    },

    // =========================================
    // Board Events
    // =========================================

    jackpot(tile){

        Score.addPoints(300);

    },

    badJackpot(tile){

        Score.subtractPoints(300);

    },

    // Shuffles the hidden events among the other unused event/mixed tiles,
    // so players who memorized where an event was hiding can no longer
    // rely on that information.
    chaos(tile){

        const candidates = GameNight.board.filter(t =>

            !t.used &&
            t.id !== tile.id &&
            (t.tileType === "event" || t.tileType === "mixed")

        );

        if(candidates.length < 2){

            return;

        }

        const events = candidates.map(t => t.event);

        Board.shuffle(events);

        candidates.forEach((t, index) => {

            t.event = events[index];

        });

    },

    // Removes one hidden event from the board entirely, converting that
    // tile's event back to "none" (its question, if any, is unaffected).
    cleanup(tile){

        const candidates = GameNight.board.filter(t =>

            !t.used &&
            t.id !== tile.id &&
            t.event &&
            t.event.type !== "none"

        );

        if(candidates.length === 0){

            return;

        }

        const index = Math.floor(Math.random() * candidates.length);

        candidates[index].event = { type: "none" };

    },

    // =========================================
    // Global Events
    // =========================================

    // "Warps" the current round's timer by cutting whatever time remains
    // in half, raising urgency. If no timer is running there is nothing to
    // warp.
    timeWarp(tile){

        if(typeof Timer !== "undefined" && Timer.running){

            Timer.remaining = Math.max(

                1,

                Math.floor(Timer.remaining / 2)

            );

            Timer.updateDisplay();

        } else {

            console.log("Time Warp: no active timer to affect.");

        }

    },

    // TODO (Phase: Pass System): once the pass system exists, No Escape
    // should actually prevent passing for a turn. Until then it strips
    // every player's shield, so nobody can currently hide from board
    // effects.
    noEscape(tile){

        GameNight.players.forEach(player => {

            player.shield = false;

        });

        Score.update();

    }

};
