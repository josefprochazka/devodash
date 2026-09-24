export type GameKey = "orani" | "most";

export interface Verse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  reference: string;
  text: string;
  parentNote: string;
  game: GameKey;
}
