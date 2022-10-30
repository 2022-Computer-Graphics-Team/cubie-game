import {entity} from './entity.js';


export const ui_controller = (() => {

    class UIController extends entity.Component {
        constructor(params) {
            super();
            this._params = params;
            this._quests = {};
        }

        InitComponent() {
            this._iconBar = {
                stats: document.getElementById('icon-bar-stats'),
                inventory: document.getElementById('icon-bar-inventory'),
                quests: document.getElementById('icon-bar-quests'),
            };

            this._ui = {
                inventory: document.getElementById('inventory'),
                stats: document.getElementById('stats'),
                quests: document.getElementById('quest-journal'),
            };

            this._iconBar.inventory.onclick = (m) => {
                this._OnInventoryClicked(m);
            };
            this._iconBar.stats.onclick = (m) => {
                this._OnStatsClicked(m);
            };
            this._iconBar.quests.onclick = (m) => {
                this._OnQuestsClicked(m);
            };
            this._HideUI();
        }

        AddQuest(quest) {
            if (quest.id in this._quests) {
                return;
            }

            const e = document.createElement('DIV');
            e.className = 'quest-entry';
            e.id = 'quest-entry-' + quest.id;
            e.innerText = quest.title;
            e.onclick = (evt) => {
                this._OnQuestSelected(e.id);
            };
            document.getElementById('quest-journal').appendChild(e);

            this._quests[quest.id] = quest;
            this._OnQuestSelected();

        }

        _OnQuestSelected() {

            const e = document.getElementById('quest-ui');
            e.style.visibility = '';

            const text = document.getElementById('quest-text');
            text.innerText = this._quests.foo.text;

            const title = document.getElementById('quest-text-title');
            title.innerText = this._quests.foo.title;

            this._CheckComplete()
        }

        _CheckComplete() {
            console.log("this")
            console.log(this)
            console.log("quest")
            console.log(this._quests)

            var countItem = [];
            for (let i = 0; i < 9; i++)
                countItem[i] = 0;
            var Raft = this._parent._parent.Filter((entityItem = this._parent._entities) => entityItem._name == 'Raft').length
            var Paddle = this._parent._parent.Filter((entityItem = this._parent._entities) => entityItem._name == 'Paddle').length
            var Torch = this._parent._parent.Filter((entityItem = this._parent._entities) => entityItem._name == 'Torch').length
            var WaterBottle = this._parent._parent.Filter((entityItem = this._parent._entities) => entityItem._name == 'WaterBottle_3').length
            var FlareGun = this._parent._parent.Filter((entityItem = this._parent._entities) => entityItem._name == 'FlareGun').length
            var Compass = this._parent._parent.Filter((entityItem = this._parent._entities) => entityItem._name == 'Compass_Open').length
            var Battery = this._parent._parent.Filter((entityItem = this._parent._entities) => entityItem._name == 'Battery_Big').length
            var Backpack = this._parent._parent.Filter((entityItem = this._parent._entities) => entityItem._name == 'Backpack').length
            var FirstAidKit = this._parent._parent.Filter((entityItem = this._parent._entities) => entityItem._name == 'FirstAidKit_Hard').length


            if (Raft == this._quests.foo.Raft) {
                if (Paddle == this._quests.foo.Paddle) {
                    if (WaterBottle == this._quests.foo.WaterBottle_3) {
                        if (FlareGun == this._quests.foo.FlareGun) {
                            if (Compass == this._quests.foo.Compass_Open) {
                                if (Battery == this._quests.foo.Battery_Big) {
                                    if (Backpack == this._quests.foo.Backpack) {
                                        if (FirstAidKit == this._quests.foo.FirstAidKit_Hard) {
                                            if (Torch == this._quests.foo.Torch) {
                                                console.log("Torch");
                                                console.log(Torch.length);
                                                window.location.replace('../Success.html')
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

        }

        _HideUI() {
            this._ui.inventory.style.visibility = 'hidden';
            this._ui.stats.style.visibility = 'hidden';
            this._ui.quests.style.visibility = 'hidden';
        }

        _OnQuestsClicked(msg) {
            const visibility = this._ui.quests.style.visibility;
            this._HideUI();
            this._ui.quests.style.visibility = (visibility ? '' : 'hidden');
        }

        _OnStatsClicked(msg) {
            const visibility = this._ui.stats.style.visibility;
            this._HideUI();
            this._ui.stats.style.visibility = (visibility ? '' : 'hidden');
        }

        _OnInventoryClicked(msg) {
            const visibility = this._ui.inventory.style.visibility;
            this._HideUI();
            this._ui.inventory.style.visibility = (visibility ? '' : 'hidden');
        }

        Update(timeInSeconds) {
        }
    };

    return {
        UIController: UIController,
    };

})();