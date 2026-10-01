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
  {
    id: "1-petruv-3-18",
    book: "1. Petrův",
    chapter: 3,
    verse: 18,
    reference: "1. Petrův 3:18",
    text: "Vždyť i Kristus jednou provždy trpěl za hříchy, spravedlivý za nespravedlivé, aby vás přivedl k Bohu. V těle byl sice usmrcen, ale v Duchu obživen.",
    parentNote:
      "Verš vysvětluje podstatu evangelia. Ukazuje, že k Bohu se nedostaneme vlastními zásluhami ani dobrými skutky, ale jedině skrze Ježíšovu oběť na kříži, která překlenuje propast hříchu.",
    game: "most",
  },
  {
    id: "matous-7-24",
    book: "Matouš",
    chapter: 7,
    verse: 24,
    reference: "Matouš 7:24",
    text: "Každý, kdo slyší tato má slova a plní je, bude podoben rozvážnému muži, který postavil svůj dům na skále.",
    parentNote:
      "Ježíšovo podobenství o dvou stavitelích (Mt 7:24–27). Oba slyší stejná slova, rozdíl je v tom, jestli podle nich jednají. Bouřka přijde na oba domy – víra neslibuje život bez těžkostí, ale pevný základ, který v nich vydrží. Dům na písku vypadal hezky a stavěl se snadno, jenže bez základu. Hra nechá dítě vybrat si místo stavby a pak přijde bouřka; po hře se můžete bavit o tom, co v našem životě znamená „stavět na skále“.",
    game: "stavitel",
  },
];
