import {entity} from '../../src/entity.js';


export const ui_controller = (() => {

    class UIController extends entity.Component {
        constructor(params) {
            super();
            this._params = params;
            this._quests = {};
        }

        InitComponent() {
            // this._iconBar = {
            //     map    : document.getElementById('icon-bar-map'),
            // };
            //
            // this._ui = {
            //     map    : document.getElementById('map'),
            // };
            //
            // this._iconBar.map.onclick = (m) => {
            //     this._OnStatsClicked(m);
            // };
            //
            // this._HideUI();
        }

        _HideUI() {
            // this._ui.map.style.visibility = 'hidden';
        }

        // _OnStatsClicked(msg) {
        //     const visibility = this._ui.map.style.visibility;
        //     this._HideUI();
        //     this._ui.map.style.visibility = (visibility ? '' : 'hidden');
        // }

        Update(timeInSeconds) {
        }
    }

    return {
        UIController: UIController,
    };

})();