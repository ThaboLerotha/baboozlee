/*
=========================================
CONTRACT DATABASE
Version 1.0 (Framework)
=========================================

Each entry is a contract DEFINITION -- a template. ContractManager
copies the relevant fields onto a per-player INSTANCE when a contract
is assigned (see ContractManager._assign()), so editing a definition
here never affects a contract a player is already partway through.

Schema:

    id          unique number
    key         unique string identifier, e.g. "ANSWER_STREAK_3"
    name        short human-readable name, e.g. "Hot Streak"
    description short human-readable explanation of what's required
    category    "starting"  -> assigned to every player at game start
                "optional"  -> available to be offered later in-game
    type        which registered handler evaluates this contract's
                progress. ContractManager itself has no knowledge of
                what any given type means -- adding a new contract
                type is done by (1) adding definitions here with a new
                `type` value and (2) calling
                ContractManager.registerType("yourType", handler)
                somewhere. ContractManager's own code never needs to
                change.
    target      generic numeric goal. What "progress" counts toward
                this is entirely up to the type's handler -- the
                database and ContractManager only know it's a number
                to reach.
    reward      { points: N } awarded on completion. Kept as an object
                (not a bare number) so future reward shapes -- an
                extra Pass, a Shield, etc. -- can be added later
                without changing the shape of every existing entry.

This file intentionally contains only a couple of placeholder entries
to prove the pipeline end-to-end. The full contract list (up to 25)
is future content, not part of this framework commit.
*/

const ContractDatabase = [

    {

        id: 1,

        key: "EXAMPLE_STARTING_PLACEHOLDER",

        name: "Example Starting Contract",

        description: "Placeholder starting contract used to verify the assignment pipeline. Not real content.",

        category: "starting",

        type: "manual",

        target: 1,

        reward: { points: 0 }

    },

    {

        id: 2,

        key: "EXAMPLE_OPTIONAL_PLACEHOLDER",

        name: "Example Optional Contract",

        description: "Placeholder optional contract used to verify the offer pipeline. Not real content.",

        category: "optional",

        type: "manual",

        target: 1,

        reward: { points: 0 }

    }

];
