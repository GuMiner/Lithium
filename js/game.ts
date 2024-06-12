
// Required for the debug viewer, otherwise not referenced
import "@babylonjs/core/Debug";
import "@babylonjs/inspector";

//import "@babylonjs/loaders/glTF";
import { Engine, Scene,
    ArcRotateCamera, 
    Vector3, Color3, Quaternion, float,
    DirectionalLight, HemisphericLight, ShadowGenerator,
    Mesh, MeshBuilder,
    StandardMaterial, Texture, CubeTexture,
    HavokPlugin, PhysicsBody, PhysicsMotionType, PhysicsShapeBox, PickingInfo } from "@babylonjs/core";

import HavokPhysics from "@babylonjs/havok";

async function getInitializedHavok() {
    return await HavokPhysics({
        locateFile: (path) => {
          // Hack because the Havok embeded WASM is weird and doesn't build properly.
          // Ensure it is located via an absolute path
          console.log(`Updating Havok path to live in static: ${path}`);
          return `/static/game/${path}`;
        }
      });
}

var canvasDiv = null;
var globalEngine: Engine = null;

class App {
    make_blocks(scene: Scene, shadowGenerator: ShadowGenerator) {
        const woodMaterial = new StandardMaterial("Wood", scene);
        woodMaterial.specularColor = new Color3(0.8, 0.8, 0.8);

        let woodTexture = new Texture('/static/game/wood.jpg', scene);
        woodMaterial.diffuseTexture = woodTexture;

        var blockLength: float = 10;
        var blockWidth: float = blockLength / 3;
        var blockHeight: float = blockLength / 4;

        const shape = new PhysicsShapeBox(
            new Vector3(0, 0, 0), new Quaternion(0, 0, 0, 1),
            new Vector3(blockWidth, blockHeight, blockLength),
            scene);
        shape.material = { friction: 0.2, restitution: 0.3 };

        var blockSpacing = 0.1;
        var blockName = "block-";

        var towerHeight = 10;

        for (var i = 0; i < towerHeight * 3; i++) {
            var box = MeshBuilder.CreateBox(blockName + i.toString(), { width: blockWidth, height: blockHeight, depth: blockLength}, scene);
            box.position.y += blockHeight / 2 + blockSpacing; // Offset off of the ground
            box.position.y += (blockHeight + blockSpacing) * Math.floor(i/3); // Move to proper height
            
            // Rotate every other layer
            if (i % 6 > 2) {
                box.rotate(Vector3.Up(), Math.PI / 2);
                box.position.z += (blockWidth + blockSpacing) * (i % 3) - (blockWidth + blockSpacing);
            } else {
                box.position.x += (blockWidth + blockSpacing) * (i % 3) - (blockWidth + blockSpacing);
            }

            box.material = woodMaterial;
            box.receiveShadows = true;
            shadowGenerator.addShadowCaster(box);

            const boxBody = new PhysicsBody(box, PhysicsMotionType.DYNAMIC, false, scene);
            boxBody.shape = shape;
            boxBody.setMassProperties({ mass: 1 });
        }
    }

    make_ground(scene) {
        var ground_size = 200
        var ground: Mesh = MeshBuilder.CreateGround("ground", {width: ground_size, height: ground_size}, scene);
        ground.receiveShadows = true;
        ground.isPickable = false;

        const groundMaterial = new StandardMaterial("Ground Material", scene);
        ground.material = groundMaterial;

        let groundTexture = new Texture('/static/game/checkerboard_basecolor.png', scene);
        groundMaterial.diffuseColor = new Color3(0.7, 0, 0);
        groundMaterial.diffuseTexture = groundTexture;

        const shape = new PhysicsShapeBox(
            new Vector3(0, 0, 0), new Quaternion(0, 0, 0, 1),
            new Vector3(ground_size, 0.01, ground_size),
            scene);
        
        const boxBody = new PhysicsBody(ground, PhysicsMotionType.STATIC, false, scene);
            boxBody.shape = shape;
            boxBody.setMassProperties({ mass: 1 });
    }

    async createSceneAsync(engine: Engine, canvas) {
        // initialize babylon scene and engine
        var scene = new Scene(engine);
        scene.autoClear = false;
        scene.autoClearDepthAndStencil = false;

        var gravityVector = new Vector3(0, -9.81, 0);
        var physicsPlugin = new HavokPlugin(true, await getInitializedHavok());
        scene.enablePhysics(gravityVector, physicsPlugin);

        var camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2.5, Math.PI / 2.5, 30, new Vector3(0, 10, 0), scene);
        camera.upperBetaLimit = Math.PI / 2 - 0.05;
        camera.lowerRadiusLimit = 10;
        camera.upperRadiusLimit = 80;
        camera.attachControl(canvas, true);

        scene.cameraToUseForPointers = camera;

        var sceneLight = new DirectionalLight("dLight", new Vector3(-1, -1, -0.5).normalize(), scene);
        var ambientLight = new HemisphericLight("hLight", new Vector3(0, 1, 1), scene);
        ambientLight.intensity = 0.4;

        var sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
        sphere.position.y += 0.5;

        sceneLight.autoUpdateExtends = true;
        sceneLight.autoCalcShadowZBounds = true;

        const shadowGenerator = new ShadowGenerator(1024, sceneLight);
        shadowGenerator.usePoissonSampling = true;

        this.make_blocks(scene, shadowGenerator);
        this.make_ground(scene);

        var skyboxTexture = new CubeTexture("/static/game/skybox/TropicalSunnyDay", scene);
        scene.createDefaultSkybox(skyboxTexture, false, 700);

        return scene;
    };

    constructor() {
        // Game screen
        canvasDiv = document.getElementById("canvasDiv");
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        canvasDiv.appendChild(canvas);

        var engine = new Engine(canvas, true, null, true);
        globalEngine = engine;

        this.createSceneAsync(engine, canvas).then((scene) => {
            window.addEventListener("keydown", (ev) => {
                // hide/show the Inspector
                if (ev.key === 'p') {
                    if (scene.debugLayer.isVisible()) {
                        scene.debugLayer.hide();
                    } else {
                        scene.debugLayer.show();
                    }
                } else if (ev.key === 'o') {
                    // Must be done this way as forceWireframe can also be not set at all.
                    if (scene.forceWireframe) {
                        scene.forceWireframe = false;
                    } else {
                        scene.forceWireframe = true;
                    }
                }

                console.log(ev.key);
            });

            var indicatorPoint = MeshBuilder.CreateSphere(
                "indicatorPoint",
                { diameter: 2 },
                scene
            );
            indicatorPoint.isVisible = false;
            var indicatorPointMat = new StandardMaterial(
                "indicatorPointMat",
                scene
            );
            indicatorPointMat.emissiveColor = new Color3(0, 1, 0);
            indicatorPointMat.alpha = 0.7;
            indicatorPoint.material = indicatorPointMat;
            indicatorPoint.isPickable = false;

            scene.onPointerPick = (evt, pickInfo: PickingInfo) => {
                console.log(evt);
                console.log(pickInfo);

                pickInfo.pickedMesh.physicsBody.applyImpulse(new Vector3(0, 5, 0), pickInfo.pickedPoint);
            }

            scene.onPointerMove = (evt, pickInfo) => {
                var hit = false;
                var hitPos = null;
        
                //if (useRaycast) {
                //    scene.createPickingRayToRef(
                //        scene.pointerX,
                //        scene.pointerY,
                //        null,
                //        pickingRay,
                //        camera
                //    );
                //    physEngine.raycastToRef(pickingRay.origin, pickingRay.origin.add(pickingRay.direction.scale(10000)), raycastResult);
                //    hit = raycastResult.hasHit;
                //    hitPos = raycastResult.hitPointWorld;
                //} else {
                    const pickInfoId = scene.pick(scene.pointerX, scene.pointerY);
                    hit = pickInfoId.hit;
                    hitPos = pickInfoId.pickedPoint;
               // }
                // console.log("hit", hit, hitPos?.toString());
                if (hit) {
                    indicatorPoint.isVisible = true;
                    indicatorPoint.position.copyFrom(hitPos);
                }
            };

            // Notes: http://127.0.0.1:5000/game, https://doc.babylonjs.com/features/starterSceneCode, 

            // Add some logging if necessary
            // scene.registerBeforeRender(() => {
            //     console.log(camera.alpha, camera.beta);
            // })

            // run the main render loop
            
            engine.runRenderLoop(() => {
                scene.render();
            });
        });
    }
}

function enterFullscreen() {
    // Fullscreen requests can only be made if triggered by a user.
    // As such, we need to do this call in a function triggered by a button press.
    // canvasDiv.requestFullscreen();
    globalEngine.switchFullscreen(false);
    globalEngine.resize(true);
}

(window as any).enterFullscreen = enterFullscreen;
window.addEventListener('load', () =>
{
    new App();
});

window.addEventListener("resize", () => {
    globalEngine.resize(true);
});
