import { Room } from "../../model/room"
import { Player } from "../../model/player"
import { CardColour, Chat, ChatMessage, HintHistory, TeamType } from "../../model/message-interfaces"
import { Card } from "../../model/card";
import { MAX_CARD_NO } from "../../model";

export class RobosoccerDatabase {
  // This class will handle the database connection and queries
  // For now, we will use a mock database
  private roomdb: Room[];
  private chatdb: Chat[];

  constructor() {
    this.roomdb = []; // Initialize as null, can be assigned a Room object later
    this.chatdb = []; // Initialize as null, can be assigned a Chat object later
  }

  public createPlayer(username: string, id: number, socketId: string): Player {
    // Create a new player object
    const newPlayer: Player = {
      id: id,      // Player ID from room ids
      socketId: socketId, // Socket ID from socket connection
      name: username,   // Player's name
      team: TeamType.Blue, // Team will be default Blue
      isSpymaster: false, // Default to false
      isInactive: false, // Default to false
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
      cards: [], // Initialize with an empty array of cards
      isStarted: false,
      winner: null, // No winner at the start
      turn: (Math.random() > 0.5 ? TeamType.Red : TeamType.Blue), // Default starting team
      remainingGuesses: 0,
      currentHint: null,
      hintHistory: null,
    };
    this.roomdb.push(newRoom); // Assign the new room to the database
    console.log("Rooms open: " + this.roomdb.length);

    const newChat: Chat = {
      roomId: roomId,
      redTeamChat: [],
      blueTeamChat: [],
      globalChat: []
    };

    this.chatdb.push(newChat); // Assign the new chat to the database
    return newRoom;
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

  public pickPosition(socketId: string, team: TeamType, spymaster: boolean): Room | null {
    // Find the room by socket ID
    const room = this.getRoomBySocketId(socketId); // Get the room ID from the socket ID
    if (room) {
      // Find the player by socket ID in the room
      const player = room.players.find(player => player.socketId === socketId);
      if (player) {
        player.team = team; // Set the player's team to the selected team
        player.isSpymaster = spymaster; // Set the player's isSpymaster property to true or false based on the input
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
      room.cards = this.getRandomCardsArray(room.turn); // Initialize the cards array
      room.remainingGuesses = 0; // Set the initial number of guesses for the starting team
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
        this.chatdb = this.chatdb.filter(c => c.roomId !== room.roomId); // Remove the chat as well
        console.log("Rooms open: " + this.roomdb.length);
      }

      return room; // Return the updated room
    } else {
      return null; // Return null if the room does not exist

    }
  }

  public giveHint(socketId: string, word: string, number: number){
    // Find the room by socket ID
    const room = this.getRoomBySocketId(socketId.toString()); // Get the room ID from the socket ID
    if (room) {
      room.currentHint = {word: word, number: number}; // Set the current hint
      if (number > 0) {
        room.remainingGuesses = number; // Set the number of guesses for the current team

      }else {
        room.remainingGuesses = 8; // Set the number of guesses for the current team

      }
      return room; // Return the updated room
    }
    return null; // Return null if the room does not exist
  }

  public makeGuess(socketId: string, guess:number): Room | null {
    // Find the room by socket ID
    const room = this.getRoomBySocketId(socketId); // Get the room ID from the socket ID
    if (room) {
      room.cards[guess].isSecret = false; // Set the guessed card to be visible
      room.remainingGuesses--;

      if(this.getNumberOfRemainingCards(room, CardColour.Red) === 0 || this.getNumberOfRemainingCards(room, CardColour.Blue) === 0 || room.cards[guess].colour === CardColour.Black){
        return this.gameOver(socketId, guess);

      }else if (room.remainingGuesses === 0 || room.cards[guess].colour !== (room.turn === TeamType.Red ? CardColour.Red : CardColour.Blue)) {
          this.endGuessing(socketId); // End the guessing phase if the guess is incorrect or the last guess
        
      }
      return room; // Return the updated room
    }
    return null; // Return null if the room does not exist
  }

  public endGuessing(socketId: string): Room | null {
    // Find the room by socket ID
    const room = this.getRoomBySocketId(socketId); // Get the room ID from the socket ID
    if (room) {
      room.remainingGuesses = 0; // Set the number of guesses for the current team to 0

      const lastHint: HintHistory = {
        team: room.turn,
        hint: room.currentHint!
      };

      if (room.hintHistory === null) {
        room.hintHistory = [lastHint]; // Initialize the hint history if it is null
      }else{
        room.hintHistory.push(lastHint); // Add the current hint to the hint history
      }

      room.currentHint = null; // Reset the current hint
      room.turn = room.turn === TeamType.Red ? TeamType.Blue : TeamType.Red; // Switch the turn to the other team
      return room; // Return the updated room
    }
    return null; // Return null if the room does not exist
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
      room.remainingGuesses = 0; // Set the number of guesses for the current team to 0

      if (room.cards[guess].colour === CardColour.Black) {
        room.winner = room.turn === TeamType.Red ? TeamType.Blue : TeamType.Red; // Set the winner to the other team

      }else if (this.getNumberOfRemainingCards(room, CardColour.Red) === 0) {
        room.winner = TeamType.Red; // Set the winner to Red

      }else if (this.getNumberOfRemainingCards(room, CardColour.Blue) === 0) {
        room.winner = TeamType.Blue; // Set the winner to Blue
      }


      console.log("Game Over for Room ID: " + room.roomId + " Winner: " + room.winner);
      return this.endGuessing(socketId); // End the guessing phase and return the updated room

    }
    return null; // Placeholder for game over logic
  }

  public restartGame(socketId: string): Room | null {
    // Find the room by socket ID
    const room = this.getRoomBySocketId(socketId); // Get the room ID from the socket ID
    if (room) {
      room.cards = []; // Initialize the cards array
      room.isStarted = false; // Set the room's isStarted property to false
      room.winner = null; // No winner at the start
      room.turn = (Math.random() > 0.5 ? TeamType.Red : TeamType.Blue); // Default starting team
      room.remainingGuesses = 0; // Set the initial number of guesses for the starting team
      room.currentHint = null; // Reset the current hint
      room.hintHistory = null; // Reset the hint history

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

  public sendTeamMessage(socketId: string, message: ChatMessage): Chat | null {
    // Find the room by socket ID
    const room = this.getRoomBySocketId(socketId); // Get the room ID from the socket ID
    const player = room?.players.find(player => player.socketId === socketId); // Find the player by socket ID in the room
    if (room && player) {
      const chat = this.chatdb.find(chat => chat.roomId === room.roomId);
      if (chat) {
        if (player.team === TeamType.Red) {
          chat.redTeamChat.push(message);
        }else{
          chat.blueTeamChat.push(message);
        }
        return chat; // Return the updated room
      }
    }
    return null; // Return null if the room does not exist
  }

  public sendGlobalMessage(socketId: string, message: ChatMessage): Chat | null {
    // Find the room by socket ID
    const room = this.getRoomBySocketId(socketId); // Get the room ID from the socket ID
    const player = room?.players.find(player => player.socketId === socketId); // Find the player by socket ID in the room
    if (room && player) {
      const chat = this.chatdb.find(chat => chat.roomId === room.roomId);
      if (chat) {
        chat.globalChat.push(message); // Add the message to the global chat
        return chat; // Return the updated room
      }
    }
    return null; // Return null if the room does not exist
  }

  public getChatBySocketId(socketId: string): Chat | null {
    // Find the room by socket ID
    const room = this.getRoomBySocketId(socketId); // Get the room ID from the socket ID
    if (room) {
      const chat = this.chatdb.find(chat => chat.roomId === room.roomId);
      if (chat) {
        return chat; // Return the chat if found
      }
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

  private getNumberOfRemainingCards(room: Room, colour: CardColour): number {
    // Count the number of remaining cards of a specific colour
    return room.cards.filter(card => card.colour === colour && card.isSecret).length;
  }


  private getRandomCardsArray(startTeam: TeamType): Card[] {
    const totalCards = 20;
    const redCards = startTeam === TeamType.Red ? 8 : 7; // Starting team gets 1 extra card
    const blueCards = startTeam === TeamType.Blue ? 8 : 7;
    const blackCards = 1;
    const greyCards = totalCards - redCards - blueCards - blackCards;

    const cards: Card[] = [];
    const usedIds = new Set<number>(); // To ensure unique IDs

    const generateUniqueId = (): number => {
      let id;
      do {
        id = Math.floor(Math.random() * MAX_CARD_NO); // Generate a random ID
      } while (usedIds.has(id));
      usedIds.add(id);
      return id;
    };

    // Helper function to create cards of a specific color
    const createCards = (count: number, colour: CardColour) => {
      for (let i = 0; i < count; i++) {
        cards.push({
          id: generateUniqueId(),
          colour: colour,
          isSecret: true, // All cards are secret initially
        });
      }
    };

    // Create cards for each color
    createCards(redCards, CardColour.Red);
    createCards(blueCards, CardColour.Blue);
    createCards(blackCards, CardColour.Black);
    createCards(greyCards, CardColour.Grey);

    // Shuffle the cards to randomize their order
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    return cards;
  }
}
