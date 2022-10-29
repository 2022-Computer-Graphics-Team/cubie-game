import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';

import {third_person_camera} from './third-person-camera.js';
import {entity_manager} from './entity-manager.js';
import {player_entity} from './player-entity.js'
import {entity} from './entity.js';
import {gltf_component} from './gltf-component.js';
import {health_component} from './health-component.js';
import {player_input} from './player-input.js';
import {npc_entity} from './npc-entity.js';
import {math} from './math.js';
import {spatial_hash_grid} from './spatial-hash-grid.js';
import {ui_controller} from './ui-controller.js';
import {health_bar} from './health-bar.js';
import {level_up_component} from './level-up-component.js';
import {quest_component} from './quest-component.js';
import {spatial_grid_controller} from './spatial-grid-controller.js';
import {inventory_controller} from './inventory-controller.js';
import {equip_weapon_component} from './equip-weapon-component.js';
import {attack_controller} from './attacker-controller.js';

const _VS = `
varying vec3 vWorldPosition;

void main() {
  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  vWorldPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;


const _FS = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;

varying vec3 vWorldPosition;

void main() {
  float h = normalize( vWorldPosition + offset ).y;
  gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
}`;


class HackNSlashDemo {
    constructor() {
        this._Initialize();
    }

    _Initialize() {
        this._threejs = new THREE.WebGLRenderer({
            antialias: true,
        });
        this._threejs.outputEncoding = THREE.sRGBEncoding;
        this._threejs.gammaFactor = 2.2;
        this._threejs.shadowMap.enabled = true;
        this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
        this._threejs.setPixelRatio(window.devicePixelRatio);
        this._threejs.setSize(window.innerWidth - 1, window.innerHeight - 5);
        this._threejs.domElement.id = 'threejs';

        document.getElementById('container').appendChild(this._threejs.domElement);

        window.addEventListener('resize', () => {
            this._OnWindowResize();
        }, false);

        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 1.0;
        const far = 10000.0;
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(25, 10, 25);

        this._scene = new THREE.Scene();
        this._scene.background = new THREE.Color(0xFFFFFF);
        this._scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);

        let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
        light.position.set(-10, 500, 10);
        light.target.position.set(0, 0, 0);
        light.castShadow = true;
        light.shadow.bias = -0.001;
        light.shadow.mapSize.width = 4096;
        light.shadow.mapSize.height = 4096;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 1000.0;
        light.shadow.camera.left = 100;
        light.shadow.camera.right = -100;
        light.shadow.camera.top = 100;
        light.shadow.camera.bottom = -100;
        this._scene.add(light);

        this._sun = light;

        const textureLoader = new THREE.TextureLoader();
        const sand = textureLoader.load('./resources/folder_1_beach_island/textures/SandCastleMaterial_baseColor.png')
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(1200, 1200, 0, 0),
            new THREE.MeshStandardMaterial({
                map: sand
            }));

        plane.castShadow = false;
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        this._scene.add(plane);

        this._entityManager = new entity_manager.EntityManager();
        this._grid = new spatial_hash_grid.SpatialHashGrid(
            [[-1000, -1000], [1000, 1000]], [100, 100]);

        this._LoadSea();
        this._LoadFoliage()
        this._LoadControllers();
        this._LoadPlayer();
        this._LoadClouds();
        this._LoadSky();
        this._previousRAF = null;
        this._RAF();
    }

    _LoadSea() {
        const e = new entity.Entity();
        var pos = new THREE.Vector3(1500, 50, 0)
        e.AddComponent(new gltf_component.StaticModelComponent({
            scene: this._scene,
            resourcePath: './resources/folder_1_beach_island/',
            resourceName: 'sea.gltf',
            scale: //Math.random() * 5 + 10,
                2.5,
            position: pos,
        }));

        e.SetPosition(pos);
        this._entityManager.Add(e, 'sea1');
        e.SetActive(false);

        const e2 = new entity.Entity();
        var pos = new THREE.Vector3(-1500, 50, 0)
        e2.AddComponent(new gltf_component.StaticModelComponent({
            scene: this._scene,
            resourcePath: './resources/folder_1_beach_island/',
            resourceName: 'sea.gltf',
            scale: 2.5,
            position: pos,
        }));
        e2.SetPosition(pos);
        this._entityManager.Add(e2, 'sea2');
        e2.SetActive(false);

        const e3 = new entity.Entity();
        var pos = new THREE.Vector3(0, 30, 850)
        e3.AddComponent(new gltf_component.StaticModelComponent({
            scene: this._scene,
            resourcePath: './resources/folder_1_beach_island/',
            resourceName: 'sea.gltf',
            scale: 2.5,
            position: pos,
        }));
        e3.SetPosition(pos);
        this._entityManager.Add(e3, 'sea3');
        e3.SetActive(false);

        const e4 = new entity.Entity();
        var pos = new THREE.Vector3(0, 30, -850)
        e4.AddComponent(new gltf_component.StaticModelComponent({
            scene: this._scene,
            resourcePath: './resources/folder_1_beach_island/',
            resourceName: 'sea.gltf',
            scale: 2.5,
            position: pos,
        }));
        e4.SetPosition(pos);
        this._entityManager.Add(e4, 'sea4');
        e4.SetActive(false);
    }

    _LoadControllers() {
        const ui = new entity.Entity();
        ui.AddComponent(new ui_controller.UIController());
        this._entityManager.Add(ui, 'ui');
    }

    _LoadFoliage() {
        for (let i = 0; i < 150; ++i) {
            const names = [
                'CommonTree_Dead', 'CommonTree',
                'BirchTree', 'BirchTree_Dead',
                'Willow', 'Willow_Dead',
                'PineTree', 'Rock'
            ];
            const name = names[math.rand_int(0, names.length - 1)];
            const index = math.rand_int(1, 5);

            const pos = new THREE.Vector3(
                (Math.random() * 2.0 - 1.0) * 500,
                0,
                (Math.random() * 2.0 - 1.0) * 500);

            const e = new entity.Entity();
            e.AddComponent(new gltf_component.StaticModelComponent({
                scene: this._scene,
                resourcePath: './resources/nature/FBX/',
                resourceName: name + '_' + index + '.fbx',
                scale: 0.25,
                emissive: new THREE.Color(0x000000),
                specular: new THREE.Color(0x000000),
                receiveShadow: true,
                castShadow: true,
            }));
            e.AddComponent(
                new spatial_grid_controller.SpatialGridController({grid: this._grid}));
            e.SetPosition(pos);
            this._entityManager.Add(e, 'Foliage');
            e.SetActive(false);
        }
    }

    _LoadSky() {
        const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFFF, 0.6);
        hemiLight.color.setHSL(0.6, 1, 0.6);
        hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        this._scene.add(hemiLight);

        const uniforms = {
            "topColor": {value: new THREE.Color(0x0077ff)},
            "bottomColor": {value: new THREE.Color(0xffffff)},
            "offset": {value: 33},
            "exponent": {value: 0.6}
        };
        uniforms["topColor"].value.copy(hemiLight.color);

        this._scene.fog.color.copy(uniforms["bottomColor"].value);

        const skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: _VS,
            fragmentShader: _FS,
            side: THREE.BackSide
        });

        const sky = new THREE.Mesh(skyGeo, skyMat);
        this._scene.add(sky);
    }

    _LoadClouds() {
        for (let i = 0; i < 30; ++i) {
            const index = math.rand_int(1, 3);
            const pos = new THREE.Vector3(
                (Math.random() * 2.0 - 1.0) * 500,
                100,
                (Math.random() * 2.0 - 1.0) * 500);

            const e = new entity.Entity();
            e.AddComponent(new gltf_component.StaticModelComponent({
                scene: this._scene,
                resourcePath: './resources/nature2/GLTF/',
                resourceName: 'Cloud' + index + '.glb',
                position: pos,
                scale: Math.random() * 5 + 10,
                emissive: new THREE.Color(0x808080),
            }));
            e.SetPosition(pos);
            this._entityManager.Add(e, 'cloud');
            e.SetActive(false);
        }
    }

    _LoadPlayer() {
        const params = {
            camera: this._camera,
            scene: this._scene,
        };

        const levelUpSpawner = new entity.Entity();
        levelUpSpawner.AddComponent(new level_up_component.LevelUpComponentSpawner({
            camera: this._camera,
            scene: this._scene,
        }));
        this._entityManager.Add(levelUpSpawner, 'level-up-spawner');

        const axe = new entity.Entity();
        axe.AddComponent(new inventory_controller.InventoryItem({
            type: 'weapon',
            damage: 3,
            renderParams: {
                name: 'Axe',
                scale: 0.25,
                icon: 'war-axe-64.png',
            },
        }));
        this._entityManager.Add(axe, 'axe');

        const sword = new entity.Entity();
        sword.AddComponent(new inventory_controller.InventoryItem({
            type: 'weapon',
            damage: 3,
            renderParams: {
                name: 'Sword',
                scale: 0.25,
                icon: 'pointy-sword-64.png',
            },
        }));
        this._entityManager.Add(sword, 'sword');

        const girl = new entity.Entity();
        girl.AddComponent(new gltf_component.AnimatedModelComponent({
            scene: this._scene,
            resourcePath: './resources/girl/',
            resourceName: 'peasant_girl.fbx',
            resourceAnimation: 'Standing Idle.fbx',
            scale: 0.035,
            receiveShadow: true,
            castShadow: true,
        }));
        girl.AddComponent(new spatial_grid_controller.SpatialGridController({
            grid: this._grid,
        }));
        girl.AddComponent(new player_input.PickableComponent());
        girl.AddComponent(new quest_component.QuestComponent());
        girl.SetPosition(new THREE.Vector3(30, 0, 0));
        this._entityManager.Add(girl, 'girl');

        const player = new entity.Entity();
        player.AddComponent(new player_input.BasicCharacterControllerInput(params));
        player.AddComponent(new player_entity.BasicCharacterController(params));
        player.AddComponent(
            new equip_weapon_component.EquipWeapon({anchor: 'RightHandIndex1'}));
        player.AddComponent(new inventory_controller.InventoryController(params));
        player.AddComponent(new health_component.HealthComponent({
            updateUI: true,
            health: 100,
            maxHealth: 100,
            strength: 50,
            wisdomness: 5,
            benchpress: 20,
            curl: 100,
            experience: 0,
            level: 1,
        }));
        player.AddComponent(
            new spatial_grid_controller.SpatialGridController({grid: this._grid}));
        player.AddComponent(new attack_controller.AttackController({timing: 0.7}));
        this._entityManager.Add(player, 'player');

        player.Broadcast({
            topic: 'inventory.add',
            value: axe.Name,
            added: false,
        });

        player.Broadcast({
            topic: 'inventory.add',
            value: sword.Name,
            added: false,
        });

        player.Broadcast({
            topic: 'inventory.equip',
            value: sword.Name,
            added: false,

        });
        console.log("main player")
        console.log(player)
        const camera = new entity.Entity();
        camera.AddComponent(
            new third_person_camera.ThirdPersonCamera({
                camera: this._camera,
                target: this._entityManager.Get('player')
            }));
        this._entityManager.Add(camera, 'player-camera');
        for (let i = 0; i < 20; i++) {
            const tool_Item = [
                {
                    resourceName: 'Raft.fbx'
                },
                {
                    resourceName: 'Raft_Paddle.fbx'
                },
                {
                    resourceName: 'Torch.fbx'
                },
                {
                    resourceName: 'WaterBottle_3.fbx'
                },
                {
                    resourceName: 'FlareGun.fbx'
                },
                {
                    resourceName: 'Compass_Open.fbx'
                },
                {
                    resourceName: 'Battery_Big.fbx'
                },
                {
                    resourceName: 'Backpack.fbx'
                },
                {
                    resourceName: 'FirstAidKit_Hard.fbx'
                }

            ];
            let m = null;

            // 무조건 한 번씩 나올 수 있도록 생성
            if (i < 9) {
                m = tool_Item[i];
            }
            // 한 번씩 출력된 이후에는 랜덤으로 추가 생성
            else {
                m = tool_Item[math.rand_int(0, tool_Item.length - 1)];
            }
            const tool = new entity.Entity();

            const pos = new THREE.Vector3(
                (Math.random() * 2.0 - 1.0) * 300,
                1.5,
                (Math.random() * 2.0 - 1.0) * 300);

            tool.AddComponent(new gltf_component.StaticModelComponent({
                scene: this._scene,
                resourcePath: './resources/Survival_Pack/FBX/',
                resourceName: m.resourceName,
                scale: 0.05,
                position: pos,
                receiveShadow: true,
                castShadow: true,
            }));
            tool.AddComponent(
                new health_component.HealthComponent({
                    health: 50,
                    maxHealth: 50,
                    strength: 2,
                    wisdomness: 0,
                    benchpress: 0,
                    curl: 0,
                    experience: 0,
                    level: 1,
                }));
            tool.AddComponent(
                new spatial_grid_controller.SpatialGridController({grid: this._grid}));
            tool.AddComponent(new health_bar.HealthBar({
                parent: this._scene,
                camera: this._camera,
            }));
            tool.SetPosition(pos);
            let entityName = m.resourceName;
            this._entityManager.Add(tool, entityName);
        }
        console.log(this)
    }

    _OnWindowResize() {
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._threejs.setSize(window.innerWidth, window.innerHeight);
    }

    _UpdateSun() {
        const player = this._entityManager.Get('player');
        const pos = player._position;

        this._sun.position.copy(pos);
        this._sun.position.add(new THREE.Vector3(-10, 500, -10));
        this._sun.target.position.copy(pos);
        this._sun.updateMatrixWorld();
        this._sun.target.updateMatrixWorld();
    }

    _RAF() {
        requestAnimationFrame((t) => {
            if (this._previousRAF === null) {
                this._previousRAF = t;
            }

            this._RAF();

            this._threejs.render(this._scene, this._camera);
            this._Step(t - this._previousRAF);
            //console.log(this)
            this._previousRAF = t;
        });
    }

    _Step(timeElapsed) {
        const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);

        this._UpdateSun();

        this._entityManager.Update(timeElapsedS);
    }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
    _APP = new HackNSlashDemo();
});
