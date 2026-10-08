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
    id: "kazatel-3-1-8",
    book: "Kazatel",
    chapter: 3,
    verse: 1,
    verseEnd: 8,
    reference: "Kazatel 3:1–8",
    text: "Všechno má svou chvíli, každý záměr pod nebem má svůj čas. Je čas rodit a čas umírat, čas sázet a čas vytrhávat, co bylo zasazeno; čas zabíjet a čas uzdravovat, čas bořit a čas stavět; čas plakat a čas se smát, čas naříkat a čas poskakovat; čas házet kameny a čas kameny shromažďovat, čas objímat a čas vzdálit se od objímání; čas hledat a čas ztrácet, čas uchovávat a čas odvrhovat; čas trhat a čas šít, čas být zticha a čas mluvit; čas milovat a čas nenávidět, čas boje a čas pokoje.",
    parentNote:
      "Kazatel nám připomíná, že Bůh drží celý náš život i čas ve svých rukou. Život přináší různá období – čas radosti i smutku, čas práce i odpočinku. Dětství je pro děti vzácným „časem sadby“, kdy do svých srdcí zasévají dobré návyky, poslušnost a lásku k BOHU. Moudrost spočívá v tom rozpoznat správný čas pro správné věci a s důvěrou odevzdat svůj čas BOHU.",
    game: "hodiny",
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
