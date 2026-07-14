/*
=========================================
POWER UP SYSTEM
Version 1.1
=========================================
*/

const PowerUps = {

    generatePool(){

        const pool=[

            null,null,null,null,null,
            null,null,null,null,null,
            null,null,null,null,null,
            null,null,null,null,null,

            "bomb",
            "bomb",

            "mystery",
            "mystery",

            "double",

            "freeze",

            "steal",

            "bonus",

            null,
            null

        ];

        this.shuffle(pool);

        return pool;

    },

    shuffle(array){

        for(let i=array.length-1;i>0;i--){

            const j=Math.floor(Math.random()*(i+1));

            [array[i],array[j]]=[array[j],array[i]];

        }

    },

    apply(tile){

        if(!tile.powerup){

            return;
        }

        const player=Players.getCurrentPlayer();

        switch(tile.powerup){

            case "bomb":

                alert("💣 BOMB!\n\nLose 200 points.");

                Score.subtractPoints(200);

                break;

            case "double":

                alert("⭐ DOUBLE POINTS!\n\nYour next correct answer is worth double.");

                player.doublePoints=true;

                break;

            case "bonus":

                alert("🎯 BONUS TURN!\n\nYou play again.");

                player.bonusTurn=true;

                break;

            case "freeze":

                alert("❄ FREEZE!\n\nNext version: choose a player to skip a turn.");

                break;

            case "steal":

                alert("🥷 STEAL!\n\nNext version: choose a player to steal points from.");

                break;

            case "mystery":

                this.mystery(player);

                break;

        }

        Score.update();

    },

    mystery(player){

        const outcomes=[

            {

                text:"🎁 +100 Points",

                action(){

                    player.score+=100;

                }

            },

            {

                text:"🎁 +200 Points",

                action(){

                    player.score+=200;

                }

            },

            {

                text:"🎁 Lose 100 Points",

                action(){

                    player.score-=100;

                }

            },

            {

                text:"🎁 DOUBLE POINTS",

                action(){

                    player.doublePoints=true;

                }

            },

            {

                text:"🎁 BONUS TURN",

                action(){

                    player.bonusTurn=true;

                }

            }

        ];

        const result=

        outcomes[Math.floor(Math.random()*outcomes.length)];

        alert(result.text);

        result.action();

    }

};
