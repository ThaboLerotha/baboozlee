/*
=========================================
BOARD GENERATOR
Version 1.0
=========================================
*/

const BoardGenerator = {

    generateTileType(){

        const roll = Math.random();

        if(roll < 0.55){

            return "question";

        }

        if(roll < 0.80){

            return "mixed";

        }

        if(roll < 0.90){

            return "event";

        }

        return "stale";

    }

};
