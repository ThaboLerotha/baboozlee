/*
=========================================
POPUP SYSTEM
Version 1.0
=========================================
*/

const Popup = {

    currentTile: null,

    open(tileID) {

        this.currentTile = tileID;

        const tile = GameNight.board.find(

            t => t.id === tileID

        );

        // Reset timer

        if(typeof Timer !== "undefined"){

            Timer.stop();

            Timer.remaining = GameNight.settings.timerSeconds;

            Timer.updateDisplay();

        }

        // Show popup

        document
            .getElementById("popup")
            .classList.remove("hidden");

        // Hide answer

        document
            .getElementById("popupAnswer")
            .classList.add("hidden");

        // Reset buttons

        document
            .getElementById("revealAnswerBtn")
            .classList.remove("hidden");

        document
            .getElementById("correctBtn")
            .classList.add("hidden");

        document
            .getElementById("wrongBtn")
            .classList.add("hidden");

        document
            .getElementById("passBtn")
            .classList.add("hidden");

        const startBtn = document.getElementById("startTimerBtn");

        if(startBtn){

            startBtn.classList.remove("hidden");

        }

        // =====================================
        // EVENT TILE
        // =====================================

        if(tile.tileType === "event"){

            document
                .getElementById("popupQuestion")
                .innerHTML = `

<h2>Tile ${tile.label}</h2>

<h3>⭐ ${tile.points} Points</h3>

<hr><br>

<h2>🎲 EVENT TILE</h2>

<p>No question on this tile.</p>

<p>Reveal the event to continue.</p>

`;

            document
                .getElementById("popupAnswer")
                .innerHTML = `

<hr><br>

<h3>Event</h3>

<p>

<strong>

${tile.event.type}

</strong>

</p>

`;

            return;

        }

        // =====================================
        // QUESTION / MIXED / STALE
        // =====================================

        const q = tile.question;

        // The question pool can legitimately run out before the board
        // finishes filling (see QuestionManager.getQuestion()). Rather
        // than crash on q.category below, show a clear fallback so the
        // host can still resolve the tile manually.
        if(!q){

            document
                .getElementById("popupQuestion")
                .innerHTML = `

<h2>Tile ${tile.label}</h2>

<h3>⭐ ${tile.points} Points</h3>

<hr><br>

<p>⚠️ No question available for this tile -- the question pool ran out.</p>

`;

            document
                .getElementById("popupAnswer")
                .innerHTML = `

<hr><br>

<p>Host may resolve this tile with Correct, Wrong, or Pass at their discretion.</p>

`;

            return;

        }

        document
            .getElementById("popupQuestion")
            .innerHTML = `

<h2>Tile ${tile.label}</h2>

<h3>⭐ ${tile.points} Points</h3>

<hr><br>

<b>Category:</b>

${q.category}

<br><br>

${q.question}

`;

        let eventText = "";

        if(tile.tileType === "mixed"){

            eventText = `

<hr>

<h3>Hidden Event</h3>

<p>

An event will activate after this tile.

</p>

`;

        }

        if(tile.isStale){

            eventText = `

<hr>

<p>

🍃 This is a Stale Tile.

No special effects.

</p>

`;

        }

        document
            .getElementById("popupAnswer")
            .innerHTML = `

<hr><br>

<h3>Answer</h3>

<p>

<strong>

${q.answer ? "TRUE" : "FALSE"}

</strong>

</p>

<br>

<h3>Explanation</h3>

<p>

${q.explanation || "No explanation available."}

</p>

${eventText}

`;

    },

    reveal() {

        if(typeof Timer !== "undefined"){

            Timer.stop();

        }

        document
            .getElementById("popupAnswer")
            .classList.remove("hidden");

        document
            .getElementById("revealAnswerBtn")
            .classList.add("hidden");

        const startBtn = document.getElementById("startTimerBtn");

        if(startBtn){

            startBtn.classList.add("hidden");

        }

        document
            .getElementById("correctBtn")
            .classList.remove("hidden");

        document
            .getElementById("wrongBtn")
            .classList.remove("hidden");

        const passBtn = document.getElementById("passBtn");

        if(Players.getCurrentPlayer().passesRemaining > 0){

            passBtn.classList.remove("hidden");

        } else {

            passBtn.classList.add("hidden");

        }

    },

    close() {

        if(typeof Timer !== "undefined"){

            Timer.stop();

        }

        document
            .getElementById("popup")
            .classList.add("hidden");

    },

    async correct() {

        const tile = GameNight.board.find(

            t => t.id === this.currentTile

        );

        Score.addPoints(tile.points);

        await EventExecutor.execute(

            tile.event,

            tile

        );

        Board.markUsed(this.currentTile);

        Score.nextPlayer();

        this.close();

    },

    async wrong() {

        const tile = GameNight.board.find(

            t => t.id === this.currentTile

        );

        await EventExecutor.execute(

            tile.event,

            tile

        );

        Board.markUsed(this.currentTile);

        Score.nextPlayer();

        this.close();

    },

    // A Pass awards no points, but the tile is still consumed and its
    // event (if any) still fires -- the only difference from wrong() is
    // the passesRemaining deduction. Guarded against passesRemaining
    // being 0, though reveal() already hides the button in that case.
    async pass() {

        const current = Players.getCurrentPlayer();

        if(current.passesRemaining <= 0){

            return;

        }

        current.passesRemaining -= 1;

        Score.update();

        const tile = GameNight.board.find(

            t => t.id === this.currentTile

        );

        await EventExecutor.execute(

            tile.event,

            tile

        );

        Board.markUsed(this.currentTile);

        Score.nextPlayer();

        this.close();

    }

};
