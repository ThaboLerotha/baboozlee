/*
=========================================
POPUP SYSTEM
Version 1.1
=========================================
*/

const Popup = {

    currentTile: null,

    // Set in open(), read by reveal(): pure Event tiles have no question
    // to judge, so the Correct button never applies to them -- only
    // Pass or the (relabeled) "Continue" button, which reuses wrong()'s
    // existing no-points/fire-event/advance-turn behavior unchanged.
    isPureEventTile: false,

    open(tileID) {

        this.currentTile = tileID;

        const tile = GameNight.board.find(

            t => t.id === tileID

        );

        const hasRealEvent = tile.event && tile.event.type !== "none";

        this.isPureEventTile = tile.tileType === "event";

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

        const wrongBtn = document.getElementById("wrongBtn");

        wrongBtn.classList.add("hidden");

        // "Wrong" doesn't make sense as a label on a tile with no
        // question -- it's still the same wrong() logic underneath
        // (no points, fires the event, consumes the tile, advances the
        // turn), just relabeled for pure Event tiles.
        wrongBtn.textContent = this.isPureEventTile ? "Continue" : "Wrong";

        // Pass is now available the moment the popup opens, before
        // anything is revealed -- not gated behind reveal() anymore.
        const passBtn = document.getElementById("passBtn");

        if(Players.getCurrentPlayer().passesRemaining > 0){

            passBtn.classList.remove("hidden");

        } else {

            passBtn.classList.add("hidden");

        }

        // Pure Event tiles have no timer (Priority 2).

        const startBtn = document.getElementById("startTimerBtn");

        const timerDisplay = document.getElementById("timerDisplay");

        const showTimer = !this.isPureEventTile;

        if(startBtn){

            startBtn.classList.toggle("hidden", !showTimer);

        }

        if(timerDisplay){

            timerDisplay.classList.toggle("hidden", !showTimer);

        }

        // =====================================
        // EVENT TILE
        // =====================================

        if(this.isPureEventTile){

            document
                .getElementById("popupQuestion")
                .innerHTML = `

<h2>Tile ${tile.label}</h2>

<hr><br>

<h2>🎲 EVENT TILE</h2>

<p>No question on this tile.</p>

<hr>

<h3>Hidden Event</h3>

<p>❓ ???</p>

`;

            document
                .getElementById("popupAnswer")
                .innerHTML = `

<hr><br>

<h3>Hidden Event</h3>

<p><strong>${tile.event.name}</strong></p>

<p>${tile.event.description}</p>

`;

            return;

        }

        // =====================================
        // QUESTION / MIXED / STALE
        // =====================================

        const q = tile.question;

        const eventTeaser = hasRealEvent ? `

<hr>

<h3>Hidden Event</h3>

<p>❓ ???</p>

` : "";

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

${eventTeaser}

`;

            document
                .getElementById("popupAnswer")
                .innerHTML = `

<hr><br>

<p>Host may resolve this tile with Correct, Wrong, or Pass at their discretion.</p>

${hasRealEvent ? `

<hr>

<h3>Hidden Event</h3>

<p><strong>${tile.event.name}</strong></p>

<p>${tile.event.description}</p>

` : ""}

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

${eventTeaser}

`;

        let eventText = "";

        if(hasRealEvent){

            eventText = `

<hr>

<h3>Hidden Event</h3>

<p><strong>${tile.event.name}</strong></p>

<p>${tile.event.description}</p>

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

        // Correct doesn't apply to a tile with no question.

        if(!this.isPureEventTile){

            document
                .getElementById("correctBtn")
                .classList.remove("hidden");

        }

        document
            .getElementById("wrongBtn")
            .classList.remove("hidden");

        // Pass's visibility was already decided in open() and doesn't
        // change between open() and reveal() -- passesRemaining can't
        // change mid-popup, so it's intentionally left alone here.

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
    // being 0, though it's already hidden in that case (see open()).
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
