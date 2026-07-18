/*
=========================================
QUESTION MANAGER
Version 1.0
=========================================
*/

const QuestionManager = {

    availableQuestions: [],

    initialize() {

        this.reset();

    },

    reset() {

        this.availableQuestions = [...QuestionDatabase];

        this.shuffle(this.availableQuestions);

    },

    getQuestion() {

        if (this.availableQuestions.length === 0) {

            // Exhausted for this game. Per design, we never silently
            // reshuffle or reuse a question mid-game -- reset() only
            // happens explicitly at the start of a new game (see
            // ui.js's startGameBtn handler). Callers must handle null.
            console.warn(

                "QuestionManager: question pool exhausted for this game."

            );

            return null;

        }

        return this.availableQuestions.pop();

    },

    shuffle(array) {

        for (let i = array.length - 1; i > 0; i--) {

            const j = Math.floor(Math.random() * (i + 1));

            [array[i], array[j]] = [array[j], array[i]];

        }

    }

};
