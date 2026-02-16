import { Server, ServerOptions, Socket } from "socket.io";
import { IncomingMessage, ServerResponse } from "http";
import { Server as HttpServer } from "http";
import { ServerMessageType, ClientMessageType } from "../../model"
import { ServerHandlers } from "./handlers";
import { RobosoccerDatabase } from "./database";

/** Realises the server side of socket communication */
export class SocketHandler {

  private io: Server;
  private handlers: ServerHandlers | null; // Initialize handlers to null
  private database: RobosoccerDatabase; // Database instance

  constructor(httpServer: HttpServer<typeof IncomingMessage, typeof ServerResponse> | Partial<ServerOptions>, database: RobosoccerDatabase) {
    this.io = new Server(httpServer);
    this.database = database
    this.handlers = null; // Initialize handlers with null socket instance
    this.setUp();

  }

  private setUp() {
    //Configure listener for socket connection
    this.handlers = new ServerHandlers(this.io, this.database);

    this.io.on("connection", (socket) => {
      const cookies = socket.handshake.headers.cookie;
      const parsedCookies = this.parseCookies(cookies);
      console.log("Parsed Cookies:", parsedCookies);

      const isRejoin = this.handlers?.cookieHandler(socket, parsedCookies); // Call the cookie handler to check if player was in room already

      //Send ACK to client by socket id
      if(isRejoin) this.io.to(socket.id).emit(ServerMessageType.ReconnectAck);
      else  this.io.to(socket.id).emit(ServerMessageType.ConnectAck);

      //Configure listeners for different message types and disconnection on socket
      socket.on(ClientMessageType.TestMessage, (content) => this.handlers?.clientTestMessageHandler(socket, content));
      socket.on(ClientMessageType.CreateRoom, (username) => this.handlers?.createRoomHandler(socket, username));
      socket.on(ClientMessageType.JoinRoom, (join) => this.handlers?.joinRoomHandler(socket, join.username, join.roomId));
      socket.on(ClientMessageType.LeaveRoom, (content) => this.handlers?.leaveRoomHandler(socket));
      socket.on(ClientMessageType.GetId, (content) => this.handlers?.getIdHandler(socket));
      socket.on(ClientMessageType.PickPosition, (content) => this.handlers?.pickTeamHandler(socket, content.team, content.spymaster));
      socket.on(ClientMessageType.StartGame, (content) => this.handlers?.startGameHandler(socket));
      socket.on(ClientMessageType.RestartGame, (content) => this.handlers?.restartGameHandler(socket));

      socket.on('disconnect', () => {
        this.handlers?.disconnectHandler(socket); // Call leaveRoomHandler on disconnect
      });
    });
  }

  private checkHandlers(handler : any) {
    if (!this.handlers) {
      return console.error("Handlers are not initialized.");
    }
    return handler;
  }

  /** Parse cookies string into an object with name:value pairs. Returns empty object if cookies is undefined. */
  private parseCookies(cookies: string | undefined){
    return Object.fromEntries(cookies?.split("; ").map((c) => c.split("=")) || []);
  }
}

