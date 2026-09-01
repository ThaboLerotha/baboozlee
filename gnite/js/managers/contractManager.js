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

    // playerId -> Set of trigger keys already resolved for that player
    // (fired exactly once each, whether or not an offer could actually
    // be shown -- see checkTrigger()).
    firedTriggers: {},

    // playerId -> true once that player is blocked from receiving any
    // further Optional Contracts. Existing active contracts (Starting
    // or Optional) are completely unaffected by this flag -- it only
    // gates future offers/triggers. Set via blockOptionalContracts().
    contractsLocked: {},

    // The maximum number of contracts (Starting + Optional combined) a
    // player may have active at once.
    maxActiveContracts: 2,

    initialize() {

        this.enabled = false;

        this.assignments = {};

        this.nextInstanceId = 1;

        this.firedTriggers = {};

        this.contractsLocked = {};

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

        this.firedTriggers = {};

        this.contractsLocked = {};

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

    // Each player gets exactly ONE random Starting Contract, not the
    // whole set. Combined with the max-2-active-contracts rule, that
    // leaves room for a second, Optional Contract to be earned during
    // play (see checkTrigger()).
    assignStartingContracts() {

        if(!this.enabled){

            return;

        }

        const startingDefs = ContractDatabase.filter(

            def => def.category === "starting"

        );

        if(startingDefs.length === 0){

            return;

        }

        GameNight.players.forEach(player => {

            const randomDef = startingDefs[

                Math.floor(Math.random() * startingDefs.length)

            ];

            this._assign(player.id, randomDef);

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

        if(this.isOptionalContractsBlocked(playerId)){

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

    // Content-driven Optional Contract triggers. A gameplay moment
    // calls this with a trigger key (e.g. "FIRST_BOMB_SURVIVED"); if a
    // contract in the database declares that same `trigger` value, and
    // this player hasn't already resolved this trigger, and they have
    // room for another active contract, the host is shown an
    // Accept/Decline offer for that specific contract. Adding a new
    // trigger later is a database change (a new optional contract with
    // a new `trigger` key) plus whatever gameplay code calls
    // checkTrigger() with that key -- this method never needs a new
    // case added for it.
    async checkTrigger(triggerKey, playerId) {

        if(!this.enabled){

            return;

        }

        if(this.isOptionalContractsBlocked(playerId)){

            return;

        }

        if(!this.firedTriggers[playerId]){

            this.firedTriggers[playerId] = new Set();

        }

        if(this.firedTriggers[playerId].has(triggerKey)){

            return;

        }

        // Resolved for this player the moment the condition is met,
        // regardless of whether an offer can actually be shown below --
        // "first X" only ever happens once per player.
        this.firedTriggers[playerId].add(triggerKey);

        if(this.getActiveContracts(playerId).length >= this.maxActiveContracts){

            return;

        }

        const def = ContractDatabase.find(

            d => d.category === "optional" && d.trigger === triggerKey

        );

        if(!def){

            return;

        }

        const player = GameNight.players.find(p => p.id === playerId);

        if(!player){

            return;

        }

        if(typeof ContractOffer === "undefined"){

            return;

        }

        const accepted = await new Promise(resolve => {

            ContractOffer.open(def, () => resolve(true), () => resolve(false));

        });

        if(accepted){

            this._assign(playerId, def);

            if(typeof HistoryManager !== "undefined"){

                HistoryManager.record(

                    playerId,

                    "Contract Accepted",

                    `${player.name} accepted the contract "${def.name}".`

                );

            }

            if(typeof NotificationManager !== "undefined"){

                NotificationManager.notify(

                    "📜 Contract Accepted",

                    def.name,

                    "success"

                );

            }

        } else {

            if(typeof HistoryManager !== "undefined"){

                HistoryManager.record(

                    playerId,

                    "Contract Declined",

                    `${player.name} declined the contract "${def.name}".`

                );

            }

            if(typeof NotificationManager !== "undefined"){

                NotificationManager.notify(

                    "Contract Declined",

                    def.name,

                    "info"

                );

            }

        }

        this.renderPanel();

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

    // =========================================
    // External punishment/consequence integration points
    // =========================================
    // These exist so other systems (currently: ThreatConsequences, not
    // yet wired into gameplay) never need to reach into `assignments`
    // or `contractsLocked` directly. Nothing calls these yet.

    isOptionalContractsBlocked(playerId) {

        return !!this.contractsLocked[playerId];

    },

    // Blocks this player from receiving any further Optional
    // Contracts. Existing active contracts (Starting or Optional) are
    // completely untouched -- this only gates future
    // offerOptionalContract()/checkTrigger() calls.
    blockOptionalContracts(playerId) {

        if(!this.enabled){

            return;

        }

        this.contractsLocked[playerId] = true;

    },

    // Removes this player's active Optional Contracts only -- Starting
    // Contracts are never touched, matched by definition.category, not
    // by any assumption about instance order or count. Wiped instances
    // get a distinct "wiped" status (not "completed" or "failed"), so
    // completeContract()/updateProgress()/_dispatch() -- all of which
    // gate on status === "active" -- can never act on them again and
    // no reward can be accidentally paid out. Does not change this
    // player's contractsLocked state. Returns the list of instances
    // actually wiped (empty if the player had none).
    wipeOptionalContracts(playerId) {

        if(!this.enabled){

            return [];

        }

        const instances = this.assignments[playerId] || [];

        const wiped = [];

        instances.forEach(instance => {

            if(instance.status !== "active"){

                return;

            }

            const def = this._getDefinition(instance.contractId);

            if(!def || def.category !== "optional"){

                return;

            }

            instance.status = "wiped";

            wiped.push(instance);

        });

        if(wiped.length > 0){

            this.renderPanel();

        }

        return wiped;

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

        if(typeof NotificationManager !== "undefined" && def){

            const rewardText = (def.reward && def.reward.points)

                ? `+${def.reward.points} Points`

                : "";

            NotificationManager.notify(

                "✅ Contract Completed",

                def.name + (rewardText ? "\n" + rewardText : ""),

                "success"

            );

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

        if(typeof NotificationManager !== "undefined"){

            const def = this._getDefinition(instance.contractId);

            if(def){

                NotificationManager.notify(

                    "❌ Contract Failed",

                    def.name,

                    "failure"

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

                if(!def){

                    html += `<div class="contractEntry"><div class="contractName">Unknown Contract</div></div>`;

                    return;

                }

                const rewardLine = (def.reward && def.reward.points)

                    ? `<div class="contractReward">Reward: +${def.reward.points}</div>`

                    : "";

                let statusLine;

                if(instance.status === "completed"){

                    statusLine = `<div class="contractStatusLine contractCompleted">Completed ✓</div>`;

                } else if(instance.status === "failed"){

                    statusLine = `<div class="contractStatusLine contractFailed">Failed ✗</div>`;

                } else {

                    statusLine = `<div class="contractStatusLine">Progress: ${instance.progress}/${instance.target} • Active</div>`;

                }

                html += `

<div class="contractEntry">

<div class="contractName">${def.name}</div>

<div class="contractDescription">${def.description}</div>

${rewardLine}

${statusLine}

</div>

`;

            });

        });

        panel.innerHTML = html;

    }

};
