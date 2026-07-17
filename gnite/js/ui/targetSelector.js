/*
=========================================
TARGET SELECTOR
Version 1.0
=========================================

A small, reusable modal that presents the host with a list of eligible
players and returns whichever one they click.

This component has no knowledge of events, points, shields, or any other
game rule. It only does two things:

    1. Show a list of players.
    2. Report back which one was clicked.

Anything that needs to target a player -- EventExecutor today, future
mechanics like Contracts later -- can reuse this without modification.
*/

const TargetSelector = {

    _overlay: null,

    _listEl: null,

    _titleEl: null,

    // Builds the modal DOM once and caches it. Safe to call repeatedly.
    _ensureBuilt(){

        if(this._overlay){

            return;

        }

        const overlay = document.createElement("div");

        overlay.id = "targetSelector";

        overlay.classList.add("hidden");

        const box = document.createElement("div");

        box.classList.add("targetSelectorBox");

        const title = document.createElement("h2");

        title.textContent = "Choose a Player";

        const list = document.createElement("div");

        list.classList.add("targetSelectorList");

        box.appendChild(title);

        box.appendChild(list);

        overlay.appendChild(box);

        document.body.appendChild(overlay);

        this._overlay = overlay;

        this._listEl = list;

        this._titleEl = title;

    },

    // Shows the modal listing `players`, and calls onSelect(player) once
    // the host clicks one of them. Optional `promptText` overrides the
    // modal's title (useful for future mechanics with different phrasing,
    // e.g. "Choose someone to Freeze").
    open(players, onSelect, promptText){

        this._ensureBuilt();

        this._titleEl.textContent = promptText || "Choose a Player";

        this._listEl.innerHTML = "";

        players.forEach(player => {

            const btn = document.createElement("button");

            btn.textContent = player.name;

            btn.addEventListener("click", () => {

                this.close();

                onSelect(player);

            });

            this._listEl.appendChild(btn);

        });

        this._overlay.classList.remove("hidden");

    },

    close(){

        if(this._overlay){

            this._overlay.classList.add("hidden");

        }

    }

};
