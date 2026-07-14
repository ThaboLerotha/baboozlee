/*
=========================================
EVENT MANAGER
Version 2.0
=========================================
*/

const EventManager = {

    availableEvents: [],

    activeEvents: [],

    initialize(){

        this.reset();

    },

    reset(){

        this.availableEvents = [];

        this.activeEvents = [];

        EventDatabase.forEach(event=>{

            for(let i=0;i<event.copies;i++){

                this.availableEvents.push({

                    ...event

                });

            }

        });

        this.shuffle(this.availableEvents);

    },

    getEvent(){

        if(this.availableEvents.length===0){

            return {

                type:"none"

            };

        }

        const event = this.availableEvents.pop();

        this.activeEvents.push(event);

        return event;

    },

    removeActiveEvent(type){

        this.activeEvents =

        this.activeEvents.filter(

            e=>e.type!==type

        );

    },

    addEvent(type){

        const event = EventDatabase.find(

            e=>e.type===type

        );

        if(event){

            this.activeEvents.push({

                ...event

            });

        }

    },

    getInventory(){

        return this.activeEvents;

    },

    shuffle(array){

        for(let i=array.length-1;i>0;i--){

            const j=Math.floor(

                Math.random()*(i+1)

            );

            [array[i],array[j]]=[array[j],array[i]];

        }

    }

};
