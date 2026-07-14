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

            this.reset();

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
