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

        type: "bomb",

        target: "self",

        copies: 2

    },

    {

        id: 2,

        key: "DOUBLE_POINTS",

        type: "doublePoints",

        target: "self",

        copies: 3

    },

    {

        id: 3,

        key: "BONUS_TURN",

        type: "bonusTurn",

        target: "self",

        copies: 2

    },

    {

        id: 4,

        key: "SHIELD",

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

        type: "bomb",

        target: "other",

        copies: 2

    },

    {

        id: 6,

        key: "FREEZE",

        type: "freeze",

        target: "other",

        copies: 2

    },

    {

        id: 7,

        key: "GIFT",

        type: "gift",

        target: "other",

        copies: 2

    },

    {

        id: 8,

        key: "STEAL",

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

        type: "jackpot",

        target: "board",

        copies: 1

    },

    {

        id: 10,

        key: "BAD_JACKPOT",

        type: "badJackpot",

        target: "board",

        copies: 1

    },

    {

        id: 11,

        key: "CHAOS",

        type: "chaos",

        target: "board",

        copies: 1

    },

    {

        id: 12,

        key: "CLEANUP",

        type: "cleanup",

        target: "board",

        copies: 1

    },

    // =====================================
    // GLOBAL EVENTS
    // =====================================

    {

        id: 13,

        key: "TIME_WARP",

        type: "timeWarp",

        target: "global",

        copies: 1

    },

    {

        id: 14,

        key: "NO_ESCAPE",

        type: "noEscape",

        target: "global",

        copies: 1

    }

];
