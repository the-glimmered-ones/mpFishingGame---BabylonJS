export const enum ShipTypes {
    "NONE",
    "SAILBOAT",
    "TRAWLER",
    "SUBMARINE",
    "DREDGER"
}

export class PlayerLocation {
    position: number[] = [0,0]
    angle: number = 0.0
    velocity: number = 0.0
    constructor(position: number[], angle: number, velocity: number){
        this.position = position
        this.angle = angle
        this.velocity = velocity
    }
}

export class GlobalClientLocation{
    position: number[] = [0,0]
    angle: number = 0.0
    type: ShipTypes = ShipTypes.SAILBOAT
    name: string = ""
    constructor(position: number[], angle: number, type: ShipTypes, name: string){
        this.position = position
        this.angle = angle
        this.type = type
        this.name = name
    }
}

export class ChatMessage{
    name: string = ""
    msg: string = ""
    constructor(name: string, msg: string){
        this.name = name
        this.msg = msg
    }
}