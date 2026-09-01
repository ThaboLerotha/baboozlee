/*
=========================================
THREAT DATABASE
Version 1.0
Data only. No logic. ThreatManager reads this;
nothing here reads game state.
=========================================
*/

// =====================================
// THREAT LEVELS
// =====================================
// A level, once reached, is never downgraded.
// "trigger" is evaluated as OR — whichever condition
// is met first advances the level.

const ThreatLevels = [

    {

        key: "NORMAL",

        order: 0,

        punishmentChance: 0,

        trigger: null

    },

    {

        key: "DANGEROUS",

        order: 1,

        punishmentChance: 0.37,

        trigger: {

            boardProgress: 0.50,

            harmfulEventsResolved: 3

        }

    },

    {

        key: "CRITICAL",

        order: 2,

        punishmentChance: 0.70,

        trigger: {

            boardProgress: 0.80,

            harmfulEventsResolved: 6

        }

    }

];

// =====================================
// PUNISHMENTS
// =====================================
// minLevel: the ThreatLevels key required for this
// punishment to be eligible (that level or higher).
// bypassesShield: true means Shield does NOT protect
// against this punishment regardless of the player's
// Shield status.
// requiresShield: true means this punishment cannot be
// selected unless the target player currently has a Shield.

const ThreatPunishments = [

    {

        key: "SHIELD_BREAK",

        minLevel: "DANGEROUS",

        weight: 30,

        bypassesShield: true,

        requiresShield: true,

        description: "Removes the player's Shield."

    },

    {

        key: "CONTRACT_LOCK",

        minLevel: "DANGEROUS",

        weight: 25,

        bypassesShield: true,

        requiresShield: false,

        description: "Blocks future Optional Contracts. Existing contracts are untouched."

    },

    {

        key: "POINT_DRAIN",

        minLevel: "DANGEROUS",

        weight: 25,

        bypassesShield: false,

        requiresShield: false,

        description: "Removes 50% of the player's current points, floored."

    },

    {

        key: "LOSE_ALL_POINTS",

        minLevel: "CRITICAL",

        weight: 12,

        bypassesShield: false,

        requiresShield: false,

        description: "Sets the player's score to zero."

    },

    {

        key: "CONTRACT_WIPE",

        minLevel: "CRITICAL",

        weight: 8,

        bypassesShield: true,

        requiresShield: false,

        description: "Removes active Optional Contracts (not Starting Contracts). Contract Lock status is unaffected."

    }

];

// =====================================
// COOLDOWN
// =====================================
// Turns (counted as qualifying harmful events resolving
// against that player) a player is exempt from the
// punishment roll after a punishment fires against them.

const ThreatCooldownLength = 2;
