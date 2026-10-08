/**
 * Čistá logika hodin – žádný Phaser, žádný React, jen čísla a slova.
 *
 * Čas držíme jako jediné číslo: počet minut od půlnoci (0–1439). Hodiny
 * mají dvanáctku, ale dítě potřebuje rozlišit 8:00 ráno a 20:00 večer –
 * proto si čas pamatujeme v celém dni a ručičky jen „vidí“ jeho dvanáctku.
 * Když dítě protočí velkou ručičku přes dvanáctku, posune se i hodina
 * (a po dvanácti hodinách se z rána stane večer), přesně jako u skutečných
 * hodin.
 */

export const MINUTES_PER_DAY = 24 * 60;

/** Fáze hry – stavový automat scény. */
export type Phase =
  /** Volné hraní: točení ručičkami, kartičky s „časem pro…“. */
  | "FREE_EXPLORE"
  /** Úkol: „Nastav hodiny na 8:00…“ – čeká se na správné nastavení. */
  | "TIME_QUIZ"
  /** Krátká oslava po správné odpovědi, pak další úkol nebo konec. */
  | "SUCCESS_CELEBRATION"
  /** Všechny úkoly splněné – React ukáže závěr s Kazatelem 3:1. */
  | "FINISHED";

/** Normalizace do 0–1439 (funguje i pro záporná čísla). */
export function wrapDay(minutes: number): number {
  return ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

export function hoursOf(total: number): number {
  return Math.floor(wrapDay(total) / 60);
}

export function minutesOf(total: number): number {
  return Math.floor(wrapDay(total) % 60);
}

export function toTotal(hours: number, minutes = 0): number {
  return wrapDay(hours * 60 + minutes);
}

// ---------------------------------------------------------------- úhly
// Úhly ve stupních, 0° = dvanáctka nahoře, kladně po směru hodinových
// ručiček (stejně jako Phaser `angle` u objektu kresleného „nahoru“).

/** Velká ručička: 60 minut = 360°, tedy 6° za minutu. */
export function minuteHandAngle(total: number): number {
  return (wrapDay(total) % 60) * 6;
}

/** Malá ručička: 12 hodin = 360°, tedy 30° za hodinu + 0,5° za minutu. */
export function hourHandAngle(total: number): number {
  return (wrapDay(total) % 720) * 0.5;
}

/** Úhel bodu (prstu) vůči středu ciferníku, 0–360°. */
export function pointerAngle(cx: number, cy: number, x: number, y: number): number {
  const deg = (Math.atan2(x - cx, cy - y) * 180) / Math.PI;
  return (deg + 360) % 360;
}

/** Nejkratší rozdíl dvou úhlů v rozsahu (-180, 180]. */
export function angleDelta(from: number, to: number): number {
  let d = (to - from) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/**
 * Kolik minut přičíst, když prst otočil ručičkou o `deltaDeg`.
 * Velká ručička: 1° = 1/6 minuty. Malá ručička: 1° = 2 minuty.
 * Ručička se tak dá točit dokola – čas plyne dál, nepřeskakuje.
 */
export function minutesForDrag(hand: "minute" | "hour", deltaDeg: number): number {
  return hand === "minute" ? deltaDeg / 6 : deltaDeg * 2;
}

/** Zaokrouhlení na `step` minut (po puštění ručička „cvakne“ na pětiminutu). */
export function snap(total: number, step = 5): number {
  return wrapDay(Math.round(total / step) * step);
}

/** Ukazují ručičky na ciferníku stejný čas? (8:00 a 20:00 vypadají stejně.) */
export function sameOnDial(a: number, b: number): boolean {
  return Math.round(wrapDay(a)) % 720 === Math.round(wrapDay(b)) % 720;
}

// ------------------------------------------------------------ digitálně

export function formatDigital(total: number): string {
  const h = hoursOf(total);
  const m = minutesOf(total);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ------------------------------------------------------------ česky

export type DayPart = "noc" | "ráno" | "dopoledne" | "poledne" | "odpoledne" | "večer";

export function dayPart(total: number): DayPart {
  const h = hoursOf(total);
  if (h < 5) return "noc";
  if (h < 9) return "ráno";
  if (h < 12) return "dopoledne";
  if (h < 13) return "poledne";
  if (h < 18) return "odpoledne";
  if (h < 22) return "večer";
  return "noc";
}

export function isDay(total: number): boolean {
  const h = hoursOf(total);
  return h >= 6 && h < 20;
}

const DAY_PART_ADVERB: Record<DayPart, string> = {
  noc: "v noci",
  ráno: "ráno",
  dopoledne: "dopoledne",
  poledne: "v poledne",
  odpoledne: "odpoledne",
  večer: "večer",
};

export const DAY_PART_ICON: Record<DayPart, string> = {
  noc: "🌙",
  ráno: "🌅",
  dopoledne: "☀️",
  poledne: "🌞",
  odpoledne: "⛅",
  večer: "🌇",
};

// Čísla 1–12 v různých pádech, jak je dítě slyší v češtině.
const HOUR_NOM = ["", "jedna", "dvě", "tři", "čtyři", "pět", "šest", "sedm", "osm", "devět", "deset", "jedenáct", "dvanáct"];
/** „čtvrt na jednu“ – akuzativ (liší se jen jednička). */
const HOUR_ACC = ["", "jednu", ...HOUR_NOM.slice(2)];
/** „půl osmé“ – řadová číslovka v genitivu. */
const HOUR_ORD = ["", "jedné", "druhé", "třetí", "čtvrté", "páté", "šesté", "sedmé", "osmé", "deváté", "desáté", "jedenácté", "dvanácté"];

const UNITS = ["", "jedna", "dvě", "tři", "čtyři", "pět", "šest", "sedm", "osm", "devět"];
const TEENS = ["deset", "jedenáct", "dvanáct", "třináct", "čtrnáct", "patnáct", "šestnáct", "sedmnáct", "osmnáct", "devatenáct"];
const TENS = ["", "", "dvacet", "třicet", "čtyřicet", "padesát"];

function numberWord(n: number): string {
  if (n < 10) return UNITS[n];
  if (n < 20) return TEENS[n - 10];
  const t = TENS[Math.floor(n / 10)];
  // „dvacet dva minut“ – ve složeném čísle se říká „dva“, ne „dvě“
  return n % 10 ? `${t} ${n % 10 === 2 ? "dva" : UNITS[n % 10]}` : t;
}

/** „je jedna hodina“, „jsou dvě hodiny“, „je pět hodin“ */
function hoursPhrase(h12: number): string {
  if (h12 === 1) return "Je jedna hodina";
  if (h12 <= 4) return `Jsou ${HOUR_NOM[h12]} hodiny`;
  return `Je ${HOUR_NOM[h12]} hodin`;
}

function minutesWord(m: number): string {
  if (m === 1) return "minuta";
  if (m >= 2 && m <= 4) return "minuty";
  return "minut";
}

/**
 * Čas slovy, jak ho řekne rodič: „Je sedm hodin ráno“, „Je čtvrt na
 * osm“, „Je půl osmé“, „Jsou tři hodiny a deset minut odpoledne“.
 * Použije se pro titulek i pro předčítání (speechSynthesis, cs-CZ).
 */
export function timeInCzech(total: number): string {
  const h = hoursOf(total);
  const m = minutesOf(total);
  // „v poledne“ jen přesně ve 12:00, 12:30 už je „půl jedné odpoledne“
  const part = h === 12 && m > 0 ? "odpoledne" : DAY_PART_ADVERB[dayPart(total)];
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const next12 = (h12 % 12) + 1;

  if (m === 0) {
    if (h === 12) return "Je poledne, dvanáct hodin";
    if (h === 0) return "Je půlnoc";
    return `${hoursPhrase(h12)} ${part}`;
  }
  if (m === 15) return `Je čtvrt na ${HOUR_ACC[next12]} ${part}`;
  if (m === 30) return `Je půl ${HOUR_ORD[next12]} ${part}`;
  if (m === 45) return `Je tři čtvrtě na ${HOUR_ACC[next12]} ${part}`;
  return `${hoursPhrase(h12)} a ${numberWord(m)} ${minutesWord(m)} ${part}`;
}
