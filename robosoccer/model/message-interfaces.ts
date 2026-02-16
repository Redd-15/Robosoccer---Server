import { Ball } from "./ball"
import { Player } from "./player"

/** Types of errors forwarded via socket */
export enum ErrorType {
  Other = 'other',
  RoomNotFound = 'room-not-found',
  RoomNoLongerExists = 'room-no-longer-exists',
  RoomAlreadyStarted = 'room-already-started',
  SettingUnavailable = 'setting-unavailable',
  NoUsername = 'no-username',
}

/** Types of teams in a game */
export enum TeamType {
  Red = 'red',
  Blue = 'blue',
}

/** Message type for joining a room  */
export interface JoinMessage {
  username: string,
  roomId: number
}

/** Message type for picking a position */
export interface TeamPickerMessage {
  playerId: number,
  team: TeamType
}

/** Message type for the forwarding of player and room ids */
export interface IdMessage {
  playerId: number | null,
  roomId: number | null
}

export interface MovementMessage {
  playerId: number | null,
  x: number | null,
  y: number | null
}

export interface PositionsMessage {
  players: Player[]
  ball: Ball
}


/** Error message type */
export interface ErrorMessage {
  errorType: ErrorType,
  message: string
}