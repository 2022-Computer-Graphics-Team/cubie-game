import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';

import {third_person_camera} from '../../src/third-person-camera.js';
import {first_person_camera} from '../../src/first-person-camera.js';

import {attack_controller} from '../../src/attacker-controller.js';
import {entity} from '../../src/entity.js';
import {entity_manager} from '../../src/entity-manager.js';
import {gltf_component} from '../../src/gltf-component.js';
import {health_bar} from '../../src/health-bar.js';
import {inventory_controller} from '../../src/inventory-controller.js';
import {math} from '../../src/math.js';
import {level_up_component} from '../../src/particle-effect.js';
import {player_input} from '../../src/player-input.js';
import {spatial_grid_controller} from '../../src/spatial-grid-controller.js';
import {spatial_hash_grid} from '../../src/spatial-hash-grid.js';

import {equip_weapon_component} from './map1-equip-weapon-component.js';
import {npc_entity} from './map1-npc-entity.js';
import {health_component} from './map1-object-hp.js';
import {player_entity} from './map1-player-entity.js';
import {ui_controller} from './map1-ui-controller.js';


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


class Map1 {
    constructor() {
        this._Initialize();
    }

    _Initialize() {
        // 로딩바만을 보여주기 위해 나머지 레이아웃을 숨긴다.
        document.getElementById('ui').style.visibility = 'hidden';
        document.getElementById('ui').style.display = 'none';

        this._threejs = new THREE.WebGLRenderer({
            antialias: true,
        });
        this._threejs.outputEncoding = THREE.sRGBEncoding;
        this._threejs.gammaFactor = 2.2;
        this._threejs.shadowMap.enabled = true;
        this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
        this._threejs.setPixelRatio(window.devicePixelRatio);
        this._threejs.setSize(window.innerWidth, window.innerHeight);
        this._threejs.domElement.id = 'threejs';

        document.getElementById('container').appendChild(this._threejs.domElement);

        window.addEventListener('resize', () => {
            this._OnWindowResize();
        }, false);

        /* 카메라 */

        // this._SetThirdPersonCamera()

        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 1.0;
        const far = 10000.0;
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(26, 10, 25);

        this._scene = new THREE.Scene();
        this._scene.background = new THREE.Color(0xFFFFFF);
        this._scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);

        /* 광원 */

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

        /* 텍스처 */

        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(5000, 5000, 10, 10),
            new THREE.MeshStandardMaterial({
                color: 0x1e601c,
            }));

        plane.castShadow = false;
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        this._scene.add(plane);

        /* 엔티티 */

        this._entityManager = new entity_manager.EntityManager();
        this._grid = new spatial_hash_grid.SpatialHashGrid(
            [[-1000, -1000], [1000, 1000]], [100, 100]);

        // NOTE: 로딩바를 위해선 _LoadPlayer() 함수가 맨 밑에 와야 함.
        this._LoadControllers();
        this._LoadFoliage();
        this._LoadClouds();
        this._LoadSky();
        this._LoadHouse();
        this._LoadPortal();
        this._LoadPlayer();

        const e1 = new entity.Entity();
        var pos = new THREE.Vector3(2000, 100, 100)
        e1.AddComponent(new gltf_component.StaticModelComponent({
            scene       : this._scene,
            resourcePath: './resources/forest1/',
            resourceName: 'scene.gltf',
            scale       : // Math.random() * 5 + 10,
                10,
            position    : pos,
        }));
        e1.SetPosition(pos);
        this._entityManager.Add(e1);
        e1.SetActive(false);

        this._previousRAF = null;
        this._RAF();
    }

    /**
     * 엔티티 컨트롤러
     */
    _LoadControllers() {
        const ui = new entity.Entity();
        ui.AddComponent(new ui_controller.UIController());
        this._entityManager.Add(ui, 'ui');
    }

    /**
     * 맵: 하늘
     */
    _LoadSky() {
        const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFFF, 0.6);
        hemiLight.color.setHSL(0.6, 1, 0.6);
        hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        this._scene.add(hemiLight);

        const uniforms = {
            "topColor"   : {value: new THREE.Color(0x0077ff)},
            "bottomColor": {value: new THREE.Color(0xffffff)},
            "offset"     : {value: 33},
            "exponent"   : {value: 0.6}
        };
        uniforms["topColor"].value.copy(hemiLight.color);

        this._scene.fog.color.copy(uniforms["bottomColor"].value);

        const skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
        const skyMat = new THREE.ShaderMaterial({
            uniforms      : uniforms,
            vertexShader  : _VS,
            fragmentShader: _FS,
            side          : THREE.BackSide
        });

        const sky = new THREE.Mesh(skyGeo, skyMat);
        this._scene.add(sky);
    }

    /**
     * 맵: 구름
     */
    _LoadClouds() {
        for (let i = 0; i < 20; ++i) {
            const index = math.rand_int(1, 3);
            const pos = new THREE.Vector3(
                0,
                100,
                (Math.random() * 2.0 - 1.0) * 500);

            const e = new entity.Entity();
            e.AddComponent(new gltf_component.StaticModelComponent({
                scene       : this._scene,
                resourcePath: './resources/nature/GLTF/',
                resourceName: 'Cloud' + index + '.glb',
                position    : pos,
                scale       : Math.random() * 5 + 10,
                emissive    : new THREE.Color(0x808080),
            }));
            e.SetPosition(pos);
            this._entityManager.Add(e);
            e.SetActive(false);
        }
    }

    /**
     * 맵: 포탈
     */
    _LoadPortal() {
        const pos = new THREE.Vector3(
            (1 * 2.0 - 1.0) * 500 - 100,
            -6,
            (1 * 2.0 - 1.0) * 500 - 130);

        const e = new entity.Entity();
        e.AddComponent(new gltf_component.StaticModelComponent({
            scene        : this._scene,
            resourcePath : './resources/magic_portal/',
            resourceName : 'scene.gltf',
            scale        : 14,
            emissive     : new THREE.Color(0x000000),
            specular     : new THREE.Color(0x000000),
            receiveShadow: true,
            castShadow   : true,
        }));
        e.AddComponent(
            new spatial_grid_controller.SpatialGridController({grid: this._grid}));
        e.SetPosition(pos);
        this._entityManager.Add(e);
        e.SetActive(false);

    }

    /**
     * 맵: 집
     */
    _LoadHouse() {
        const pos = new THREE.Vector3(
            (1 * 2.0 - 1.0) * 500 - 100,
            0,
            (1 * 2.0 - 1.0) * 500 - 100);

        const e = new entity.Entity();
        e.AddComponent(new gltf_component.StaticModelComponent({
            scene        : this._scene,
            resourcePath : './resources/medieval_tower/',
            resourceName : 'scene.gltf',
            scale        : 0.1,
            emissive     : new THREE.Color(0x000000),
            specular     : new THREE.Color(0x000000),
            receiveShadow: true,
            castShadow   : true,
        }));
        e.AddComponent(
            new spatial_grid_controller.SpatialGridController({grid: this._grid}));
        e.SetPosition(pos);
        this._entityManager.Add(e);
        e.SetActive(false);
    }

    /**
     * 맵: 자연 구조물
     */
    _LoadFoliage() {
        for (let i = 0; i < 30; ++i) {
            const names = [
                'CommonTree_Dead', 'CommonTree',
                'BirchTree', 'BirchTree_Dead',
                'Willow', 'Willow_Dead',
                'PineTree',
            ];
            const name = names[math.rand_int(0, names.length - 1)];
            const index = math.rand_int(1, 5);

            const pos = new THREE.Vector3(
                (Math.random() * 2.0 - 1.0) * 500,
                5,
                (Math.random() * 2.0 - 1.0) * 500 - 400);

            if (pos.x >= (1 * 2.0 - 1.0) * 500 - 70 || pos.x <= (1 * 2.0 - 1.0) * 500 - 170 && pos.y != 0 && pos.z <= (1 * 2.0 - 1.0) * 500 - 100) {

                const e = new entity.Entity();
                e.AddComponent(new gltf_component.StaticModelComponent({
                    scene        : this._scene,
                    resourcePath : './resources/forest1/',
                    resourceName : 'scene.gltf',
                    scale        : 6,
                    emissive     : new THREE.Color(0x000000),
                    specular     : new THREE.Color(0x000000),
                    receiveShadow: true,
                    castShadow   : true,
                }));
                e.AddComponent(
                    new spatial_grid_controller.SpatialGridController({grid: this._grid}));
                e.SetPosition(pos);
                this._entityManager.Add(e);
                e.SetActive(false);
            }
        }
    }

    /**
     * 플레이어
     */
    _LoadPlayer() {
        const object = this

        const params = {
            camera: this._camera,
            scene : this._scene,
        };

        /* 레벨업 효과 파티클 */

        const levelUpSpawner = new entity.Entity();
        levelUpSpawner.AddComponent(new level_up_component.LevelUpComponentSpawner({
            camera: this._camera,
            scene : this._scene,
        }));
        this._entityManager.Add(levelUpSpawner, 'level-up-spawner');

        /* 무기: 검 */

        const sword = new entity.Entity();
        sword.AddComponent(new inventory_controller.InventoryItem({
            type        : 'weapon',
            damage      : 3,
            renderParams: {
                name : 'Sword',
                scale: 0.25,
                icon : 'pointy-sword-64.png',
            },
        }));
        this._entityManager.Add(sword);

        /* 무기: 도끼 */

        const axe = new entity.Entity();
        axe.AddComponent(new inventory_controller.InventoryItem({
            type        : 'weapon',
            damage      : 3,
            renderParams: {
                name : 'Axe',
                scale: 0.25,
                icon : 'war-axe-64.png',
            },
        }));
        this._entityManager.Add(axe);

        /* 캐릭터 */
        const player = new entity.Entity();
        player.AddComponent(new player_input.BasicCharacterControllerInput(params));
        player.AddComponent(new player_entity.BasicCharacterController(params));
        // player.AddComponent(new equip_weapon_component.EquipWeapon({anchor: 'RightHandIndex1'}));
        // player.AddComponent(new equip_weapon_component.EquipWeapon({anchor: 'mixamorig6RightHandIndex1'}));
        player.AddComponent(new equip_weapon_component.EquipWeapon({anchor: 'RightHand'}));
        player.AddComponent(new inventory_controller.InventoryController(params));
        player.AddComponent(new health_component.HealthComponent({
            updateUI  : true,
            health    : 100,
            maxHealth : 100,
            strength  : 50,
            wisdomness: 5,
            benchpress: 20,
            curl      : 100,
            experience: 0,
            level     : 1,
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

        /* 카메라 */

        const camera = new entity.Entity();
        camera.AddComponent(
            new third_person_camera.ThirdPersonCamera({
                camera: this._camera,
                target: this._entityManager.Get('player')
            }));
        document.addEventListener("keydown", keyDown, false);
        this._entityManager.Add(camera, 'player-camera');


        // FIXME: 키를 눌렀을 때 (1, 2번) 제대로 카메라 전환이 되도록 수정해야 한다.
        function keyDown(event) {

            // 숫자 키패드 1번을 눌렀을 때 1인칭 시점 카메라로 전환된다.
            if (event.keyCode === 49) {
                camera.AddComponent(
                    new first_person_camera.FirstPersonCamera({
                        camera: object._camera,
                        target: object._entityManager.Get('player')
                    }));
            }

            // 숫자 키패드 2번을 눌렀을 때 3인칭 시점 카메라로 전환된다.
            // FIXME: 이 부분이 잘 안 된다!
            if (event.keyCode === 50) {
                camera.AddComponent(
                    new third_person_camera.ThirdPersonCamera({
                        camera: object._camera,
                        target: object._entityManager.Get('player')
                    }));
            }
        }

        for (let i = 0; i < 100; ++i) {

            // FIXME: 몬스터를 좀비로 바꾸자!
            const monsters = [
                {
                    resourceName: 'Zombie_Male.fbx',
                    resourcePath: './resources/zombie/',
                },
                {
                    resourceName: 'Zombie_Female.fbx',
                    resourcePath: './resources/zombie/',
                },
                {
                    resourceName: 'Goblin_Female.fbx',
                    resourcePath: './resources/zombie/',
                },
                {
                    resourceName: 'Goblin_Male.fbx',
                    resourcePath: './resources/zombie/',
                },

            ];

            const m = monsters[math.rand_int(0, monsters.length - 1)];

            const npc = new entity.Entity();
            npc.AddComponent(new npc_entity.NPCController({
                camera      : this._camera,
                scene       : this._scene,
                resourceName: m.resourceName,
                resourcePath: m.resourcePath,
            }));

            // NOTE: strength = 50
            npc.AddComponent(
                new health_component.HealthComponent({
                    health    : 50,
                    maxHealth : 50,
                    strength  : 5,
                    wisdomness: 2,
                    benchpress: 3,
                    curl      : 1,
                    experience: 0,
                    level     : 1,
                    camera    : this._camera,
                    scene     : this._scene,
                }));

            npc.AddComponent(
                new spatial_grid_controller.SpatialGridController({grid: this._grid}));

            // NOTE: 체력 지우기
            npc.AddComponent(new health_bar.HealthBar({
                parent: this._scene,
                camera: this._camera,
            }));

            npc.AddComponent(new attack_controller.AttackController({timing: 0.35}));
            npc.SetPosition(new THREE.Vector3(
                (Math.random() * 2 - 1) * 500,
                0,
                (Math.random() * 2 - 1) * 500));
            this._entityManager.Add(npc);
        }
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
            //mconsole.log(this)
            this._previousRAF = t;
        });
    }

    _Step(timeElapsed) {
        const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);

        this._UpdateSun();

        this._entityManager.Update(timeElapsedS);
    }

    _SetThirdPersonCamera() {
        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 1.0;
        const far = 10000.0;

        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(25, 10, 25);
    }

    _SetFirstersonCamera() {
        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 1.0;
        const far = 10000.0;

        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(0, 10, 0);
    }
}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
    _APP = new Map1();
});
