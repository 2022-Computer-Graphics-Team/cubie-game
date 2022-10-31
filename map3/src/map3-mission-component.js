import {entity} from "../../src/entity.js";


export const quest_component = (() => {

    class QuestComponent extends entity.Component {
        constructor() {
            super();

            const e = document.getElementById('mission-ui');
            // e.style.visibility = 'hidden';
        }

        InitComponent() {
            this._RegisterHandler('input.picked', (m) => this._OnPicked(m));
        }

        _OnPicked(msg) {
            var randomNeedItem = [];
            for (let i = 0; i < 9; i++)
                randomNeedItem[i] = Math.floor(Math.random() * (3 - 1 + 1) + 1);

            var _TITLE = 'Get me an escape item!';
            // var _TEXT ='We need the following items Hurry up and save me!\n' +
            //     "\nRaft : "+ randomNeedItem[0] +
            //     "\nPaddle : "+ randomNeedItem[1] +
            //     "\nTorch : "+ randomNeedItem[2] +
            //     "\nWaterBottle : "+ randomNeedItem[3] +
            //     "\nFlareGun : "+ randomNeedItem[4] +
            //     "\nCompass : "+ randomNeedItem[5] +
            //     "\nBattery : "+ randomNeedItem[6] +
            //     "\nBackpack : "+ randomNeedItem[7] +
            //     "\nFirstAidKit : "+ randomNeedItem[8];
            /*
            Test Usage
             */
            var _TEXT = 'We need the following items Hurry up and save me!\n' +
                "\nRaft : " + 0 +
                "\nPaddle : " + 0 +
                "\nTorch : " + 1 +
                "\nWaterBottle : " + 2 +
                "\nFlareGun : " + 0 +
                "\nCompass : " + 0 +
                "\nBattery : " + 0 +
                "\nBackpack : " + 0 +
                "\nFirstAidKit : " + 0;

            // HARDCODE A QUEST
            const quest = {
                id: 'foo',
                title: _TITLE,
                text: _TEXT,
                // Raft: randomNeedItem[0],
                // Paddle: randomNeedItem[1],
                // Torch: randomNeedItem[2],
                // WaterBottle_3: randomNeedItem[3],
                // FlareGun: randomNeedItem[4],
                // Compass_Open: randomNeedItem[5],
                // Battery_Big: randomNeedItem[6],
                // Backpack: randomNeedItem[7],
                // FirstAidKit_Hard: randomNeedItem[8],

                // Test Usage
                Raft: 0,
                Paddle: 0,
                Torch: 1,
                WaterBottle_3: 2,
                FlareGun: 0,
                Compass_Open: 0,
                Battery_Big: 0,
                Backpack: 0,
                FirstAidKit_Hard: 0,

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