import type { Verse } from "../types";

/**
 * Verše se přidávají sem ručně, jeden po druhém.
 * Appka nikdy neobsahuje celou Bibli, jen verše vybrané autorem.
 */
export const verses: Verse[] = [
  {
    id: "prislovi-20-4",
    book: "Přísloví",
    chapter: 20,
    verse: 4,
    reference: "Přísloví 20:4",
    text: "Lenoch na podzim neorá, potom se při žni dožaduje, ale nic není.",
    parentNote:
      "Verš mluví o následcích odkládání práce. Kdo na podzim (v čas přípravy) neoře pole, nemůže o žních čekat úrodu – marně by ji hledal. Dětem to ukazuje, že věci, které je potřeba udělat včas, se nedají „dohnat“ ve chvíli, kdy už je pozdě.",
    game: "orani",
  },
];
