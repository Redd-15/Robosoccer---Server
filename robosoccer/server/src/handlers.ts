// This file contains the handlers for the socket events.

import { Socket, Server } from "socket.io";
import { RobosoccerDatabase } from "./database";
import { ServerMessageType } from "../../model";
import { ChatMessage, ErrorMessage, ErrorType, IdMessage, TeamType } from "../../model/message-interfaces";


// Import necessary types from the model
export class ServerHandlers {
    // This class will handle the socket events

    private io: Server; // Socket.IO instance
    private database: RobosoccerDatabase; // Database instance

    constructor(io: Server, database: RobosoccerDatabase) {
        this.io = io; // Assign the Socket.IO instance
        this.database = database
    }

    public clientTestMessageHandler(socket: Socket, content: any) {
        console.log(`Client ${socket.id} sent: ${content}`);
    }

    public cookieHandler(socket: Socket, cookie: any) {

        if (cookie == undefined || !cookie.playerId) { // If no cookie is found, return
            return;
        }
        // Handle cookies here if needed
        console.log(`Client ${socket.id} has joined with existing player ID: ${cookie.playerId}`);
        let room = this.database.updateSocketIdInPlayerRoom(Number.parseInt(cookie.playerId), socket.id); // Find the player by ID in the database
        // Get the player ID from the database

        if (room) { // If the player is found in a room, join the room
            console.log(`Found room for client (${socket.id}): ${room.roomId}`);
            const currentPlayerId = this.database.getPlayerIdBySocketId(socket.id);
            room = this.database.setPlayerActive(socket.id); // Set the player as active in the database

            if (!room) { // If player cannot be set active
                console.log(`Client ${socket.id} cannot be set Active`);

                const error: ErrorMessage = {
                    errorType: ErrorType.SettingUnavailable, // Error type for other errors
                    message: `Player with ID (${cookie.playerId}) cannot be set Active.` // Error message for room not found
                };

                this.io.to(socket.id).emit(ServerMessageType.Error, error); // Send an error message back to the client
                return;
            }

            const idmessage: IdMessage = {
                playerId: currentPlayerId, // Player ID from room ids
                roomId: room.roomId, // Room ID from the created room
            };



            this.io.to(socket.id).emit(ServerMessageType.ReceiveId, idmessage); // Send the socket ID back to the client
            socket.join(room.roomId.toString()); // Join the room in the socket
            this.joinTeamChat(socket); // Join the team chat room
            this.io.to(room.roomId.toString()).emit(ServerMessageType.ReceiveRoom, room); // Send a message back to the client
            const chat = this.database.getChatBySocketId(socket.id); // Get the chat by room ID
            if (chat) {
                this.io.to(chat.roomId.toString()).emit(ServerMessageType.ReceiveGlobalMessage, chat.globalChat); // Send a message back to the client
                let teamChat;
                if (this.database.getPlayerById(currentPlayerId!)!.team == TeamType.Red) { teamChat = chat.redTeamChat; }
                else { teamChat = chat.blueTeamChat; }

                this.io.to(this.getTeamChatId(room.roomId, this.getPlayerTeamById(currentPlayerId!)!)).emit(ServerMessageType.ReceiveTeamMessage, teamChat); // Send a message back to the client
            }

            console.log(`Client ${socket.id} joined back to room (${room.roomId})`);
            return true;
        } else {
            console.log(`Client ${socket.id} does not have an existing room`);

            const error: ErrorMessage = {
                errorType: ErrorType.RoomNoLongerExists, // Error type for other errors
                message: `Room with ID (${cookie.playerId}) no longer exists.` // Error message for room not found
            };
            this.io.to(socket.id).emit(ServerMessageType.Error, error); // Send an error message back to the client
            return;
        }
    }

    public createRoomHandler(socket: Socket, username: string) {

        console.log(`Client ${socket.id} requested to create a room with username: "${username}"`);

        let room = this.database.getRoomBySocketId(socket.id)
        if (room) {
            const idmessage: IdMessage = {
                playerId: this.database.getPlayerIdBySocketId(socket.id), // Player ID from room ids
                roomId: room.roomId, // Room ID from the created room
            };

            this.io.to(socket.id).emit(ServerMessageType.ReceiveId, idmessage); // Send the socket ID back to the client
            this.io.to(socket.id).emit(ServerMessageType.ReceiveRoom, room); // Send a message back to the client
            socket.join(room.roomId.toString()); // Join the room in the socket
            console.log(`Client ${socket.id} tried to create new room while having an already existing one (${room.roomId})`);
            return; // Return the room if it exists
        }

        if (username == '') {
            this.noUsernameError(socket); // If no username is provided, send an error message
            return;
        }

        room = this.database.createRoom(username, socket.id); // Create a new room in the database
        const idmessage: IdMessage = {
            playerId: room.players[0].id, // Player ID from room ids
            roomId: room.roomId, // Room ID from the created room
        };

        this.io.to(socket.id).emit(ServerMessageType.ReceiveId, idmessage); // Send the socket ID back to the client
        this.io.to(socket.id).emit(ServerMessageType.ReceiveRoom, room); // Send a message back to the client
        console.log(`Client (SID: ${socket.id}) created room (ID: ${room.roomId}) with username: ${username}`);
        socket.join(room.roomId.toString()); // Join the room in the socket
        this.joinTeamChat(socket); // Join the team chat room

    }

    public joinRoomHandler(socket: Socket, username: string, roomId: number) {

        console.log(`Player ${username} requested to join room with ID: ${roomId}`);

        let room = this.database.getRoomBySocketId(socket.id)
        if (room) {

            if (room.isStarted) {
                console.log(`Room with ID (${room.roomId}) has already started.`);

                const error: ErrorMessage = {
                    errorType: ErrorType.RoomAlreadyStarted, // Error type for other errors
                    message: `Room with ID (${room.roomId}) has already started.` // Error message for room not found
                };
                this.io.to(socket.id).emit(ServerMessageType.Error, error); // Send an error message back to the client
                return;
            }

            const idmessage: IdMessage = {
                playerId: this.database.getPlayerIdBySocketId(socket.id), // Player ID from room ids
                roomId: room.roomId, // Room ID from the created room
            };

            this.io.to(socket.id).emit(ServerMessageType.ReceiveId, idmessage); // Send the socket ID back to the client
            this.io.to(socket.id).emit(ServerMessageType.ReceiveRoom, room); // Send a message back to the client
            socket.join(room.roomId.toString()); // Join the room in the socket
            this.joinTeamChat(socket); // Join the team chat room

            const chat = this.database.getChatBySocketId(socket.id); // Get the chat by room ID
            if (chat) {
                this.io.to(chat.roomId.toString()).emit(ServerMessageType.ReceiveGlobalMessage, chat.globalChat); // Send a message back to the client
                let teamChat;
                if (this.database.getPlayerById(this.database.getPlayerIdBySocketId(socket.id)!)!.team == TeamType.Red) { teamChat = chat.redTeamChat; }
                else { teamChat = chat.blueTeamChat; }

                this.io.to(this.getTeamChatId(room.roomId, this.getPlayerTeamById(this.database.getPlayerIdBySocketId(socket.id)!)!)).emit(ServerMessageType.ReceiveTeamMessage, teamChat); // Send a message back to the client
            }
            console.log(`Client ${socket.id} tried to create new room while having an already existing one (${room.roomId})`);



            return; // Return the room if it exists
        }

        if (username == '') {
            this.noUsernameError(socket); // If no username is provided, send an error message
            return;
        }

        room = this.database.joinRoom(username, socket.id, roomId); // Join the room in the database
        const currentPlayerId = this.database.getPlayerIdBySocketId(socket.id); // Get the player ID from the database

        if (room) {

            const idmessage: IdMessage = {
                playerId: currentPlayerId, // Player ID from room ids
                roomId: room.roomId, // Room ID from the created room
            };
            this.io.to(socket.id).emit(ServerMessageType.ReceiveId, idmessage); // Send the socket ID back to the client
            socket.join(room.roomId.toString()); // Join the room in the socket
            this.joinTeamChat(socket); // Join the team chat room
            this.io.to(room.roomId.toString()).emit(ServerMessageType.ReceiveRoom, room); // Send a message back to the client

            const chat = this.database.getChatBySocketId(socket.id); // Get the chat by room ID
            if (chat) {
                this.io.to(chat.roomId.toString()).emit(ServerMessageType.ReceiveGlobalMessage, chat.globalChat); // Send a message back to the client
                let teamChat;
                if (this.database.getPlayerById(this.database.getPlayerIdBySocketId(socket.id)!)!.team == TeamType.Red) { teamChat = chat.redTeamChat; }
                else { teamChat = chat.blueTeamChat; }

                this.io.to(this.getTeamChatId(room.roomId, this.getPlayerTeamById(this.database.getPlayerIdBySocketId(socket.id)!)!)).emit(ServerMessageType.ReceiveTeamMessage, teamChat); // Send a message back to the client
            }
            console.log(`Client ${socket.id} joined room with username: ${username}`);

        } else {

            this.roomWithIdNotFound(socket, roomId); // If the room does not exist, send an error message

        }
    }

    public pickPositionHandler(socket: Socket, team: TeamType, spymaster: boolean) {
        console.log(`Client ${socket.id} requested to pick team: ${team} and spymaster: ${spymaster}`);
        const room = this.database.pickPosition(socket.id, team, spymaster); // Pick a team in the database

        if (room) {
            this.io.to(room.roomId.toString()).emit(ServerMessageType.ReceiveRoom, room); // Send a message back to the client
            this.joinTeamChat(socket); // Join the team chat room
            console.log(`Client switched to team ${team} and spymaster: ${spymaster}`);

        } else {
            this.roomNotFoundError(socket); // If the room does not exist, send an error message
        }
    }

    public startGameHandler(socket: Socket) {
        console.log(`Client ${socket.id} requested to start game`);
        const room = this.database.startGame(socket.id); // Start the game in the database

        if (room) {
            this.io.to(room.roomId.toString()).emit(ServerMessageType.ReceiveRoom, room); // Send a message back to the client
            console.log(`Client ${socket.id} started game in room with ID: ${room.roomId}`);

        } else {
            this.roomNotFoundError(socket); // If the room does not exist, send an error message
        }
    }

    public giveHintHandler(socket: Socket, word: string, number: number) {
        console.log(`Client ${socket.id} requested to send hint: ${word} with number: ${number}`);
        const room = this.database.giveHint(socket.id, word, number); // Send a hint in the database

        if (room) {
            this.io.to(room.roomId.toString()).emit(ServerMessageType.ReceiveRoom, room); // Send a message back to the client
            //this.io.to(room.roomId.toString()).emit(ServerMessageType.SendHint, {word: word, number: number}); // Send a message back to the client
            console.log(`Client ${socket.id} sent hint: ${word} with number: ${number}`);

        } else {
            this.roomNotFoundError(socket); // If the room does not exist, send an error message
        }
    }

    public makeGuessHandler(socket: Socket, guess: number) {
        console.log(`Client ${socket.id} requested to make guess: ${guess}`);
        const room = this.database.makeGuess(socket.id, guess); // Make a guess in the database

        if (room) {
            this.io.to(room.roomId.toString()).emit(ServerMessageType.ReceiveRoom, room); // Send a message back to the client
            console.log(`Client ${socket.id} made guess: ${guess}`);

        } else {
            this.roomNotFoundError(socket); // If the room does not exist, send an error message
        }

    }

    public endGuessingHandler(socket: Socket) {
        console.log(`Client ${socket.id} requested to end guessing`);
        const room = this.database.endGuessing(socket.id); // End guessing in the database
        if (room) {
            this.io.to(room.roomId.toString()).emit(ServerMessageType.ReceiveRoom, room); // Send a message back to the client
            console.log(`Client ${socket.id} ended guessing`);
        }
        else {
            this.roomNotFoundError(socket); // If the room does not exist, send an error message
        }
    }

    public leaveRoomHandler(socket: Socket) {
        console.log(`Client ${socket.id} requested to leave their room`);

        const room = this.database.leaveRoom(socket.id)

        if (room) { // Leave the room in the database

            this.io.to(room.roomId.toString()).emit(ServerMessageType.ReceiveRoom, room); // Send a message back to the client
            socket.leave(room.roomId.toString()); // Leave the socket room
            this.leaveTeamChat(socket); // Leave the team chat room
            console.log(`Client ${socket.id} left their room`);
            socket.disconnect(); // Disconnect the socket

        } else {
            this.roomNotFoundError(socket); // If the room does not exist, send an error message
        }
    }

    public disconnectHandler(socket: Socket) {
        console.log(`Client ${socket.id} disconnected, setting status to inactive`);
        const room = this.database.setPlayerInactive(socket.id); // Leave the room in the database

        if (room) { // If the room exists, send a message back to the client
            this.io.to(room.roomId.toString()).emit(ServerMessageType.ReceiveRoom, room); // Send a message back to the client
        }
    }

    public getIdHandler(socket: Socket) {
        console.log(`Client ${socket.id} requested their ID`);
        const idmessage: IdMessage = {
            playerId: this.database.getPlayerIdBySocketId(socket.id), // Player ID from room ids
            roomId: this.database.getRoomIdBySocketId(socket.id), // Room ID from the created room
        };
        this.io.to(socket.id).emit(ServerMessageType.ReceiveId, idmessage); // Send the socket ID back to the client
        console.log(`Client ${socket.id} received their ID`);
    }

    public restartGameHandler(socket: Socket) {
        console.log(`Client ${socket.id} requested to restart game`);
        const room = this.database.restartGame(socket.id); // Restart the game in the database
        if (room) {
            this.io.to(room.roomId.toString()).emit(ServerMessageType.ReceiveRoom, room); // Send a message back to the client
            console.log(`Client ${socket.id} restarted game in room with ID: ${room.roomId}`);
        }
        else {
            this.roomNotFoundError(socket); // If the room does not exist, send an error message
        }
    }

    public sendTeamMessageHandler(socket: Socket, message: ChatMessage) {
        console.log(`Client ${socket.id} requested to send team message: ${message.message}`);
        const chat = this.database.sendTeamMessage(socket.id, message); // Send a team message in the database
        const playerId = this.database.getPlayerIdBySocketId(socket.id)
        const room = this.database.getRoomBySocketId(socket.id)
        let teamChat = null;

        if (room && playerId && chat) { // If the room, plazer and chat exists, send a message back to the client
            if (this.database.getPlayerById(playerId)!.team == TeamType.Red) { teamChat = chat.redTeamChat; }
            else { teamChat = chat.blueTeamChat; }

            this.io.to(this.getTeamChatId(room.roomId, this.getPlayerTeamById(playerId)!)).emit(ServerMessageType.ReceiveTeamMessage, teamChat); // Send a message back to the client
            console.log(`Client ${socket.id} sent team message: ${message.message}`);

        } else {
            this.roomNotFoundError(socket); // If the room does not exist, send an error message
        }
    }

    public sendGlobalMessageHandler(socket: Socket, message: ChatMessage) {
        console.log(`Client ${socket.id} requested to send global message: ${message.message}`);
        const chat = this.database.sendGlobalMessage(socket.id, message); // Send a team message in the database
        if (chat) {
            this.io.to(chat.roomId.toString()).emit(ServerMessageType.ReceiveGlobalMessage, chat.globalChat); // Send a message back to the client
            console.log(`Client ${socket.id} sent global message: ${message.message}`);

        } else {
            this.roomNotFoundError(socket); // If the room does not exist, send an error message
        }
    }

    private roomNotFoundError(socket: Socket) {
        console.log(`Client ${socket.id} does not have an existing room`);

        const error: ErrorMessage = {
            errorType: ErrorType.RoomNotFound, // Error type for other errors
            message: `Room for player with socket.id (${socket.id}) no longer not exist.` // Error message for room not found
        };

        this.io.to(socket.id).emit(ServerMessageType.Error, error); // Send an error message back to the client
        return;
    }

    private roomWithIdNotFound(socket: Socket, roomId: number) {
        console.log(`Room with ID ${roomId} does not exist.`);

        const error: ErrorMessage = {
            errorType: ErrorType.RoomNotFound, // Error type for other errors
            message: `Room with ID ${roomId} does not exist.` // Error message for room not found
        };
        this.io.to(socket.id).emit(ServerMessageType.Error, error); // Send an error message back to the client
        return;
    }

    private noUsernameError(socket: Socket) {
        console.log(`Client ${socket.id} requested to join a room without username`)
        const error: ErrorMessage = {
            errorType: ErrorType.NoUsername, // Error type for other errors
            message: `Username cannot be empty.` // Error message for room not found
        };
        this.io.to(socket.id).emit(ServerMessageType.Error, error); // Send an error message back to the client
        return;
    }

    private getTeamChatId(roomId: number, playerTeam: TeamType) {
        return `${roomId}-${playerTeam}`; // Return the team chat ID
    }

    private getPlayerTeamById(playerId: number) {
        const player = this.database.getPlayerById(playerId); // Get the player by ID
        if (player) {
            return player.team; // Return the team of the player
        } else {
            console.log(`Player with ID ${playerId} not found.`);
            return null; // Return null if the player is not found
        }
    }

    private joinTeamChat(socket: Socket) {
        const playerTeam = this.getPlayerTeamById(this.database.getPlayerIdBySocketId(socket.id)!); // Get the player team by ID
        const room = this.database.getRoomBySocketId(socket.id)
        if (playerTeam && room) {
            const notPlayerTeam = playerTeam === TeamType.Red ? TeamType.Blue : TeamType.Red; // Get the other team

            socket.leave(this.getTeamChatId(room.roomId, notPlayerTeam)); // Leave the team chat room if already joined
            socket.join(this.getTeamChatId(room.roomId, playerTeam)); // Join the team chat room

        } else {
            console.log(`Client ${socket.id} failed to join Team Chat room`);

            const error: ErrorMessage = {
                errorType: ErrorType.ChatError, // Error type for other errors
                message: `Player (${this.database.getPlayerIdBySocketId(socket.id)}) failed to join TeamChat.` // Error message for room not found
            };
            this.io.to(socket.id).emit(ServerMessageType.Error, error); // Send an error message back to the client
            return;
        }
    }

    private leaveTeamChat(socket: Socket) {
        const playerTeam = this.getPlayerTeamById(this.database.getPlayerIdBySocketId(socket.id)!); // Get the player team by ID
        const room = this.database.getRoomBySocketId(socket.id)
        if (playerTeam && room) {
            socket.leave(this.getTeamChatId(room.roomId, playerTeam)); // Leave the team chat room
        } else {
            console.log(`Client ${socket.id} failed to leave Team Chat room`);

            const error: ErrorMessage = {
                errorType: ErrorType.ChatError, // Error type for other errors
                message: `Player (${this.database.getPlayerIdBySocketId(socket.id)}) failed to leave TeamChat.` // Error message for room not found
            };
            this.io.to(socket.id).emit(ServerMessageType.Error, error); // Send an error message back to the client
            return;
        }
    }

}
