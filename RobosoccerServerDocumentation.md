# Robosoccer Server Interface Documentation

## 1. Overview

This document describes the WebSocket-based communication interface for the Robosoccer game server. The server manages game rooms, player interactions, and real-time game state updates.

The server is built with Node.js, Express, and `socket.io`.

## 2. Connection

Clients can connect to the server using a WebSocket connection.

-   **URL**: The server listens on port `3000`. The default endpoint is `<server-address>:3000`.

When a client successfully connects, the server will send a `ConnectAck` message. If the client is reconnecting (identified by a `playerId` cookie), the server will send a `ReconnectAck` message.

## 3. Communication Protocol

Communication between the client and the server is done via JSON messages exchanged over the WebSocket connection. Each message has a `type` and an optional `payload`.

## 4. Server to Client Messages

These are the messages that the server can send to the client.

### `TestMessage`

-   **Type**: `serverTest`
-   **Payload**: `string`
-   **Description**: A test message to check the connection.

### `ConnectAck`

-   **Type**: `connectAck`
-   **Payload**: None
-   **Description**: Sent to the client upon a successful new connection.

### `ReconnectAck`

-   **Type**: `reconnectAck`
-   **Payload**: None
-   **Description**: Sent to the client upon a successful reconnection.

### `ReceiveId`

-   **Type**: `receiveId`
-   **Payload**: `IdMessage`
-   **Description**: Sent to the client to provide the client's `playerId` and the `roomId` they are in.

### `ReceiveRoom`

-   **Type**: `receiveRoom`
-   **Payload**: `Room`
-   **Description**: Sent to all clients in a room whenever the room's state changes. This includes player joining/leaving, team changes, game start/end, and game state updates during gameplay. To receive these updates, clients must subscribe to a socket event with the name equal to their `roomId`.

### `GameOver`

-   **Type**: `gameOver`
-   **Payload**: `TeamType | null`
-   **Description**: Sent when a game is over, indicating the winning team.

### `Error`

-   **Type**: `error`
-   **Payload**: `ErrorMessage`
-   **Description**: Sent to a client when an error occurs (e.g., trying to join a non-existent room).

### `ReceiveConfig`

-   **Type**: `receive-config`
-   **Payload**: `GameConfigMessage`
-   -**Description**: Sent to a client after they join a room. It contains the configuration of the game, such as field dimensions, player and ball radius, etc. Keep in mind that the LEFT goal is point for red and right goal is point for blue, so left is the red gate, right is the blue gate!

## 5. Client to Server Messages

These are the messages that the client can send to the server.

### `TestMessage`

-   **Type**: `clientTest`
-   **Payload**: `string`
-   **Description**: A test message to check the connection.

### `CreateRoom`

-   **Type**: `createRoom`
-   **Payload**: `string` (username)
-   **Description**: Requests the server to create a new game room. The user who creates the room automatically joins it.

### `JoinRoom`

-   **Type**: `joinRoom`
-   **Payload**: `JoinMessage`
-   **Description**: Requests to join an existing game room.

### `LeaveRoom`

-   **Type**: `leaveRoom`
-   **Payload**: None
-   **Description**: Requests to leave the current game room.

### `GetId`

-   **Type**: `getId`
-   **Payload**: None
-   **Description**: Requests the server to send the client's `playerId` and `roomId`.

### `PickTeam`

-   **Type**: `pickTeam`
-   **Payload**: `TeamPickerMessage`
-   **Description**: Allows a player to select a team (`red` or `blue`).

### `StartGame`

-   **Type**: `startGame`
-   **Payload**: None
-   **Description**: A request to start the game in the current room.

### `RestartGame`

-   **Type**: `restartGame`
-   **Payload**: None
-   **Description**: A request to restart the game in the current room.

### `MovementMessage`

-   **Type**: `movementMessage`
-   **Payload**: `MovementMessage`
-   **Description**: Sent by the client to update their player's movement direction. The payload contains `x` and `y` values representing the direction of movement. Movements may only be sent at 60 FPS, sending it faster may lead to omitting frames.


## 6. Data Models

These are the main data structures used in the communication.

### `Room`

```typescript
interface Room {
  roomId: number;
  ball: Ball;
  players: Player[];
  isStarted: boolean;
  winner: TeamType | null;
  score: {
    [TeamType.Blue]: number;
    [TeamType.Red]: number;
  };
  countdownTicks: number; 
}
```

### `Player`

```typescript
interface Player {
  id: number;
  socketId: string;
  name: string;
  team: TeamType | null;
  isInactive: boolean;
  x: number;
  y: number;
  x_velocity: number;
  y_velocity: number;
}
```

### `Ball`

```typescript
interface Ball {
  x: number;
  y: number;
  x_velocity: number;
  y_velocity: number;
}
```

### `JoinMessage`

```typescript
interface JoinMessage {
  username: string;
  roomId: number;
}
```

### `TeamPickerMessage`

```typescript
interface TeamPickerMessage {
  playerId: number;
  team: TeamType;
}
```

### `IdMessage`

```typescript
interface IdMessage {
  playerId: number | null;
  roomId: number | null;
}
```

### `MovementMessage`

```typescript
interface MovementMessage {
  playerId: number | null;
  x: number | null;
  y: number | null;
}
```

### `ErrorMessage`

```typescript
interface ErrorMessage {
  errorType: ErrorType;
  message: string;
}
```

### `GameConfigMessage`

```typescript
interface GameConfigMessage {
  fieldWidth: number;
  fieldHeight: number;
  playerRadius: number;
  ballRadius: number;
  goalMinY: number;
  goalMaxY: number;
  winScore: number;
  countdown: number;
}
```

### Enums

#### `ServerMessageType`

```typescript
enum ServerMessageType {
  TestMessage = 'serverTest',
  ConnectAck = 'connectAck',
  ReceiveId = 'receiveId',
  ReceiveRoom = 'receiveRoom',
  GameOver = 'gameOver',
  Error = 'error',
  ReconnectAck = 'reconnectAck',
  ReceiveConfig = 'receive-config'
}
```

#### `ClientMessageType`

```typescript
enum ClientMessageType {
  TestMessage = 'clientTest',
  CreateRoom = 'createRoom',
  JoinRoom = 'joinRoom',
  LeaveRoom = 'leaveRoom',
  GetId = 'getId',
  PickTeam = 'pickTeam',
  PickPosition = 'pickPosition',
  StartGame = 'startGame',
  RestartGame = 'restartGame',
  MovementMessage = 'movementMessage'
}
```

#### `TeamType`

```typescript
enum TeamType {
  Red = 'red',
  Blue = 'blue',
}
```

#### `ErrorType`

```typescript
enum ErrorType {
  Other = 'other',
  RoomNotFound = 'room-not-found',
  RoomNoLongerExists = 'room-no-longer-exists',
  RoomAlreadyStarted = 'room-already-started',
  SettingUnavailable = 'setting-unavailable',
  NoUsername = 'no-username',
}
```
