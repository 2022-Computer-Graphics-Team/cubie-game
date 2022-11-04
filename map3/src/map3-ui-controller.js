import {entity} from '../../src/entity.js';

export const ui_controller = (() => {

    class UIController extends entity.Component {
        constructor(params) {
            super();
            this._params = params;
            this._quests = {};
        }

        InitComponent() {
            this._ui = {
                quests: document.getElementById('mission-ui'),
            };

            this._ui.quests.onclick = (m) => {
                this._OnQuestsClicked(m);
            };

        }

        AddQuest(quest) {
            if (quest.id in this._quests) {
                return;
            }

            this._quests[quest.id] = quest;
            this._OnQuestSelected(quest.id);
            //console.log("add quest")

        }

        _OnQuestSelected(id) {
            const quest = this._quests[id];

            const e = document.getElementById('mission-ui');
            e.style.visibility = '';

            const text = document.getElementById('mission-text');
            text.innerText = quest.text;

            const title = document.getElementById('mission-title');
            title.innerText = quest.title;

        }

        _OnQuestsClicked(msg) {
            const visibility = this._ui.quests.style.visibility;
            this._HideUI();
            this._ui.quests.style.visibility = (visibility ? '' : 'hidden');
        }

        Update(timeInSeconds) {
        }
    }

    return {
        UIController: UIController,
    };

})();