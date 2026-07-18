/*
=========================================
BOARD SYSTEM
Version 1.1
=========================================
*/

const Board = {

    initialize() {

    },

    build() {

        const board = document.getElementById("board");

        board.innerHTML = "";

        GameNight.board = [];

        // =========================================
        // Hidden Point Pool
        // =========================================

        const pointPool = [

            100,100,100,100,100,100,

            200,200,200,200,200,200,

            300,300,300,300,300,300,

            400,400,400,400,400,

            500,500,500,500,

            600,600,600

        ];

        this.shuffle(pointPool);

        // =========================================
        // Build Tiles
        // =========================================

        for(let i = 1; i <= 30; i++){

            const tileType = BoardGenerator.generateTileType();

            let question = null;

            let event = {

                type: "none"

            };

            let isStale = false;

            // -----------------------------
            // QUESTION TILE
            // -----------------------------

            if(tileType === "question"){

                question = QuestionManager.getQuestion();

            }

            // -----------------------------
            // MIXED TILE
            // -----------------------------

            else if(tileType === "mixed"){

                question = QuestionManager.getQuestion();

                event = EventManager.getEvent();

            }

            // -----------------------------
            // EVENT TILE
            // -----------------------------

            else if(tileType === "event"){

                event = EventManager.getEvent();

            }

            // -----------------------------
            // STALE TILE
            // -----------------------------

            else if(tileType === "stale"){

                question = QuestionManager.getQuestion();

                isStale = true;

            }

            const tile = {

                id: i,

                label: i,

                tileType: tileType,

                points: pointPool[i - 1],

                question: question,

                event: event,

                isStale: isStale,

                used: false

            };

            GameNight.board.push(tile);

            const div = document.createElement("div");

            div.className = "tile";

            div.dataset.tile = i;

            div.innerHTML = i;

            div.onclick = () => {

                this.select(i);

            };

            board.appendChild(div);

        }

    },

    select(tileID){

        const tile = GameNight.board.find(

            t => t.id === tileID

        );

        if(tile.used){

            return;

        }

        Popup.open(tileID);

    },

    markUsed(tileID){

        const tile = GameNight.board.find(

            t => t.id === tileID

        );

        tile.used = true;

        const div = document.querySelector(

            `[data-tile='${tileID}']`

        );

        div.classList.add("used");

        div.innerHTML = "✓";

    },

    shuffle(array){

        for(let i = array.length - 1; i > 0; i--){

            const j = Math.floor(

                Math.random() * (i + 1)

            );

            [array[i], array[j]] =

            [array[j], array[i]];

        }

    },

    // =========================================
    // Board Event System -- reusable primitives
    // =========================================
    //
    // Everything below is generic: it knows how to query and mutate
    // tiles, but nothing about what Jackpot, Meteor, etc. mean. The
    // named board-mutation methods further down compose these to
    // implement each event. EventExecutor only ever calls the named
    // methods, never these primitives directly.

    // All unused tiles, optionally narrowed by a predicate.
    getUnrevealedTiles(filter){

        return GameNight.board.filter(t =>

            !t.used && (!filter || filter(t))

        );

    },

    // Unused tiles worth exactly `points`, optionally narrowed further.
    getTilesByPoints(points, filter){

        return this.getUnrevealedTiles(t =>

            t.points === points && (!filter || filter(t))

        );

    },

    // Up to `count` unused tiles, chosen at random, optionally narrowed.
    getRandomTiles(count, filter){

        const pool = this.getUnrevealedTiles(filter).slice();

        this.shuffle(pool);

        return pool.slice(0, count);

    },

    // Marks every tile in `tiles` as used and updates its DOM cell with
    // `symbol` (defaults to the same checkmark normal play uses). This is
    // the bulk counterpart to markUsed(), which stays as-is for the
    // single-tile flow in Popup.
    markTilesUsed(tiles, symbol){

        tiles.forEach(tile => {

            tile.used = true;

            const div = document.querySelector(

                `[data-tile='${tile.id}']`

            );

            if(div){

                div.classList.add("used");

                div.innerHTML = symbol || "✓";

            }

        });

    },

    // Strips a tile's event and turns it into an ordinary stale/
    // question-only trivia tile. If the tile had no question of its own
    // (pure Event tiles don't), it's given one so Popup has something to
    // display.
    convertTilesToStale(tiles){

        tiles.forEach(tile => {

            if(!tile.question){

                tile.question = QuestionManager.getQuestion();

            }

            tile.event = { type: "none" };

            tile.isStale = true;

            tile.tileType = "stale";

        });

    },

    // =========================================
    // Board Event System -- named mutations
    // =========================================

    // Jackpot: removes up to `count` unrevealed low-value tiles from
    // play, preferring the cheapest point tier first and moving up to
    // higher tiers only if the cheap tier doesn't have enough. Tiles are
    // marked used (never revealed), so the remaining board is worth more
    // on average and the game gets a little shorter.
    removeLowValueTiles(count){

        const tiers = [100, 200, 300, 400, 500, 600];

        const isEligible = t =>

            t.tileType === "stale" || t.tileType === "question";

        let selected = [];

        for(const points of tiers){

            if(selected.length >= count){

                break;

            }

            const remaining = count - selected.length;

            const tierTiles = this.getTilesByPoints(points, isEligible);

            this.shuffle(tierTiles);

            selected = selected.concat(

                tierTiles.slice(0, remaining)

            );

        }

        this.markTilesUsed(selected, "💰");

        return selected;

    },

    // Bad Jackpot / Cleanup: converts up to `count` random unrevealed
    // event-bearing tiles (Event or Mixed, with a real event) into
    // ordinary stale/question tiles. The tile itself survives -- only
    // its hidden event is lost.
    convertRandomEventTiles(count){

        const hasRealEvent = t =>

            t.event && t.event.type !== "none";

        const selected = this.getRandomTiles(count, hasRealEvent);

        this.convertTilesToStale(selected);

        return selected;

    },

    // Chaos: redistributes hidden events among every unrevealed tile
    // that currently has one, excluding `excludeTileId` (the tile being
    // resolved right now). Every event stays in the game -- only
    // locations change, so a player who was tracking a suspected event
    // location loses that information.
    shuffleHiddenEvents(excludeTileId){

        const candidates = this.getUnrevealedTiles(t =>

            t.id !== excludeTileId &&

            t.event && t.event.type !== "none"

        );

        if(candidates.length < 2){

            return [];

        }

        const events = candidates.map(t => t.event);

        this.shuffle(events);

        candidates.forEach((t, index) => {

            t.event = events[index];

        });

        return candidates;

    },

    // Meteor: destroys roughly `fraction` of all remaining unrevealed
    // tiles (any type), excluding `excludeTileId`. Destroyed tiles are
    // marked used without being revealed, so their contents are lost.
    destroyRandomTiles(fraction, excludeTileId){

        const pool = this.getUnrevealedTiles(t =>

            t.id !== excludeTileId

        );

        const count = Math.round(pool.length * fraction);

        const selected = this.getRandomTiles(

            count,

            t => t.id !== excludeTileId

        );

        this.markTilesUsed(selected, "☄");

        return selected;

    }

};
