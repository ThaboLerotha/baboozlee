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
        // START GAME
        // -----------------------------

        const startGameBtn = document.getElementById("startGameBtn");

        if (startGameBtn) {

            startGameBtn.addEventListener("click", () => {

                Players.createPlayers();

                GameNight.currentPlayer = 0;

                if(typeof ContractManager !== "undefined"){

                    const contractsCheckbox = document.getElementById("contractsEnabled");

                    ContractManager.enabled = !!(contractsCheckbox && contractsCheckbox.checked);

                    ContractManager.startGame();

                }

                QuestionManager.reset();

                Board.build();

                Score.draw();

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
