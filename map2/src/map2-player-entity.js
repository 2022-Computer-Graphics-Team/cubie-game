import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';

import {finite_state_machine} from '../../src/finite-state-machine.js';
import {entity} from '../../src/entity.js';
import {player_state} from '../../src/player-state.js';
import {inventory_controller} from "../../src/inventory-controller.js";

let pickFlag = false;
export const player_entity = (() => {

    class CharacterFSM extends finite_state_machine.FiniteStateMachine {
        constructor(proxy) {
            super();
            this._proxy = proxy;
            this._Init();
        }

        _Init() {
            this._AddState('idle', player_state.IdleState);
            this._AddState('walk', player_state.WalkState);
            this._AddState('run', player_state.RunState);
            this._AddState('attack', player_state.AttackState);
            this._AddState('death', player_state.DeathState);
            this._AddState('pick', player_state.PickState);
        }
    }

    class BasicCharacterControllerProxy {
        constructor(animations) {
            this._animations = animations;
        }

        get animations() {
            return this._animations;
        }
    }

    class BasicCharacterController extends entity.Component {
        constructor(params) {
            super();
            this._Init(params);
        }

        _Init(params) {
            this._params = params;
            this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
            this._acceleration = new THREE.Vector3(1, 0.125, 50.0);
            this._velocity = new THREE.Vector3(0, 0, 0);
            this._position = new THREE.Vector3();

            this._animations = {};
            this._stateMachine = new CharacterFSM(
                new BasicCharacterControllerProxy(this._animations));

            this._LoadModels();
        }

        InitComponent() {
            this._RegisterHandler('health.death', (m) => {
                this._OnDeath(m);
            });
        }

        _OnDeath(msg) {
            this._stateMachine.SetState('death');

            setTimeout(function () {
                window.location.replace('../fail_to_map2.html')
            }, 5000);
        }

        /**
         * 캐릭터 모델 로드
         */
        _LoadModels() {
            const loader = new FBXLoader();
            loader.setPath('../../resources/character/');
            loader.load('Boy.fbx', (fbx) => {
                this._target = fbx;
                this._target.scale.setScalar(0.035);
                this._params.scene.add(this._target);

                this._bones = {};

                for (let b of this._target.children[1].skeleton.bones) {
                    this._bones[b.name] = b;
                }

                this._target.traverse(c => {
                    c.castShadow = false;
                    c.receiveShadow = false;
                    if (c.material && c.material.map) {
                        c.material.map.encoding = THREE.sRGBEncoding;
                    }
                });

                this.Broadcast({
                    topic: 'load.character',
                    model: this._target,
                    bones: this._bones,
                });

                this._mixer = new THREE.AnimationMixer(this._target);

                const _OnLoad = (animName, anim) => {
                    const clip = anim.animations[0];
                    const action = this._mixer.clipAction(clip);

                    this._animations[animName] = {
                        clip  : clip,
                        action: action,
                    };
                };

                this._manager = new THREE.LoadingManager();
                this._manager.onLoad = () => {
                    this._stateMachine.SetState('idle');

                    // 여기서 모든 FBX 로드가 끝났다고 보고 진행하기
                    document.getElementById('loading').style.visibility = 'hidden';
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('ui').style.visibility = 'visible';
                    document.getElementById('ui').style.display = 'initial';
                };

                const loader = new FBXLoader(this._manager);
                loader.setPath('../../resources/character/');
                loader.load('Sword And Shield Idle.fbx', (a) => {
                    _OnLoad('idle', a);
                });
                loader.load('Sword And Shield Run.fbx', (a) => {
                    _OnLoad('run', a);
                });
                loader.load('Sword And Shield Walk.fbx', (a) => {
                    _OnLoad('walk', a);
                });
                loader.load('Sword And Shield Slash.fbx', (a) => {
                    _OnLoad('attack', a);
                });
                loader.load('Sword And Shield Death.fbx', (a) => {
                    _OnLoad('death', a);
                });
                loader.load('Picking Up.fbx', (a) => {
                    _OnLoad('pick', a);
                });

                loader.load();
            });

        }

        _FindIntersections(pos) {
            const _IsAlive = (c) => {
                const h = c.entity.GetComponent('HealthComponent');
                if (!h) {
                    return true;
                }
                return h._health > 0;
            };

            const grid = this.GetComponent('SpatialGridController');
            const nearby = grid.FindNearbyEntities(5).filter(e => _IsAlive(e));
            const collisions = [];

            for (let i = 0; i < nearby.length; ++i) {
                const e = nearby[i].entity;
                const d = ((pos.x - e._position.x) ** 2 + (pos.z - e._position.z) ** 2) ** 0.5;

                if (d <= 4) {
                    collisions.push(nearby[i].entity);
                }
            }

            //console.log(pos.x + " " + pos.z + " " + pickFlag)
            if ((pos.x >= 300 && pos.x < 400) && (pos.z >= -550 && pos.z <= -500) && (pickFlag == true)) {
                let Item = new entity.Entity();
                Item._name = "key";
                Item._parent = this._parent._parent;
                Item.AddComponent(new inventory_controller.InventoryItem({
                    type        : 'weapon',
                    damage      : 3,
                    renderParams: {
                        name : "key",
                        scale: 0.25,
                        icon : "key.png",
                    },
                }));
                Item._parent.Add(Item, "key");
                const player = Item._parent.Filter((entityItem = Item._parent._entities) => entityItem._name == 'player')
                player[0].Broadcast({
                    topic: 'inventory.add',
                    value: "key",
                    added: false,
                });
                pickFlag = false;
            }

            if ((pos.x >= 300 && pos.x < 400) && (pos.z >= -500 && pos.z <= -470) && (pickFlag == true)) {
                let Item = new entity.Entity();
                Item._name = "treasure";
                Item._parent = this._parent._parent;
                Item.AddComponent(new inventory_controller.InventoryItem({
                    type        : 'weapon',
                    damage      : 3,
                    renderParams: {
                        name : "treasure",
                        scale: 0.25,
                        icon : "treasure.png",
                    },
                }));
                Item._parent.Add(Item, "treasure");
                const player = Item._parent.Filter((entityItem = Item._parent._entities) => entityItem._name == 'player')
                player[0].Broadcast({
                    topic: 'inventory.add',
                    value: "treasure",
                    added: false,
                });
                pickFlag = false;
            }
            //console.log(this._parent._parent)
            var key = this._parent._parent.Filter((entityItem = this._parent._entities) => entityItem._name == 'key').length
            var treasure = this._parent._parent.Filter((entityItem = this._parent._entities) => entityItem._name == 'treasure').length

            //console.log(pos.x + " " + pos.z + " " + key + " " + treasure)
            if (key >= 1 && treasure >= 1 && (pos.x >= 50 && pos.x < 150) && (pos.z >= 50 && pos.z <= 150)) {
                // 다음 스테이지로 넘어가는 부분
                window.location.replace('../../map3/map3.html')
            }

            return collisions;
        }

        Update(timeInSeconds) {
            if (!this._stateMachine._currentState) {
                return;
            }

            const input = this.GetComponent('BasicCharacterControllerInput');
            this._stateMachine.Update(timeInSeconds, input);

            if (this._mixer) {
                this._mixer.update(timeInSeconds);
            }
            if (this._stateMachine._currentState._action) {
                this.Broadcast({
                    topic : 'player.action',
                    action: this._stateMachine._currentState.Name,
                    time  : this._stateMachine._currentState._action.time,
                });
            }

            const currentState = this._stateMachine._currentState;

            if (currentState.Name == 'pick') {
                pickFlag = true;
                // 열쇠 위치
                if (currentState.Name != 'walk' &&
                    currentState.Name != 'run' &&
                    currentState.Name != 'idle') {
                    return;
                }
            }

            const velocity = this._velocity;
            const frameDecceleration = new THREE.Vector3(
                velocity.x * this._decceleration.x,
                velocity.y * this._decceleration.y,
                velocity.z * this._decceleration.z
            );
            frameDecceleration.multiplyScalar(timeInSeconds);
            frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
                Math.abs(frameDecceleration.z), Math.abs(velocity.z));

            velocity.add(frameDecceleration);

            const controlObject = this._target;
            const _Q = new THREE.Quaternion();
            const _A = new THREE.Vector3();
            const _R = controlObject.quaternion.clone();

            const acc = this._acceleration.clone();
            if (input._keys.shift) {
                acc.multiplyScalar(3.0);
            }

            if (input._keys.forward) {
                velocity.z += acc.z * timeInSeconds;
            }
            if (input._keys.backward) {
                velocity.z -= acc.z * timeInSeconds;
            }
            if (input._keys.left) {
                _A.set(0, 1, 0);
                _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this._acceleration.y);
                _R.multiply(_Q);
            }
            if (input._keys.right) {
                _A.set(0, 1, 0);
                _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this._acceleration.y);
                _R.multiply(_Q);
            }

            controlObject.quaternion.copy(_R);

            const oldPosition = new THREE.Vector3();
            oldPosition.copy(controlObject.position);

            const forward = new THREE.Vector3(0, 0, 1);
            forward.applyQuaternion(controlObject.quaternion);
            forward.normalize();

            const sideways = new THREE.Vector3(1, 0, 0);
            sideways.applyQuaternion(controlObject.quaternion);
            sideways.normalize();

            sideways.multiplyScalar(velocity.x * timeInSeconds);
            forward.multiplyScalar(velocity.z * timeInSeconds);

            const pos = controlObject.position.clone();
            pos.add(forward);
            pos.add(sideways);

            const collisions = this._FindIntersections(pos);
            if (collisions.length > 0) {
                return;
            }

            controlObject.position.copy(pos);
            this._position.copy(pos);

            this._parent.SetPosition(this._position);
            this._parent.SetQuaternion(this._target.quaternion);
        }
    }

    return {
        BasicCharacterControllerProxy: BasicCharacterControllerProxy,
        BasicCharacterController     : BasicCharacterController,
    };

})();
