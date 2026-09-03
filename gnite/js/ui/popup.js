/*
=========================================
POPUP SYSTEM
Version 1.2
=========================================
*/

const Popup = {

    currentTile: null,

    // Set in open(), read by reveal(): tiles with nothing to answer
    // (pure Event tiles and true Stale tiles) never show Correct/Wrong
    // -- only Continue (see continueEvent()) and, until reveal, Pass
    // (Stale tiles skip Pass too -- see open()).
    noQuestionTile: false,

    isTrueStaleTile: false,

    open(tileID) {

        this.currentTile = tileID;

        const tile = GameNight.board.find(

            t => t.id === tileID

        );

        const hasRealEvent = tile.event && tile.event.type !== "none";

        this.isTrueStaleTile = !!tile.isStale;

        this.noQuestionTile = tile.tileType === "event" || this.isTrueStaleTile;

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

        if(!this.isTrueStaleTile && Players.getCurrentPlayer().passesRemaining > 0){

            passBtn.classList.remove("hidden");

        } else {

            passBtn.classList.add("hidden");

        }

        // Pure Event tiles and true Stale tiles have no timer.

        const startBtn = document.getElementById("startTimerBtn");

        const timerDisplay = document.getElementById("timerDisplay");

        const showTimer = !this.noQuestionTile;

        if(startBtn){

            startBtn.classList.toggle("hidden", !showTimer);

        }

        if(timerDisplay){

            timerDisplay.classList.toggle("hidden", !showTimer);

        }

        // =====================================
        // TRUE STALE TILE
        // =====================================
        // No question, no event, no timer, no answer, no explanation --
        // just an empty tile. No Reveal step either, since there's
        // nothing to reveal; Continue is available immediately.

        if(this.isTrueStaleTile){

            document
                .getElementById("revealAnswerBtn")
                .classList.add("hidden");

            document
                .getElementById("continueBtn")
                .classList.remove("hidden");

            document
                .getElementById("popupQuestion")
                .innerHTML = `

<h2>Tile ${tile.label}</h2>

<hr><br>

<h2>🌫️ STALE TILE</h2>

<p>This tile is empty. Nothing happens here.</p>

`;

            document
                .getElementById("popupAnswer")
                .innerHTML = "";

            return;

        }

        // =====================================
        // EVENT TILE
        // =====================================

        if(tile.tileType === "event"){

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

        // Real events render through the Name + Description visual
        // pattern. True Stale tiles never reach this section at all --
        // see the dedicated TRUE STALE TILE branch above, which returns
        // early.
        let infoBlock = "";

        if(hasRealEvent){

            infoBlock = `

<hr>

<h3>Hidden Event</h3>

<p><strong>${tile.event.name}</strong></p>

<p>${tile.event.description}</p>

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

        if(this.noQuestionTile){

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
    // `outcome` is passed through to ContractManager's hook untouched --
    // popup.js doesn't need to know what, if anything, a contract does
    // with it.
    async _resolveTile(awardPoints, outcome) {

        const tile = GameNight.board.find(

            t => t.id === this.currentTile

        );

        const resolvingPlayer = Players.getCurrentPlayer();

        // Captured before Score.addPoints() runs, because addPoints()
        // reads AND clears doublePoints internally -- and because a
        // contract reward can be awarded synchronously as a side
        // effect of this same call (via ContractManager's onScoreChange
        // hook), which would contaminate a simple before/after score
        // delta. Computing the tile's own contribution directly avoids
        // double-counting points that already get their own separate
        // "Contract Completed" entry.
        const wasDoubled = resolvingPlayer.doublePoints;

        if(awardPoints){

            Score.addPoints(tile.points);

        }

        if(typeof HistoryManager !== "undefined"){

            if(outcome === "correct"){

                const tileContribution = wasDoubled ? tile.points * 2 : tile.points;

                HistoryManager.record(

                    resolvingPlayer.id,

                    "Answered Correctly",

                    `${resolvingPlayer.name} answered correctly (+${tileContribution} points).`

                );

            } else if(outcome === "wrong"){

                HistoryManager.record(

                    resolvingPlayer.id,

                    "Answered Incorrectly",

                    `${resolvingPlayer.name} answered incorrectly.`

                );

            } else if(outcome === "pass"){

                HistoryManager.record(

                    resolvingPlayer.id,

                    "Pass Used",

                    `${resolvingPlayer.name} used a Pass.`

                );

            }

            // outcome === "continue" (pure Event tile) intentionally
            // records nothing here -- there was no question to answer.
            // What actually happens is covered by the Event Activated/
            // Event Outcome entries EventExecutor records below.

        }

        await EventExecutor.execute(

            tile.event,

            tile

        );

        // Some events change visible state right before the tile
        // resolves (Time Warp halves the on-screen timer, for
        // example). Without a yield here, the popup can close and hide
        // that change in the same synchronous turn, before the browser
        // ever paints it -- so the DOM value is correct, but the host
        // never actually sees it. Two animation frames reliably
        // guarantees at least one paint has happened in between, and
        // costs about 1/30th of a second -- imperceptible, but enough.
        await new Promise(resolve => {

            if(typeof requestAnimationFrame !== "undefined"){

                requestAnimationFrame(() => requestAnimationFrame(resolve));

            } else {

                resolve();

            }

        });

        if(typeof ContractManager !== "undefined"){

            ContractManager.onTileResolved({

                playerId: resolvingPlayer.id,

                tileId: tile.id,

                outcome: outcome

            });

            if(outcome === "pass"){

                await ContractManager.checkTrigger("FIRST_PASS_USED", resolvingPlayer.id);

            }

            if(tile.tileType === "mixed"){

                await ContractManager.checkTrigger("FIRST_MIXED_TILE_OPENED", resolvingPlayer.id);

            }

        }

        Board.markUsed(this.currentTile);

        Score.nextPlayer();

        this.close();

    },

    async correct() {

        await this._resolveTile(true, "correct");

    },

    async wrong() {

        await this._resolveTile(false, "wrong");

    },

    // The dedicated resolve action for pure Event tiles. There was
    // never a question, so "Wrong" would be a misleading label and
    // function name -- this exists purely so the UI and the code both
    // honestly describe what happened: the tile had no question, and
    // its event is now firing.
    async continueEvent() {

        await this._resolveTile(false, "continue");

    },

    // A Pass awards no points, but the tile is still consumed and its
    // event (if any) still fires -- the only difference from wrong() is
    // the passesRemaining deduction. Guarded against passesRemaining
    // being 0, though the button is already hidden in that case.
    //
    // Threat Engine (Step 6): the harmful event itself still fully
    // resolves via _resolveTile() below, exactly as it does for
    // wrong() -- Pass does not undo it, and its normal outcome is
    // still recorded (see _resolveTile's own "pass" branch). What Pass
    // changes is specifically that the Threat punishment roll must not
    // happen for this one resolution. EventExecutor.execute() has no
    // `outcome` parameter, and _resolveTile() is shared by
    // correct/wrong/pass/continueEvent, so neither can be taught "this
    // is a Pass" without a change reaching outside this file. Instead,
    // ThreatManager.registerHarmfulEvent is temporarily pointed at a
    // no-op for the single _resolveTile() call below -- every Harmful
    // handler inside EventExecutor still calls it exactly as it always
    // does (the existing Threat Engine API is fully reused, completely
    // unmodified), it simply resolves to "no punishment" while a Pass
    // is in flight. Always restored in `finally`, so a mid-resolution
    // error can never leave the Threat Engine permanently disabled.
    //
    // Step 6 correction: nothing in ui.js disables the Pass button
    // while a resolution is in flight (checked -- no such guard exists
    // anywhere), and _resolveTile() genuinely yields at real await
    // points (a targeted event's promptTarget(), then a deliberate
    // double requestAnimationFrame). A second pass() invocation
    // arriving during that window would swap
    // ThreatManager.registerHarmfulEvent a second time, and whichever
    // call's `finally` runs first would restore the OTHER call's
    // in-flight no-op instead of the real function, permanently
    // disabling Threat registration for the rest of the game. This
    // guard makes that impossible: a second pass() call arriving while
    // one is already in flight returns immediately, before touching
    // passesRemaining or the swap at all, so only one swap/restore
    // cycle can ever be active at a time. This also incidentally fixes
    // the same double-resolution risk (double passesRemaining
    // deduction, double tile resolution) the race would otherwise
    // cause independent of the Threat Engine -- but the fix is scoped
    // to pass() only, not the shared _resolveTile() other actions use,
    // since only Pass's concurrency was in scope for this correction.
    _passInProgress: false,

    async pass() {

        if(this._passInProgress){

            return;

        }

        const current = Players.getCurrentPlayer();

        if(current.passesRemaining <= 0){

            return;

        }

        this._passInProgress = true;

        current.passesRemaining -= 1;

        Score.update();

        let originalRegisterHarmfulEvent = null;

        if(typeof ThreatManager !== "undefined"){

            originalRegisterHarmfulEvent = ThreatManager.registerHarmfulEvent;

            ThreatManager.registerHarmfulEvent = function(){

                return { punished: false, reason: "pass" };

            };

        }

        try {

            await this._resolveTile(false, "pass");

        } finally {

            if(originalRegisterHarmfulEvent){

                ThreatManager.registerHarmfulEvent = originalRegisterHarmfulEvent;

            }

            this._passInProgress = false;

        }

    }

};
