/*
=========================================
POPUP SYSTEM
Version 1.2
=========================================
*/

// Stale tiles have no real event (tile.event.type stays "none" on
// purpose -- see Board.convertTilesToStale()), so they can't pull a
// name/description from EventDatabase without pretending to be a real,
// targetable event. This local, display-only info object lets the
// popup render them with the same Name + Description visual pattern
// as everything else, without touching the actual event system.
const STALE_TILE_INFO = {

    name: "Stale Tile",

    description: "No special effects. This tile is only worth its points."

};

const Popup = {

    currentTile: null,

    // Set in open(), read by reveal(): pure Event tiles have no question
    // to judge, so Correct/Wrong never apply to them -- only Continue
    // (see continueEvent()) and, until reveal, Pass.
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

        document
            .getElementById("wrongBtn")
            .classList.add("hidden");

        document
            .getElementById("continueBtn")
            .classList.add("hidden");

        // Pass is available the moment the popup opens, before anything
        // is revealed -- but it expires once Reveal is clicked (see
        // reveal() below), since the gamble is choosing the tile, not
        // dodging what it turns out to contain.
        const passBtn = document.getElementById("passBtn");

        if(Players.getCurrentPlayer().passesRemaining > 0){

            passBtn.classList.remove("hidden");

        } else {

            passBtn.classList.add("hidden");

        }

        // Pure Event tiles have no timer.

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

        // Both real events and Stale tiles render through the same
        // Name + Description visual pattern -- Stale just pulls its
        // copy from the local STALE_TILE_INFO constant above instead
        // of EventDatabase, since it isn't a real, targetable event.
        let infoBlock = "";

        if(hasRealEvent){

            infoBlock = `

<hr>

<h3>Hidden Event</h3>

<p><strong>${tile.event.name}</strong></p>

<p>${tile.event.description}</p>

`;

        } else if(tile.isStale){

            infoBlock = `

<hr>

<h3>Tile Info</h3>

<p><strong>${STALE_TILE_INFO.name}</strong></p>

<p>${STALE_TILE_INFO.description}</p>

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

${infoBlock}

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

        // Pass expires the moment the tile's contents are revealed --
        // the gamble was choosing the tile, not what happens after.
        document
            .getElementById("passBtn")
            .classList.add("hidden");

        if(this.isPureEventTile){

            document
                .getElementById("continueBtn")
                .classList.remove("hidden");

        } else {

            document
                .getElementById("correctBtn")
                .classList.remove("hidden");

            document
                .getElementById("wrongBtn")
                .classList.remove("hidden");

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

    // Shared by correct()/wrong()/continueEvent()/pass(): every path
    // that resolves a tile fires its event, marks it used, and advances
    // the turn the same way. Only whether points are awarded differs.
    async _resolveTile(awardPoints) {

        const tile = GameNight.board.find(

            t => t.id === this.currentTile

        );

        if(awardPoints){

            Score.addPoints(tile.points);

        }

        await EventExecutor.execute(

            tile.event,

            tile

        );

        Board.markUsed(this.currentTile);

        Score.nextPlayer();

        this.close();

    },

    async correct() {

        await this._resolveTile(true);

    },

    async wrong() {

        await this._resolveTile(false);

    },

    // The dedicated resolve action for pure Event tiles. There was
    // never a question, so "Wrong" would be a misleading label and
    // function name -- this exists purely so the UI and the code both
    // honestly describe what happened: the tile had no question, and
    // its event is now firing.
    async continueEvent() {

        await this._resolveTile(false);

    },

    // A Pass awards no points, but the tile is still consumed and its
    // event (if any) still fires -- the only difference from wrong() is
    // the passesRemaining deduction. Guarded against passesRemaining
    // being 0, though the button is already hidden in that case.
    async pass() {

        const current = Players.getCurrentPlayer();

        if(current.passesRemaining <= 0){

            return;

        }

        current.passesRemaining -= 1;

        Score.update();

        await this._resolveTile(false);

    }

};
