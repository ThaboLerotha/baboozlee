/*
=========================================
THREAT MANAGER
Version 1.0
=========================================

Step 2 of the Threat Engine. This manager decides WHAT should happen
(current level, whether a punishment fires, which punishment) -- it
never DOES anything to a player, tile, or contract itself. That's
ThreatConsequences' job, a later step. Nothing in the game currently
calls this manager; it is not wired into the game loop yet.

Threat level is global (one shared state for the whole game). Cooldown
is per player, since punishments target a specific player.
*/

const ThreatManager = {

    // Index into ThreatLevels. 0 = NORMAL. Never decreases.
    currentLevelIndex: 0,

    // Global count of harmful events resolved, across all players.
    harmfulEventsResolved: 0,

    // playerId -> remaining cooldown (qualifying harmful events until
    // punishment rolls resume for that player).
    playerCooldowns: {},

    initialize(){

        this.reset();

    },

    reset(){

        this.currentLevelIndex = 0;

        this.harmfulEventsResolved = 0;

        this.playerCooldowns = {};

    },

    // =====================================
    // Public read API
    // =====================================

    getCurrentLevel(){

        return ThreatLevels[this.currentLevelIndex];

    },

    getCurrentLevelKey(){

        return this.getCurrentLevel().key;

    },

    getHarmfulEventsResolved(){

        return this.harmfulEventsResolved;

    },

    getCooldown(playerId){

        return this.playerCooldowns[playerId] || 0;

    },

    isOnCooldown(playerId){

        return this.getCooldown(playerId) > 0;

    },

    // Independent of player count: always tiles-used / total tiles on
    // the fixed 30-tile board, whatever the board's actual size is.
    getBoardProgress(){

        if(!GameNight.board || GameNight.board.length === 0){

            return 0;

        }

        const used = GameNight.board.filter(t => t.used).length;

        return used / GameNight.board.length;

    },

    // Small snapshot for later use (e.g. Information Board display) --
    // deliberately excludes per-player cooldowns and anything that
    // could hint at hidden event locations.
    getSummary(){

        return {

            level: this.getCurrentLevelKey(),

            harmfulEventsResolved: this.harmfulEventsResolved,

            boardProgress: this.getBoardProgress()

        };

    },

    // =====================================
    // Level evaluation
    // =====================================
    // Checks only the next level up. A level, once reached, is never
    // downgraded -- this method has no path that lowers
    // currentLevelIndex under any circumstance.

    evaluateLevel(){

        const nextIndex = this.currentLevelIndex + 1;

        if(nextIndex >= ThreatLevels.length){

            return this.getCurrentLevel();

        }

        const next = ThreatLevels[nextIndex];

        const trigger = next.trigger;

        const meetsProgress = this.getBoardProgress() >= trigger.boardProgress;

        const meetsHarmful = this.harmfulEventsResolved >= trigger.harmfulEventsResolved;

        if(meetsProgress || meetsHarmful){

            this.currentLevelIndex = nextIndex;

            // Re-check in case more than one threshold was crossed at
            // once (e.g. board progress jumped straight past both
            // DANGEROUS and CRITICAL in one tile resolution).
            return this.evaluateLevel();

        }

        return this.getCurrentLevel();

    },

    // =====================================
    // Harmful event registration
    // =====================================
    // The intended single entry point once this manager is wired into
    // the game loop (a later step, not this one). Nothing calls this
    // yet.

    registerHarmfulEvent(playerId){

        this.harmfulEventsResolved++;

        this.evaluateLevel();

        if(this.isOnCooldown(playerId)){

            this.playerCooldowns[playerId] = this.getCooldown(playerId) - 1;

            return {

                punished: false,

                reason: "cooldown",

                level: this.getCurrentLevelKey()

            };

        }

        return this.rollPunishment(playerId);

    },

    // =====================================
    // Punishment roll + selection
    // =====================================
    // Selection only -- callers are responsible for actually applying
    // the effect (ThreatConsequences, a later step). Setting the
    // player's cooldown IS this manager's responsibility, since it's
    // part of deciding whether future rolls happen, not part of
    // applying an effect.

    rollPunishment(playerId){

        const level = this.getCurrentLevel();

        if(level.punishmentChance <= 0){

            return { punished: false, reason: "no-chance", level: level.key };

        }

        if(Math.random() >= level.punishmentChance){

            return { punished: false, reason: "missed-roll", level: level.key };

        }

        const punishment = this.selectPunishment(playerId, level.key);

        if(!punishment){

            return { punished: false, reason: "no-eligible-punishment", level: level.key };

        }

        this.playerCooldowns[playerId] = ThreatCooldownLength;

        return { punished: true, punishment: punishment.key, level: level.key };

    },

    // Weighted random selection among punishments eligible for the
    // given level, filtered further by requiresShield against the
    // target player's actual Shield status.
    selectPunishment(playerId, levelKey){

        const player = GameNight.players.find(p => p.id === playerId);

        const levelOrder = ThreatLevels.find(l => l.key === levelKey).order;

        const eligible = ThreatPunishments.filter(p => {

            const minOrder = ThreatLevels.find(l => l.key === p.minLevel).order;

            if(levelOrder < minOrder){

                return false;

            }

            if(p.requiresShield && !(player && player.shield)){

                return false;

            }

            return true;

        });

        if(eligible.length === 0){

            return null;

        }

        const totalWeight = eligible.reduce((sum, p) => sum + p.weight, 0);

        let roll = Math.random() * totalWeight;

        for(const p of eligible){

            roll -= p.weight;

            if(roll <= 0){

                return p;

            }

        }

        return eligible[eligible.length - 1];

    }

};
