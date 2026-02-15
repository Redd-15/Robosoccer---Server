import { TeamType } from "./message-interfaces";

/** Player type for participants in a game */
export interface Player {
  id: number,
  socketId: string,
  name: string,
  team: TeamType | null,
  isSpymaster: boolean,
  isInactive: boolean
}
