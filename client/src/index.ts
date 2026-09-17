import { GlobalClientLocation, ShipTypes } from "@shared/Consts";
import { ClientPacketTypes, ServerPacketTypes, ClientPacket, ServerPacket } from "@shared/PacketTypes";
//import { createNewBoat, setPlayerHasJoined } from "@src/shared";
//import * as Game from "https://the-glimmered-ones.github.io/multiplayer-boat-game/game.ts";
//Game.setJoinedWithName()

export const ws: WebSocket = new WebSocket("ws://localhost:2323")//"ws://mpfishinggame.sbthompson429.workers.dev:2323")//"https://mpfishinggame.sbthompson429.workers.dev/")

function getWebsocket(){
    return ws;
}

function requestWs(window: Window) {
    let gameWindow = window 
    console.log("game window is " + gameWindow)
}

var gameFrameWindow: Window
const gameModule = await import("./game.js")
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
            <canvas id=renderCanvas disabled></canvas>
            
        </body>
    </html>`;//<script src="${import("./game.js")}" type=module></script> //loads in index again
    //module doesn't accept ts >:(
    //only type module accepts imports/exports
    (async function linkGameToIFrame() { // i need to run this code under game frame, load has already completed
        //console.log(self)
        gameModule.linkWsToGame(gameFrameWindow, ws)
    }).call(gameFrame.contentDocument)
    
})


const nameInput: HTMLInputElement = <HTMLInputElement>document.getElementById("nameInput");
const selectSailboat: HTMLButtonElement = <HTMLButtonElement>document.getElementById("selectSailboat");
const selectTrawler: HTMLButtonElement = <HTMLButtonElement>document.getElementById("selectTrawler");
const selectSubmarine: HTMLButtonElement = <HTMLButtonElement>document.getElementById("selectSubmarine");
var ship: ShipTypes = ShipTypes.NONE
const shipSelectBtns: HTMLCollectionOf<HTMLButtonElement> = <HTMLCollectionOf<HTMLButtonElement>>document.getElementsByClassName("selectShipBtns")
var selectedShipBtn: HTMLButtonElement;
for (let btn of shipSelectBtns){
    btn.addEventListener("click", (event) => {
        selectedShipBtn = btn
        selectSailboat.style.backgroundColor = selectTrawler.style.backgroundColor = selectSubmarine.style.backgroundColor = "antiquewhite"
        switch (btn.id){
        case "selectSailboat":
            if (ship == ShipTypes.SAILBOAT){
                selectSailboat.style.backgroundColor = "antiquewhite"
                ship = ShipTypes.NONE
                return;
            }
            ship = ShipTypes.SAILBOAT
            selectSailboat.style.backgroundColor = "rgb(222, 184, 135)"
            break;

        case "selectTrawler":
            if (ship == ShipTypes.TRAWLER){
                selectTrawler.style.backgroundColor = "antiquewhite"
                ship = ShipTypes.NONE
                return;
            }
            ship = ShipTypes.TRAWLER
            selectTrawler.style.backgroundColor = "rgb(222, 184, 135)"
            break;

        case "selectSubmarine":
            if (ship == ShipTypes.SUBMARINE){
                selectSubmarine.style.backgroundColor = "antiquewhite"
                ship = ShipTypes.NONE
                return;
            }
            ship = ShipTypes.SUBMARINE
            selectSubmarine.style.backgroundColor = "rgb(222, 184, 135)"
            break;

        default:
            return;
        //send packet with player and check if name exists, dupe returns error
        }
    })
    btn.addEventListener("mouseenter", (event) => {
        btn.style.backgroundColor = "rgb(222, 184, 135)"
    })
    btn.addEventListener("mouseleave", (event) => {
        if (btn != selectedShipBtn){
            btn.style.backgroundColor = "antiquewhite"
        }
    })
}

let name: string
const submitNameBtn: HTMLButtonElement = <HTMLButtonElement>document.getElementById("submitNameBtn");
submitNameBtn.addEventListener("click", () => {
    name = nameInput.value
    //console.log(name + " " + ship)
    if(name != "" && ship){
        ws.send(JSON.stringify(new ClientPacket(ClientPacketTypes.JOIN_WITH_NAME, name)))
        console.log("join request sent")
    }
})

const chooseShipOverlay: HTMLDivElement = <HTMLDivElement>document.getElementById("chooseShipOverlay")
ws.addEventListener("message", (event) => {
    let msg: ServerPacket = JSON.parse(event.data)
    //console.log(typeof msg)
    switch (msg.packetType){
        case ServerPacketTypes.DUPLICATE_NAME_DETECTED:
            break
        case ServerPacketTypes.INVALID_NAME_DETECTED://TODO show some kind of error message by the name box
            break
        case ServerPacketTypes.JOIN_ACCEPTED:
            console.log("hidden")

            if (gameModule && gameFrameWindow){
                if (typeof gameModule.setJoinedWithName === "function"){
                    gameModule.setJoinedWithName.call(gameFrameWindow, true)
                    console.log("joined with name")
                }
                
            }
            chooseShipOverlay.style.visibility = "hidden"
            break
        case ServerPacketTypes.UPDATE_GLOBAL_PLAYER_POSITIONS:
             const playerPositions: GlobalClientLocation[] = msg.data
             if (gameModule && gameFrameWindow){
                for (let player of playerPositions){
                    if (player.name != name)
                        gameModule.addOtherBoat.call(gameFrameWindow, player)
                }
            }
            break
        default:
            console.log("fail")
    }
})


