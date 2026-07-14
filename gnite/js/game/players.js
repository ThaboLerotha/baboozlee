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

        container.innerHTML = "";

        for (let i = 1; i <= count; i++) {

            const input = document.createElement("input");

            input.type = "text";

            input.placeholder = "Player " + i + " Name";

            input.className = "playerName";

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

                doublePoints: false

            });

        });

        GameNight.currentPlayer = 0;

    },

    getCurrentPlayer() {

        return GameNight.players[GameNight.currentPlayer];

    }

};
