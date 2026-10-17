// shared/PacketTypes.ts
class ClientPacket {
  packetType = 0 /* NONE */;
  data;
  constructor(packetType, data) {
    this.packetType = packetType;
    this.data = data;
  }
}

// shared/Consts.ts
class PlayerLocation {
  position = [0, 0];
  angle = 0;
  velocity = 0;
  constructor(position, angle, velocity) {
    this.position = position;
    this.angle = angle;
    this.velocity = velocity;
  }
}
class ChatMessage {
  name = "";
  msg = "";
  time = [new Date().getHours(), new Date().getMinutes()];
  constructor(name, msg) {
    this.name = name;
    this.msg = msg;
  }
}

// client/src/game.ts
var ws = new WebSocket("");
var iframe = window.self;
var canvas = document.createElement("canvas");
var engine = null;
var boatRoot;
var boatObj;
var camera;
var gameLoaded = false;
var joinedWithName;
var chatHistory = [];
var BOAT_Y_POSITION;
var BOAT_SCALE;
var BOAT_STARTING_ROTATION;
function linkWsToGame(frame, webSocket) {
  ws.close();
  ws = webSocket;
  canvas = iframe.window.document.body.children[0];
  iframe = frame;
  BOAT_Y_POSITION = 5;
  BOAT_SCALE = new BABYLON.Vector3(5, 5, 5);
  BOAT_STARTING_ROTATION = new BABYLON.Vector3(0, 4.712, 0);
  startGame();
}
var name = "";
function setJoinedWithName(joinName) {
  joinedWithName = true;
  name = joinName;
  setInterval(queueClientAction, 10);
}
function createWaterScene(engine2, canvas2) {
  var scene = new BABYLON.Scene(engine2);
  camera = new BABYLON.FreeCamera("Camera", new BABYLON.Vector3(0, 0, 0), scene);
  var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0.1), scene);
  light.diffuse = new BABYLON.Color3(1, 0.992, 0.867);
  light.intensity = 0.4;
  var skybox = BABYLON.CreateBox("skyBox", { size: 1000 }, scene);
  var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/TropicalSunnyDay/", scene);
  skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
  skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
  skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
  skyboxMaterial.disableLighting = true;
  skybox.material = skyboxMaterial;
  var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
  groundMaterial.diffuseTexture = new BABYLON.Texture("textures/ground.jpg", scene);
  groundMaterial.diffuseTexture.scale(4);
  var ground = BABYLON.CreateGround("ground", { width: 512, height: 512, subdivisions: 32 }, scene);
  ground.position.y = -1;
  ground.material = groundMaterial;
  var waterMesh = BABYLON.CreateGround("waterMesh", { width: 512, height: 512, subdivisions: 32 }, scene);
  var water = new BABYLON.WaterMaterial("water", scene);
  water.bumpTexture = new BABYLON.Texture("textures/waterbump.png", scene);
  water.windForce = 15;
  water.waveHeight = 0.6;
  water.windDirection = new BABYLON.Vector2(1, 1);
  water.waterColor = new BABYLON.Color3(0.11, 0.3, 0.75);
  water.colorBlendFactor = 0.8;
  water.bumpHeight = 0.1;
  water.waveLength = 0.6;
  water.addToRenderList(skybox);
  water.addToRenderList(ground);
  waterMesh.material = water;
  loadBoatMesh(scene, new BABYLON.Vector3(0, BOAT_Y_POSITION, 0));
  return scene;
}
var chatDisplay;
function setupUI() {
  const body = iframe.document.body;
  body.style.flexDirection = "row";
  const ui_minimap = iframe.document.createElement("button");
  const minimap_img = iframe.document.createElement("img");
  minimap_img.src = "textures/ui/minimap.png";
  ui_minimap.appendChild(minimap_img);
  ui_minimap.style.height, minimap_img.style.height = "28vh";
  ui_minimap.style.width, minimap_img.style.width = "auto";
  ui_minimap.style.position = "absolute";
  ui_minimap.style.left = "0px";
  ui_minimap.style.padding = "0";
  ui_minimap.style.backgroundColor = "transparent";
  ui_minimap.style.border = "none";
  body.appendChild(ui_minimap);
  ui_minimap.style.bottom = "-4px";
  minimap_img.toggleAttribute("inert");
  minimap_img.tabIndex, ui_minimap.tabIndex = -1;
  const ui_map = iframe.document.createElement("div");
  ui_map.style.position = "absolute";
  ui_map.style.left = "0px";
  ui_map.style.top = "0px";
  ui_map.style.padding = "0";
  ui_map.style.backgroundColor = "transparent";
  ui_map.style.height = "100vh";
  ui_map.style.width = "100vw";
  body.appendChild(ui_map);
  ui_map.style.backgroundImage = "url(textures/ui/map-bg.png)";
  ui_map.style.backgroundRepeat = "no-repeat";
  ui_map.style.backgroundSize = "98vw 92vh";
  ui_map.style.backgroundAttachment = "fixed";
  ui_map.style.backgroundPosition = "50% 20%";
  const ui_exit_map = iframe.document.createElement("button");
  const exit_map_img = iframe.document.createElement("img");
  exit_map_img.src = "textures/ui/exit-map.png";
  exit_map_img.style.width = "12vw";
  exit_map_img.style.height, ui_exit_map.style.width, ui_exit_map.style.height = "auto";
  ui_exit_map.appendChild(exit_map_img);
  ui_map.style.visibility = "hidden";
  ui_map.appendChild(ui_exit_map);
  ui_exit_map.style.position = "absolute";
  ui_exit_map.style.left = "4vw";
  ui_exit_map.style.bottom = "0px";
  ui_exit_map.style.padding = "0";
  ui_exit_map.style.backgroundColor = "transparent";
  ui_exit_map.style.border = "none";
  ui_map.tabIndex, ui_exit_map.tabIndex, exit_map_img.tabIndex = -1;
  ui_minimap.addEventListener("click", () => {
    toggleMap(ui_minimap, ui_map);
  });
  ui_exit_map.addEventListener("click", () => {
    toggleMap(ui_map, ui_minimap);
    canvas.focus();
  });
  const ui_chat_table = iframe.document.createElement("table");
  ui_chat_table.innerHTML = `
  <tr style="display: flex">
  <td style="background-image:url('textures/ui/chatbox.png'); background-repeat: no-repeat; background-position: top right;background-size: 100% 100%;">
      <input id="chat-box" type="text" placeholder="say somethings" style="margin:8px 15px;width: 30vw;height: 3vh">
    </td>
  <td style="background-image:url('textures/ui/send-chat.png');background-repeat: no-repeat;background-position: top right;background-size: 100% 100%;">
    <button id="send-chat" style="background-color: transparent; border: none; margin: 5px; width: 5vw; height: stretch;color: antiqueWhite;font-weight: bold;">
    Send</button>
  </td>
  </tr>`;
  ui_chat_table.style.position = "absolute";
  ui_chat_table.style.right = "0px";
  ui_chat_table.style.bottom = "0px";
  ui_chat_table.style.border = "none";
  ui_chat_table.style.padding = "0";
  ui_chat_table.style.display = "flex";
  ui_chat_table.style.borderSpacing = "2";
  body.appendChild(ui_chat_table);
  const sendChatButton = iframe.document.getElementById("send-chat");
  const chatBox = iframe.document.getElementById("chat-box");
  chatDisplay = iframe.document.createElement("div");
  chatDisplay.id = "chat-display";
  chatDisplay.style.backgroundColor = "antiqueWhite";
  chatDisplay.style.border = "1px solid black";
  chatDisplay.style.width = chatBox.style.width;
  chatDisplay.style.position = "absolute";
  const chatHeight = chatBox.getBoundingClientRect().height + Number(chatBox.style.marginTop.slice(0, 1));
  const chatLeft = chatBox.getBoundingClientRect().x;
  chatDisplay.style.bottom = Math.round(chatHeight) * 100 / iframe.document.documentElement.clientHeight + "vh";
  chatDisplay.style.left = Math.round(chatLeft) * 100 / iframe.document.documentElement.clientWidth + "vw";
  chatDisplay.style.display = "flex";
  chatDisplay.style.flexDirection = "column";
  chatDisplay.style.maxHeight = "30vh";
  chatDisplay.style.overflowY = "scroll";
  chatDisplay.style.overflowWrap = "anywhere";
  chatDisplay.style.visibility = "hidden";
  body.appendChild(chatDisplay);
  chatBox.addEventListener("mouseenter", () => {
    chatDisplay.scroll(0, chatDisplay.scrollHeight);
    chatDisplay.style.visibility = "visible";
  }, { capture: true });
  chatDisplay.addEventListener("mouseover", () => {
    chatDisplay.style.visibility = "visible";
  }, { capture: true });
  ui_chat_table.addEventListener("mouseleave", () => {
    chatDisplay.style.visibility = "hidden";
  });
  chatDisplay.addEventListener("mouseout", () => {
    if (document.activeElement != chatBox || document.activeElement != ui_chat_table) {
      chatDisplay.style.visibility = "hidden";
    }
  }, { capture: true });
  sendChatButton.addEventListener("click", () => {
    sendChat(chatBox.value);
    chatBox.value = "";
    chatBox.focus();
  });
  chatBox.addEventListener("keyup", (event) => {
    if (event.key == "Enter") {
      sendChat(chatBox.value);
      chatBox.value = "";
    }
  }, { capture: true });
}
function sendChat(msg) {
  if (msg == "") {
    return;
  }
  const message = new ChatMessage(name, msg);
  chatHistory.push(message);
  var hours = new Date().getHours().toString().length == 1 ? "0" + new Date().getHours().toString() : new Date().getHours().toString();
  var minutes = new Date().getMinutes().toString().length == 1 ? "0" + new Date().getMinutes().toString() : new Date().getMinutes().toString();
  chatDisplay.innerHTML += `<p style="padding:3px; margin: 0; border: 1px solid lightGray">
  <span id="name" style="font-weight: bold; text-decoration: underline;">${name}:</span><span style="font-style:italic; color: gray; position: absolute; right: 3px;">${hours}:${minutes}</span>
  <br>${msg}
  </p>`;
  chatDisplay.scroll(0, chatDisplay.scrollHeight);
  ws.send(JSON.stringify(new ClientPacket(3 /* SEND_CHAT */, message)));
}
function displayInboundChat(message) {
  if (message.name != name) {
    chatHistory.push(message);
    chatDisplay.innerHTML += `<p style="padding:3px; margin: 0; border: 1px solid lightGray">
    <span id="name" style="font-weight: bold; text-decoration: underline;">${message.name}:</span><span style="font-style:italic; color: gray; position: absolute; right: 3px;">${message.time[0]}:${message.time[1]}</span>
    <br>${message.msg}
    </p>`;
  }
}
function toggleMap(hideElem, showElem) {
  hideElem.style.visibility = "hidden";
  showElem.style.visibility = "visible";
}
var boatMesh;
var oceanCamera;
var shipCamera;
var tiller;
var mast;
var gaff;
async function loadBoatMesh(scene, pos) {
  await BABYLON.AppendSceneAsync("textures/sailboat.glb", scene);
  console.log(scene);
  var woodMat;
  woodMat = new BABYLON.StandardMaterial("boatMat");
  woodMat.diffuseColor = new BABYLON.Color3(97 / 255, 38 / 255, 0);
  var lightWoodMat;
  lightWoodMat = new BABYLON.StandardMaterial("boatMat");
  lightWoodMat.diffuseColor = new BABYLON.Color3(214 / 255, 151 / 255, 92 / 255);
  boatMesh = scene.getNodeByName("BOAT");
  mast = scene.getNodeByName("mast");
  tiller = scene.getNodeByName("tiller");
  gaff = scene.getMeshByName("gaff");
  boatMesh.material = woodMat;
  mast.material = woodMat;
  tiller.material = lightWoodMat;
  oceanCamera = scene.cameras.find((camera2) => {
    return camera2.name == "OceanCamera";
  });
  shipCamera = scene.cameras.find((camera2) => {
    return camera2.name == "ShipCamera";
  });
  shipCamera.parent = scene.getNodeByName("camera-pivot");
  shipCamera.target = scene.getNodeByName("camera-target").position;
  camera = oceanCamera;
  shipCamera.fov = 0.33;
  console.log(scene.cameras);
  setupGizmos();
  for (let mesh of scene.meshes) {
    if (mesh.name == "gaff" || mesh.name == "boom") {
      mesh.material = woodMat;
    }
    if (mesh.name == "bowsprit") {
      mesh.material = woodMat;
    }
    if (mesh.name == "cabin") {
      mesh.material = lightWoodMat;
    }
  }
  boatMesh.position = pos;
  boatObj = boatMesh;
  if (boatMesh) {
    addBoat(boatMesh, new BABYLON.Vector3(0, BOAT_Y_POSITION, 0), BOAT_SCALE, BOAT_STARTING_ROTATION, [oceanCamera, shipCamera]);
  }
}
function addBoat(mesh, pos, scale, rotation, cameras) {
  boatRoot = new BABYLON.TransformNode("boatTransform");
  console.log(mesh);
  if (cameras) {
    oceanCamera.parent = boatRoot;
    console.log("cameras added");
    oceanCamera.position = boatObj.position.add(new BABYLON.Vector3(0, 50, -3));
    oceanCamera.target = new BABYLON.Vector3(0, -10, -3);
    oceanCamera.fov = 1.1;
    scene.activeCamera = oceanCamera;
  }
  boatObj.parent = boatRoot;
  boatRoot.position = pos;
  boatObj.rotation = rotation;
}
function addOtherBoat(player) {
  addBoat(boatMesh, new BABYLON.Vector3(player.position[0], BOAT_Y_POSITION, player.position[1]), BOAT_SCALE, new BABYLON.Vector3(0, player.angle, 0));
}
var scene;
async function startGame() {
  ws.addEventListener("open", async () => {
    canvas = iframe.document.getElementById("renderCanvas");
    engine = new BABYLON.Engine(canvas, true);
    let createScene = createWaterScene;
    if (!createScene)
      throw new Error("No createScene() export found.");
    scene = await createWaterScene(engine, canvas);
    gameLoaded = true;
    engine.runRenderLoop(() => scene.render());
    addEventListener("resize", () => {
      if (engine) {
        engine.resize();
      }
    });
    joinedWithName = false;
    console.log("scene drawn");
    addKeyListeners();
    setupUI();
  });
}
var shipView = false;
function changeShipView() {
  if (shipView) {
    scene.activeCamera = oceanCamera;
    tillerRotationGizmo.attachedMesh = null;
    mastRotationGizmo.attachedMesh = null;
    gaffMovementGizmo.attachedMesh = null;
    gaffRotationGizmo.attachedMesh = null;
    shipView = false;
  } else {
    scene.activeCamera = shipCamera;
    tillerRotationGizmo.attachedMesh = tiller;
    mastRotationGizmo.attachedMesh = mast;
    gaffMovementGizmo.attachedMesh = gaff;
    gaffRotationGizmo.attachedMesh = gaff;
    shipView = true;
  }
}
var tillerRotationGizmo;
var mastRotationGizmo;
var gaffMovementGizmo;
var gaffRotationGizmo;
function setupGizmos() {
  var utilLayer = new BABYLON.UtilityLayerRenderer(scene);
  tiller.behaviors.splice(0);
  mast.behaviors.splice(0);
  gaff.behaviors.splice(0);
  const dragbehavior = new BABYLON.PointerDragBehavior;
  dragbehavior.enabled = false;
  tiller.addBehavior(dragbehavior);
  mast.addBehavior(dragbehavior);
  gaff.addBehavior(dragbehavior);
  tillerRotationGizmo = new BABYLON.PlaneRotationGizmo(new BABYLON.Vector3(0, 1, 0), BABYLON.Color3.Yellow(), utilLayer, undefined, undefined, false, 3, BABYLON.Color3.Teal());
  tillerRotationGizmo.attachedMesh = tiller;
  tillerRotationGizmo.updateGizmoRotationToMatchAttachedMesh = true;
  tillerRotationGizmo.updateGizmoPositionToMatchAttachedMesh = true;
  tillerRotationGizmo.scaleRatio = 0.3;
  tillerRotationGizmo.sensitivity = 0.5;
  tillerRotationGizmo.dragBehavior.onDragObservable.add((e) => {
    let y = (tiller.rotationQuaternion ? tiller.rotationQuaternion.y : tiller.rotation.y) * (180 / Math.PI);
    let factor = Math.round(tiller.scaling.x * 100) / 100;
    tiller.scaling = new BABYLON.Vector3(factor, factor, factor);
    const gizmoResult = rotateGizmo(y, 25, tiller.rotationQuaternion ? tiller.rotationQuaternion : undefined);
    if (gizmoResult.boundsHit) {
      tillerRotationGizmo.dragBehavior.releaseDrag();
    }
    switch (gizmoResult.type) {
      case 0 /* QUATERNION_ROT */:
        tiller.rotationQuaternion.y = gizmoResult.finalAngle;
        break;
      case 1 /* EULER_ROT */:
        tiller.rotation.y = gizmoResult.finalAngle;
        break;
    }
  });
  mastRotationGizmo = new BABYLON.PlaneRotationGizmo(new BABYLON.Vector3(0, 1, 0), BABYLON.Color3.Yellow(), utilLayer, undefined, undefined, false, 3, BABYLON.Color3.Teal());
  mastRotationGizmo.attachedMesh = mast;
  mastRotationGizmo.updateGizmoRotationToMatchAttachedMesh = true;
  mastRotationGizmo.updateGizmoPositionToMatchAttachedMesh = true;
  mastRotationGizmo.scaleRatio = 0.25;
  mastRotationGizmo.sensitivity = 0.5;
  mastRotationGizmo.dragBehavior.onDragObservable.add((e) => {
    let y = (mast.rotationQuaternion ? mast.rotationQuaternion.y : mast.rotation.y) * (180 / Math.PI);
    mast.scaling = new BABYLON.Vector3(Math.round(mast.scaling.x * 100) / 100, Math.round(mast.scaling.y * 100) / 100, Math.round(mast.scaling.z * 100) / 100);
    const gizmoResult = rotateGizmo(y, 35, mast.rotationQuaternion ? mast.rotationQuaternion : undefined);
    if (gizmoResult.boundsHit) {
      mastRotationGizmo.dragBehavior.releaseDrag();
    }
    switch (gizmoResult.type) {
      case 0 /* QUATERNION_ROT */:
        mast.rotationQuaternion.y = gizmoResult.finalAngle;
        break;
      case 1 /* EULER_ROT */:
        mast.rotation.y = gizmoResult.finalAngle;
        break;
    }
    console.log(y);
  });
  gaffMovementGizmo = new BABYLON.AxisDragGizmo(new BABYLON.Vector3(0, 1, 0), BABYLON.Color3.Red(), utilLayer, undefined, 3, BABYLON.Color3.Teal());
  gaffMovementGizmo.updateGizmoRotationToMatchAttachedMesh = false;
  gaffMovementGizmo.updateGizmoPositionToMatchAttachedMesh = true;
  gaffMovementGizmo.attachedMesh = gaff;
  gaffMovementGizmo.scaleRatio = 0.35;
  gaffMovementGizmo.dragBehavior.onDragObservable.add((e) => {
    const y = gaff.position.y;
    const minY = -3.7;
    const maxY = 0.45;
    let finalY = y;
    if (y < minY) {
      finalY = minY;
    } else if (y > maxY) {
      finalY = maxY;
    }
    if (finalY != y) {
      gaffMovementGizmo.dragBehavior.releaseDrag();
    }
  });
  gaffRotationGizmo = new BABYLON.PlaneRotationGizmo(new BABYLON.Vector3(0, 0, 1), BABYLON.Color3.Green(), utilLayer, undefined, undefined, false, 3, BABYLON.Color3.Teal());
  gaffRotationGizmo.attachedMesh = gaff;
  gaffRotationGizmo.updateGizmoRotationToMatchAttachedMesh = true;
  gaffRotationGizmo.updateGizmoPositionToMatchAttachedMesh = true;
  gaffRotationGizmo.sensitivity = 0.5;
  gaffRotationGizmo.scaleRatio = 0.25;
  gaffRotationGizmo.dragBehavior.onDragObservable.add((e) => {
    let z = (gaff.rotationQuaternion ? gaff.rotationQuaternion.z : gaff.rotation.z) * (180 / Math.PI);
    gaff.scaling = new BABYLON.Vector3(Math.round(gaff.scaling.x * 100) / 100, Math.round(gaff.scaling.y * 100) / 100, Math.round(gaff.scaling.z * 100) / 100);
    const gizmoResult = rotateGizmo(z, 41.8, gaff.rotationQuaternion ? gaff.rotationQuaternion : undefined, 15);
    if (gizmoResult.boundsHit) {
      gaffRotationGizmo.dragBehavior.releaseDrag();
    }
    switch (gizmoResult.type) {
      case 0 /* QUATERNION_ROT */:
        gaff.rotationQuaternion.z = gizmoResult.finalAngle;
        break;
      case 1 /* EULER_ROT */:
        gaff.rotation.z = gizmoResult.finalAngle;
        break;
    }
    console.log(z);
  });
}
class RotationResult {
  type = 0 /* QUATERNION_ROT */;
  boundsHit = false;
  finalAngle = 0;
  constructor() {}
}
function rotateGizmo(currentAngle, maxAngle, quaternionRot, minAngle) {
  let res = new RotationResult;
  let finalRot = currentAngle;
  if (!minAngle) {
    minAngle = maxAngle * -1;
  }
  if (currentAngle < minAngle) {
    finalRot = minAngle;
  } else if (currentAngle > maxAngle) {
    finalRot = maxAngle;
  }
  if (finalRot != currentAngle) {
    res.boundsHit = true;
  }
  if (quaternionRot) {
    res.finalAngle = finalRot * (Math.PI / 180);
    res.type = 0 /* QUATERNION_ROT */;
  } else {
    res.finalAngle = finalRot * (Math.PI / 180);
    res.type = 1 /* EULER_ROT */;
  }
  return res;
}
var acceleration = 0.02;
var MAX_VELOCITY = 0.2;
var velocity = 0;
var rotSpeed = 5 * (Math.PI / 180);
function moveBoat() {
  if (!joinedWithName) {
    return;
  }
  if (actionParams.length == 0) {
    return;
  }
  console.log("move boat");
  const inputWE = actionParams[0];
  const inputNS = actionParams[1];
  if (inputNS != "" || inputWE != "") {
    ws.send(JSON.stringify(new ClientPacket(2 /* PLAYER_POSITION_UPDATE */, new PlayerLocation([boatObj.absolutePosition.x, boatObj.absolutePosition.z], boatObj.rotation.y, velocity))));
  }
  if (inputNS == "N") {
    if (velocity < MAX_VELOCITY) {
      velocity += acceleration;
    }
    actionParams[1] = "";
  } else if (inputNS == "S") {
    if (velocity > 0) {
      velocity -= acceleration;
    }
    actionParams[1] = "";
  }
  if (inputWE == "W") {
    boatObj.addRotation(0, -1 * rotSpeed, 0);
    actionParams[0] = "";
  } else if (inputWE == "E") {
    boatObj.addRotation(0, rotSpeed, 0);
    actionParams[0] = "";
  }
}
var pressedMoveKeys = [];
function addKeyListeners() {
  canvas.addEventListener("keydown", (event) => {
    const key = event.key;
    if (joinedWithName) {
      if (key == "a") {
        actionParams[0] = "W";
      } else if (key == "d") {
        actionParams[0] = "E";
      } else {
        actionParams[0] = "";
      }
      if (key === "w") {
        console.log(key, pressedMoveKeys);
        actionParams[1] = "N";
      } else if (key == "s") {
        actionParams[1] = "S";
      } else {
        actionParams[1] = "";
      }
      currentAction = moveBoat;
      if (!pressedMoveKeys.includes(key)) {
        pressedMoveKeys.push(key);
      }
      if (key == "ArrowLeft") {
        shipCamera.position = new BABYLON.Vector3(shipCamera.position.x - 5, shipCamera.position.y, shipCamera.position.z);
      } else if (key == "ArrowRight") {
        shipCamera.position = new BABYLON.Vector3(shipCamera.position.x + 5, shipCamera.position.y, shipCamera.position.z);
      } else if (key == ",") {
        shipCamera.position = new BABYLON.Vector3(shipCamera.position.x, shipCamera.position.y, shipCamera.position.z - 5);
      } else if (key == ".") {
        shipCamera.position = new BABYLON.Vector3(shipCamera.position.x, shipCamera.position.y, shipCamera.position.z + 5);
      } else if (key == "ArrowUp") {
        shipCamera.position = new BABYLON.Vector3(shipCamera.position.x, shipCamera.position.y + 5, shipCamera.position.z);
      } else if (key == "ArrowDown") {
        shipCamera.position = new BABYLON.Vector3(shipCamera.position.x, shipCamera.position.y - 5, shipCamera.position.z);
      }
    }
  });
  canvas.addEventListener("keyup", (event) => {
    const key = event.key;
    if (pressedMoveKeys.includes(key)) {
      pressedMoveKeys.splice(pressedMoveKeys.indexOf(key), 1);
    }
    if (key == "Control") {
      changeShipView();
    }
  });
  scene.onPointerObservable.add((e) => {
    if (e.type == BABYLON.PointerEventTypes.POINTERDOWN && shipView) {
      if (e.pickInfo?.pickedMesh == tiller) {
        tillerRotationGizmo.attachedMesh = tiller;
      } else if (e.pickInfo?.pickedMesh == mast) {
        mastRotationGizmo.attachedMesh = mast;
      }
    }
  });
}
function updateVisibleChatHistory() {}
var currentAction = () => {};
var actionParams = [];
var delta;
async function queueClientAction() {
  if (gameLoaded) {
    delta = engine.getDeltaTime() / 1000;
    let moveKeysPressed = false;
    velocity = Math.round(velocity * 1000) / 1000;
    if (velocity != 0) {
      if (pressedMoveKeys.includes("w") || pressedMoveKeys.includes("s") || pressedMoveKeys.includes("d") || pressedMoveKeys.includes("a")) {
        moveKeysPressed = true;
      }
    }
    console.log(velocity);
    await currentAction();
    boatObj.locallyTranslate(new BABYLON.Vector3(velocity, 0, 0));
    if (shipView) {
      shipCamera.parent = scene.getNodeByName("camera-pivot");
      shipCamera.position = shipCamera.parent.position;
      shipCamera.target = scene.getNodeByName("camera-target").position;
    } else {
      oceanCamera.position = boatObj.position.add(new BABYLON.Vector3(0, 50, -3));
    }
    updateVisibleChatHistory();
  }
}
export {
  setJoinedWithName,
  linkWsToGame,
  gameLoaded,
  displayInboundChat,
  addOtherBoat
};
