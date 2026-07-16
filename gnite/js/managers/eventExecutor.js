/*
=========================================
EVENT EXECUTOR
Version 2.0
=========================================
*/

const EventExecutor = {

    execute(event, tile){

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
                this.bombOther(tile);
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
                this.freeze(tile);
                break;

            case "STEAL":
                this.steal(tile);
                break;

            case "GIFT":
                this.gift(tile);
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

    // TODO (Phase 2): Replace with real target-selection UI where the host
    // picks which player an event applies to. Until that exists, targeted
    // events deterministically target the next player in turn order so the
    // effect is at least real and testable.
    getPlaceholderTarget(){

        const players = GameNight.players;

        if(!players || players.length < 2){

            return null;

        }

        let index = GameNight.currentPlayer + 1;

        if(index >= players.length){

            index = 0;

        }

        return players[index];

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

    bombOther(tile){

        const target = this.getPlaceholderTarget();

        if(!target){

            console.warn("Bomb Other: no valid target player.");

            return;

        }

        if(this.consumeShieldIfPresent(target)){

            Score.update();

            return;

        }

        target.score -= 200;

        Score.update();

    },

    freeze(tile){

        const target = this.getPlaceholderTarget();

        if(!target){

            console.warn("Freeze: no valid target player.");

            return;

        }

        if(this.consumeShieldIfPresent(target)){

            Score.update();

            return;

        }

        target.skipTurns += 1;

        Score.update();

    },

    steal(tile){

        const target = this.getPlaceholderTarget();

        if(!target){

            console.warn("Steal: no valid target player.");

            return;

        }

        if(this.consumeShieldIfPresent(target)){

            Score.update();

            return;

        }

        const amount = 150;

        target.score -= amount;

        Players.getCurrentPlayer().score += amount;

        Score.update();

    },

    gift(tile){

        const target = this.getPlaceholderTarget();

        if(!target){

            console.warn("Gift: no valid target player.");

            return;

        }

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

    // TODO (Phase 5): once the pass system exists, No Escape should
    // actually prevent passing for a turn. Until then it strips every
    // player's shield, so nobody can currently hide from board effects.
    noEscape(tile){

        GameNight.players.forEach(player => {

            player.shield = false;

        });

        Score.update();

    }

};
