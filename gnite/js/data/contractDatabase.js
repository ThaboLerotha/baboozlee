/*
=========================================
CONTRACT DATABASE
Version 2.0 (First 25 production contracts)
=========================================

Each entry is a contract DEFINITION -- a template. ContractManager
copies the relevant fields onto a per-player INSTANCE when a contract
is assigned (see ContractManager._assign()), so editing a definition
here never affects a contract a player is already partway through.

Schema:

    id          unique number
    key         unique string identifier
    name        short human-readable name
    description short human-readable explanation of what's required
    difficulty  "Easy" | "Medium" | "Hard" -- organizational only,
                not read by ContractManager
    category    "starting"  -> assigned to every player at game start
                "optional"  -> available to be offered later in-game
    type        which registered handler (see contractTypes.js)
                evaluates this contract's progress
    target      generic numeric goal the handler checks progress
                against
    config      type-specific parameters the handler needs (e.g. which
                outcome to count, a minimum point threshold). Shape
                depends entirely on `type` -- ContractManager itself
                never reads this field, only the handler does
    reward      { points: N } awarded on completion

Design note: every target here is calibrated to be realistic within a
normal-sized game (the game supports 2-20 players sharing one 30-tile
board, so per-player turn count varies enormously -- see
contractTypes.js's header comment for the full reasoning). None of
these depend on a specific board event occurring, and none require
detecting that the game has ended.
*/

const ContractDatabase = [

    // =====================================
    // EASY (10)
    // =====================================

    {

        id: 1,

        key: "WARM_UP",

        name: "Warm Up",

        description: "Answer 1 question correctly.",

        difficulty: "Easy",

        category: "starting",

        type: "countOutcome",

        target: 1,

        config: { outcome: "correct" },

        reward: { points: 100 }

    },

    {

        id: 2,

        key: "PLAY_IT_SAFE",

        name: "Play It Safe",

        description: "Use a Pass at least once.",

        difficulty: "Easy",

        category: "starting",

        type: "countOutcome",

        target: 1,

        config: { outcome: "pass" },

        reward: { points: 100 }

    },

    {

        id: 3,

        key: "ON_THE_BOARD",

        name: "On The Board",

        description: "Complete your first turn.",

        difficulty: "Easy",

        category: "starting",

        type: "turnsPlayed",

        target: 1,

        config: {},

        reward: { points: 50 }

    },

    {

        id: 4,

        key: "GOOD_START",

        name: "Off to a Good Start",

        description: "Reach a total score of 150 points.",

        difficulty: "Easy",

        category: "starting",

        type: "scoreThreshold",

        target: 150,

        config: {},

        reward: { points: 100 }

    },

    {

        id: 5,

        key: "SOLID_HIT",

        name: "Solid Hit",

        description: "Earn 300 or more points from a single tile.",

        difficulty: "Easy",

        category: "starting",

        type: "singleTileScore",

        target: 300,

        config: {},

        reward: { points: 150 }

    },

    {

        id: 6,

        key: "TWO_FOR_TWO",

        name: "Two for Two",

        description: "Answer 2 questions correctly.",

        difficulty: "Easy",

        category: "starting",

        type: "countOutcome",

        target: 2,

        config: { outcome: "correct" },

        reward: { points: 150 }

    },

    {

        id: 7,

        key: "SMALL_STREAK",

        name: "Small Streak",

        description: "Answer 2 questions correctly in a row.",

        difficulty: "Easy",

        category: "starting",

        type: "correctStreak",

        target: 2,

        config: {},

        reward: { points: 150 }

    },

    {

        id: 8,

        key: "GETTING_COMFORTABLE",

        name: "Getting Comfortable",

        description: "Complete 2 turns.",

        difficulty: "Easy",

        category: "starting",

        type: "turnsPlayed",

        target: 2,

        config: {},

        reward: { points: 100 }

    },

    {

        id: 9,

        key: "CAREFUL_PLAYER",

        name: "Careful Player",

        description: "Use both of your Passes.",

        difficulty: "Easy",

        category: "optional",

        type: "countOutcome",

        target: 2,

        config: { outcome: "pass" },

        reward: { points: 150 }

    },

    {

        id: 10,

        key: "MODEST_GAINS",

        name: "Modest Gains",

        description: "Reach a total score of 300 points.",

        difficulty: "Easy",

        category: "optional",

        type: "scoreThreshold",

        target: 300,

        config: {},

        reward: { points: 150 }

    },

    // =====================================
    // MEDIUM (10)
    // =====================================

    {

        id: 11,

        key: "SHARP_MIND",

        name: "Sharp Mind",

        description: "Answer 3 questions correctly.",

        difficulty: "Medium",

        category: "starting",

        type: "countOutcome",

        target: 3,

        config: { outcome: "correct" },

        reward: { points: 200 }

    },

    {

        id: 12,

        key: "BIG_HIT",

        name: "Big Hit",

        description: "Earn 400 or more points from a single tile.",

        difficulty: "Medium",

        category: "optional",

        type: "singleTileScore",

        target: 400,

        config: {},

        reward: { points: 200 }

    },

    {

        id: 13,

        key: "ON_FIRE",

        name: "On Fire",

        description: "Answer 3 questions correctly in a row.",

        difficulty: "Medium",

        category: "optional",

        type: "correctStreak",

        target: 3,

        config: {},

        reward: { points: 250 }

    },

    {

        id: 14,

        key: "CLIMBING_HIGH",

        name: "Climbing High",

        description: "Reach a total score of 500 points.",

        difficulty: "Medium",

        category: "optional",

        type: "scoreThreshold",

        target: 500,

        config: {},

        reward: { points: 250 }

    },

    {

        id: 15,

        key: "STEADY_HAND",

        name: "Steady Hand",

        description: "Complete 3 turns.",

        difficulty: "Medium",

        category: "starting",

        type: "turnsPlayed",

        target: 3,

        config: {},

        reward: { points: 150 }

    },

    {

        id: 16,

        key: "DOUBLE_DUTY",

        name: "Double Duty",

        description: "Earn 300 or more points from a tile, twice.",

        difficulty: "Medium",

        category: "optional",

        type: "countAboveThreshold",

        target: 2,

        config: { minDelta: 300 },

        reward: { points: 250 }

    },

    {

        id: 17,

        key: "TRIVIA_BUFF",

        name: "Trivia Buff",

        description: "Answer 4 questions correctly.",

        difficulty: "Medium",

        category: "optional",

        type: "countOutcome",

        target: 4,

        config: { outcome: "correct" },

        reward: { points: 250 }

    },

    {

        id: 18,

        key: "BALANCED_GROWTH",

        name: "Balanced Growth",

        description: "Reach 400 points and answer 3 questions correctly.",

        difficulty: "Medium",

        category: "optional",

        type: "scoreAndCorrectCombo",

        target: 2,

        config: { scoreTarget: 400, correctTarget: 3 },

        reward: { points: 300 }

    },

    {

        id: 19,

        key: "BOLD_CHOICES",

        name: "Bold Choices",

        description: "Use a Pass and still answer 3 questions correctly.",

        difficulty: "Medium",

        category: "optional",

        type: "passAndCorrectCombo",

        target: 2,

        config: { correctTarget: 3 },

        reward: { points: 300 }

    },

    {

        id: 20,

        key: "CONSISTENT",

        name: "Consistent",

        description: "Complete 5 turns.",

        difficulty: "Medium",

        category: "optional",

        type: "turnsPlayed",

        target: 5,

        config: {},

        reward: { points: 250 }

    },

    // =====================================
    // HARD (5)
    // =====================================

    {

        id: 21,

        key: "PERFECTIONIST",

        name: "Perfectionist",

        description: "Answer 4 questions correctly in a row.",

        difficulty: "Hard",

        category: "optional",

        type: "correctStreak",

        target: 4,

        config: {},

        reward: { points: 400 }

    },

    {

        id: 22,

        key: "GRAND_SLAM",

        name: "Grand Slam",

        description: "Earn 500 or more points from a single tile.",

        difficulty: "Hard",

        category: "optional",

        type: "singleTileScore",

        target: 500,

        config: {},

        reward: { points: 400 }

    },

    {

        id: 23,

        key: "HIGH_ROLLER",

        name: "High Roller",

        description: "Reach a total score of 800 points.",

        difficulty: "Hard",

        category: "optional",

        type: "scoreThreshold",

        target: 800,

        config: {},

        reward: { points: 400 }

    },

    {

        id: 24,

        key: "RELENTLESS",

        name: "Relentless",

        description: "Answer 6 questions correctly.",

        difficulty: "Hard",

        category: "optional",

        type: "countOutcome",

        target: 6,

        config: { outcome: "correct" },

        reward: { points: 400 }

    },

    {

        id: 25,

        key: "TRIPLE_THREAT",

        name: "Triple Threat",

        description: "Earn 300 or more points from a tile, three times.",

        difficulty: "Hard",

        category: "optional",

        type: "countAboveThreshold",

        target: 3,

        config: { minDelta: 300 },

        reward: { points: 450 }

    }

];
