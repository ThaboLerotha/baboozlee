/*
=========================================
CONTRACT MANAGER
Version 1.0 (Framework)
=========================================

Framework only. This does NOT implement real contract content -- see
contractDatabase.js's header comment. What it does implement:

    - enable/disable, read from the Setup screen
    - assigning Starting Contracts at game start
    - offering Optional Contracts on demand (callable by future code)
    - generic progress tracking, with automatic completion at target
    - completed/failed state tracking
    - an extensible type-handler registry, so future contract types
      never require editing this file
    - hook methods (onTileResolved/onScoreChange/onTurnEnd) that other
      systems call, which are no-ops whenever contracts are disabled

Every public method most callers use starts with an `if(!this.enabled)
return;` guard. That is deliberate: when Contracts is off, calling any
of these does nothing at all, so the rest of the game is byte-for-byte
unaffected by this file existing.
*/

const ContractManager = {

    enabled: false,

    // playerId -> [ instance, instance, ... ]
    assignments: {},

    nextInstanceId: 1,

    // typeKey -> handler object implementing
    // handler.onHook(instance, definition, hookName, payload, ContractManager)
    typeHandlers: {},

    initialize() {

        this.enabled = false;

        this.assignments = {};

        this.nextInstanceId = 1;

        // A minimal built-in type, registered here purely to prove the
        // registry pattern works end-to-end. It does nothing on any
        // hook -- progress for a "manual" contract only ever advances
        // if something explicitly calls updateProgress() for it. Real
        // contract types (answer streaks, point thresholds, etc.) are
        // future content and would each register their own handler
        // the same way, without touching this file.
        this.registerType("manual", {

            onHook() {

                // Intentionally does nothing -- see comment above.

            }

        });

    },

    // Future contract types call this (from their own file) to plug
    // into the system. ContractManager's own code never needs to
    // change to support a new type.
    registerType(typeKey, handler) {

        this.typeHandlers[typeKey] = handler;

    },

    // Called once from the Start Game flow, after Players.createPlayers()
    // so player.id values exist. Resets all contract state for the new
    // game and assigns Starting Contracts if enabled.
    startGame() {

        this.assignments = {};

        this.nextInstanceId = 1;

        if(!this.enabled){

            this.renderPanel();

            return;

        }

        GameNight.players.forEach(player => {

            this.assignments[player.id] = [];

        });

        this.assignStartingContracts();

        this.renderPanel();

    },

    assignStartingContracts() {

        if(!this.enabled){

            return;

        }

        const startingDefs = ContractDatabase.filter(

            def => def.category === "starting"

        );

        GameNight.players.forEach(player => {

            startingDefs.forEach(def => {

                this._assign(player.id, def);

            });

        });

    },

    // Not wired to any automatic trigger yet -- deciding *when* during
    // a game an Optional Contract should be offered is a gameplay/UX
    // decision for a future phase. This method exists so that future
    // code has a real, working pipeline to call into.
    offerOptionalContract(playerId) {

        if(!this.enabled){

            return null;

        }

        const optionalDefs = ContractDatabase.filter(

            def => def.category === "optional"

        );

        if(optionalDefs.length === 0){

            return null;

        }

        const def = optionalDefs[

            Math.floor(Math.random() * optionalDefs.length)

        ];

        const instance = this._assign(playerId, def);

        this.renderPanel();

        return instance;

    },

    _assign(playerId, def) {

        const instance = {

            instanceId: this.nextInstanceId++,

            contractId: def.id,

            playerId: playerId,

            status: "active",

            progress: 0,

            target: def.target

        };

        if(!this.assignments[playerId]){

            this.assignments[playerId] = [];

        }

        this.assignments[playerId].push(instance);

        if(typeof HistoryManager !== "undefined"){

            const player = GameNight.players.find(p => p.id === playerId);

            if(player){

                HistoryManager.record(

                    playerId,

                    "Contract Assigned",

                    `${player.name} received the contract "${def.name}".`

                );

            }

        }

        return instance;

    },

    getActiveContracts(playerId) {

        if(!this.enabled){

            return [];

        }

        return (this.assignments[playerId] || []).filter(

            i => i.status === "active"

        );

    },

    // Generic progress update. What `amount` represents is entirely up
    // to whatever type handler triggered it -- ContractManager just
    // adds it to the instance's progress and checks it against the
    // target it was assigned with.
    updateProgress(playerId, instanceId, amount) {

        if(!this.enabled){

            return;

        }

        const instance = this._findInstance(playerId, instanceId);

        if(!instance || instance.status !== "active"){

            return;

        }

        instance.progress += amount;

        if(instance.target != null && instance.progress >= instance.target){

            this.completeContract(playerId, instanceId);

            return;

        }

        if(typeof HistoryManager !== "undefined"){

            const def = this._getDefinition(instance.contractId);

            const player = GameNight.players.find(p => p.id === playerId);

            if(def && player){

                HistoryManager.record(

                    playerId,

                    "Contract Progress Updated",

                    `${player.name} made progress on "${def.name}" (${instance.progress}/${instance.target}).`

                );

            }

        }

        this.renderPanel();

    },

    completeContract(playerId, instanceId) {

        if(!this.enabled){

            return;

        }

        const instance = this._findInstance(playerId, instanceId);

        if(!instance || instance.status !== "active"){

            return;

        }

        instance.status = "completed";

        const def = this._getDefinition(instance.contractId);

        if(def && def.reward && def.reward.points){

            const player = GameNight.players.find(

                p => p.id === playerId

            );

            if(player){

                player.score += def.reward.points;

                if(typeof Score !== "undefined"){

                    Score.update();

                }

            }

        }

        if(typeof HistoryManager !== "undefined"){

            const completingPlayer = GameNight.players.find(p => p.id === playerId);

            if(def && completingPlayer){

                const rewardText = (def.reward && def.reward.points)

                    ? ` (+${def.reward.points} points)`

                    : "";

                HistoryManager.record(

                    playerId,

                    "Contract Completed",

                    `${completingPlayer.name} completed "${def.name}"${rewardText}.`

                );

            }

        }

        this.renderPanel();

    },

    failContract(playerId, instanceId, reason) {

        if(!this.enabled){

            return;

        }

        const instance = this._findInstance(playerId, instanceId);

        if(!instance || instance.status !== "active"){

            return;

        }

        instance.status = "failed";

        instance.failReason = reason || null;

        if(typeof HistoryManager !== "undefined"){

            const def = this._getDefinition(instance.contractId);

            const player = GameNight.players.find(p => p.id === playerId);

            if(def && player){

                HistoryManager.record(

                    playerId,

                    "Contract Failed",

                    `${player.name} failed "${def.name}".`

                );

            }

        }

        this.renderPanel();

    },

    _findInstance(playerId, instanceId) {

        return (this.assignments[playerId] || []).find(

            i => i.instanceId === instanceId

        );

    },

    _getDefinition(contractId) {

        return ContractDatabase.find(

            def => def.id === contractId

        );

    },

    // =========================================
    // Hooks -- called by other systems (Score, Popup) at the moments
    // future contract types will need to react to. Every hook is a
    // guarded no-op when contracts are disabled.
    // =========================================

    onTileResolved(payload) {

        if(!this.enabled){

            return;

        }

        this._dispatch("tileResolved", payload);

    },

    onScoreChange(payload) {

        if(!this.enabled){

            return;

        }

        this._dispatch("scoreChange", payload);

    },

    onTurnEnd(payload) {

        if(!this.enabled){

            return;

        }

        this._dispatch("turnEnd", payload);

    },

    _dispatch(hookName, payload) {

        const playerId = payload && payload.playerId;

        if(playerId == null){

            return;

        }

        const instances = this.getActiveContracts(playerId);

        instances.forEach(instance => {

            const def = this._getDefinition(instance.contractId);

            if(!def){

                return;

            }

            const handler = this.typeHandlers[def.type];

            if(handler && typeof handler.onHook === "function"){

                handler.onHook(instance, def, hookName, payload, this);

            }

        });

    },

    // =========================================
    // UI placeholder
    // =========================================
    //
    // Deliberately minimal -- this proves contracts are visible to the
    // host, not a finished design. Hidden entirely when disabled.

    renderPanel() {

        const panel = document.getElementById("contractPanel");

        if(!panel){

            return;

        }

        if(!this.enabled){

            panel.classList.add("hidden");

            panel.innerHTML = "";

            return;

        }

        panel.classList.remove("hidden");

        const allInstances = Object.values(this.assignments).flat();

        if(allInstances.length === 0){

            panel.innerHTML = "<h2>Contracts</h2><p>No active contracts.</p>";

            return;

        }

        let html = "<h2>Contracts</h2>";

        GameNight.players.forEach(player => {

            const playerInstances = this.assignments[player.id] || [];

            if(playerInstances.length === 0){

                return;

            }

            html += `<h3>${player.name}</h3>`;

            playerInstances.forEach(instance => {

                const def = this._getDefinition(instance.contractId);

                const label = def ? def.name : "Unknown Contract";

                html += `<p>${label} -- ${instance.status} (${instance.progress}/${instance.target})</p>`;

            });

        });

        panel.innerHTML = html;

    }

};
