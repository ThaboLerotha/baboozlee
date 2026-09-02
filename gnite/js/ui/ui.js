/*
=========================================
UI MANAGER
Version 0.5
=========================================
*/

const UI = {

    screens: {},

    initialize() {

        this.screens.home = document.getElementById("homeScreen");
        this.screens.setup = document.getElementById("setupScreen");
        this.screens.game = document.getElementById("gameScreen");

        // -----------------------------
        // HOME
        // -----------------------------

        const newGameBtn = document.getElementById("newGameBtn");

        if (newGameBtn) {

            newGameBtn.addEventListener("click", () => {

                this.show("setup");

                Players.buildInputs();

            });

        } else {

            console.error("newGameBtn not found");

        }

        // -----------------------------
        // PLAYER COUNT CHANGE
        // -----------------------------
        // Root cause of the "only 4 players ever get created" bug:
        // buildInputs() was only ever called once, when the Setup
        // screen first opens. Changing the dropdown afterward had no
        // listener wired to it at all, so the input boxes never
        // regenerated -- Players.createPlayers() then only ever found
        // the original 4 inputs still sitting in the DOM, regardless
        // of what the dropdown showed. Every downstream system (Score,
        // turn order, Contracts, History, GameEndManager) was already
        // fully dynamic; only this one listener was missing.

        const playerCountSelect = document.getElementById("playerCount");

        if (playerCountSelect) {

            playerCountSelect.addEventListener("change", () => {

                Players.buildInputs();

            });

        } else {

            console.error("playerCount select not found");

        }

        // -----------------------------
        // START GAME
        // -----------------------------

        const startGameBtn = document.getElementById("startGameBtn");

        if (startGameBtn) {

            startGameBtn.addEventListener("click", () => {

                Players.createPlayers();

                GameNight.currentPlayer = 0;

                if(typeof GameEndManager !== "undefined"){

                    GameEndManager.initialize();

                }

                if(typeof HistoryManager !== "undefined"){

                    HistoryManager.initialize();

                    HistoryManager.advanceTurn();

                    const firstPlayer = Players.getCurrentPlayer();

                    HistoryManager.record(

                        firstPlayer.id,

                        "Turn Started",

                        `${firstPlayer.name}'s turn began.`

                    );

                }

                if(typeof ContractManager !== "undefined"){

                    const contractsCheckbox = document.getElementById("contractsEnabled");

                    ContractManager.enabled = !!(contractsCheckbox && contractsCheckbox.checked);

                    ContractManager.startGame();

                }

                // Threat Engine game state is per-game, same as
                // Contracts/History/Timer above -- GameNight.initialize()
                // (window.onload, app.js) only runs once per page load,
                // never again on this click, so it can't be relied on to
                // reset this. This IS the actual "a new game begins"
                // boundary.
                if(typeof ThreatManager !== "undefined"){

                    ThreatManager.initialize();

                }

                QuestionManager.reset();

                Board.build();

                Score.draw();

                if(typeof InformationBoard !== "undefined"){

                    InformationBoard.render();

                }

                if (typeof Timer !== "undefined") {

                    Timer.initialize();

                }

                this.show("game");

            });

        } else {

            console.error("startGameBtn not found");

        }

        // -----------------------------
        // START TIMER
        // -----------------------------

        const startTimerBtn = document.getElementById("startTimerBtn");

        if (startTimerBtn) {

            startTimerBtn.addEventListener("click", () => {

                if (typeof Timer !== "undefined") {

                    Timer.start();

                } else {

                    console.error("Timer object not found");

                }

            });

        } else {

            console.error("startTimerBtn not found");

        }

        // -----------------------------
        // REVEAL
        // -----------------------------

        const revealBtn = document.getElementById("revealAnswerBtn");

        if (revealBtn) {

            revealBtn.addEventListener("click", () => {

                Popup.reveal();

            });

        } else {

            console.error("revealAnswerBtn not found");

        }

        // -----------------------------
        // CORRECT
        // -----------------------------

        const correctBtn = document.getElementById("correctBtn");

        if (correctBtn) {

            correctBtn.addEventListener("click", () => {

                Popup.correct();

            });

        } else {

            console.error("correctBtn not found");

        }

        // -----------------------------
        // WRONG
        // -----------------------------

        const wrongBtn = document.getElementById("wrongBtn");

        if (wrongBtn) {

            wrongBtn.addEventListener("click", () => {

                Popup.wrong();

            });

        } else {

            console.error("wrongBtn not found");

        }

        // -----------------------------
        // CONTINUE (pure Event Tiles only)
        // -----------------------------

        const continueBtn = document.getElementById("continueBtn");

        if (continueBtn) {

            continueBtn.addEventListener("click", () => {

                Popup.continueEvent();

            });

        } else {

            console.error("continueBtn not found");

        }

        // -----------------------------
        // PASS
        // -----------------------------

        const passBtn = document.getElementById("passBtn");

        if (passBtn) {

            passBtn.addEventListener("click", () => {

                Popup.pass();

            });

        } else {

            console.error("passBtn not found");

        }

        // -----------------------------
        // CLOSE
        // -----------------------------

        const closeBtn = document.getElementById("closeBtn");

        if (closeBtn) {

            closeBtn.addEventListener("click", () => {

                Popup.close();

            });

        } else {

            console.error("closeBtn not found");

        }

        // -----------------------------
        // HISTORY
        // -----------------------------

        const historyBtn = document.getElementById("historyBtn");

        if (historyBtn) {

            historyBtn.addEventListener("click", () => {

                if(typeof HistoryManager !== "undefined"){

                    HistoryManager.open();

                }

            });

        } else {

            console.error("historyBtn not found");

        }

        const closeHistoryBtn = document.getElementById("closeHistoryBtn");

        if (closeHistoryBtn) {

            closeHistoryBtn.addEventListener("click", () => {

                if(typeof HistoryManager !== "undefined"){

                    HistoryManager.close();

                }

            });

        } else {

            console.error("closeHistoryBtn not found");

        }

        // -----------------------------
        // END GAME
        // -----------------------------

        const endGameNewGameBtn = document.getElementById("endGameNewGameBtn");

        if (endGameNewGameBtn) {

            endGameNewGameBtn.addEventListener("click", () => {

                if(typeof GameEndManager !== "undefined"){

                    GameEndManager.newGameWithSamePlayers();

                }

            });

        } else {

            console.error("endGameNewGameBtn not found");

        }

        const endGameReturnHomeBtn = document.getElementById("endGameReturnHomeBtn");

        if (endGameReturnHomeBtn) {

            endGameReturnHomeBtn.addEventListener("click", () => {

                const win = document.getElementById("endGameWindow");

                if(win){

                    win.classList.add("hidden");

                }

                this.show("home");

            });

        } else {

            console.error("endGameReturnHomeBtn not found");

        }

        // -----------------------------
        // MUTE
        // -----------------------------

        const muteBtn = document.getElementById("muteBtn");

        if (muteBtn) {

            muteBtn.addEventListener("click", () => {

                GameNight.settings.soundEnabled =
                    !GameNight.settings.soundEnabled;

                muteBtn.innerHTML =
                    GameNight.settings.soundEnabled
                        ? "🔊 Sound ON"
                        : "🔇 Sound OFF";

            });

        } else {

            console.error("muteBtn not found");

        }

    },

    show(screen) {

        Object.values(this.screens).forEach(s => {

            s.classList.add("hidden");

        });

        this.screens[screen].classList.remove("hidden");

    }

};
