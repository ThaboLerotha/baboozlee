/*
=========================================
GAME NIGHT ENGINE
Version 0.5
=========================================
*/

const GameNight = {

    settings: {

        rows: 5,

        columns: 6,

        values: [100, 200, 300, 400, 500, 600],

        timerSeconds: 5,

        soundEnabled: true

    },

    players: [],

    currentPlayer: 0,

    board: [],

    initialize() {

      QuestionManager.initialize();

EventManager.initialize();

if(typeof ContractManager !== "undefined"){

    ContractManager.initialize();

}

UI.initialize();

console.log("Game Night Engine Loaded");

    }

};

window.onload = () => {

    GameNight.initialize();

};
