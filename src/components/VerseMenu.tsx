import { verses } from "../data/verses";
import type { Verse } from "../types";

/** Zástupný id pro budoucí verš, který ještě nemá reálná data. */
export const COMING_SOON_ID = "coming-soon";

/** Samostatná sekce mimo ztišení – jiná appka/hra napojená přes stejné menu. */
export const MATH_EXPLORE_ID = "math-explore";

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
}

function groupByBookAndChapter(list: Verse[]) {
  const books = new Map<string, Map<number, Verse[]>>();
  for (const v of list) {
    if (!books.has(v.book)) books.set(v.book, new Map());
    const chapters = books.get(v.book)!;
    if (!chapters.has(v.chapter)) chapters.set(v.chapter, []);
    chapters.get(v.chapter)!.push(v);
  }
  return books;
}

export function VerseMenu({ selectedId, onSelect }: Props) {
  const books = groupByBookAndChapter(verses);

  return (
    <nav className="w-full md:w-64 shrink-0 bg-emerald-900 text-emerald-50 p-4 md:min-h-screen">
      <h1 className="text-xl font-bold mb-4 tracking-wide">📖 Ztišení</h1>
      {[...books.entries()].map(([book, chapters]) => (
        <div key={book} className="mb-3">
          <div className="font-semibold text-emerald-200 mb-1">{book}</div>
          {[...chapters.entries()].map(([chapter, versesInChapter]) => (
            <div key={chapter} className="ml-2 mb-1">
              <div className="text-sm text-emerald-300/80 mb-1">
                Kapitola {chapter}
              </div>
              <ul className="ml-2 space-y-1">
                {versesInChapter.map((v) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(v.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                        selectedId === v.id
                          ? "bg-amber-400 text-emerald-950 font-semibold"
                          : "hover:bg-emerald-800"
                      }`}
                    >
                      Verš {v.verse}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}

      <div className="mb-3">
        <button
          type="button"
          onClick={() => onSelect(COMING_SOON_ID)}
          className={`w-full text-left px-3 py-2 rounded-lg border border-dashed transition-colors cursor-pointer ${
            selectedId === COMING_SOON_ID
              ? "bg-amber-400 text-emerald-950 font-semibold border-amber-400"
              : "border-emerald-700 text-emerald-300/80 hover:bg-emerald-800"
          }`}
        >
          + další verš
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-emerald-700/50">
        <button
          type="button"
          onClick={() => onSelect(MATH_EXPLORE_ID)}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors cursor-pointer ${
            selectedId === MATH_EXPLORE_ID
              ? "bg-amber-400 text-emerald-950 font-semibold"
              : "bg-indigo-800/60 text-indigo-100 hover:bg-indigo-800"
          }`}
        >
          🔢 Matematické objevování
        </button>
      </div>
    </nav>
  );
}
