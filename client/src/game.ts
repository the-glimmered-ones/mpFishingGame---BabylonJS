import { ClientPacket, ClientPacketTypes } from "@shared/PacketTypes";
import { PlayerLocation, GlobalClientLocation, ChatMessage } from "@shared/Consts"; 
import { WaterMaterial } from "babylonjs-materials";
var ws: WebSocket = new WebSocket("");
var iframe: Window = window.self;
//fixed loading times by hosting this file online and importing it when needed

let canvas: HTMLCanvasElement = document.createElement("canvas")
//console.log(canvas)

let engine: BABYLON.Engine | null = null;
var boatRoot: BABYLON.TransformNode;
var boatObj: BABYLON.Mesh;
var camera: BABYLON.FreeCamera;
export var gameLoaded: boolean = false
var joinedWithName: boolean;
const chatHistory: ChatMessage[] = []

let BOAT_Y_POSITION: number;
let BOAT_SCALE: BABYLON.Vector3;
let BOAT_STARTING_ROTATION: BABYLON.Vector3;
export function linkWsToGame(frame: Window, webSocket: WebSocket){
  ws.close()
  ws = webSocket
  canvas = <HTMLCanvasElement>(iframe.window.document.body.children[0])
  //console.log(frame.window.document.body.children)
  iframe = frame
  //console.log(window.document.scripts)
  BOAT_Y_POSITION = 5
  BOAT_SCALE = new BABYLON.Vector3(5,5,5)
  BOAT_STARTING_ROTATION = new BABYLON.Vector3(0, 4.712, 0)
  startGame()
}
var name: string = ""
export function setJoinedWithName(joinName: string){
  //console.log("set true")
  joinedWithName = true
  name = joinName
  setInterval(queueClientAction, 10)
}

function createWaterScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
    var scene: BABYLON.Scene = new BABYLON.Scene(engine);
    loadBoatMesh(scene, new BABYLON.Vector3(0, BOAT_Y_POSITION, 0))
    //console.log("scene created")
    //var camera = new BABYLON.ArcRotateCamera("Camera", 3 * Math.PI / 2, 8 * Math.PI / 45, 100, BABYLON.Vector3.Zero(), scene);
    camera = new BABYLON.FreeCamera("Camera", new BABYLON.Vector3(0,0,0), scene);
    //camera.attachControl(canvas, true);
    
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, .1), scene);
    light.diffuse = new BABYLON.Color3(1, .992, .867)
    light.intensity = 0.4

    var skybox = BABYLON.CreateBox("skyBox", { size: 1e3 }, scene);
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
    var ground = BABYLON.CreateGround("ground", { width: 512, height: 512, subdivisions: 32}, scene);
    ground.position.y = -1;
    ground.material = groundMaterial;

    var waterMesh = BABYLON.CreateGround("waterMesh", { width: 512, height: 512, subdivisions: 32}, scene);
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

    // BABYLON.Effect.ShadersStore["customFragmentShader"] = `
    // #ifdef GL_ES
    // precision highp float;
    // #endif

    // // Samplers
    // varying vec2 vUV;
    // uniform sampler2D textureSampler;
    
    // // Parameters
    // uniform vec2 screenSize;
    // uniform float threshold;

    // void main(void) {
    // vec2 texelSize = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
    // vec4 baseColor = texture2D(textureSampler, vUV);
    
    // // if (baseColor.r < threshold) {
    // gl_FragColor = baseColor;
    // // } else {
    // // gl_FragColor = vec4(0);
    // // }
    // }`;

    // var postProcess = new BABYLON.PostProcess("My custom post process", "custom", ["screenSize", "threshold"], null, 0.25, camera);
    // postProcess.onApply = function(effect) {
    //     effect.setFloat2("screenSize", postProcess.width, postProcess.height);
    //     effect.setFloat("threshold", 0.3);
    // };

return scene;
}

var chatDisplay: HTMLDivElement 
function setupUI(){
  const body = iframe.document.body
  body.style.flexDirection = "row"
  const ui_minimap = iframe.document.createElement("button")
  const minimap_img = iframe.document.createElement("img")
  minimap_img.src = "textures/ui/minimap.png"
  ui_minimap.appendChild(minimap_img)
  ui_minimap.style.height, minimap_img.style.height = "28vh"
  ui_minimap.style.width, minimap_img.style.width = "auto"
  ui_minimap.style.position = "absolute"
  ui_minimap.style.left = "0px"
  ui_minimap.style.padding = "0"
  ui_minimap.style.backgroundColor = "transparent"
  ui_minimap.style.border = "none"
  body.appendChild(ui_minimap)
  ui_minimap.style.bottom = "-4px"
  minimap_img.toggleAttribute("inert")
  minimap_img.tabIndex, ui_minimap.tabIndex = -1

  const ui_map = iframe.document.createElement("div")
  ui_map.style.position = "absolute"
  ui_map.style.left = "0px"
  ui_map.style.top = "0px"
  ui_map.style.padding = "0"
  ui_map.style.backgroundColor = "transparent"
  ui_map.style.height = "100vh"
  ui_map.style.width = "100vw"
  body.appendChild(ui_map)
  ui_map.style.backgroundImage = "url(textures/ui/map-bg.png)"
  ui_map.style.backgroundRepeat = "no-repeat"
  ui_map.style.backgroundSize = "98vw 92vh"
  ui_map.style.backgroundAttachment = "fixed"
  ui_map.style.backgroundPosition = "50% 20%"

  const ui_exit_map = iframe.document.createElement("button")
  const exit_map_img = iframe.document.createElement("img")
  exit_map_img.src = "textures/ui/exit-map.png"
  exit_map_img.style.width = "12vw"
  exit_map_img.style.height, ui_exit_map.style.width, ui_exit_map.style.height = "auto"
  ui_exit_map.appendChild(exit_map_img)
  ui_map.style.visibility = "hidden"
  ui_map.appendChild(ui_exit_map)
  ui_exit_map.style.position = "absolute"
  ui_exit_map.style.left = "4vw"
  ui_exit_map.style.bottom = "0px"
  ui_exit_map.style.padding = "0"
  ui_exit_map.style.backgroundColor = "transparent"
  ui_exit_map.style.border = "none"
  ui_map.tabIndex, ui_exit_map.tabIndex, exit_map_img.tabIndex = -1

  ui_minimap.addEventListener("click", () => { toggleMap(ui_minimap, ui_map) })
  ui_exit_map.addEventListener("click", () => { toggleMap(ui_map, ui_minimap); canvas.focus() })

  const ui_chat_table = iframe.document.createElement("table")
  ui_chat_table.innerHTML = `
  <tr style="display: flex">
  <td style="background-image:url('textures/ui/chatbox.png'); background-repeat: no-repeat; background-position: top right;background-size: 100% 100%;">
      <input id="chat-box" type="text" placeholder="say somethings" style="margin:8px 15px;width: 30vw;height: 3vh">
    </td>
  <td style="background-image:url('textures/ui/send-chat.png');background-repeat: no-repeat;background-position: top right;background-size: 100% 100%;">
    <button id="send-chat" style="background-color: transparent; border: none; margin: 5px; width: 5vw; height: stretch;color: antiqueWhite;font-weight: bold;">
    Send</button>
  </td>
  </tr>`
  ui_chat_table.style.position = "absolute"
  ui_chat_table.style.right = "0px"
  ui_chat_table.style.bottom = "0px"
  ui_chat_table.style.border = "none"
  ui_chat_table.style.padding = "0"
  ui_chat_table.style.display = "flex"
  ui_chat_table.style.borderSpacing = "2"
  body.appendChild(ui_chat_table)

  const sendChatButton: HTMLButtonElement = <HTMLButtonElement>iframe.document.getElementById("send-chat")
  const chatBox: HTMLInputElement = <HTMLInputElement>iframe.document.getElementById("chat-box")
  chatDisplay = iframe.document.createElement("div")
  chatDisplay.id = "chat-display"
  // chatDisplay.innerHTML = `<p style="margin:1px">
  // <span id="name" style="font-weight: bold">${name}:</span><span style="font-style:italic; color: gray; position: absolute; right: 3px;">${new Date().getHours()}:${new Date().getMinutes()}</span>
  // <br>hello my name is ${name}.
  // </p>`
  chatDisplay.style.backgroundColor = "antiqueWhite"
  chatDisplay.style.border = "1px solid black"
  chatDisplay.style.width = chatBox.style.width
  chatDisplay.style.position = "absolute"
  const chatHeight = chatBox.getBoundingClientRect().height + Number(chatBox.style.marginTop.slice(0,1))//in px
  const chatLeft = (chatBox.getBoundingClientRect().x)
  //console.log("chat height " + chatHeight.toString() + "px " + (Math.round(chatHeight) * 100 / iframe.document.documentElement.clientHeight) + "vh")
  chatDisplay.style.bottom = (Math.round(chatHeight) * 100 / iframe.document.documentElement.clientHeight) + "vh"//converting to viewport units
  chatDisplay.style.left = (Math.round(chatLeft) * 100 / iframe.document.documentElement.clientWidth) + "vw"
  chatDisplay.style.display = "flex"
  chatDisplay.style.flexDirection = "column"
  chatDisplay.style.maxHeight = "30vh"
  chatDisplay.style.overflowY = "scroll"
  chatDisplay.style.overflowWrap = "anywhere"
  chatDisplay.style.visibility = "hidden"
  body.appendChild(chatDisplay)

  chatBox.addEventListener("mouseenter", () => {
    chatDisplay.scroll(0, chatDisplay.scrollHeight)
    chatDisplay.style.visibility = "visible"
  }, {"capture": true})

  chatDisplay.addEventListener("mouseover", () => {
    chatDisplay.style.visibility = "visible"
  }, {"capture": true})

  ui_chat_table.addEventListener("mouseleave", () => {
    chatDisplay.style.visibility = "hidden"
  })

  chatDisplay.addEventListener("mouseout", () => {
    if (document.activeElement != chatBox || document.activeElement != ui_chat_table){
      chatDisplay.style.visibility = "hidden"
    }
  }, {"capture": true})

  sendChatButton.addEventListener("click", () => { sendChat(chatBox.value); chatBox.value = ""; chatBox.focus(); })
  chatBox.addEventListener("keyup", (event) => {
    if (event.key == "Enter"){
      sendChat(chatBox.value); 
      chatBox.value = "";
    }
  }, {"capture": true})
}

function sendChat(msg: string){
  if (msg == "") { return; }
  const message = new ChatMessage(name, msg)
  chatHistory.push(message)
  var hours = (new Date().getHours().toString().length == 1) ? ("0" + new Date().getHours().toString()) : (new Date().getHours().toString())
  var minutes = (new Date().getMinutes().toString().length == 1) ? ("0" + new Date().getMinutes().toString()) : (new Date().getMinutes().toString())
  chatDisplay.innerHTML += `<p style="padding:3px; margin: 0; border: 1px solid lightGray">
  <span id="name" style="font-weight: bold; text-decoration: underline;">${name}:</span><span style="font-style:italic; color: gray; position: absolute; right: 3px;">${hours}:${minutes}</span>
  <br>${msg}
  </p>`
  chatDisplay.scroll(0, chatDisplay.scrollHeight)
  ws.send(JSON.stringify(new ClientPacket(ClientPacketTypes.SEND_CHAT, message)))
}

export function displayInboundChat(message: ChatMessage){
  if (message.name != name){
    chatHistory.push(message)
    chatDisplay.innerHTML += `<p style="padding:3px; margin: 0; border: 1px solid lightGray">
    <span id="name" style="font-weight: bold; text-decoration: underline;">${message.name}:</span><span style="font-style:italic; color: gray; position: absolute; right: 3px;">${message.time[0]}:${message.time[1]}</span>
    <br>${message.msg}
    </p>`
  }
}

function toggleMap(hideElem: HTMLElement, showElem: HTMLElement){
  hideElem.style.visibility = "hidden"
  showElem.style.visibility = "visible"
}

var boatMesh: BABYLON.Mesh
var oceanCamera: BABYLON.FreeCamera; 
var shipCamera: BABYLON.FreeCamera;
var tiller: BABYLON.AbstractMesh;
var mast: BABYLON.AbstractMesh;
var gaff: BABYLON.AbstractMesh;

async function loadBoatMesh(scene: BABYLON.Scene, pos: BABYLON.Vector3){
    //sceneMeshes = (await BABYLON.ImportMeshAsync("textures/sailboat.obj", scene));//"textures/boat-placeholder.obj", scene));
    await BABYLON.AppendSceneAsync("textures/sailboat.glb", scene).then(() => {
      boatMesh = <BABYLON.Mesh> scene.getNodeByName("BOAT");
      boatMesh.checkCollisions = true
      console.log(boatMesh.collider)
      boatMesh.collisionGroup = 1
      boatMesh.onCollideObservable.add(() => {
        console.log("collision")
        velocity = 0
      })
      addPreloadedPlayers();
    })
    
    
    console.log(scene)
    var woodMat: BABYLON.StandardMaterial;
    woodMat = new BABYLON.StandardMaterial("boatMat")
    woodMat.diffuseColor = new BABYLON.Color3(97/255, 38/255, 0);

    var lightWoodMat: BABYLON.StandardMaterial;
    lightWoodMat = new BABYLON.StandardMaterial("boatMat")
    lightWoodMat.diffuseColor = new BABYLON.Color3(214/255, 151/255, 92/255);

    mast = <BABYLON.AbstractMesh> scene.getNodeByName("mast")
    tiller = <BABYLON.AbstractMesh> scene.getNodeByName("tiller")
    gaff = <BABYLON.AbstractMesh> scene.getMeshByName("gaff")
    boatMesh.material = woodMat
    mast.material = woodMat
    tiller.material = lightWoodMat

    oceanCamera = <BABYLON.FreeCamera> scene.cameras.find((camera) => { return camera.name == "OceanCamera"})
    shipCamera = <BABYLON.FreeCamera> scene.cameras.find((camera) => { return camera.name == "ShipCamera"})
    oceanCamera.parent = (<BABYLON.TransformNode>scene.getNodeByName("ocean-camera-pivot"))
    shipCamera.parent = (<BABYLON.TransformNode>scene.getNodeByName("camera-pivot"))
    //shipCamera.lockedTarget = <BABYLON.Mesh> scene.meshes.find((mesh) => { return mesh.name == "camera-target"})
    shipCamera.target = (<BABYLON.TransformNode>scene.getNodeByName("camera-target")).position
    camera = oceanCamera
    shipCamera.fov = .33
    //console.log(scene.cameras)
    setupGizmos();

    for (let mesh of scene.meshes){
      if (mesh.name == "gaff" || mesh.name == "boom"){
        mesh.material = woodMat
        //mast.addChild(mesh)
      }
      if (mesh.name == "bowsprit"){
        mesh.material = woodMat
        //boatMesh.addChild(mesh)
      }
      if (mesh.name == "cabin"){
        mesh.material = lightWoodMat
        //boatMesh.addChild(mesh)
      }
    }
    // boatMesh.addChild(mast)
    boatMesh.position = pos

    if (boatMesh){
      addBoat(boatMesh, new BABYLON.Vector3(0, BOAT_Y_POSITION, 0), BOAT_SCALE, BOAT_STARTING_ROTATION, [oceanCamera, shipCamera]);
    }

}

function addBoat(mesh: BABYLON.Mesh, pos: BABYLON.Vector3, scale: BABYLON.Vector3, rotation: BABYLON.Vector3, cameras?: BABYLON.FreeCamera[]){
  boatRoot = new BABYLON.TransformNode("boatTransform");
  boatObj = mesh
  console.log(mesh)
  if (cameras){
    //oceanCamera.parent = boatRoot
    //shipCamera.parent = boatRoot
    //console.log("cameras added")
    oceanCamera.position = (<BABYLON.TransformNode>oceanCamera.parent).position
    oceanCamera.target = (<BABYLON.TransformNode> scene.getNodeByName("camera-target")).position
    oceanCamera.fov = .386
    //shipCamera.position = new BABYLON.Vector3(-5, 35, -40)
    // shipCamera.position = boatObj.position.add(new BABYLON.Vector3(-8, 35, -40))
    // shipCamera.setTarget(new BABYLON.Vector3(boatObj.absolutePosition.x, 3, boatObj.absolutePosition.z))
    // shipCamera.fov = .3
    scene.activeCamera = oceanCamera
  }

  boatObj.parent = boatRoot
  boatRoot.position = pos
  //boatRoot.scaling = scale
  boatObj.rotation = rotation
  return boatRoot;
}

class LoadedPlayer {
  name
  mesh
  constructor(name: string, mesh: BABYLON.InstancedMesh){
    this.name = name
    this.mesh = mesh
  }
}
const preloadedPlayers: GlobalClientLocation[] = []
const loadedPlayers: LoadedPlayer[] = []
export function addOtherBoat(player: GlobalClientLocation){
  if (!boatMesh) { preloadedPlayers.push(player); return;}
  if (player.name == name) {return;}
  //if (!loadedPlayers.find(({name}) => {return player.name == name})){
    const mesh: BABYLON.InstancedMesh = boatMesh.createInstance(`${player.name}BoatInstance`)//TODO instance of different mesh depending on ship type
    mesh.position = new BABYLON.Vector3(player.position[0], BOAT_Y_POSITION, player.position[1])
    mesh.rotation = new BABYLON.Vector3(0, player.angle, 0)
    mesh.parent = null
    mesh.collisionMask = 2
    scene.addMesh(mesh)
    //const transform = addBoat(mesh, new BABYLON.Vector3(player.position[0], BOAT_Y_POSITION, player.position[1]), BOAT_SCALE, new BABYLON.Vector3(0, player.angle, 0))
    loadedPlayers.push(new LoadedPlayer(player.name, mesh))
}

function addPreloadedPlayers(){
  for (let player of preloadedPlayers){
    addOtherBoat(player)
  }
}

export function updateExistingPlayerLocation(data: GlobalClientLocation){
  const player = loadedPlayers.find(({name}) => {return data.name == name})
  //console.log("players: ", loadedPlayers)
  if (player?.mesh){
    player.mesh.position = new BABYLON.Vector3(data.position[0], BOAT_Y_POSITION, data.position[1])
    player.mesh.rotation = new BABYLON.Vector3(0,data.angle,0)
    //console.log(`${player.name} moved to ${player.mesh.position}`)
  }
  else{
    addOtherBoat(data)
  }
}

export function removePlayerShipOnLeave(name: string){
  let result = loadedPlayers.find((player) => {return name == player.name})
  console.log(result)
  if (result){
    console.log("mesh removed")
    scene.removeMesh(result.mesh, true)
    result.mesh.dispose()
    loadedPlayers.splice(loadedPlayers.indexOf(result),1)
  }
}

//https://stackoverflow.com/questions/251420/invoking-javascript-code-in-an-iframe-from-the-parent-page
//https://www.reddit.com/r/javascript/comments/657ma6/attempting_to_call_parent_function_from_iframe_is/
var scene: BABYLON.Scene;
async function startGame(){//parent.getWebsocket()){
  ws.addEventListener("open", async () => {
    //if (engine == null) {
    canvas = <HTMLCanvasElement>(iframe.document.getElementById("renderCanvas"))//iframe.window.document.body.children[0])
    engine = new BABYLON.Engine(canvas, true); //,{ preserveDrawingBuffer: true, stencil: true });
    //}

    let createScene = createWaterScene;// || mod.default;
    // if (!createScene && mod.Playground?.CreateScene) createScene = (e,c)=>mod.Playground.CreateScene(e,c);
    if (!createScene) throw new Error('No createScene() export found.');

    //console.log("made here")
    //console.log(iframe.window.document.body.children)
    scene = await createWaterScene(engine, canvas);
    gameLoaded = true;
    engine.runRenderLoop(() => scene.render());
    addEventListener('resize', () => { if(engine) { engine.resize() } });
    scene.debugLayer.show()
    joinedWithName = false
    console.log("scene drawn")
    addKeyListeners()
    setupUI()

    // //this stopped it from rendering
    // if (typeof createWaterScene === 'function') {
    //   try { engine = await createWaterScene; } catch {}
    // }
  })
}

var shipView = false
function changeShipView(){
  if (shipView){
    scene.activeCamera = oceanCamera
    tillerRotationGizmo.attachedMesh = null
    mastRotationGizmo.attachedMesh = null
    gaffMovementGizmo.attachedMesh = null
    gaffRotationGizmo.attachedMesh = null
    shipView = false
  }
  else{
    scene.activeCamera = shipCamera
    tillerRotationGizmo.attachedMesh = tiller
    mastRotationGizmo.attachedMesh = mast
    gaffMovementGizmo.attachedMesh = gaff
    gaffRotationGizmo.attachedMesh = gaff
    shipView = true
  }
}

var tillerRotationGizmo: BABYLON.PlaneRotationGizmo;
var mastRotationGizmo: BABYLON.PlaneRotationGizmo;
var gaffMovementGizmo: BABYLON.AxisDragGizmo;
var gaffRotationGizmo: BABYLON.PlaneRotationGizmo;
function setupGizmos(){
  var utilLayer = new BABYLON.UtilityLayerRenderer(scene);
  tiller.behaviors.splice(0)
  mast.behaviors.splice(0)
  gaff.behaviors.splice(0)
  const dragbehavior = new BABYLON.PointerDragBehavior
  dragbehavior.enabled = false
  tiller.addBehavior(dragbehavior)
  mast.addBehavior(dragbehavior)
  gaff.addBehavior(dragbehavior)
  
  tillerRotationGizmo = new BABYLON.PlaneRotationGizmo(new BABYLON.Vector3(0,1,0), BABYLON.Color3.Yellow(), utilLayer, undefined, undefined, false, 3, BABYLON.Color3.Teal())
  tillerRotationGizmo.attachedMesh = null
  tillerRotationGizmo.updateGizmoRotationToMatchAttachedMesh = true;
  tillerRotationGizmo.updateGizmoPositionToMatchAttachedMesh = true;
  tillerRotationGizmo.scaleRatio = .3
  tillerRotationGizmo.sensitivity = .5
  tillerRotationGizmo.dragBehavior.onDragObservable.add((e) => {
    let y = (tiller.rotationQuaternion ? tiller.rotationQuaternion.y : tiller.rotation.y) * (180/Math.PI)
    let factor = Math.round(tiller.scaling.x * 100)/100
    tiller.scaling = new BABYLON.Vector3(factor, factor, factor)
    const gizmoResult = rotateGizmo(y, 25, (tiller.rotationQuaternion ? tiller.rotationQuaternion : undefined));
    if (gizmoResult.boundsHit){
      tillerRotationGizmo.dragBehavior.releaseDrag()
    }
    switch (gizmoResult.type){
      case RotationType.QUATERNION_ROT:
        (<BABYLON.Quaternion>tiller.rotationQuaternion).y = gizmoResult.finalAngle
        break;
      case RotationType.EULER_ROT:
        tiller.rotation.y = gizmoResult.finalAngle
        break;
    }
    //console.log(y)
  });

  mastRotationGizmo = new BABYLON.PlaneRotationGizmo(new BABYLON.Vector3(0,1,0), BABYLON.Color3.Yellow(), utilLayer, undefined, undefined, false, 3, BABYLON.Color3.Teal())
  mastRotationGizmo.attachedMesh = null
  mastRotationGizmo.updateGizmoRotationToMatchAttachedMesh = true;
  mastRotationGizmo.updateGizmoPositionToMatchAttachedMesh = true;
  mastRotationGizmo.scaleRatio = .25
  mastRotationGizmo.sensitivity = .5
  mastRotationGizmo.dragBehavior.onDragObservable.add((e) => {
    let y = (mast.rotationQuaternion ? mast.rotationQuaternion.y : mast.rotation.y) * (180/Math.PI)
    mast.scaling = new BABYLON.Vector3(Math.round(mast.scaling.x * 100)/100, Math.round(mast.scaling.y * 100)/100, Math.round(mast.scaling.z * 100)/100)
    const gizmoResult = rotateGizmo(y, 35, (mast.rotationQuaternion ? mast.rotationQuaternion : undefined));
    if (gizmoResult.boundsHit){
      mastRotationGizmo.dragBehavior.releaseDrag()
    }
    switch (gizmoResult.type){
      case RotationType.QUATERNION_ROT:
        (<BABYLON.Quaternion>mast.rotationQuaternion).y = gizmoResult.finalAngle
        break;
      case RotationType.EULER_ROT:
        mast.rotation.y = gizmoResult.finalAngle
        break;
    }
    console.log(y)
  });

  gaffMovementGizmo = new BABYLON.AxisDragGizmo(new BABYLON.Vector3(0,1,0), BABYLON.Color3.Red(), utilLayer, undefined, 3, BABYLON.Color3.Teal())
  gaffMovementGizmo.updateGizmoRotationToMatchAttachedMesh = false;
  gaffMovementGizmo.updateGizmoPositionToMatchAttachedMesh = true;
  gaffMovementGizmo.attachedMesh = null
  gaffMovementGizmo.scaleRatio = .35
  gaffMovementGizmo.dragBehavior.onDragObservable.add((e) => {
    const y = gaff.position.y
    //console.log(y)//-3.7, 0.45
    const minY = -3.7
    const maxY = 0.45
    let finalY = y
    if (y < minY){
      finalY = minY
    }
    else if (y > maxY){
      finalY = maxY
    }
    if (finalY != y){
      gaffMovementGizmo.dragBehavior.releaseDrag()
    }
  });

  gaffRotationGizmo = new BABYLON.PlaneRotationGizmo(new BABYLON.Vector3(0,0,1), BABYLON.Color3.Green(), utilLayer, undefined, undefined, false, 3, BABYLON.Color3.Teal())
  gaffRotationGizmo.attachedMesh = null
  gaffRotationGizmo.updateGizmoRotationToMatchAttachedMesh = true;
  gaffRotationGizmo.updateGizmoPositionToMatchAttachedMesh = true;
  gaffRotationGizmo.sensitivity = .5
  gaffRotationGizmo.scaleRatio = .25
  gaffRotationGizmo.dragBehavior.onDragObservable.add((e) => {
    let z = (gaff.rotationQuaternion ? gaff.rotationQuaternion.z : gaff.rotation.z) * (180/Math.PI)
    //console.log((gaff.rotationQuaternion ? gaff.rotationQuaternion.z : 0)* (180/Math.PI), gaff.rotation.z)
    gaff.scaling = new BABYLON.Vector3(Math.round(gaff.scaling.x * 100)/100, Math.round(gaff.scaling.y * 100)/100, Math.round(gaff.scaling.z * 100)/100)
    const gizmoResult = rotateGizmo(z, 41.8, (gaff.rotationQuaternion ? gaff.rotationQuaternion : undefined), 15);
    if (gizmoResult.boundsHit){
      gaffRotationGizmo.dragBehavior.releaseDrag()
    }
    switch (gizmoResult.type){
      case RotationType.QUATERNION_ROT:
        (<BABYLON.Quaternion>gaff.rotationQuaternion).z = gizmoResult.finalAngle
        break;
      case RotationType.EULER_ROT:
        gaff.rotation.z = gizmoResult.finalAngle
        break;
    }
    console.log(z)
  });
}

const enum RotationType{
  "QUATERNION_ROT",
  "EULER_ROT"
}
class RotationResult{
  type: RotationType = RotationType.QUATERNION_ROT
  boundsHit: boolean = false
  finalAngle: number = 0
  constructor(){
  }
}
function rotateGizmo(currentAngle: number, maxAngle: number, quaternionRot?: BABYLON.Quaternion, minAngle?: number): RotationResult{
  let res = new RotationResult()
  let finalRot = currentAngle;
  if (!minAngle){
    minAngle = maxAngle * -1
  }

  if (currentAngle < minAngle){
    finalRot = minAngle
  }
  else if (currentAngle > maxAngle){
    finalRot = maxAngle
  }

  if (finalRot != currentAngle){
    res.boundsHit = true
  }
  if (quaternionRot){
    res.finalAngle = finalRot * (Math.PI/180)
    res.type = RotationType.QUATERNION_ROT
  }
  else{
    res.finalAngle = finalRot * (Math.PI/180)
    res.type = RotationType.EULER_ROT
  }
  return res;
}


const acceleration = .02;
const MAX_VELOCITY = .2;
let velocity: number = 0;
const rotSpeed: number = 5 * (Math.PI/180); //5 deg
//let moveNS: number = 0
function moveBoat(){
  if (!joinedWithName) { return; }

  if (actionParams.length == 0) { return; }
  //console.log("move boat")

  //moveNS = .5
  const inputWE = actionParams[0]
  const inputNS = actionParams[1]
  //console.log(actionParams)

  //TODO: acceleration / lerp with delta for smoother movement

  //if NS input, move boat forward/backward
  // "Every frame, you add your acceleration value (PLAYER_ACCELERATION) to the player's velocity until it reaches a maximum."
  if (inputNS == "N"){
    if (velocity < MAX_VELOCITY){
      velocity += acceleration
    }
    actionParams[1] = ""
  }
  else if (inputNS == "S"){
    if (velocity > 0){
      velocity -= acceleration
    }
    actionParams[1] = ""
  }

  //if WE input, turn on rudder
  if (inputWE == "W"){
    boatObj.addRotation(0, -1 * rotSpeed, 0)
    //tiller.addRotation(0, -15 * (Math.PI/180), 0)
    actionParams[0] = ""
  }
  else if (inputWE == "E"){
    boatObj.addRotation(0, rotSpeed, 0)
    //tiller.addRotation(0, 15 * (Math.PI/180), 0)
    actionParams[0] = ""
  }
}

const pressedMoveKeys: Array<string> = []
function addKeyListeners(){
  //console.log("added listeners")
  canvas.addEventListener("keydown", (event) => {
  //w/up = go forward, left/right = turn, down = slowly back up
  //change view = space, attack = shift, map = tab
    const key = event.key
    //console.log(gameLoaded, joinedWithName)
    if (joinedWithName){
      if(key == "a"){
        actionParams[0] = "W";
      }
      else if(key == "d"){
        actionParams[0] = "E";
      }
      else{
        actionParams[0] = "";
      }
      if(key === "w"){
        actionParams[1] = "N";
      }
      else if(key == "s"){
        actionParams[1] = "S";
      }
      else{
        actionParams[1] = "";
      }
      currentAction = moveBoat
      if (!pressedMoveKeys.includes(key)){
        pressedMoveKeys.push(key)
      }
      //console.log(actionParams, pressedMoveKeys)

      let oceanPivot = <BABYLON.TransformNode> scene.getNodeByName("ocean-camera-pivot")
      if (key == "ArrowLeft"){
        shipCamera.position = new BABYLON.Vector3(shipCamera.position.x - 5, shipCamera.position.y, shipCamera.position.z)
      }
      else if (key == "ArrowRight"){
        shipCamera.position = new BABYLON.Vector3(shipCamera.position.x + 5, shipCamera.position.y, shipCamera.position.z)
      }
      else if (key == ","){
        oceanPivot.position = new BABYLON.Vector3(oceanPivot.position.x, oceanPivot.position.y - 5, oceanPivot.position.z)
      }
      else if (key == "."){
        oceanPivot.position = new BABYLON.Vector3(oceanPivot.position.x, oceanPivot.position.y + 5, oceanPivot.position.z)
      }
      else if (key == "ArrowUp"){
        oceanPivot.position = new BABYLON.Vector3(oceanPivot.position.x + 1, oceanPivot.position.y, oceanPivot.position.z)
      }
      else if (key == "ArrowDown"){
        oceanPivot.position = new BABYLON.Vector3(oceanPivot.position.x - 1, oceanPivot.position.y, oceanPivot.position.z)
      }
    }
  })

  canvas.addEventListener("keyup", (event) => {
    const key = event.key
    if (pressedMoveKeys.includes(key)){
      pressedMoveKeys.splice(pressedMoveKeys.indexOf(key), 1)
    }
    if (key == "Control"){
        changeShipView()
    }
  })
  scene.onPointerObservable.add((e) => {
    if (e.type == BABYLON.PointerEventTypes.POINTERDOWN && shipView){
      if (e.pickInfo?.pickedMesh == tiller){
        tillerRotationGizmo.attachedMesh = tiller
      }
      else if (e.pickInfo?.pickedMesh == mast){
        mastRotationGizmo.attachedMesh = mast
      }
    }
  })
}

function updateVisibleChatHistory(){
  
}

var currentAction: CallableFunction = () => {};
var actionParams: Array<any> = [];
var delta;// = (engine).getDeltaTime()/1000 
async function queueClientAction(){
  if (gameLoaded){
    delta = (<BABYLON.Engine> engine).getDeltaTime()/1000
    //console.log("tick ", currentAction)
    let moveKeysPressed: boolean = false;
    velocity = Math.round(velocity*1000)/1000
    if (velocity != 0){
      if (pressedMoveKeys.includes("w") || pressedMoveKeys.includes("s") || pressedMoveKeys.includes("d") || pressedMoveKeys.includes("a")){//not moving, decelerate
        moveKeysPressed = true
        //console.log("move keys pressed " + pressedMoveKeys)
      }
    }
    //console.log(velocity)
    await currentAction()
    boatObj.locallyTranslate(new BABYLON.Vector3(velocity, 0, 0))

    ws.send(
      JSON.stringify(
        new ClientPacket(ClientPacketTypes.PLAYER_POSITION_UPDATE, 
        new PlayerLocation(
          [boatObj.absolutePosition.x, boatObj.absolutePosition.z],
          boatObj.rotation.y,
          velocity
    ))))

    //currentAction = () => {};
    //actionParams = [];

    if (shipView){
      shipCamera.parent = <BABYLON.TransformNode> scene.getNodeByName("camera-pivot")
      shipCamera.position = (<BABYLON.TransformNode>shipCamera.parent).position
      //shipCamera.position = ((<BABYLON.Mesh>shipCamera.parent) ? (<BABYLON.Mesh>shipCamera.parent).position : boatObj.position.add(new BABYLON.Vector3(-8, 25, -40)))
      //shipCamera.setTarget(new BABYLON.Vector3(boatObj.position.x, 3, boatObj.position.z))
      shipCamera.target = (<BABYLON.TransformNode> scene.getNodeByName("camera-target")).position
    }
    else{
      //oceanCamera.position = boatObj.position.add(new BABYLON.Vector3(0, 50, -3))
      oceanCamera.parent = <BABYLON.TransformNode> scene.getNodeByName("ocean-camera-pivot")
      //oceanCamera.position = (<BABYLON.TransformNode>oceanCamera.parent).position
      oceanCamera.target = (<BABYLON.TransformNode> scene.getNodeByName("camera-target")).position
    }

    updateVisibleChatHistory()
  }
}