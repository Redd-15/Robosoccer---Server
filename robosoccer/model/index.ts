/** Constant for the number of picture cards */
export const MAX_CARD_NO = 279

/**Constant for the maximum message lenght in chars */
export const MAX_MESSAGE_LENGTH = 255

/** Enum for message types FROM SERVER */
export enum ServerMessageType {
  TestMessage = 'serverTest',
  ConnectAck = 'connectAck',
  ReceiveId = 'receiveId',
  ReceiveRoom = 'receiveRoom',
  ReceiveHint = 'receiveHint',
  ReceiveGuess = 'receiveGuess',
  GameOver = 'gameOver',
  Error = 'error',
  ReceiveTeamMessage = 'receiveTeamMessage',
  ReceiveGlobalMessage = 'receiveGlobalMessage',
  ReconnectAck = 'reconnectAck'
}

/** Enum for message types FROM CLIENT */
export enum ClientMessageType {
  TestMessage = 'clientTest',
  CreateRoom = 'createRoom',
  JoinRoom = 'joinRoom',
  LeaveRoom = 'leaveRoom',
  GetId = 'getId',
  PickTeam = 'pickTeam',
  PickSpymaster = 'pickSpymaster',
  PickPosition = 'pickPosition',
  StartGame = 'startGame',
  GiveHint = 'giveHint',
  MakeGuess = 'makeGuess',
  EndGuessing = 'endGuessing',
  RestartGame = 'restartGame',
  SendTeamMessage = 'sendTeamMessage',
  SendGlobalMessage = 'sendGlobalMessage'
}

/** How many different agent cards per colour we have (numbered from 1 to n) */
export const AGENT_CARD_NO = {
  'red': 2,
  'blue': 2,
  'grey': 2,
  'black': 1
}
