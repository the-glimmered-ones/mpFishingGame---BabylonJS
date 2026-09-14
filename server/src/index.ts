// import Elysia from "elysia";
// import { html } from '@elysia/html'
// import { staticPlugin } from '@elysia/static'
import { ShipTypes, PlayerLocation, GlobalClientLocation } from "@shared/Consts";
import { ClientPacketTypes, ServerPacketTypes, ClientPacket, ServerPacket } from "@shared/PacketTypes";
import * as mainPage from "@build/index.html"


class Client {
    ws: any
    name: string = ""
    data: ClientData = new ClientData([0,0], 0.0, 0.0, ShipTypes.SAILBOAT)
}

class ClientData {
    pos: number[] = [0,0]
    angle: number = 0.0
    velocity: number = 0.0
    shipType: ShipTypes = ShipTypes.SAILBOAT
    constructor(pos: number[], angle: number, velocity: number, shipType: ShipTypes){
        this.pos = pos;
        this.angle = angle;
        this.velocity = velocity;
        this.shipType = shipType;
    }
}

const clients: Client[] = [] 
const nameList: string[] = []
console.log("server file reached")

Bun.serve({
    port: 2323,
    hostname: "mpfishinggame.sbthompson429.workers.dev",
    routes: {
        "/": mainPage
    },
    fetch(req, server) {
    // upgrade the request to a WebSocket
    if (server.upgrade(req, { data: { client: new Client() } })) {
      return; // do not return a Response
    }
    return new Response("Upgrade failed", { status: 500 });
  },
  websocket: {
    data: {
        client: new Client()
    },
    open: (ws) => {
            console.log(clients.length)
            //TODO: only add clients when sure its not just gonna disappear, after name submit? set a timeout?
            if (ws.data){
                ws.data.client.ws = ws
                var dupedClient: Client = new Client();
                if (clients.find((client) => { dupedClient = client; return ws.remoteAddress == client.ws.remoteAddress; })){
                    clients[clients.indexOf(dupedClient)] =  ws.data.client
                    nameList[clients.indexOf(dupedClient)] = ws.data.client.name
                    console.log("user replaced")
                }
                else{
                    clients.push(ws.data.client)
                    nameList.push(ws.data.client.name)
                    console.log("user connect")
                }
                console.log(clients.length)
            }
            
            
            
            //console.log(clients)
        },
        close(ws) {
            console.log(clients.length)
            console.log("user disconnect")
            for (let i = 0; i < clients.length; i++){
                if (clients[i].ws.remoteAddress == ws.remoteAddress) {
                    nameList.splice(nameList.indexOf(clients[i].name), 1)
                    clients.splice(i, 1)
                }
            }
        },
        message(ws, message: string){
            //console.log(msg)
            console.log(JSON.parse(message))
            var msg: ClientPacket = JSON.parse(message)// msg = {packetType, everything else}
            console.log("msg recieved")
            switch(msg.packetType){

            case ClientPacketTypes.NONE:
                break;

            case ClientPacketTypes.JOIN_WITH_NAME:
                if(nameList.includes(msg.data)){
                    ws.send(JSON.stringify(
                        new ServerPacket(ServerPacketTypes.DUPLICATE_NAME_DETECTED)))
                    console.log("dupe name")
                }
                else{
                    //console.log("not a dupe")
                    for (let client of clients){
                        if (client.ws.remoteAddress == ws.remoteAddress){
                            //console.log("found id")
                            if (msg.data != ""){//TODO also put a character limit here
                                client.name = msg.data
                                console.log(`accepted ${client.name}`)
                                
                                ws.send(JSON.stringify(
                                    new ServerPacket(ServerPacketTypes.JOIN_ACCEPTED)))
                                break;
                            }
                            else{
                                console.log("invalid name")
                                ws.send(JSON.stringify(
                                    new ServerPacket(ServerPacketTypes.INVALID_NAME_DETECTED)))
                                break;
                            }
                        }
                    }
                    break;
                }

            case ClientPacketTypes.PLAYER_POSITION_UPDATE:
                console.log("position update")
                let arrClient = clients.find((client) => {
                    return client.ws.remoteAddress == ws.remoteAddress;
                })
                let location: PlayerLocation = msg.data
                if (arrClient){
                    arrClient.data.pos = location.position
                    arrClient.data.angle = location.angle
                    arrClient.data.velocity = location.velocity
                }
                
                break;
            }
        }

  }, // handlers
})


// new Elysia()
//     .use(html()) // only needed for local server, cloudflare has its own way of serving the page
//     .use(
//         staticPlugin({
//             assets: 'client/build',
//             prefix: '/',
//         })
//     )
//     .decorate('client', new Client())
//     .ws('/', {
//         open: (ws) => {
//             console.log(clients.length)
//             //TODO: only add clients when sure its not just gonna disappear, after name submit? set a timeout?
//             ws.data.client = new Client()
//             ws.data.client.ws = ws
//             var dupedClient: Client = new Client();
//             if (clients.find((client) => { dupedClient = client; return ws.remoteAddress == client.ws.remoteAddress; })){
//                 clients[clients.indexOf(dupedClient)] =  ws.data.client
//                 nameList[clients.indexOf(dupedClient)] = ws.data.client.name
//                 console.log("user replaced")
//             }
//             else{
//                 clients.push(ws.data.client)
//                 nameList.push(ws.data.client.name)
//                 console.log("user connect")
//             }
//             console.log(clients.length)
            
            
//             //console.log(clients)
//         },
//         close(ws) {
//             console.log(clients.length)
//             console.log("user disconnect")
//             for (let i = 0; i < clients.length; i++){
//                 if (clients[i].ws.id == ws.id) {
//                     nameList.splice(nameList.indexOf(clients[i].name), 1)
//                     clients.splice(i, 1)
//                 }
//             }
//         },
//         message(ws, msg: ClientPacket){
//             console.log(msg)
//             // console.log(JSON.parse(message))
//             // var msg = JSON.parse(message)// msg = {packetType, everything else}
//             console.log("msg recieved")
//             switch(msg.packetType){

//             case ClientPacketTypes.NONE:
//                 break;

//             case ClientPacketTypes.JOIN_WITH_NAME:
//                 if(nameList.includes(msg.data)){
//                     ws.send(JSON.stringify(
//                         new ServerPacket(ServerPacketTypes.DUPLICATE_NAME_DETECTED)))
//                     console.log("dupe name")
//                 }
//                 else{
//                     //console.log("not a dupe")
//                     for (let client of clients){
//                         if (client.ws.remoteAddress == ws.remoteAddress){
//                             //console.log("found id")
//                             if (msg.data != ""){//TODO also put a character limit here
//                                 client.name = msg.data
//                                 console.log(`accepted ${client.name}`)
                                
//                                 ws.send(JSON.stringify(
//                                     new ServerPacket(ServerPacketTypes.JOIN_ACCEPTED)))
//                                 break;
//                             }
//                             else{
//                                 console.log("invalid name")
//                                 ws.send(JSON.stringify(
//                                     new ServerPacket(ServerPacketTypes.INVALID_NAME_DETECTED)))
//                                 break;
//                             }
//                         }
//                     }
//                     break;
//                 }

//             case ClientPacketTypes.PLAYER_POSITION_UPDATE:
//                 console.log("position update")
//                 let arrClient = clients.find((client) => {
//                     return client.ws.id == ws.id;
//                 })
//                 let location: PlayerLocation = msg.data
//                 if (arrClient){
//                     arrClient.data.pos = location.position
//                     arrClient.data.angle = location.angle
//                     arrClient.data.velocity = location.velocity
//                 }
                
//                 break;
//             }
//         }
//     },
// )
// .listen(2323)//"https://mpfishinggame.sbthompson429.workers.dev/")

if (nameList.length > 0)
    setInterval(serverTick, 15)

async function serverTick(){
//TODO: send out all ship info to every player, even unnamed ones
//should include position, angle, type, name
    const globalClientLocations: GlobalClientLocation[] = []
    for (let client of clients){
        if (client.name != ""){
            //console.log(client.name)
            globalClientLocations.push(new GlobalClientLocation(
                client.data.pos,
                client.data.angle,
                client.data.shipType,
                client.name
            ))
        }
    }
    for (let client of clients){
        client.ws.send(JSON.stringify(new ServerPacket(
            ServerPacketTypes.UPDATE_GLOBAL_PLAYER_POSITIONS, 
            globalClientLocations
        )))
    }
} 