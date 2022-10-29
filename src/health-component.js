import {entity} from "./entity.js";
import {inventory_controller} from './inventory-controller.js';

export const health_component = (() => {

    class HealthComponent extends entity.Component {
        constructor(params) {
            super();
            this._health = params.health;
            this._maxHealth = params.maxHealth;
            this._params = params;
        }

        InitComponent() {
            this._RegisterHandler('health.damage', (m) => this._OnDamage(m));
            this._RegisterHandler('health.add-experience', (m) => this._OnAddExperience(m));

            this._UpdateUI();
        }

        IsAlive() {
            return this._health > 0;
        }

        _UpdateUI() {
            if (!this._params.updateUI) {
                return;
            }

            const bar = document.getElementById('health-bar');

            const healthAsPercentage = this._health / this._maxHealth;
            bar.style.width = Math.floor(200 * healthAsPercentage) + 'px';

            document.getElementById('stats-strength').innerText = this._params.strength;
            document.getElementById('stats-wisdomness').innerText = this._params.wisdomness;
            document.getElementById('stats-benchpress').innerText = this._params.benchpress;
            document.getElementById('stats-curl').innerText = this._params.curl;
            document.getElementById('stats-experience').innerText = this._params.experience;
        }

        _ComputeLevelXPRequirement() {
            const level = this._params.level;
            // Blah just something easy
            const xpRequired = Math.round(2 ** (level - 1) * 100);
            return xpRequired;
        }

        _OnAddExperience(msg) {
            this._params.experience += msg.value;
            const requiredExperience = this._ComputeLevelXPRequirement();
            if (this._params.experience < requiredExperience) {
                return;
            }

            this._params.level += 1;
            this._params.strength += 1;
            this._params.wisdomness += 1;
            this._params.benchpress += 1;
            this._params.curl += 2;

            const spawner = this.FindEntity(
                'level-up-spawner').GetComponent('LevelUpComponentSpawner');
            spawner.Spawn(this._parent._position);

            this.Broadcast({
                topic: 'health.levelGained',
                value: this._params.level,
            });

            this._UpdateUI();
        }

        _OnDeath(attacker) {
            if (attacker) {
                attacker.Broadcast({
                    topic: 'health.add-experience',
                    value: this._params.level * 100
                });
            }
            this.Broadcast({
                topic: 'health.death',
            });

            let ItemName;
            let ItemIcon;
            switch (this._parent._name) {
                case 'Raft.fbx' :
                    ItemName = 'Raft'
                    ItemIcon = 'pointy-Raft-64.png'
                    break;

                case 'Raft_Paddle.fbx' :
                    ItemName = 'Paddle'
                    ItemIcon = 'pointy-Raft_Paddle-64.png'
                    break;

                case 'Torch.fbx' :
                    ItemName = 'Torch'
                    ItemIcon = 'pointy-Torch-64.png'
                    break;

                case 'WaterBottle_3.fbx' :
                    ItemName = 'WaterBottle_3'
                    ItemIcon = 'pointy-WaterBottle_3-64.png'
                    break;

                case 'FlareGun.fbx' :
                    ItemName = 'FlareGun'
                    ItemIcon = 'pointy-FlareGun-64.png'
                    break;

                case 'Compass_Open.fbx' :
                    ItemName = 'Compass_Open'
                    ItemIcon = 'pointy-Compass_Open-64.png'
                    break;

                case 'Battery_Big.fbx' :
                    ItemName = 'Battery_Big'
                    ItemIcon = 'pointy-Battery_Big-64.png'
                    break;

                case 'Backpack.fbx' :
                    ItemName = 'Backpack'
                    ItemIcon = 'pointy-Backpack_tool-64.png'
                    break;

                case 'FirstAidKit_Hard.fbx' :
                    ItemName = 'FirstAidKit_Hard'
                    ItemIcon = 'pointy-FirstAidKit_Hard-64.png'
                    break;

            }
            //console.log("this")
            //console.log(this)
            // console.log("this par")
            // console.log(this._parent)
            // console.log("this par par ")
            // console.log(this._parent._parent)

            let Item = new entity.Entity();
            Item._name = ItemName
            Item._parent = this._parent._parent;
            Item.AddComponent(new inventory_controller.InventoryItem({
                  type: 'weapon',
                  damage: 3,
                  renderParams: {
                      name: ItemName,
                      scale: 0.25,
                      icon: ItemIcon,
                  },
              }));
            //console.log("Item")
            //console.log(Item)
            Item._parent.Add(Item, ItemName);
            //console.log("Item _parent")
            //console.log(Item._parent)
            const player = Item._parent.Filter((entityItem = Item._parent._entities) =>entityItem._name == 'player')
            console.log("player")
            console.log(player)
            player[0].Broadcast({
                topic: 'inventory.add',
                value: ItemName,
                added: false,
            });
        }

        _OnDamage(msg) {
            this._health = Math.max(0.0, this._health - msg.value);
            if (this._health == 0) {
                this._OnDeath(msg.attacker);
            }

            this.Broadcast({
                topic: 'health.update',
                health: this._health,
                maxHealth: this._maxHealth,
            });

            this._UpdateUI();
        }
    };

    return {
        HealthComponent: HealthComponent,
    };

})();