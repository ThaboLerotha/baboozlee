/*
=========================================
EVENT DATABASE
Version 2.0
=========================================
*/

const EventDatabase = [

    // =====================================
    // SELF EVENTS
    // =====================================

    {

        id: 1,

        key: "BOMB_SELF",

        category: "Harmful",

        name: "Bomb (Self)",

        description: "You lose 200 points.",

        type: "bomb",

        target: "self",

        copies: 2

    },

    {

        id: 2,

        key: "DOUBLE_POINTS",

        category: "Beneficial",

        name: "Double Points",

        description: "Your next points earned are doubled.",

        type: "doublePoints",

        target: "self",

        copies: 3

    },

    {

        id: 3,

        key: "BONUS_TURN",

        category: "Beneficial",

        name: "Bonus Turn",

        description: "You get another turn immediately.",

        type: "bonusTurn",

        target: "self",

        copies: 2

    },

    {

        id: 4,

        key: "SHIELD",

        category: "Beneficial",

        name: "Shield",

        description: "Blocks the next negative effect used against you.",

        type: "shield",

        target: "self",

        copies: 2

    },

    // =====================================
    // TARGET EVENTS
    // =====================================

    {

        id: 5,

        key: "BOMB_OTHER",

        category: "Harmful",

        name: "Bomb Other",

        description: "Choose another player. They lose 200 points.",

        type: "bomb",

        target: "other",

        copies: 2

    },

    {

        id: 6,

        key: "FREEZE",

        category: "Harmful",

        name: "Freeze",

        description: "Choose another player. They skip their next turn.",

        type: "freeze",

        target: "other",

        copies: 2

    },

    {

        id: 7,

        key: "GIFT",

        category: "Beneficial",

        name: "Gift",

        description: "Choose another player. Give them 100 of your points.",

        type: "gift",

        target: "other",

        copies: 2

    },

    {

        id: 8,

        key: "STEAL",

        category: "Harmful",

        name: "Steal",

        description: "Choose another player. Steal 150 of their points.",

        type: "steal",

        target: "other",

        copies: 2

    },

    // =====================================
    // BOARD EVENTS
    // =====================================

    {

        id: 9,

        key: "JACKPOT",

        category: "Beneficial",

        name: "Jackpot",

        description: "Removes a few of the board's lowest-value tiles.",

        type: "jackpot",

        target: "board",

        copies: 1

    },

    {

        id: 10,

        key: "BAD_JACKPOT",

        category: "Harmful",

        name: "Bad Jackpot",

        description: "Turns a few hidden events into ordinary tiles.",

        type: "badJackpot",

        target: "board",

        copies: 1

    },

    {

        id: 11,

        key: "CHAOS",

        category: "Neutral",

        name: "Chaos",

        description: "Randomly redistributes hidden events on the board.",

        type: "chaos",

        target: "board",

        copies: 1

    },

    {

        id: 12,

        key: "CLEANUP",

        category: "Neutral",

        name: "Cleanup",

        description: "Removes one hidden event from the board.",

        type: "cleanup",

        target: "board",

        copies: 1

    },

    {

        id: 13,

        key: "METEOR",

        category: "Harmful",

        name: "Meteor",

        description: "Destroys roughly 30% of the remaining board.",

        type: "meteor",

        target: "board",

        copies: 1

    },

    // =====================================
    // GLOBAL EVENTS
    // =====================================

    {

        id: 14,

        key: "TIME_WARP",

        category: "Harmful",

        name: "Time Warp",

        description: "Cuts the current timer in half.",

        type: "timeWarp",

        target: "global",

        copies: 1

    },

    {

        id: 15,

        key: "NO_ESCAPE",

        category: "Harmful",

        name: "No Escape",

        description: "Removes every player's shield.",

        type: "noEscape",

        target: "global",

        copies: 1

    }

];
