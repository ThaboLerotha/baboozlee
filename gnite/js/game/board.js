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

    }

};
