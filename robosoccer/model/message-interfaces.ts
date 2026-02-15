/** Types of errors forwarded via socket */
export enum ErrorType {
  Other = 'other',
  RoomNotFound = 'room-not-found',
  RoomNoLongerExists = 'room-no-longer-exists',
  RoomAlreadyStarted = 'room-already-started',
  SettingUnavailable = 'setting-unavailable',
  NoUsername = 'no-username',
  ChatError = 'chat-error',
}

/** Types of teams in a game */
export enum TeamType {
  Red = 'red',
  Blue = 'blue',
}

/** Enum for the hidden card colours */
export enum CardColour {
  Red = 'red',
  Blue = 'blue',
  Grey = 'grey',
  Black = 'black',
  Unknown = 'unknown'
}

/** Message type for joining a room  */
export interface JoinMessage {
  username: string,
  roomId: number
}

/** Message type for picking a position */
export interface PositionPickerMessage {
  playerId: number,
  team: TeamType,
  spymaster: boolean
}

/** Message type for the forwarding of player and room ids */
export interface IdMessage {
  playerId: number | null,
  roomId: number | null
}

/** Error message type */
export interface ErrorMessage {
  errorType: ErrorType,
  message: string
}

/** Hint type for the game */
export interface Hint {
  word: string,
  number: number // 0 means not, -1 means any number
}

export interface HintHistory {
  team: TeamType,
  hint: Hint
}

export interface Guess{
  guess: number,
}

/** Type of messages passed in in-game chat */
export interface ChatMessage {
  senderId: number,
  message: string
}

export interface Chat{
  roomId: number,
  redTeamChat: ChatMessage[],
  blueTeamChat: ChatMessage[],
  globalChat: ChatMessage[],
}