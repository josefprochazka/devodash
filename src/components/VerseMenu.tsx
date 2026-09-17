import { verses } from "../data/verses";
import type { Verse } from "../types";

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
    </nav>
  );
}
