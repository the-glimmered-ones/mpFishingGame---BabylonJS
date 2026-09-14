export class ServerPacket {
    packetType: ServerPacketTypes = ServerPacketTypes.NONE
    data: any
    constructor(packetType: ServerPacketTypes, data?: any){
        this.packetType = packetType
        this.data = data
    }
}

export class ClientPacket {
    packetType: ClientPacketTypes = ClientPacketTypes.NONE
    data: any
    constructor(packetType: ClientPacketTypes, data: any){
        this.packetType = packetType
        this.data = data
    }
}

export const enum ClientPacketTypes{
    NONE,
    JOIN_WITH_NAME,
    PLAYER_POSITION_UPDATE
}

export const enum ServerPacketTypes{
    NONE,
    DUPLICATE_NAME_DETECTED,
    JOIN_ACCEPTED,
    INVALID_NAME_DETECTED,
    UPDATE_GLOBAL_PLAYER_POSITIONS
}