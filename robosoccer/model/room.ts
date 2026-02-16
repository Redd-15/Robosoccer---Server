import { Ball } from "./ball"
import { TeamType } from "./message-interfaces"
import { Player } from "./player"

/** Type for game room handling */
export interface Room {
  roomId: number,
  ball: Ball
  players: Player[],
  isStarted: boolean,
  winner: TeamType | null,
}

