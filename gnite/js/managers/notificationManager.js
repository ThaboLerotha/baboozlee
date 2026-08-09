/*
=========================================
NOTIFICATION MANAGER
Version 1.0
=========================================

Temporary, on-screen feedback for things that can influence a
player's decisions right now -- a contract completing, a shield
breaking, a threat level rising. This is NOT the History Log:
History is permanent and complete; notifications appear briefly and
disappear on their own.

The only thing any other system should ever call is notify(). It has
no idea what "a contract" or "a shield" is -- callers are responsible
for their own title/description text, exactly like HistoryManager.
*/

const NotificationManager = {

    autoDismissMs: 4000,

    _container: null,

    initialize() {

        this._ensureBuilt();

    },

    _ensureBuilt() {

        if(this._container){

            return;

        }

        const container = document.createElement("div");

        container.id = "notificationStack";

        document.body.appendChild(container);

        this._container = container;

    },

    // type is purely a styling hint ("success" | "failure" | "info").
    // Callers don't need to pass one -- it defaults to a neutral style.
    notify(title, description, type) {

        this._ensureBuilt();

        const card = document.createElement("div");

        card.classList.add("notificationCard");

        if(type){

            card.classList.add("notification-" + type);

        }

        const titleEl = document.createElement("div");

        titleEl.classList.add("notificationTitle");

        titleEl.textContent = title;

        card.appendChild(titleEl);

        if(description){

            const descEl = document.createElement("div");

            descEl.classList.add("notificationDescription");

            descEl.textContent = description;

            card.appendChild(descEl);

        }

        this._container.appendChild(card);

        setTimeout(() => {

            card.classList.add("notificationFadeOut");

            setTimeout(() => {

                if(card.parentNode){

                    card.parentNode.removeChild(card);

                }

            }, 400);

        }, this.autoDismissMs);

    }

};
