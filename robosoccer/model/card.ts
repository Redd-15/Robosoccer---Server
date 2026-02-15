import { CardColour } from "./message-interfaces";

/** Card type for the backend. Id must be between 0 and MAX_CARD_NO */
export interface Card {
  id: number,
  colour: CardColour,
  isSecret: boolean
}
