/*
=========================================
CONTRACT OFFER
Version 1.0
=========================================

A small, reusable modal that presents a single Optional Contract to
the host and reports back whether it was accepted or declined.

Like TargetSelector, this component has no knowledge of contract
rules, triggers, or progress -- it only shows a name/description and
two buttons. ContractManager decides when to show it and what to do
with the answer.
*/

const ContractOffer = {

    _overlay: null,

    _titleEl: null,

    _descriptionEl: null,

    _acceptBtn: null,

    _declineBtn: null,

    _ensureBuilt(){

        if(this._overlay){

            return;

        }

        const overlay = document.createElement("div");

        overlay.id = "contractOffer";

        overlay.classList.add("hidden");

        const box = document.createElement("div");

        box.classList.add("contractOfferBox");

        const heading = document.createElement("h2");

        heading.textContent = "New Contract Available";

        const title = document.createElement("h3");

        const description = document.createElement("p");

        const buttons = document.createElement("div");

        buttons.classList.add("contractOfferButtons");

        const acceptBtn = document.createElement("button");

        acceptBtn.textContent = "Accept";

        const declineBtn = document.createElement("button");

        declineBtn.textContent = "Decline";

        buttons.appendChild(acceptBtn);

        buttons.appendChild(declineBtn);

        box.appendChild(heading);

        box.appendChild(title);

        box.appendChild(description);

        box.appendChild(buttons);

        overlay.appendChild(box);

        document.body.appendChild(overlay);

        this._overlay = overlay;

        this._titleEl = title;

        this._descriptionEl = description;

        this._acceptBtn = acceptBtn;

        this._declineBtn = declineBtn;

    },

    // Shows `def` (a contract database entry) and calls onAccept() or
    // onDecline() once the host picks one -- never both, never neither.
    open(def, onAccept, onDecline){

        this._ensureBuilt();

        this._titleEl.textContent = def.name;

        this._descriptionEl.textContent = def.description;

        // Replace the buttons with fresh clones so no listener from a
        // previous offer can ever fire twice.
        const newAccept = this._acceptBtn.cloneNode(true);

        this._acceptBtn.replaceWith(newAccept);

        this._acceptBtn = newAccept;

        const newDecline = this._declineBtn.cloneNode(true);

        this._declineBtn.replaceWith(newDecline);

        this._declineBtn = newDecline;

        this._acceptBtn.addEventListener("click", () => {

            this.close();

            onAccept();

        });

        this._declineBtn.addEventListener("click", () => {

            this.close();

            onDecline();

        });

        this._overlay.classList.remove("hidden");

    },

    close(){

        if(this._overlay){

            this._overlay.classList.add("hidden");

        }

    }

};
