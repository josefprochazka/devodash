/**
 * Kanonické pořadí biblických knih (názvy podle ČEP).
 * Slouží jen k řazení menu – název knihy ve `verses.ts` se musí shodovat.
 */
export const BIBLE_BOOKS: string[] = [
  // Starý zákon
  "Genesis", "Exodus", "Leviticus", "Numeri", "Deuteronomium",
  "Jozue", "Soudců", "Rút", "1. Samuelova", "2. Samuelova",
  "1. Královská", "2. Královská", "1. Paralipomenon", "2. Paralipomenon",
  "Ezdráš", "Nehemjáš", "Ester", "Jób", "Žalmy", "Přísloví", "Kazatel",
  "Píseň písní", "Izajáš", "Jeremjáš", "Pláč", "Ezechiel", "Daniel",
  "Ozeáš", "Jóel", "Ámos", "Abdijáš", "Jonáš", "Micheáš", "Nahum",
  "Abakuk", "Sofonjáš", "Ageus", "Zacharjáš", "Malachiáš",
  // Nový zákon
  "Matouš", "Marek", "Lukáš", "Jan", "Skutky", "Římanům",
  "1. Korintským", "2. Korintským", "Galatským", "Efezským", "Filipským",
  "Koloským", "1. Tesalonickým", "2. Tesalonickým", "1. Timoteovi",
  "2. Timoteovi", "Titovi", "Filemonovi", "Židům", "Jakubův",
  "1. Petrův", "2. Petrův", "1. Janův", "2. Janův", "3. Janův", "Judův",
  "Zjevení",
];

/** Index knihy v Bibli; neznámé knihy jdou na konec. */
export function bookOrder(book: string): number {
  const i = BIBLE_BOOKS.indexOf(book);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
}
