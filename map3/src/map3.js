import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';

import {third_person_camera} from '../../src/third-person-camera.js';
import {first_person_camera} from '../../src/first-person-camera.js';

import {attack_controller} from '../../src/attacker-controller.js';
import {entity} from '../../src/entity.js';
import {entity_manager} from '../../src/entity-manager.js';
import {health_bar} from '../../src/health-bar.js';
import {inventory_controller} from '../../src/inventory-controller.js';
import {gltf_component} from '../../src/gltf-component.js';
import {math} from '../../src/math.js';
import {level_up_component} from '../../src/particle-effect.js';
import {player_input} from '../../src/player-input.js';
import {spatial_grid_controller} from '../../src/spatial-grid-controller.js';
import {spatial_hash_grid} from '../../src/spatial-hash-grid.js';

import {equip_weapon_component} from './map3-equip-weapon-component.js';
import {quest_component} from './map3-mission-component.js';
import {health_component} from './map3-object-hp.js';
import {player_entity} from './map3-player-entity.js'
import {ui_controller} from './map3-ui-controller.js';


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

        /* 카메라 */

        this._SetThirdPersonCamera()

        /*
        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 1.0;
        const far = 10000.0;
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(25, 10, 25);
         */

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

        const textureLoader = new THREE.TextureLoader();
        const sand = textureLoader.load('./resources/beach/textures/SandCastleMaterial_baseColor.png')
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(1200, 1200, 0, 0),
            new THREE.MeshStandardMaterial({
                map: sand
            }));

        plane.castShadow = false;
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        this._scene.add(plane);

        /* 엔티티 */

        this._entityManager = new entity_manager.EntityManager();
        this._grid = new spatial_hash_grid.SpatialHashGrid(
            [[-1000, -1000], [1000, 1000]], [100, 100]);

        this._LoadSea();
        this._LoadFoliage()
        this._LoadControllers();
        this._LoadPlayer();
        this._LoadClouds();
        this._LoadSky();
        this._LoadPortal();
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
     * 맵: 바다
     * CHECK: 여기에 resourcePath 부분 제대로 동작하는지 확인하기
     */
    _LoadSea() {
        const e = new entity.Entity();
        var pos = new THREE.Vector3(1500, 50, 0)
        e.AddComponent(new gltf_component.StaticModelComponent({
            scene       : this._scene,
            resourcePath: './resources/beach/',
            resourceName: 'sea.gltf',
            scale       : 2.5,
            position    : pos,
        }));
        e.SetPosition(pos);
        this._entityManager.Add(e, 'sea1');
        e.SetActive(false);

        const e2 = new entity.Entity();
        var pos = new THREE.Vector3(-1500, 50, 0)
        e2.AddComponent(new gltf_component.StaticModelComponent({
            scene       : this._scene,
            resourcePath: './resources/beach/',
            resourceName: 'sea.gltf',
            scale       : 2.5,
            position    : pos,
        }));
        e2.SetPosition(pos);
        this._entityManager.Add(e2, 'sea2');
        e2.SetActive(false);

        const e3 = new entity.Entity();
        var pos = new THREE.Vector3(0, 30, 850)
        e3.AddComponent(new gltf_component.StaticModelComponent({
            scene       : this._scene,
            resourcePath: './resources/beach/',
            resourceName: 'sea.gltf',
            scale       : 2.5,
            position    : pos,
        }));
        e3.SetPosition(pos);
        this._entityManager.Add(e3, 'sea3');
        e3.SetActive(false);

        const e4 = new entity.Entity();
        var pos = new THREE.Vector3(0, 30, -850)
        e4.AddComponent(new gltf_component.StaticModelComponent({
            scene       : this._scene,
            resourcePath: './resources/beach/',
            resourceName: 'sea.gltf',
            scale       : 2.5,
            position    : pos,
        }));
        e4.SetPosition(pos);
        this._entityManager.Add(e4, 'sea4');
        e4.SetActive(false);
    }

    /**
     * 맵: 자연 구조물
     */
    _LoadFoliage() {
        for (let i = 0; i < 200; ++i) {
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
                scene        : this._scene,
                resourcePath : './resources/nature/FBX/',
                resourceName : name + '_' + index + '.fbx',
                scale        : 0.25,
                emissive     : new THREE.Color(0x000000),
                specular     : new THREE.Color(0x000000),
                receiveShadow: true,
                castShadow   : true,
            }));
            e.AddComponent(
                new spatial_grid_controller.SpatialGridController({grid: this._grid}));
            e.SetPosition(pos);
            this._entityManager.Add(e, 'Foliage');
            e.SetActive(false);
        }
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
        for (let i = 0; i < 30; ++i) {
            const index = math.rand_int(1, 3);
            const pos = new THREE.Vector3(
                (Math.random() * 2.0 - 1.0) * 500,
                100,
                (Math.random() * 2.0 - 1.0) * 500);

            const e = new entity.Entity();
            e.AddComponent(new gltf_component.StaticModelComponent({

                // CHECK: 머지 충돌 해결할 때 경로가 .resources/nature/GLTF/라고 되어 있던 걸 지움. 맞는지 체크하기.
                scene       : this._scene,
                resourcePath: './resources/nature2/GLTF/',
                resourceName: 'Cloud' + index + '.glb',
                position    : pos,
                scale       : Math.random() * 5 + 10,
                emissive    : new THREE.Color(0x808080),
            }));
            e.SetPosition(pos);
            this._entityManager.Add(e, 'cloud');
            e.SetActive(false);
        }
    }

    /**
     * 맵: 포털
     */
    _LoadPortal() {
        const pos = new THREE.Vector3(
            (1 * 2.0 - 1.0) * 500 - 100,
            0,
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

        /* NPC : 여자 */

        const girl = new entity.Entity();
        girl.AddComponent(new gltf_component.AnimatedModelComponent({
            scene            : this._scene,
            resourcePath     : './resources/girl/',
            resourceName     : 'peasant_girl.fbx',
            resourceAnimation: 'Standing Idle.fbx',
            scale            : 0.035,
            receiveShadow    : true,
            castShadow       : true,
        }));
        girl.AddComponent(new spatial_grid_controller.SpatialGridController({
            grid: this._grid,
        }));
        girl.AddComponent(new player_input.PickableComponent());
        girl.AddComponent(new quest_component.QuestComponent());
        girl.SetPosition(new THREE.Vector3(30, 0, 0));
        this._entityManager.Add(girl, 'girl');

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
        this._entityManager.Add(sword, 'sword');

        /* 무기: 도끼 */
        const axe = new entity.Entity();
        axe.AddComponent(new inventory_controller.InventoryItem({
            type        : 'weapon',
            damage      : 3,
            renderParams: {
                name : 'Axe_Small',
                scale: 0.25,
                icon : 'war-axe-64.png',
            },
        }));
        this._entityManager.Add(axe, 'axe');

        /* 캐릭터 */

        const player = new entity.Entity();
        player.AddComponent(new player_input.BasicCharacterControllerInput(params));
        player.AddComponent(new player_entity.BasicCharacterController(params));
        player.AddComponent(new equip_weapon_component.EquipWeapon({anchor: 'mixamorig6RightHandMiddle1'}));
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

        // function keyDown(event) {
        //     if (flag === 0 && event.keyCode === 70) {
        //         object._SetFirstersonCamera()
        //         flag = 1;
        //     }
        //
        //     if (flag === 0 && event.keyCode === 70) {
        //         object._SetThirdPersonCamera()
        //         flag = 0;
        //     }
        // }

        function keyDown(event) {

            if (event.keyCode === 49) {
                camera.AddComponent(
                    new first_person_camera.FirstPersonCamera({
                        camera: object._camera,
                        target: object._entityManager.Get('player')
                    }));
            }

            if (event.keyCode === 50) {
                camera.AddComponent(
                    new third_person_camera.ThirdPersonCamera({
                        camera: object._camera,
                        target: object._entityManager.Get('player')
                    }));
            }
        }

        /* 기타 모델 */

        for (let i = 0; i < 20; i++) {
            const tool_Item = [
                {
                    resourceName: 'Radio.fbx'
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
                scene        : this._scene,
                resourcePath : './resources/survival-pack/FBX/',
                resourceName : m.resourceName,
                scale        : 0.05,
                position     : pos,
                receiveShadow: true,
                castShadow   : true,
            }));
            tool.AddComponent(
                new health_component.HealthComponent({
                    health    : 50,
                    maxHealth : 50,
                    strength  : 3,
                    wisdomness: 0,
                    benchpress: 0,
                    curl      : 0,
                    experience: 0,
                    level     : 1,
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
    _APP = new HackNSlashDemo();
});
