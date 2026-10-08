export type GameKey = "orani" | "most" | "stavitel" | "hodiny";

export interface Verse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  /** Poslední verš úseku (Kazatel 3:1–8 → verse 1, verseEnd 8). */
  verseEnd?: number;
  reference: string;
  text: string;
  parentNote: string;
  game: GameKey;
}
