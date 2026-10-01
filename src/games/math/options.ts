export type CreatureType = "dwarf" | "apple" | "animal";

/** Volby v multiselectu. Přidání dalšího typu = třída v creatures.ts + záznam zde. */
export const CREATURE_OPTIONS: { type: CreatureType; label: string; icon: string }[] = [
  { type: "dwarf", label: "Trpaslíci", icon: "🧔" },
  { type: "apple", label: "Jablíčka", icon: "🍎" },
  { type: "animal", label: "Zvířátka", icon: "🐰" },
];
