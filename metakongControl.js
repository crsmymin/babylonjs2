window.onload = function () {
    main();
}

var inputMap = {}; // 키보드 이벤트 
// 아바타 초기 위치
var player_position = {
    position: new BABYLON.Vector3(3, 0.077, - 2), // 위치
    y: 0.077, // 아바타-캠 기본 높이
    alpha: Math.PI, // 시각
    speed: 0.03 // 속도
}
// babylon 앤진 세팅
var canvas = document.getElementById("renderCanvas");
var engine = new BABYLON.Engine(canvas, true);
var scene = new BABYLON.Scene(engine);

function main() {
    scene.enablePhysics(); // 물리 엔진 활성화
    //scene.debugLayer.show({ embedMode: true }); // babylon 디버그

    // 필수 Lights - 햇빛
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.6;
    light.specular = BABYLON.Color3.Black();

    // 그라운드 생성
    var ground = initGround();

    // 아바타 생성
    var avatar = initPlayer();

    // 아바타 무빙 액션 생성 
    initKeyboardEvent();

    // 카메라 생성
    initCameraSetting();

    // GUI - 화면 아래 안내문구
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("GUI");
    var instructions = new BABYLON.GUI.TextBlock("instructions");
    instructions.text = "Move wasd / WASD keys, look with the mouse";
    instructions.color = "white";
    instructions.fontSize = 16;
    instructions.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
    instructions.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    advancedTexture.addControl(instructions);

    engine.runRenderLoop(function () {
        scene.render();
    });

}

// ----------------- init set -------------------
// 그라운드 생성
function initGround() {

    // Skybox 
    var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://www.babylonjs-playground.com/textures/TropicalSunnyDay", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = BABYLON.Color3.Black()
    skyboxMaterial.specularColor = BABYLON.Color3.Black();
    skybox.material = skyboxMaterial;

    // camp ground
    BABYLON.SceneLoader.ImportMesh("", "https://bitbucket.org/sehong90/metakong/raw/master/meshes/autumn_forest_camp/", "forest_camp.gltf", scene, function (newMeshes, particleSystems, skeletons, animationGroups) {
        var ground = newMeshes[0];

        //Scale the model down        
        ground.scaling.scaleInPlace(1.7);
        ground.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
    });

    // ----------------- 투명 객체 만들기 -------------------
    // 투명 설정
    const cMaterial = new BABYLON.StandardMaterial("cmaterial", scene);
    cMaterial.alpha = 0;

    // 벽 바닥 
    const rise = 2;
    const diamInner = 70;
    const iWidth = diamInner * .15
    const diamOuter = diamInner + iWidth / 2

    const iFloor = BABYLON.MeshBuilder.CreateDisc("floor_", { radius: diamOuter / 2 - iWidth / 4 }, scene)
    const mFloor = new BABYLON.StandardMaterial("ifloor", scene)
    mFloor.diffuseColor = new BABYLON.Color3(119 / 255, 88 / 255, 39 / 255);
    iFloor.rotation.x = Math.PI / 2
    iFloor.material = mFloor

    // 벽  
    const iOuter = BABYLON.MeshBuilder.CreateCylinder("iOuter", { diameter: diamOuter, height: rise }, scene)
    iOuter.position.y = rise / 2
    const iInner = BABYLON.MeshBuilder.CreateTube(
        "inner",
        {
            path: [new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, rise, 0)],
            radius: diamInner / 2,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        },
        scene
    )
    const outerCSG = BABYLON.CSG.FromMesh(iOuter)
    const innerCSG = BABYLON.CSG.FromMesh(iInner)
    const iRingCSG = outerCSG.subtract(innerCSG)
    const iRing = iRingCSG.toMesh("wall_", null, scene)
    iInner.dispose()
    iOuter.dispose()
    scene.removeMesh(iInner)
    scene.removeMesh(iOuter)
    scene.removeMesh(iRingCSG)

    iRing.checkCollisions = true;
    iRing.material = cMaterial;

    // 캠프파이어 
    const cylinder = BABYLON.MeshBuilder.CreateCylinder("campfire_", { diameter: 2 });
    cylinder.checkCollisions = true;
    cylinder.position.set(0.5, 0, -6);
    cylinder.diameter = 2;
    cylinder.material = cMaterial;

    // 나무 더미1
    const treebox1 = BABYLON.MeshBuilder.CreateBox("treebox1_", { width: 2, depth: 2.2, height: 4 });
    treebox1.checkCollisions = true;
    treebox1.position.set(-2.8, 0, 0);
    treebox1.rotation = new BABYLON.Vector3(0, -Math.PI / 8, 0);
    treebox1.material = cMaterial;

    // 나무 더미2
    const treebox2 = BABYLON.MeshBuilder.CreateBox("treebox2_", { width: 3.6, depth: 2.2, height: 2.5 });
    treebox2.checkCollisions = true;
    treebox2.position.set(6, 0, 0.3);
    treebox2.rotation = new BABYLON.Vector3(0, Math.PI / 3.7, 0);
    treebox2.material = cMaterial;

}
// 아바타 생성
function initPlayer() {

    // 아바타 생성
    BABYLON.SceneLoader.ImportMesh("", "https://www.babylonjs-playground.com/scenes/", "dummy3.babylon", scene, (meshes, particleSystems, skeletons) => {

        player = meshes[0];
        skeleton = skeletons[0];
        player.skeleton = skeleton;

        player.position = player_position.position;
        player.rotation = new BABYLON.Vector3(0, player_position.alpha, 0);
        player.checkCollisions = true;

        // 아바타 네임태그
        namePlane = BABYLON.MeshBuilder.CreatePlane('namePlane', { width: 5, height: 5 }, scene);
        nameText = new BABYLON.GUI.TextBlock('nameText');
        advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(namePlane);

        // 아바타 캠
        video = document.querySelector('video');
        videoTexture = new BABYLON.VideoTexture('video', video, scene, true, true);
        videoMat = new BABYLON.StandardMaterial('videoMat', scene);

        // 아바타 애니메이션 설정
        skeleton.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();
        skeleton.animationPropertiesOverride.enableBlending = true;
        skeleton.animationPropertiesOverride.blendingSpeed = 1;
        skeleton.animationPropertiesOverride.loopMode = 1;

        var idleRange = skeleton.getAnimationRange("YBot_Idle");
        var walkRange = skeleton.getAnimationRange("YBot_Walk");
        var runRange = skeleton.getAnimationRange("YBot_Run");
        var leftRange = skeleton.getAnimationRange("YBot_LeftStrafeWalk");
        var rightRange = skeleton.getAnimationRange("YBot_RightStrafeWalk");

        // IDLE Ani
        if (idleRange) scene.beginAnimation(skeleton, idleRange.from, idleRange.to, true);

        var animating = true;
        // 아바타 무빙
        scene.onBeforeRenderObservable.add(() => {
            player.position.y = player_position.y;

            var keydown = false;
            player_position.alpha = Math.PI - (camera.alpha - Math.PI / 2);
            if (inputMap["w"] && inputMap["a"]) {
                player.rotation = new BABYLON.Vector3(0, player_position.alpha - (Math.PI / 3), 0);
                keydown = true;
            } else if (inputMap["w"] && inputMap["d"]) {
                player.rotation = new BABYLON.Vector3(0, player_position.alpha + (Math.PI / 3), 0);
                keydown = true;
            } else if (inputMap["s"] && inputMap["a"]) {
                player.rotation = new BABYLON.Vector3(0, player_position.alpha - (Math.PI / 1.5), 0);
                keydown = true;
            } else if (inputMap["s"] && inputMap["d"]) {
                player.rotation = new BABYLON.Vector3(0, player_position.alpha + (Math.PI / 1.5), 0);
                keydown = true;
            } else if (inputMap["w"]) {
                player.rotation = new BABYLON.Vector3(0, player_position.alpha, 0);
                keydown = true;
            } else if (inputMap["s"]) {
                player.rotation = new BABYLON.Vector3(0, player_position.alpha - Math.PI, 0);
                keydown = true;
            } else if (inputMap["a"]) {
                player.rotation = new BABYLON.Vector3(0, player_position.alpha - (Math.PI / 2), 0);
                keydown = true;
            } else if (inputMap["d"]) {
                player.rotation = new BABYLON.Vector3(0, player_position.alpha + (Math.PI / 2), 0);
                keydown = true;
            }

            if (keydown) {
                player.moveWithCollisions(player.forward.scaleInPlace(player_position.speed));
                if (!animating) {
                    animating = true;
                    if (inputMap["Shift"]) {
                        player_position.speed = 0.2;
                        scene.beginAnimation(skeleton, runRange.from, runRange.to, true);
                    } else {
                        scene.beginAnimation(skeleton, walkRange.from, walkRange.to, true);
                    }
                    player_position.position = player.position;
                }
            } else {
                player_position.speed = 0.03;
                if (animating) {
                    scene.beginAnimation(skeleton, idleRange.from, idleRange.to, true);
                    animating = false;
                }
            }
        });
    });
}
// 아바타 키보드 이벤트
function initKeyboardEvent() {

    var keysLeft = [37, 65]; // "ArrowLeft", "A", "a", "ㅁ"
    var keysRight = [39, 68]; // "ArrowRight", "D", "d", "ㅇ"
    var keysForwards = [38, 87]; // "ArrowUp", "W", "w", "ㅉ", "ㅈ"
    var keysBackwards = [40, 83]; // "ArrowDown", "S", "s", "ㄴ"
    var keysSpeedModifier = [16]; // "Shift"
    var keysSamba = [66]; // "b"

    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
        var t = evt.sourceEvent.keyCode;
        if (-1 !== keysLeft.indexOf(t) || -1 !== keysRight.indexOf(t) || -1 !== keysForwards.indexOf(t) || -1 !== keysBackwards.indexOf(t) || -1 !== keysSpeedModifier.indexOf(t) || -1 !== keysSamba.indexOf(t)) {
            var key;
            -1 !== keysLeft.indexOf(t) ? key = "a" : -1 !== keysRight.indexOf(t) ? key = "d" : -1 !== keysForwards.indexOf(t) ? key = "w" : -1 !== keysBackwards.indexOf(t) ? key = "s" : -1 !== keysSpeedModifier.indexOf(t) ? key = "Shift" : -1 !== keysSamba.indexOf(t) && (key = "b");
            inputMap[key] = evt.sourceEvent.type == "keydown";
        }
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
        var t = evt.sourceEvent.keyCode;
        if (-1 !== keysLeft.indexOf(t) || -1 !== keysRight.indexOf(t) || -1 !== keysForwards.indexOf(t) || -1 !== keysBackwards.indexOf(t) || -1 !== keysSpeedModifier.indexOf(t) || -1 !== keysSamba.indexOf(t)) {
            var key;
            -1 !== keysLeft.indexOf(t) ? key = "a" : -1 !== keysRight.indexOf(t) ? key = "d" : -1 !== keysForwards.indexOf(t) ? key = "w" : -1 !== keysBackwards.indexOf(t) ? key = "s" : -1 !== keysSpeedModifier.indexOf(t) ? key = "Shift" : -1 !== keysSamba.indexOf(t) && (key = "b");
            inputMap[key] = evt.sourceEvent.type == "keydown";
        }
    }));

}
// 카메라 생성
function initCameraSetting() {

    var alpha = player_position.position.y - Math.PI / 2;
    var beta = Math.PI;
    var target = new BABYLON.Vector3(player_position.position.x, player_position.position.y + 1.5, player_position.position.z);

    camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", alpha, beta, 5, target, scene);
    scene.activeCamera = camera;
    scene.activeCamera.attachControl(canvas, true);

    camera.checkCollisions = false;
    camera.wheelPrecision = 15;
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 8;
    camera.lowerBetaLimit = -0.1;
    camera.upperBetaLimit = (Math.PI / 2) * 0.95;
    camera.wheelDeltaPercentage = 0.01;
    camera.inputs.remove(camera.inputs.attached.keyboard);

    scene.registerBeforeRender(function () {
        camera.target.copyFrom(player_position.position);
        camera.target.y = 1.5;
    });

}
// ----------------- init set end -------------------

// ----------------- event set -------------------
// 아바타 닉네임 태그
function setNameLabel() {

    var name = document.getElementById('name').value;

    // 네임태그 바탕(사용안함)
    var label = new BABYLON.GUI.Rectangle("nameLabel");
    label.background = "black"
    label.height = "20px";
    label.alpha = 0.5;
    label.width = "80px";
    label.cornerRadius = 20;
    label.thickness = 1;

    // 네임태그
    nameText.text = name;
    nameText.color = "white";
    nameText.fontSize = 20;

    namePlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    advancedTexture.addControl(nameText);

    scene.registerBeforeRender(function () {
        namePlane.position.x = player_position.position.x;
        namePlane.position.y = player_position.position.y + 2 - player_position.y;
        namePlane.position.z = player_position.position.z;
    });

    // 설정창 닫기
    $('.li-skeleton').hide();
    document.getElementById('setting').innerText = "설정";

}
// 아바타-캠 스위치 액션
function setAvatartoggle() {
    var t = document.getElementById('avatar').innerText;
    if (t == "캠") {
        if (!webcamState) {
            alert("캠 상태를 확인하세요.");
        } else {
            // 아바타 삭제
            scene.removeMesh(scene.getMeshByName("YBot"));
            scene.removeMesh(scene.getMeshByName("mixamorig:Skin"));
            player.subMeshes[0].getMaterial().dispose();
            player.subMeshes[1].getMaterial().dispose();
            player.material.dispose();
            skeleton.dispose();

            // 원형 plane 생성
            player_disc = BABYLON.MeshBuilder.CreateDisc("webCam", {});
            player_disc.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
            player_disc.position = player_position.position;

            // plane에 캠 영상 적용
            videoMat.backFaceCulling = false;
            videoMat.diffuseTexture = videoTexture;
            videoMat.emissiveColor = BABYLON.Color3.White();
            
            player_disc.material = videoMat;
            player_position.y = 1.4;
                
            document.getElementById('avatar').innerText = "아바타";
        }
    } else {
        // 캠 plane 삭제
        scene.removeMesh(player_disc);
        
        player_position.y = 0.077;

        // 아바타 생성
        BABYLON.SceneLoader.ImportMesh("", "https://www.babylonjs-playground.com/scenes/", "dummy3.babylon", scene, (meshes, particleSystems, skeletons) => {
            player = meshes[0];
            skeleton = skeletons[0];
            player.skeleton = skeleton;
            
            player.position = player_position.position;
            player.rotation = new BABYLON.Vector3(0, player_position.alpha - Math.PI, 0);
            player.checkCollisions = true;
            
            // 아바타 애니메이션 설정
            skeleton.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();
            skeleton.animationPropertiesOverride.enableBlending = true;
            skeleton.animationPropertiesOverride.blendingSpeed = 1;
            skeleton.animationPropertiesOverride.loopMode = 1;

            var idleRange = skeleton.getAnimationRange("YBot_Idle");
            
            // IDLE Ani
            if (idleRange) scene.beginAnimation(skeleton, idleRange.from, idleRange.to, true);

        });

        document.getElementById('avatar').innerText = "캠";
    }
}
// ----------------- event set end-------------------
