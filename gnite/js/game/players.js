/*
=========================================
PLAYER SYSTEM
Version 1.1
=========================================
*/

const Players = {

    buildInputs() {

        const count = parseInt(

            document.getElementById("playerCount").value

        );

        const container = document.getElementById("playerInputs");

        // Capture whatever names are already typed before wiping the
        // container, so changing the count doesn't force the host to
        // retype names for players they'd already entered.
        const existingNames = Array.from(

            document.querySelectorAll(".playerName")

        ).map(input => input.value);

        container.innerHTML = "";

        for (let i = 1; i <= count; i++) {

            const input = document.createElement("input");

            input.type = "text";

            input.placeholder = "Player " + i + " Name";

            input.className = "playerName";

            if(existingNames[i - 1]){

                input.value = existingNames[i - 1];

            }

            container.appendChild(input);

            container.appendChild(document.createElement("br"));

        }

    },

    createPlayers() {

        GameNight.players = [];

        const inputs = document.querySelectorAll(".playerName");

        inputs.forEach((input, index) => {

            GameNight.players.push({

                id: index + 1,

                name: input.value.trim() || ("Player " + (index + 1)),

                score: 0,

                // ---------- Player States ----------

                frozen: false,

                skipTurns: 0,

                bonusTurn: false,

                shield: false,

                doublePoints: false,

                // Each player starts with 2 Passes for the game. A Pass
                // can be used once the question on their tile has been
                // revealed instead of answering Correct/Wrong: it awards
                // no points, but still consumes the tile and still
                // triggers the tile's event. Not regained unless a
                // future event/mechanic explicitly grants one.
                passesRemaining: 2

            });

        });

        GameNight.currentPlayer = 0;

    },

    getCurrentPlayer() {

        return GameNight.players[GameNight.currentPlayer];

    },

    // Player Departure, Step 1: the removal primitive. Nothing yet
    // calls this. Does NOT check remaining player count or end the
    // game, and does NOT record history or create any Treasure Chest
    // -- those all read/act on the *result* of a removal, which is a
    // decision for whichever future step actually wires this in.
    //
    // Uses `id`, the same identifier every other manager already looks
    // players up by (GameNight.players.find(p => p.id === ...) appears
    // throughout historyManager.js/contractManager.js/threatManager.js/
    // threatConsequences.js/eventExecutor.js) -- not array position,
    // which would be unstable across removals anyway.
    //
    // GameNight.players is mutated directly (via splice, so the
    // remaining players keep their existing relative order) -- there
    // is no second/duplicate player list anywhere to keep in sync.
    //
    // Player Departure, Step 2: GameNight.currentPlayer is an array
    // *index*, not a player id (see score.js's nextPlayer(), the
    // existing turn-advancement code, which increments/wraps it the
    // same way). Removing an element shifts every later index down by
    // one, so the index needs the same adjustment here or it would
    // silently point at the wrong player (or go out of bounds) the
    // moment anything actually calls this during a real game:
    //   - removed player was BEFORE the current index -> everyone from
    //     the current player onward shifted down by one, so decrement
    //     to keep pointing at the same actual player.
    //   - removed player was AFTER the current index -> current
    //     player's own position is untouched, leave it alone.
    //   - removed player WAS the current player -> the player who was
    //     next now occupies this same index, so leave the index alone
    //     UNLESS it was also the last index (nothing shifted into it),
    //     in which case clamp to the new last index, floored at 0 for
    //     an empty list. This never wraps to 0 the way normal turn
    //     advancement does in score.js -- a departure isn't a turn
    //     ending, it's a clamp to stay in range.
    removePlayer(playerId) {

        const index = GameNight.players.findIndex(

            p => p.id === playerId

        );

        if(index === -1){

            return null;

        }

        const removed = GameNight.players.splice(index, 1)[0];

        if(index < GameNight.currentPlayer){

            GameNight.currentPlayer -= 1;

        } else if(index === GameNight.currentPlayer){

            if(GameNight.currentPlayer >= GameNight.players.length){

                GameNight.currentPlayer = Math.max(0, GameNight.players.length - 1);

            }

        }

        return removed;

    },

    // Player Departure, Step 3: the departure entry point. Nothing
    // yet calls this either -- still no UI, no History recording, no
    // chest creation. This exists purely as the one seam future
    // departure functionality should call, instead of manipulating
    // GameNight.players or calling removePlayer() directly:
    //   UI (future) -> Players.departPlayer(playerId) -> removePlayer()
    //
    // Deliberately thin: validates the player exists (so callers get
    // an explicit, clear result rather than having to infer success
    // from removePlayer()'s null-vs-object return), then delegates the
    // actual mutation and the Step 2 currentPlayer safeguards entirely
    // to the existing removePlayer() -- no removal logic is
    // duplicated here, and GameNight.players stays the only player
    // list either way.
    //
    // Result shape matches this codebase's existing convention for a
    // decision/action outcome object (see ThreatManager.registerHarmfulEvent()
    // and ThreatConsequences.apply(), both { <flag>: boolean, reason?
    // string, ...details }), rather than a bare boolean or throwing.
    departPlayer(playerId) {

        const player = GameNight.players.find(

            p => p.id === playerId

        );

        if(!player){

            return { success: false, reason: "invalid-player", playerId };

        }

        const removed = this.removePlayer(playerId);

        return { success: true, player: removed };

    }

};
