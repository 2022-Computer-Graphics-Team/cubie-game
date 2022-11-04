import {entity} from './entity.js';


/**
 * main function:
 *  - 인벤토리 개수 조정
 *  - 인벤토리 내부 커스텀
 *  - 인벤토리 내 무기로 변경 (더블 클릭)
 */
export const inventory_controller = (() => {

    class InventoryController extends entity.Component {
        constructor(params) {
            super();

            this._inventory = {};

            // 인벤토리 개수를 16개로 제한
            for (let i = 1; i <= 16; ++i) {
                this._inventory['inventory-' + i] = {
                    type : 'inventory',
                    value: null,
                };
            }

            // 무기 변경 없앤다는 가정 하에 주석 처리
            /*
              for (let i = 1; i <= 8; ++i) {
                  this._inventory['inventory-equip-' + i] = {
                      type : 'equip',
                      value: null,
                  };
              }
             */
        }

        InitComponent() {
            this._RegisterHandler('inventory.add', (m) => this._OnInventoryAdded(m));

            const _SetupElement = (n) => {
                const element = document.getElementById(n);

                element.ondblclick = (ev) => {
                    this._OnItemChanged(element);
                }

                // element.ondragstart = (ev) => {
                //     ev.dataTransfer.setData('text/plain', n);
                // };
                // element.ondragover = (ev) => {
                //     ev.preventDefault();
                // };
                // element.ondrop = (ev) => {
                //     ev.preventDefault();
                //     const data = ev.dataTransfer.getData('text/plain');
                //     const other = document.getElementById(data);
                //
                //     this._OnItemDropped(other, element);
                // };
            }

            for (let k in this._inventory) {
                _SetupElement(k);
            }
        }

        // 아이템이 드롭되었을 때
        // CHANGED: 아이템 드래그에서 더블 클릭으로 변경 -> 없애기
        _OnItemChanged(newElement) {
            const newItem = this._inventory[newElement.id];
            const newValue = newItem.value;

            // this._SetItemAtSlot(newElement.id, oldValue);

            if (newItem.type === 'equip') {
                this.Broadcast({
                    topic: 'inventory.equip',
                    value: newValue,
                    added: false,
                });
            }
        }

        _SetItemAtSlot(slot, itemName) {
            const div = document.getElementById(slot);
            const obj = this.FindEntity(itemName);
            if (obj) {
                const item = obj.GetComponent('InventoryItem');
                const path = '../map3/resources/icons/' + item.RenderParams.icon;
                div.style.backgroundImage = "url('" + path + "')";
            } else {
                div.style.backgroundImage = '';
            }
            this._inventory[slot].value = itemName;
        }

        _OnInventoryAdded(msg) {
            for (let k in this._inventory) {
                if (!this._inventory[k].value && this._inventory[k].type === 'inventory') {
                    this._inventory[k].value = msg.value;
                    msg.added = true;

                    this._SetItemAtSlot(k, msg.value);

                    break;
                }
            }
        }

        GetItemByName(name) {
            for (let k in this._inventory) {
                if (this._inventory[k].value === name) {
                    return this.FindEntity(name);
                }
            }
            return null;
        }
    }

    class InventoryItem extends entity.Component {
        constructor(params) {
            super();
            this._params = params;
        }

        InitComponent() {
        }

        get Params() {
            return this._params;
        }

        get RenderParams() {
            return this._params.renderParams;
        }
    }

    return {
        InventoryController: InventoryController,
        InventoryItem      : InventoryItem,
    };

})();