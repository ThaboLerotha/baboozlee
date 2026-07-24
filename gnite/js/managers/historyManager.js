/*
=========================================
HISTORY MANAGER
Version 1.0
=========================================

Records what happened during the game, in order, for the host to
review later. Contains no gameplay logic of its own -- every other
system is responsible for producing its own human-readable title and
description text; HistoryManager only stores and displays it.

The only two "structural" methods besides record() are advanceTurn()
(the in-game relative clock entries are stamped with) and the
open()/close()/render() trio for the read-only viewer. Everything else
that writes here goes through record().
*/

const HistoryManager = {

    entries: [],

    nextSequence: 1,

    currentTurn: 0,

    isOpen: false,

    initialize() {

        this.entries = [];

        this.nextSequence = 1;

        this.currentTurn = 0;

        this.isOpen = false;

    },

    // The one method every other system calls to write an entry.
    // `playerId` may be null for something not tied to a specific
    // player, though nothing currently in the game produces one.
    record(playerId, title, description) {

        const player = GameNight.players.find(

            p => p.id === playerId

        );

        this.entries.push({

            sequence: this.nextSequence++,

            turn: this.currentTurn,

            playerId: playerId,

            playerName: player ? player.name : null,

            title: title,

            description: description

        });

        if(this.isOpen){

            this.render();

        }

    },

    // Advances the relative, in-game "clock" new entries get stamped
    // with. Called once per turn transition (see score.js) -- entries
    // are grouped and displayed by this number, not real clock time.
    advanceTurn() {

        this.currentTurn++;

    },

    open() {

        this.isOpen = true;

        const win = document.getElementById("historyWindow");

        if(win){

            win.classList.remove("hidden");

        }

        this.render();

    },

    close() {

        this.isOpen = false;

        const win = document.getElementById("historyWindow");

        if(win){

            win.classList.add("hidden");

        }

    },

    // Read-only. Newest entries first.
    render() {

        const list = document.getElementById("historyList");

        if(!list){

            return;

        }

        if(this.entries.length === 0){

            list.innerHTML = "<p>Nothing has happened yet.</p>";

            return;

        }

        const sorted = this.entries.slice().reverse();

        list.innerHTML = sorted.map(entry => {

            const who = entry.playerName ? " -- " + entry.playerName : "";

            return `

<div class="historyEntry">

<div class="historyMeta">Turn ${entry.turn}${who}</div>

<div class="historyTitle">${entry.title}</div>

<div class="historyDescription">${entry.description}</div>

</div>

`;

        }).join("");

    }

};
