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

    // Treasure Chests, Step 1: authoritative in-memory state model
    // only -- no board placement, no discovery, no reward generation,
    // no asset transfer, all separate later steps. A single object
    // (never a list) means "at most one Reward Chest" is structurally
    // guaranteed, not just a rule someone has to remember to follow;
    // null vs. a single object does the same for the Legacy Chest.
    // Read by informationBoard.js; nothing else sets or reads these
    // yet.
    rewardChest: null,

    legacyChest: null,

    initialize() {

      QuestionManager.initialize();

EventManager.initialize();

if(typeof ContractManager !== "undefined"){

    ContractManager.initialize();

}

if(typeof HistoryManager !== "undefined"){

    HistoryManager.initialize();

}

if(typeof NotificationManager !== "undefined"){

    NotificationManager.initialize();

}

if(typeof GameEndManager !== "undefined"){

    GameEndManager.initialize();

}

UI.initialize();

console.log("Game Night Engine Loaded");

    },

    // Treasure Chests, Step 1: the chest-state reset point. Called
    // from the same two real "new game begins" boundaries
    // ThreatManager.initialize() already uses (ui.js's Start Game
    // handler, gameEndManager.js's newGameWithSamePlayers()) --
    // GameNight.initialize() above only ever runs once, at
    // window.onload, so it can't be relied on for a per-game reset
    // any more than it could for ThreatManager (see DEVLOG Entry 20).
    // Treasure Chests, Step 4: the reward bundle. Generated once here,
    // at the same reset point Step 1 already established (not
    // regenerated every time the chest popup opens -- Popup.js only
    // ever reads GameNight.rewardChest.contents, it never writes to
    // it). Values are modest, well within the existing game economy
    // (normal tile points already range 100-600 -- see
    // game/board.js's pointPool) rather than a new, separate scale.
    // Uses the existing player resource fields directly (score,
    // shield, passesRemaining) -- no new resource system.
    generateRewardChestContents() {

        return {

            points: 300,

            shield: 1,

            passes: 1

        };

    },

    resetChests() {

        this.rewardChest = {

            found: false,

            contents: this.generateRewardChestContents()

        };

        this.legacyChest = null;

    }

};

window.onload = () => {

    GameNight.initialize();

};
