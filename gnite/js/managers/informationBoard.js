/*
=========================================
INFORMATION BOARD
Version 1.0
=========================================

A permanent, live dashboard of current game state -- distinct from
both HistoryManager (a permanent log of past actions) and
NotificationManager (temporary feedback that disappears). This board
never disappears and always reflects the CURRENT state.

It owns no state of its own. Hidden Event Status is derived entirely
from GameNight.board (which tile is used, which still carries a real
event) cross-referenced with EventDatabase's `category` field -- not
from a separate tracked count, so it can never drift out of sync with
the actual board.

Treasure Status reads GameNight.rewardChestStatus / legacyChestStatus
if they exist. Neither is set by anything yet -- the Treasure Chest
system itself is deferred (see DEVLOG). This just defines the display
contract a future system can write into, without fabricating chest
state that doesn't exist.

Threat Status (Step 7) reads ThreatManager.getSummary() -- level and
harmfulEventsResolved come entirely from ThreatManager's own state,
never tracked here. Deliberately excludes cooldowns and anything that
could hint at hidden event locations.
*/

const InformationBoard = {

    render() {

        const panel = document.getElementById("infoBoard");

        if(!panel){

            return;

        }

        const counts = { Beneficial: 0, Harmful: 0, Neutral: 0 };

        GameNight.board.forEach(tile => {

            if(tile.used || !tile.event || tile.event.type === "none"){

                return;

            }

            const def = (typeof EventDatabase !== "undefined")

                ? EventDatabase.find(e => e.key === tile.event.key)

                : null;

            if(def && Object.prototype.hasOwnProperty.call(counts, def.category)){

                counts[def.category]++;

            }

        });

        const rewardChestStatus = GameNight.rewardChestStatus || "Not yet available";

        const legacyChestStatus = GameNight.legacyChestStatus || "Not Created";

        // Reads ThreatManager's own public summary API (built for
        // exactly this purpose -- see its own comment in
        // threatManager.js) rather than tracking level/count here.
        // Deliberately excludes cooldowns and anything that could hint
        // at hidden event locations, same as the Hidden Event Status
        // section above only shows counts, never positions.
        const threatSummary = (typeof ThreatManager !== "undefined")

            ? ThreatManager.getSummary()

            : { level: "NORMAL", harmfulEventsResolved: 0 };

        panel.innerHTML = `

<h2>Information Board</h2>

<h3>Treasure Status</h3>

<p class="infoBoardLine">Reward Chest: ${rewardChestStatus}</p>

<p class="infoBoardLine">Legacy Chest: ${legacyChestStatus}</p>

<h3>Hidden Event Status</h3>

<p class="infoBoardLine">Beneficial Events Remaining: ${counts.Beneficial}</p>

<p class="infoBoardLine">Harmful Events Remaining: ${counts.Harmful}</p>

<p class="infoBoardLine">Neutral Events Remaining: ${counts.Neutral}</p>

<h3>Threat Status</h3>

<p class="infoBoardLine">Threat Level: ${threatSummary.level}</p>

<p class="infoBoardLine">Harmful Events Resolved: ${threatSummary.harmfulEventsResolved}</p>

`;

    }

};
