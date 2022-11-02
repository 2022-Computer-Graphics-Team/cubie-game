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
                console.log("click quest")
                this._OnQuestsClicked(m);
            };
        }

        AddQuest(quest) {
            if (quest.id in this._quests) {
                return;
            }
            // const e = document.createElement('p');
            // //e.className = 'quest-entry';
            // e.id = 'quest-entry-' + quest.id;
            // e.innerText = quest.title;
            // e.onclick = (evt) => {
            //     this._OnQuestSelected(e.id);
            // };
            // document.getElementById('mission-ui').appendChild(e);


            this._quests[quest.id] = quest;
            this._OnQuestSelected(quest.id);
            console.log("add quest")

        }

        _OnQuestSelected(id) {
            const quest = this._quests[id];

            const e = document.getElementById('mission-ui');
            e.style.visibility = '';

            const text = document.getElementById('mission-text');
            text.innerText = quest.text;

            const title = document.getElementById('mission-title');
            title.innerText = quest.title;

            this._CheckComplete()
        }

        _CheckComplete() {
            console.log("this")
            console.log(this)
            console.log("quest")
            console.log(this._quests)

            var Radio = this._parent._parent.Filter((entityItem = this._parent._entities) => entityItem._name == 'Radio').length
            var Paddle = this._parent._parent.Filter((entityItem = this._parent._entities) => entityItem._name == 'Paddle').length
            var Torch = this._parent._parent.Filter((entityItem = this._parent._entities) => entityItem._name == 'Torch').length
            var WaterBottle = this._parent._parent.Filter((entityItem = this._parent._entities) => entityItem._name == 'WaterBottle_3').length
            var FlareGun = this._parent._parent.Filter((entityItem = this._parent._entities) => entityItem._name == 'FlareGun').length
            var Compass = this._parent._parent.Filter((entityItem = this._parent._entities) => entityItem._name == 'Compass_Open').length
            var Battery = this._parent._parent.Filter((entityItem = this._parent._entities) => entityItem._name == 'Battery_Big').length
            var Backpack = this._parent._parent.Filter((entityItem = this._parent._entities) => entityItem._name == 'Backpack').length
            var FirstAidKit = this._parent._parent.Filter((entityItem = this._parent._entities) => entityItem._name == 'FirstAidKit_Hard').length


            if (Radio == this._quests.foo.Radio) {
                if (Paddle == this._quests.foo.Paddle) {
                    if (WaterBottle == this._quests.foo.WaterBottle_3) {
                        if (FlareGun == this._quests.foo.FlareGun) {
                            if (Compass == this._quests.foo.Compass_Open) {
                                if (Battery == this._quests.foo.Battery_Big) {
                                    if (Backpack == this._quests.foo.Backpack) {
                                        if (FirstAidKit == this._quests.foo.FirstAidKit_Hard) {
                                            if (Torch == this._quests.foo.Torch) {
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