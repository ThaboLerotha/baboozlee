/*
=========================================
TIMER SYSTEM
Version 0.5
=========================================
*/

const Timer = {

    remaining: 0,

    interval: null,

    running: false,

    initialize() {

        this.updateDisplay();

    },

    start() {

        if (this.running) return;

        this.running = true;

        this.remaining = GameNight.settings.timerSeconds;

        this.updateDisplay();

        this.interval = setInterval(() => {

            this.remaining--;

            this.updateDisplay();

            if (this.remaining <= 0) {

                this.stop();

                this.timeUp();

            }

        },1000);

    },

    stop() {

        clearInterval(this.interval);

        this.running = false;

    },

    timeUp() {

        document.getElementById("timerDisplay").innerHTML = "TIME'S UP!";

        if(GameNight.settings.soundEnabled){

            this.beep();

        }

    },

    updateDisplay(){

        const timer = document.getElementById("timerDisplay");

        if(timer){

            timer.innerHTML = this.remaining;

        }

    },

    beep(){

        const audio = new Audio(

            "sounds/beep.mp3"

        );

        audio.play();

    }

};
