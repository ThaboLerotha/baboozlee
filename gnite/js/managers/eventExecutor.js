/*
=========================================
EVENT EXECUTOR
Version 1.1
=========================================
*/

const EventExecutor = {

    execute(event, tile){

        if(!event){

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

    bombSelf(tile){

        console.log("Bomb Self", tile);

    },

    bombOther(tile){

        console.log("Bomb Other", tile);

    },

    doublePoints(tile){

        console.log("Double Points", tile);

    },

    bonusTurn(tile){

        console.log("Bonus Turn", tile);

    },

    shield(tile){

        console.log("Shield", tile);

    },

    freeze(tile){

        console.log("Freeze", tile);

    },

    steal(tile){

        console.log("Steal", tile);

    },

    gift(tile){

        console.log("Gift", tile);

    },

    jackpot(tile){

        console.log("Jackpot", tile);

    },

    badJackpot(tile){

        console.log("Bad Jackpot", tile);

    },

    chaos(tile){

        console.log("Chaos", tile);

    },

    cleanup(tile){

        console.log("Cleanup", tile);

    },

    timeWarp(tile){

        console.log("Time Warp", tile);

    },

    noEscape(tile){

        console.log("No Escape", tile);

    }

};
