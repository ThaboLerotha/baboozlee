/*
=========================================
SCORE SYSTEM
Version 1.1
=========================================
*/

const Score = {

    draw() {

        const scoreboard = document.getElementById("scoreboard");

        scoreboard.innerHTML = "";

        const title = document.createElement("h2");

        title.innerText = "Scoreboard";

        scoreboard.appendChild(title);

        GameNight.players.forEach(player => {

            let status = "";

            if(player.skipTurns > 0){

                status += " ❄";

            }

            if(player.shield){

                status += " 🛡";

            }

            if(player.doublePoints){

                status += " ⭐";

            }

            if(player.bonusTurn){

                status += " 🎯";

            }

            const row = document.createElement("div");

            row.className = "scorePlayer";

            row.innerHTML = `

                <span class="scoreName">

                    ${player.name}${status}

                </span>

                <span class="scorePoints">

                    ${player.score}

                </span>

            `;

            scoreboard.appendChild(row);

        });

        this.updateCurrentPlayer();

    },

    update(){

        this.draw();

    },

    updateCurrentPlayer(){

        const label = document.getElementById("currentPlayer");

        if(GameNight.players.length===0){

            label.innerHTML="";

            return;

        }

        label.innerHTML=

        "🎯 Current Player: <strong>"+

        GameNight.players[GameNight.currentPlayer].name+

        "</strong>";

    },

    nextPlayer(){

        let current = GameNight.players[GameNight.currentPlayer];

        // Bonus turn

        if(current.bonusTurn){

            current.bonusTurn = false;

            this.update();

            return;

        }

        // Advance until we land on a player who is not frozen. A player
        // with skipTurns > 0 is skipped entirely for this pass (their
        // skipTurns is decremented by exactly one), rather than being
        // allowed to play immediately once it reaches 0 in the same pass.
        // safetyLimit guards against every player being frozen at once,
        // which would otherwise loop forever.
        let skippedThisPass = true;

        let safetyLimit = GameNight.players.length * 2;

        while(skippedThisPass && safetyLimit > 0){

            GameNight.currentPlayer++;

            if(GameNight.currentPlayer>=GameNight.players.length){

                GameNight.currentPlayer=0;

            }

            current = GameNight.players[GameNight.currentPlayer];

            if(current.skipTurns>0){

                current.skipTurns--;

                skippedThisPass = true;

            } else {

                skippedThisPass = false;

            }

            safetyLimit--;

        }

        this.update();

    },

    addPoints(points){

        const player = GameNight.players[GameNight.currentPlayer];

        if(player.doublePoints){

            points*=2;

            player.doublePoints=false;

        }

        player.score+=points;

        this.update();

    },

    subtractPoints(points){

        GameNight.players[GameNight.currentPlayer].score-=points;

        this.update();

    }

};
