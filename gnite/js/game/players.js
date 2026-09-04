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

    // Player Departure, Step 1: the removal primitive only -- nothing
    // yet calls this. Deliberately does NOT touch GameNight.currentPlayer
    // (turn rotation / current-player replacement is a separate later
    // step), does NOT check remaining player count or end the game,
    // and does NOT record history or create any Treasure Chest --
    // those all read/act on the *result* of a removal, which is a
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
    removePlayer(playerId) {

        const index = GameNight.players.findIndex(

            p => p.id === playerId

        );

        if(index === -1){

            return null;

        }

        return GameNight.players.splice(index, 1)[0];

    }

};
