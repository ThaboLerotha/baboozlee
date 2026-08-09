/*
=========================================
GAME END MANAGER
Version 1.0
=========================================

The single authority over determining and managing the end of the
game. No other manager independently decides that the game has ended
-- Board only reports that a tile was consumed (see
Board.markUsed()/markTilesUsed()), and this file decides what that
means: nothing yet, a winner, a tie requiring Sudden Death, or (later
milestones) Awards/Disses.

Statistics shown on the End Game screen are derived entirely from
HistoryManager.entries, not from separate counters -- every one of
those numbers is something History already records verbatim, so there
is nothing new to keep in sync.
*/

const GameEndManager = {

    gameEnded: false,

    suddenDeath: {

        active: false,

        tiedPlayers: [],

        scores: {},

        currentIndex: 0,

        roundAnswered: {}

    },

    initialize() {

        this.gameEnded = false;

        this.suddenDeath = {

            active: false,

            tiedPlayers: [],

            scores: {},

            currentIndex: 0,

            roundAnswered: {}

        };

    },

    // The ONLY thing Board calls. Board has no opinion beyond "a tile
    // just became used" -- everything past that line is decided here.
    checkBoardExhausted() {

        if(this.gameEnded || this.suddenDeath.active){

            return;

        }

        // "No unused playable tiles remain" -- not "every tile has
        // been opened by a player." A Stale tile becomes used the
        // instant it's opened, board-mutating events can consume tiles
        // in bulk, and a future system could still restore a used tile
        // back into play -- this check only ever looks at the board's
        // current state, never a fixed count.
        const boardExhausted =

            GameNight.board.length > 0 &&

            GameNight.board.every(tile => tile.used);

        if(boardExhausted){

            this.endGame();

        }

    },

    endGame() {

        if(this.gameEnded){

            return;

        }

        const maxScore = Math.max(

            ...GameNight.players.map(p => p.score)

        );

        const leaders = GameNight.players.filter(

            p => p.score === maxScore

        );

        if(leaders.length > 1){

            this.startSuddenDeath(leaders);

            return;

        }

        this.gameEnded = true;

        this.showEndGameWindow(leaders[0]);

    },

    // =========================================
    // Sudden Death
    // =========================================
    //
    // Only the tied players participate; everyone else is a spectator.
    // No board tiles, no events, no contract progress, no points --
    // purely alternating True/False questions from the existing
    // QuestionManager until one player is unambiguously ahead.

    startSuddenDeath(tiedPlayers) {

        this.suddenDeath.active = true;

        this.suddenDeath.tiedPlayers = tiedPlayers;

        this.suddenDeath.scores = {};

        tiedPlayers.forEach(p => {

            this.suddenDeath.scores[p.id] = 0;

        });

        this.suddenDeath.currentIndex = 0;

        this.suddenDeath.roundAnswered = {};

        if(typeof HistoryManager !== "undefined"){

            const names = tiedPlayers.map(p => p.name).join(", ");

            HistoryManager.record(

                null,

                "Sudden Death Started",

                `${names} are tied and entering Sudden Death.`

            );

        }

        if(typeof NotificationManager !== "undefined"){

            NotificationManager.notify(

                "⚔️ Sudden Death",

                tiedPlayers.map(p => p.name).join(", ") + " are tied!",

                "info"

            );

        }

        this.nextSuddenDeathQuestion();

    },

    nextSuddenDeathQuestion() {

        let q = QuestionManager.getQuestion();

        if(!q){

            // Sudden Death must always resolve a winner -- if the
            // shared pool is exhausted mid-tiebreak, reset it rather
            // than stall indefinitely. This is a deliberate exception
            // to "never reshuffle mid-game", justified because Sudden
            // Death is no longer the main game.
            QuestionManager.reset();

            q = QuestionManager.getQuestion();

        }

        this.suddenDeath.currentQuestion = q;

        this.renderSuddenDeath();

    },

    answerSuddenDeath(isCorrect) {

        const player = this.suddenDeath.tiedPlayers[

            this.suddenDeath.currentIndex

        ];

        if(isCorrect){

            this.suddenDeath.scores[player.id] += 1;

        }

        if(typeof HistoryManager !== "undefined"){

            HistoryManager.record(

                player.id,

                "Sudden Death Answer",

                `${player.name} answered ${isCorrect ? "correctly" : "incorrectly"} in Sudden Death.`

            );

        }

        this.suddenDeath.roundAnswered[player.id] = true;

        const allAnsweredThisRound = this.suddenDeath.tiedPlayers.every(

            p => this.suddenDeath.roundAnswered[p.id]

        );

        this.suddenDeath.currentIndex =

            (this.suddenDeath.currentIndex + 1) %

            this.suddenDeath.tiedPlayers.length;

        if(allAnsweredThisRound){

            const maxCorrect = Math.max(

                ...Object.values(this.suddenDeath.scores)

            );

            const leaders = this.suddenDeath.tiedPlayers.filter(

                p => this.suddenDeath.scores[p.id] === maxCorrect

            );

            if(leaders.length === 1){

                this.concludeSuddenDeath(leaders[0]);

                return;

            }

            this.suddenDeath.roundAnswered = {};

        }

        this.nextSuddenDeathQuestion();

    },

    concludeSuddenDeath(winner) {

        this.suddenDeath.active = false;

        if(typeof HistoryManager !== "undefined"){

            HistoryManager.record(

                winner.id,

                "Sudden Death Winner",

                `${winner.name} won Sudden Death.`

            );

        }

        const win = document.getElementById("suddenDeathWindow");

        if(win){

            win.classList.add("hidden");

        }

        this.gameEnded = true;

        this.showEndGameWindow(winner);

    },

    renderSuddenDeath() {

        const content = document.getElementById("suddenDeathContent");

        if(!content){

            return;

        }

        const player = this.suddenDeath.tiedPlayers[

            this.suddenDeath.currentIndex

        ];

        const q = this.suddenDeath.currentQuestion;

        const scoreLines = this.suddenDeath.tiedPlayers.map(p =>

            `<p>${p.name}: ${this.suddenDeath.scores[p.id]} correct</p>`

        ).join("");

        content.innerHTML = `

<h2>⚔️ Sudden Death</h2>

<p>${scoreLines}</p>

<hr>

<h3>${player.name}'s turn</h3>

<b>Category:</b> ${q.category}

<br><br>

${q.question}

<div id="suddenDeathButtons">

<button id="suddenDeathCorrectBtn">Correct</button>

<button id="suddenDeathWrongBtn">Wrong</button>

</div>

`;

        const win = document.getElementById("suddenDeathWindow");

        if(win){

            win.classList.remove("hidden");

        }

        const correctBtn = document.getElementById("suddenDeathCorrectBtn");

        const wrongBtn = document.getElementById("suddenDeathWrongBtn");

        if(correctBtn){

            correctBtn.addEventListener("click", () => {

                this.answerSuddenDeath(true);

            });

        }

        if(wrongBtn){

            wrongBtn.addEventListener("click", () => {

                this.answerSuddenDeath(false);

            });

        }

    },

    // =========================================
    // Statistics -- derived entirely from History
    // =========================================

    computeStats(playerId) {

        const entries = (typeof HistoryManager !== "undefined")

            ? HistoryManager.entries.filter(e => e.playerId === playerId)

            : [];

        const correct = entries.filter(e => e.title === "Answered Correctly").length;

        const wrong = entries.filter(e => e.title === "Answered Incorrectly").length;

        const answered = correct + wrong;

        const accuracy = answered > 0

            ? Math.round((correct / answered) * 100)

            : null;

        return {

            questionsAnswered: answered,

            correct: correct,

            wrong: wrong,

            accuracy: accuracy,

            eventsTriggered: entries.filter(e => e.title === "Event Activated").length,

            contractsCompleted: entries.filter(e => e.title === "Contract Completed").length,

            passesUsed: entries.filter(e => e.title === "Pass Used").length

        };

    },

    // =========================================
    // End Game window
    // =========================================

    showEndGameWindow(winner) {

        const content = document.getElementById("endGameContent");

        if(!content){

            return;

        }

        const ranked = GameNight.players

            .slice()

            .sort((a, b) => b.score - a.score);

        const scoreboardRows = ranked.map((p, index) =>

            `<tr><td>${index + 1}</td><td>${p.name}</td><td>${p.score}</td></tr>`

        ).join("");

        const summaryRows = ranked.map(p => {

            const stats = this.computeStats(p.id);

            const accuracyText = stats.accuracy === null

                ? "--"

                : stats.accuracy + "%";

            return `

<tr>

<td>${p.name}</td>

<td>${stats.questionsAnswered}</td>

<td>${stats.correct}</td>

<td>${stats.wrong}</td>

<td>${accuracyText}</td>

<td>${stats.eventsTriggered}</td>

<td>${stats.contractsCompleted}</td>

<td>${stats.passesUsed}</td>

</tr>

`;

        }).join("");

        content.innerHTML = `

<h2>🏆 ${winner.name} Wins!</h2>

<p>Final Score: ${winner.score}</p>

<hr>

<h3>Final Scoreboard</h3>

<table class="endGameTable">

<tr><th>Rank</th><th>Player</th><th>Score</th></tr>

${scoreboardRows}

</table>

<hr>

<h3>Game Summary</h3>

<table class="endGameTable">

<tr>

<th>Player</th>

<th>Questions Answered</th>

<th>Correct</th>

<th>Wrong</th>

<th>Accuracy</th>

<th>Events Triggered</th>

<th>Contracts Completed</th>

<th>Passes Used</th>

</tr>

${summaryRows}

</table>

`;

        const win = document.getElementById("endGameWindow");

        if(win){

            win.classList.remove("hidden");

        }

    },

    // =========================================
    // New Game / Return Home
    // =========================================
    //
    // "New Game" replays immediately with the same players, skipping
    // Home/Setup entirely. "Return Home" goes back to the actual Home
    // screen so different players/settings can be configured -- that
    // path already fully re-initializes everything via the existing
    // Start Game flow, so nothing extra is needed here beyond hiding
    // this window and switching screens.

    newGameWithSamePlayers() {

        const win = document.getElementById("endGameWindow");

        if(win){

            win.classList.add("hidden");

        }

        GameNight.players.forEach(player => {

            player.score = 0;

            player.frozen = false;

            player.skipTurns = 0;

            player.bonusTurn = false;

            player.shield = false;

            player.doublePoints = false;

            player.passesRemaining = 2;

        });

        GameNight.currentPlayer = 0;

        this.initialize();

        if(typeof HistoryManager !== "undefined"){

            HistoryManager.initialize();

            HistoryManager.advanceTurn();

            const firstPlayer = GameNight.players[0];

            HistoryManager.record(

                firstPlayer.id,

                "Turn Started",

                `${firstPlayer.name}'s turn began.`

            );

        }

        if(typeof ContractManager !== "undefined"){

            ContractManager.startGame();

        }

        QuestionManager.reset();

        Board.build();

        Score.draw();

        if(typeof InformationBoard !== "undefined"){

            InformationBoard.render();

        }

        if(typeof Timer !== "undefined"){

            Timer.initialize();

        }

        if(typeof UI !== "undefined"){

            UI.show("game");

        }

    }

};
