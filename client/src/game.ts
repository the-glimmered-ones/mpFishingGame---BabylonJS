// import * as BABYLON from "babylonjs";
// import { WaterMaterial } from "babylonjs-materials"; 
// import "babylonjs-materials";
// import "babylonjs-loaders";
// import "babylonjs-post-process";
// import "babylonjs-serializers";
// import "babylonjs-gui";
import { ClientPacket, ClientPacketTypes } from "@shared/PacketTypes";
import { PlayerLocation, GlobalClientLocation, ChatMessage } from "@shared/Consts"; 
import { FollowCamera } from "babylonjs";
//import { ws } from "@src/shared";
var ws: WebSocket = new WebSocket("");
var iframe: Window = window.self;
//fixed loading times by hosting this file online and importing it when needed

let canvas: HTMLCanvasElement = document.createElement("canvas")
//console.log(canvas)

let engine: BABYLON.Engine | null = null;
var boatRoot: BABYLON.TransformNode;
var boatObj: BABYLON.Mesh;
var camera: BABYLON.FollowCamera;
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
    //console.log("scene created")
    //var camera = new BABYLON.ArcRotateCamera("Camera", 3 * Math.PI / 2, 8 * Math.PI / 45, 100, BABYLON.Vector3.Zero(), scene);
    camera = new BABYLON.FollowCamera("Camera", new BABYLON.Vector3(0,0,0), scene);
    //camera.attachControl(canvas, true);
    
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, .1), scene);
    light.diffuse = new BABYLON.Color3(1, .992, .867)
    light.intensity = 0.5

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

    loadBoatMesh(scene)

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
var sceneMeshes: BABYLON.ISceneLoaderAsyncResult;
var oceanCamera: BABYLON.FollowCamera; 
var shipCamera: BABYLON.FollowCamera;
async function loadBoatMesh(scene: BABYLON.Scene){
    //sceneMeshes = (await BABYLON.ImportMeshAsync("textures/sailboat.obj", scene));//"textures/boat-placeholder.obj", scene));
    await BABYLON.AppendSceneAsync("textures/sailboat.glb", scene)
    console.log(scene)
    boatMesh = <BABYLON.Mesh> scene.meshes.find((mesh) => { return mesh.name == "BOAT"})
    const mast = <BABYLON.Mesh> scene.meshes.find((mesh) => { return mesh.name == "mast"})
    oceanCamera = <BABYLON.FollowCamera> scene.cameras.find((camera) => { return camera.name == "OceanCamera"})
    shipCamera = <BABYLON.FollowCamera> scene.cameras.find((camera) => { return camera.name == "ShipCamera"})
    console.log(scene.cameras)
    for (let mesh of scene.meshes){
      if (mesh.name == "gaff" || mesh.name == "boom"){
        mast.addChild(mesh)
      }
      if (mesh.name == "bowsprit" || mesh.name == "cabin"){
        boatMesh.addChild(mesh)
      }
    }
    boatMesh.addChild(mast)
    if (boatMesh){
      addBoat(boatMesh, new BABYLON.Vector3(0, BOAT_Y_POSITION, 0), BOAT_SCALE, BOAT_STARTING_ROTATION, [oceanCamera, shipCamera]);
    }
    // for (let mesh of sceneMeshes.meshes){
    //   if (mesh.name.includes('BOAT')){//BOAT
    //     boatMesh = <BABYLON.Mesh>mesh
    //     addBoat(boatMesh, new BABYLON.Vector3(0, BOAT_Y_POSITION, 0), BOAT_SCALE, BOAT_STARTING_ROTATION, camera);
    //     break;
    //   }
    // }
    //y is height, x and z are width and length, rotation is in radians
    
}

function addBoat(mesh: BABYLON.Mesh, pos: BABYLON.Vector3, scale: BABYLON.Vector3, rotation: BABYLON.Vector3, cameras?: BABYLON.FollowCamera[]){
  boatRoot = new BABYLON.TransformNode("boatTransform");
  var boatMat: BABYLON.StandardMaterial;
  console.log(mesh)
  boatObj = mesh
  boatMat = new BABYLON.StandardMaterial("boatMat")
  boatMat.diffuseColor = new BABYLON.Color3(97/255, 38/255, 0);
  boatObj.material = boatMat
  
  if (cameras){
    oceanCamera.parent = boatRoot
    shipCamera.parent = boatObj
    scene.activeCamera = oceanCamera
  }

  boatObj.parent = boatRoot
  boatRoot.position = pos
  boatRoot.scaling = scale
  boatObj.rotation = rotation
  
  // if (camera){
  //   camera.position = new BABYLON.Vector3(0, 30, -3)
  //   camera.setTarget(new BABYLON.Vector3(0, -10, -3))
  //   camera.fov = 1.1
  //   camera.parent = boatRoot;
  //   //camera.attachControl();
  //   //camera.cameraAcceleration = 1;
  //   //camera.maxCameraSpeed = 10;
  // }

  //console.log(boatRoot) 
}

export function addOtherBoat(player: GlobalClientLocation){
  addBoat(boatMesh, new BABYLON.Vector3(player.position[0], BOAT_Y_POSITION, player.position[1]), BOAT_SCALE, new BABYLON.Vector3(0, player.angle, 0))
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
    //camera.fov = 1.1
    scene.activeCamera = oceanCamera
    shipView = false
    //camera.parent = boatMesh.parent
    
  }
  else{
    scene.activeCamera = shipCamera
    // camera.fov = .5
    shipView = true
    // camera.parent = boatMesh
    // camera.rotationOffset
  }
  
}


//const MAX_ACCELERATION = 1;
const acceleration = .2;
const MAX_VELOCITY = 2;
let velocity: number = 1;
const rotSpeed: number = 0.087; //5 deg
let moveNS: number = 0
function moveBoat(){
  if (!gameLoaded || !joinedWithName) { return; }

  if (actionParams.length == 0) { return; }
  console.log("move boat")

  moveNS = .5
  const inputWE = actionParams[0]
  const inputNS = actionParams[1]
  //console.log(actionParams)

  //TODO: acceleration / lerp with delta for smoother movement

  if (inputNS != "" || inputWE != ""){
    //console.log("hasJoinedWithName " + joinedWithName)
    ws.send(
      JSON.stringify(
        new ClientPacket(ClientPacketTypes.PLAYER_POSITION_UPDATE, 
        new PlayerLocation(
          [boatObj.absolutePosition.x, boatObj.absolutePosition.z],
          boatObj.rotation.y,
          velocity
    ))))
  }

  if (inputNS != ""){
    //if NS input, move boat forward/backward
    // "Every frame, you add your acceleration value (PLAYER_ACCELERATION) to the player's velocity until it reaches a maximum."

    if (inputNS == "N"){
      if (velocity > 0)
        velocity = -.2
      accelerate(false);
      moveNS = (-1 * moveNS) + velocity//-1 * (velocity + acceleration)
    }
    else if (inputNS == "S"){
      if (velocity < 0)
        velocity = .2
      accelerate(true);
      moveNS = moveNS + velocity// + acceleration
    }
    //console.log("pos " + boatObj.position)
    boatObj.locallyTranslate(new BABYLON.Vector3(moveNS, 0, 0))//new BABYLON.Vector3(moveNS, 0, 0))

    //console.log("new pos " + boatObj.position)
    camera.position = new BABYLON.Vector3(boatObj.position.x, camera.position.y, boatObj.position.z - 3)
    //if boat angle > 180, shift camera down, if angle < 180, shift camera up; center boat on screen?
    
  }
  //if WE input, turn on rudder
  if (inputWE != ""){
    velocity = 0
    if (inputWE == "W")
      boatObj.addRotation(0, -1 * rotSpeed, 0)
    else if (inputWE == "E")
      boatObj.addRotation(0, rotSpeed, 0)
  }
}

function accelerate(reversing: boolean){
  if (reversing){
    if (velocity < MAX_VELOCITY)
      velocity += acceleration;
    if (velocity > MAX_VELOCITY)
      velocity = MAX_VELOCITY;
    console.log("reversing velocity " + velocity)
  }
  else{
    if (velocity > (MAX_VELOCITY * -1) && velocity <= 0) // if > -3
      velocity -= acceleration; //
    if (velocity < (MAX_VELOCITY * -1))
      velocity = (MAX_VELOCITY * -1);
  }
}

function decelerate(reversing: boolean){
  if (reversing){
    if (velocity < 0)
      velocity += acceleration;
    if (velocity > 0)
      velocity = 0;
  }
  else{
    if (velocity > 0)
      velocity -= acceleration;
    if (velocity < 0)
      velocity = 0;
  }
  //boatObj.locallyTranslate(new BABYLON.Vector3(moveNS, 0, 0))
}

const pressedMoveKeys: Array<string> = []
function addKeyListeners(){
  //console.log("added listeners")
  canvas.addEventListener("keydown", (event) => {
  //w/up = go forward, left/right = turn, down = slowly back up
  //change view = space, attack = shift, map = tab
    const key = event.key
    //console.log(key)
    //console.log(gameLoaded, joinedWithName)
    if (gameLoaded && joinedWithName){
      actionParams = [];
      pressedMoveKeys.splice(0)
      if(key == "a" || pressedMoveKeys.includes(key)){
        actionParams[0] = "W";
      }
      else if(key == "d" || pressedMoveKeys.includes(key)){
        actionParams[0] = "E";
      }
      else{
        actionParams[0] = "";
      }

      if(key == "w" || pressedMoveKeys.includes(key)){
        actionParams[1] = "N";
      }
      else if(key == "s" || pressedMoveKeys.includes(key)){
        actionParams[1] = "S";
      }
      else{
        actionParams[1] = "";
      }
      currentAction = moveBoat
      pressedMoveKeys.push(key)

      if (key == "Control"){
        changeShipView()
      }
    }
  })

  canvas.addEventListener("keyup", (event) => {
    const key = event.key
    if (pressedMoveKeys.includes(key)){
      pressedMoveKeys.splice(pressedMoveKeys.indexOf(key), 1)
    }
  })

}

function setCameraPosRelativeToBoat(){
  if (boatObj.rotation.y > Math.PI){
    camera.position = new BABYLON.Vector3(boatObj.position.x, camera.position.y, boatObj.position.z + 12)
    camera.setTarget(new BABYLON.Vector3(boatObj.position.x, camera.position.y, boatObj.position.z + 12))
  }
  else if (boatObj.rotation.y < Math.PI){
    camera.position = new BABYLON.Vector3(boatObj.position.x, camera.position.y, boatObj.position.z - 12)
    camera.setTarget(new BABYLON.Vector3(boatObj.position.x, camera.position.y, boatObj.position.z - 12))
  }
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
    console.log("velocity " + velocity + " action params " + actionParams)
    if (velocity != 0){
      if (pressedMoveKeys.includes("w") || pressedMoveKeys.includes("s") || pressedMoveKeys.includes("d") || pressedMoveKeys.includes("a")){//not moving, decelerate
        moveKeysPressed = true
        console.log("move keys pressed " + pressedMoveKeys)
      }

      if (!moveKeysPressed){
        console.log("decelerate")
        decelerate((velocity < 0) ? true:false);
        boatObj.locallyTranslate(new BABYLON.Vector3(velocity, 0, 0))
        camera.position = new BABYLON.Vector3(boatObj.position.x, camera.position.y, boatObj.position.z - 3)
      }
    }
    //setCameraPosRelativeToBoat();

    await currentAction()
    currentAction = () => {};
    actionParams = [];

    updateVisibleChatHistory()
  }
}