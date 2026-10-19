export const enum ShipTypes {
    "NONE",
    "SAILBOAT",
    "TRAWLER",
    "DREDGER",
    "CARGO",
    "SURVEYOR",
    "SUBMARINE",
}

class Ship {
    type: ShipTypes = ShipTypes.NONE
    acceleration: number = 0
    max_velocity: number = 0
    rotation_speed: number = 0
}

export class Sailboat extends Ship {
    type: ShipTypes = ShipTypes.SAILBOAT
    acceleration: number = .02
    max_velocity: number = .2
    rotation_speed: number = 5 * (Math.PI/180); //5 deg
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
    time: number[] = [new Date().getHours(), new Date().getMinutes()]
    constructor(name: string, msg: string){
        this.name = name
        this.msg = msg
    }
}