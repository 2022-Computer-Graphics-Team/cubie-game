import {entity} from "../../src/entity.js";


export const quest_component = (() => {

    class QuestComponent extends entity.Component {
        constructor() {
            super();
            const e = document.getElementById('mission-ui');
            //e.style.visibility = 'hidden';
        }

        InitComponent() {
            this._RegisterHandler('input.picked', (m) => this._OnPicked(m));
        }

        _OnPicked(msg) {
            var randomNeedItem = [];
            for (let i = 0; i < 9; i++)
                randomNeedItem[i] = Math.floor(Math.random() * (3 - 1 + 1) + 1);

            var _TITLE = 'At Stage 3: Escape from the beach!';
            // var _TEXT ='You need to get the necessary items!\n' +
            //     "\nRadio : "+ randomNeedItem[0] +
            //     "\nPaddle : "+ randomNeedItem[1] +
            //     "\nTorch : "+ randomNeedItem[2] +
            //     "\nWaterBottle : "+ randomNeedItem[3] +
            //     "\nFlareGun : "+ randomNeedItem[4] +
            //     "\nCompass : "+ randomNeedItem[5] +
            //     "\nBattery : "+ randomNeedItem[6] +
            //     "\nBackpack : "+ randomNeedItem[7] +
            //     "\nFirstAidKit : "+ randomNeedItem[8];

            /* Test Usage */
            var _TEXT = 'You need to get the necessary items.\n' +
                "\nRadio : " + 1 +
                "\nPaddle : " + 1 +
                "\nTorch : " + 1 +
                "\nWaterBottle : " + 1 +
                "\nFlareGun : " + 1 +
                "\nCompass : " + 1 +
                "\nBattery : " + 1 +
                "\nBackpack : " + 1 +
                "\nFirstAidKit : " + 1;


            // HARDCODE A QUEST
            const quest = {
                id: 'foo',
                title: _TITLE,
                text: _TEXT,

                // Radio: randomNeedItem[0],
                // Paddle: randomNeedItem[1],
                // Torch: randomNeedItem[2],
                // WaterBottle_3: randomNeedItem[3],
                // FlareGun: randomNeedItem[4],
                // Compass_Open: randomNeedItem[5],
                // Battery_Big: randomNeedItem[6],
                // Backpack: randomNeedItem[7],
                // FirstAidKit_Hard: randomNeedItem[8],

                /* Test Usage */
                Radio: 1,
                Paddle: 1,
                Torch: 1,
                WaterBottle_3: 1,
                FlareGun: 1,
                Compass_Open: 1,
                Battery_Big: 1,
                Backpack: 1,
                FirstAidKit_Hard: 1,

            };
            this._AddQuestToJournal(quest);
        }

        _AddQuestToJournal(quest) {

            const ui = this.FindEntity('ui').GetComponent('UIController');
            ui.AddQuest(quest);
        }
    }

    return {
        QuestComponent: QuestComponent,
    };
})();