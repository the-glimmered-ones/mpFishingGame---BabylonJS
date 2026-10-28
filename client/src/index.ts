import { ChatMessage, GlobalClientLocation, ShipTypes } from "@shared/Consts";
import { ClientPacketTypes, ServerPacketTypes, ClientPacket, ServerPacket } from "@shared/PacketTypes";

//export const ws: WebSocket = new WebSocket("ws://localhost:2323")
//export const ws: WebSocket = new WebSocket("https://mpfishinggame-server.vercel.app")
export const ws: WebSocket = new WebSocket("https://mpfishinggame-babylonjs.onrender.com/")

var gameFrameWindow: Window
const gameModule = await import("./game.js")
//console.log(gameModule)
addEventListener("load", async () => {
    const gameFrame: HTMLIFrameElement = <HTMLIFrameElement>document.getElementById("gameFrame")
    gameFrameWindow = <Window>gameFrame.contentWindow
    gameFrameWindow.name = "gameFrameWindow"
    gameFrame.srcdoc =  `
    <html>
        <head>
            <style>
            html, body, canvas{ 
                width: 100%;
                height: 100%; 
                margin: 0; 
                padding: 0; 
                overflow: hidden; 
                background: #000; 
                flex-direction: none;
            }
            </style>         
        </head>
        <body>
            <canvas id=renderCanvas></canvas>
            
        </body>
    </html>`;

    (async function linkGameToIFrame() {
        gameModule.linkWsToGame(gameFrameWindow, ws)
    }).call(gameFrame.contentDocument)
})


const nameInput: HTMLInputElement = <HTMLInputElement>document.getElementById("nameInput");
var ship: ShipTypes = ShipTypes.NONE
const shipSelectRadioBtns = <NodeListOf<HTMLInputElement>>document.getElementsByName("selectClass")
var selectedShipBtn: HTMLInputElement;
for (let btn of shipSelectRadioBtns){
    btn.addEventListener("change", (event) => {
        selectedShipBtn = <HTMLInputElement>btn
        console.log(btn.value)
        switch (btn.value){
            case "selectSailboat":
                ship = ShipTypes.SAILBOAT
                break;
            case "selectTrawler":
                ship = ShipTypes.TRAWLER
                break;
            case "selectSubmarine":
                ship = ShipTypes.SUBMARINE
                break;
            case "selectCargo":
                ship = ShipTypes.CARGO
                break;
            case "selectDredger":
                ship = ShipTypes.DREDGER
                break;
            case "selectSurveyor":
                ship = ShipTypes.SURVEYOR
                break;
            default:
                return;
            //send packet with player and check if name exists, dupe returns error
        }
    })
    btn.addEventListener("mouseenter", (event) => {
        if (btn != selectedShipBtn){
            btn.style.backgroundColor = "rgb(222, 184, 135)"
        }
    })
    btn.addEventListener("mouseleave", (event) => {
        if (btn != selectedShipBtn){
            btn.style.backgroundColor = "antiquewhite"
        }
    })
    btn.addEventListener("keyup", (event) => {
        if (btn.type == "radio" && !event.key.includes("Arrow")){
            nameInput.focus()
        }
    })
}

let name: string
const submitNameBtn: HTMLButtonElement = <HTMLButtonElement>document.getElementById("submitNameBtn");
submitNameBtn.addEventListener("click", () => { joinGame(); })
nameInput.addEventListener("keyup", (event) => {
    if (event.key == "Enter"){
        joinGame();
    }
})

function joinGame(){
    name = nameInput.value
    //console.log(name + " " + ship)
    if(ship != ShipTypes.NONE){
        ws.send(JSON.stringify(new ClientPacket(ClientPacketTypes.JOIN_WITH_NAME, 
            {
                "name": name,
                "type": ship
             })))
        //console.log("join request sent")
    }
}

const chooseShipOverlay: HTMLDivElement = <HTMLDivElement>document.getElementById("chooseShipOverlay")
const nameWarning = <HTMLSpanElement>document.getElementById("nameWarning")
ws.addEventListener("message", (event) => {
    let msg: ServerPacket = JSON.parse(event.data)
    //console.log(typeof msg)
    switch (msg.packetType){
        case ServerPacketTypes.DUPLICATE_NAME_DETECTED:
            nameWarning.style.visibility = "visible"
            nameWarning.style.display = "block"
            nameWarning.textContent = "This name is already taken"
            break
        case ServerPacketTypes.INVALID_NAME_DETECTED:
            nameWarning.style.visibility = "visible"
            nameWarning.style.display = "block"
            nameWarning.textContent = "Please use a valid name"
            break
        case ServerPacketTypes.JOIN_ACCEPTED:
            //console.log("hidden")
            nameWarning.style.visibility = "hidden"
            nameWarning.style.display = "none"
            chooseShipOverlay.style.visibility = "hidden"
            nameWarning.textContent = ""
            if (gameModule && gameFrameWindow){
                if (typeof gameModule.setJoinedWithName === "function"){
                    gameModule.setJoinedWithName.call(gameFrameWindow, name)
                    //console.log("joined with name")
                }
                
            }
            break
        case ServerPacketTypes.PLAYER_START_POSITIONS:
            const posList: GlobalClientLocation[] = msg.data
            if (gameModule && gameFrameWindow){
                for (let player of posList){
                    if (player.name != name && player.name != ""){
                        gameModule.addOtherBoat.call(gameFrameWindow, player)
                        console.log(`${player.name} boat added`)
                    }
                }
            }
            break
        case ServerPacketTypes.UPDATE_GLOBAL_PLAYER_POSITIONS:
             const playerPositions: GlobalClientLocation[] = msg.data
             if (gameModule){
                for (let player of playerPositions){
                    if (player.name != name && player.name != ""){
                        console.log(`${player.name} pos updated`)
                        gameModule.updateExistingPlayerLocation(player)
                    }
                }
            }
            break
        case ServerPacketTypes.INCOMING_CHAT_MESSAGE:
            gameModule.displayInboundChat(<ChatMessage>msg.data)
            break
        case ServerPacketTypes.PLAYER_LEFT_EXPERIENCE:
            gameModule.removePlayerShipOnLeave(msg.data);
            break
        default:
            console.log("fail")
    }
})


