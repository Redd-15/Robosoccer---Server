import { Room } from "../../model/room"
import { Player } from "../../model/player"
import { TeamType } from "../../model/message-interfaces";

export class RobosoccerDatabase {
  // This class will handle the database connection and queries
  // For now, we will use a mock database
  private roomdb: Room[];

  constructor() {
    this.roomdb = []; // Initialize as null, can be assigned a Room object later
  }

  public createPlayer(username: string, id: number, socketId: string): Player {
    // Create a new player object
    const newPlayer: Player = {
      id: id,      // Player ID from room ids
      socketId: socketId, // Socket ID from socket connection
      name: username,   // Player's name
      team: TeamType.Blue, // Team will be default Blue
      isInactive: false, // Default to false
      x: 0, // Default x position
      y: 0  // Default y position
    };
    return newPlayer; // Return the new player object
  }

  // Method to create a new room
  public createRoom(username: string, socketId: string): Room {
    // Create a new room and add the player to it
    const roomId = this.generateUniqueRoomId(); // Generate a unique room ID
    const newRoom: Room = {
      roomId: roomId, // Random room ID for now
      players: [this.createPlayer(username, roomId*10000 + 0, socketId)],
      isStarted: false,
      winner: null, // No winner at the start
      ball: {x: 500, y: 500} // Initial position of the ball
    };
    this.roomdb.push(newRoom); // Assign the new room to the database
    console.log("Rooms open: " + this.roomdb.length);

    return newRoom; // Return the new room
  }

  public joinRoom(username: string, socketId: string, roomId: number,): Room | null {
    // Find the room by ID
    const room = this.roomdb.find(room => room.roomId == roomId);
    if (room == undefined) { // If the room exists, create a new player and add them to the room
        return null; // Return null if the room does not exist
    }
    else if (!room.isStarted) { // If the room is already started, return null
        const playerId = this.generateUniquePlayerId(room);
        const player = this.createPlayer(username, playerId, socketId); // Create a new player
        room.players.push(player); // Add the player to the room
        return room; // Return the updated room
        }
    else {
        return null; // Return null if the room does not exist
    }
  }

  public pickTeam(socketId: string, team: TeamType, spymaster: boolean): Room | null {
    // Find the room by socket ID
    const room = this.getRoomBySocketId(socketId); // Get the room ID from the socket ID
    if (room) {
      // Find the player by socket ID in the room
      const player = room.players.find(player => player.socketId === socketId);
      if (player) {
        player.team = team; // Set the player's team to the selected team
        return room; // Return the room
      }
    }
    return null; // Return null if the room does not exist
  }

  public startGame(socketId: string): Room | null {
    // Find the room by ID
    const room = this.getRoomBySocketId(socketId); // Get the room ID from the socket ID
    if (room) {
      room.isStarted = true; // Set the room's isStarted property to true

      return room; // Return the updated room
    }
    return null; // Return null if the room does not exist
  }

  public leaveRoom(socketId: string): Room | null {
    // Find the room by socket ID
    let room = this.roomdb.find(room => room.roomId === this.getRoomIdBySocketId(socketId)); // Get the room ID from the socket ID
    if (room) {

      // Remove the player from the room
      room.players = room.players.filter(player => player.socketId !== socketId);

      if (room.players.length === 0) {
        // If no players left, remove the room from the database
        this.roomdb = this.roomdb.filter(r => r.roomId !== room.roomId);
        console.log("Rooms open: " + this.roomdb.length);
      }

      return room; // Return the updated room
    } else {
      return null; // Return null if the room does not exist

    }
  }

  public setPlayerInactive(socketId: string): Room | null {
    // Find the room by socket ID
    const room = this.getRoomBySocketId(socketId); // Get the room ID from the socket ID
    if (room) {
      // Find the player by socket ID in the room
      const player = room.players.find(player => player.socketId === socketId);
      if (player) {
        player.isInactive = true; // Set the player's isInactive property to true
        return room; // Return the room
      }
    }
    return null; // Return null if the room does not exist
  }

  public setPlayerActive(socketId: string): Room | null {
    // Find the room by socket ID
    const room = this.getRoomBySocketId(socketId); // Get the room ID from the socket ID
    if (room) {
      // Find the player by socket ID in the room
      const player = room.players.find(player => player.socketId === socketId);
      if (player) {
        player.isInactive = false; // Set the player's isInactive property to true
        return room; // Return the room
      }
    }
    return null; // Return null if the room does not exist
  }

  public gameOver(socketId: string, guess: number ): Room | null {

    // Find the room by socket ID
    const room = this.getRoomBySocketId(socketId); // Get the room ID from the socket ID
    if (room) {

        //TODO: Implement game over logic based on the guess and the current state of the room


      console.log("Game Over for Room ID: " + room.roomId + " Winner: " + room.winner);
      return null;

    }
    return null; // Placeholder for game over logic
  }

  public restartGame(socketId: string): Room | null {
    // Find the room by socket ID
    const room = this.getRoomBySocketId(socketId); // Get the room ID from the socket ID
    if (room) {
      room.isStarted = false; // Set the room's isStarted property to false
      room.winner = null; // No winner at the start
      room.ball = {x: 500, y: 500}; // Reset ball position


      return room; // Return the updated room
    }
    return null; // Return null if the room does not exist
  }

  public getRoomIdBySocketId(socketId: string): number | null {
    // Find the room by socket ID
    const playerId = this.getPlayerIdBySocketId(socketId); // Call getPlayerIdBySocketId to ensure the player exists
    if (playerId === null) {
      return null; // Return null if the player does not exist
    }else{
      return Math.floor(playerId / 10000)
    }
  }

  public getPlayerIdBySocketId(socketId: string): number | null {
    // Find the room by socket ID
    const room = this.roomdb.find(room => room.players.some(player => player.socketId === socketId));
    if (room) {
      const player = room.players.find(player => player.socketId === socketId);
      if (player) {
        return player.id; // Return the player ID if found
      }
    }
    return null; // Return null if the player does not exist
  }

  public updateSocketIdInPlayerRoom(playerId: number, newSocketId: string): Room | null {
    // Find the room by player ID
    const room = this.roomdb.find(room => room.roomId === this.getRoomIdBySocketIdFromPlayerId(playerId));

    if (room) {
      // Find the player by ID in the room
      const player = room.players.find(player => player.id === playerId);

      if (player){
        player.socketId = newSocketId; // Update the player's socket ID
        return room; // Return the room
      }
      else{
        return null
      }
    }
    return null; // Return null if the room does not exist
  }

  public getRoomBySocketId(socketId: string): Room | null {
    // Find the room by socket ID
    const room = this.roomdb.find(room => room.players.some(player => player.socketId === socketId));
    if (room) {
      return room; // Return the room if found
    }
    return null; // Return null if the room does not exist
  }

  public getPlayerById(playerId: number): Player | null {
    // Find the room by player ID
    const room = this.roomdb.find(room => room.roomId === this.getRoomIdBySocketIdFromPlayerId(playerId)); // Get the room ID from the player ID
    if (room) {
      // Find the player by ID in the room
      const player = room.players.find(player => player.id === playerId);
      if (player) {
        return player; // Return the player if found
      }
    }
    return null; // Return null if the player does not exist
  }

  private generateUniqueRoomId(): number {
    // Generate a unique room ID
    const usedRoomIds = new Set(this.roomdb.map(room => room.roomId));
    let roomId: number;
    do {
      roomId = Math.floor(Math.random() * 9000) + 999; // random number between 999 and 9999
    } while (usedRoomIds.has(roomId)); // Check if the room ID already exists
    return roomId;
  }

  private generateUniquePlayerId(room: Room): number {

    // Extract used suffixes from current players
    const usedPlayerIds = new Set(room.players.map(player => player.id % 10000));
    let suffix: number;
    do {
      suffix = Math.floor(Math.random() * 10000); // random number between 0–9999
    } while (usedPlayerIds.has(suffix));

    return room.roomId * 10000 + suffix;
  }

  private getRoomIdBySocketIdFromPlayerId(playerId: number): number {

    return Math.floor(playerId / 10000); // Get the room ID from the player ID

  }
}
