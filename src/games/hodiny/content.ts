/**
 * Obsah hry „Boží hodiny – čas pro všechno“ (Kazatel 3:1–8).
 *
 * Teologická osa: Kazatel neříká „všechno je jedno“, ale „všechno má svůj
 * čas“ – Bůh dal každé části dne dobrý smysl. Dítě si na hodinách projde
 * obyčejný den (ráno, poledne, odpoledne, večer, noc) a u každé chvíle
 * uslyší kousek verše, který k ní patří. Data jsou oddělená od scény, aby
 * šlo snadno přidat další chvíle nebo úkoly (např. pro starší děti s
 * půlhodinami a čtvrthodinami).
 */

/** Interaktivní mini-scéna: co se stane po ťuknutí na obrázek. */
export type SlotAction = "plant" | "pray" | "build" | "tidy" | "sleep";

export interface TimeSlot {
  /** Hodina 0–23; scéna se ukáže po celou tuto hodinu (7:00–7:59). */
  hour: number;
  icon: string;
  title: string;
  /** Kousek Kazatele 3, který k chvíli patří. */
  verse: string;
  /** Výzva k ťuknutí na obrázek. */
  tapHint: string;
  /** Co se řekne nahlas po ťuknutí (modlitba / poselství). */
  afterTap: string;
  action: SlotAction;
  /** Barva „oblohy“ ve scéně. */
  sky: [number, number];
}

export const TIME_SLOTS: TimeSlot[] = [
  {
    hour: 7,
    icon: "🌱",
    title: "Čas vstávat a sázet dobré věci",
    verse: "„…čas sázet…“ (Kazatel 3:2)",
    tapHint: "Ťukni na květináč a zasaď semínko",
    afterTap: "Dobré ráno, Pane Bože. Děkuju ti za nový den.",
    action: "plant",
    sky: [0xfde68a, 0xfef9c3],
  },
  {
    hour: 12,
    icon: "🍲",
    title: "Čas jíst a radovat se",
    verse: "„…čas se smát…“ (Kazatel 3:4)",
    tapHint: "Ťukni na talíř a poděkuj za jídlo",
    afterTap: "Děkujeme ti, Pane Bože, za jídlo.",
    action: "pray",
    sky: [0x7dd3fc, 0xe0f2fe],
  },
  {
    hour: 15,
    icon: "🧱",
    title: "Čas hrát si a stavět",
    verse: "„…čas stavět…“ (Kazatel 3:3)",
    tapHint: "Ťukni a postav s kamarádem věž",
    afterTap: "Je čas hrát si, stavět a pomáhat druhým.",
    action: "build",
    sky: [0x93c5fd, 0xdbeafe],
  },
  {
    hour: 18,
    icon: "🧸",
    title: "Čas uklidit hračky",
    verse: "„…čas kameny shromažďovat…“ (Kazatel 3:5)",
    tapHint: "Ťukni a ukliď hračky do krabice",
    afterTap: "Hotovo! Je čas uklidit, co jsme rozházeli.",
    action: "tidy",
    sky: [0xfdba74, 0xfef3c7],
  },
  {
    hour: 20,
    icon: "🌙",
    title: "Čas být zticha a spát",
    verse: "„…čas být zticha…“ (Kazatel 3:7)",
    tapHint: "Ťukni na postýlku – dobrou noc",
    afterTap: "Dobrou noc. Pán Bůh bdí nad tvým spánkem.",
    action: "sleep",
    sky: [0x1e1b4b, 0x312e81],
  },
];

export function slotForHour(hour: number): TimeSlot | undefined {
  return TIME_SLOTS.find((s) => s.hour === hour);
}

export interface QuizTask {
  hour: number;
  minute: number;
  icon: string;
  /** Text úkolu na obrazovce. */
  text: string;
  /** Totéž slovy pro předčítání (čísla vyslovená česky). */
  spoken: string;
}

/**
 * Úkoly pro TIME_QUIZ. Na ciferníku se 8:00 a 20:00 neliší – úkol proto
 * vždy řekne i „ráno/večer“ a u odpoledních časů přepočet (15:00 = 3).
 */
export const QUIZ_TASKS: QuizTask[] = [
  {
    hour: 8,
    minute: 0,
    icon: "🎒",
    text: "Nastav hodiny na 8:00 – čas jít do školy a učit se moudrosti!",
    spoken: "Nastav hodiny na osm hodin ráno. Je čas jít do školy a učit se moudrosti.",
  },
  {
    hour: 12,
    minute: 0,
    icon: "🍲",
    text: "Kdy je čas na oběd? Nastav 12:00 – poledne.",
    spoken: "Kdy je čas na oběd? Nastav dvanáct hodin, poledne.",
  },
  {
    hour: 15,
    minute: 0,
    icon: "🧱",
    text: "Nastav 15:00 – to jsou 3 hodiny odpoledne, čas hrát si a stavět.",
    spoken: "Nastav patnáct hodin. To jsou tři hodiny odpoledne, čas hrát si a stavět.",
  },
  {
    hour: 18,
    minute: 0,
    icon: "🧸",
    text: "Nastav 18:00 – 6 hodin večer, čas uklidit hračky.",
    spoken: "Nastav osmnáct hodin. To je šest hodin večer, čas uklidit hračky.",
  },
  {
    hour: 20,
    minute: 0,
    icon: "🛏️",
    text: "Kdy je čas jít spát? Nastav hodiny na 20:00 – 8 hodin večer.",
    spoken: "Kdy je čas jít spát? Nastav hodiny na dvacet hodin. To je osm hodin večer.",
  },
];
