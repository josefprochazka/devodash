import type { Verse } from "../types";
import { gameRegistry } from "../games/registry";

export function VerseView({ verse, wide = false }: { verse: Verse; wide?: boolean }) {
  const Game = gameRegistry[verse.game];

  return (
    <main className={`flex-1 p-4 md:p-8 mx-auto w-full ${wide ? "max-w-5xl pt-16 md:pt-16" : "max-w-3xl"}`}>
      <header>
        <p className="text-sm uppercase tracking-widest text-emerald-700 font-semibold mb-1">
          {verse.reference}
        </p>
        <blockquote className="text-xl md:text-2xl font-serif text-stone-800 border-l-4 border-amber-400 pl-4 mb-4">
          „{verse.text}“
        </blockquote>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-emerald-700 uppercase mb-1">
            Pro rodiče
          </p>
          <p className="text-sm text-stone-700 leading-relaxed">
            {verse.parentNote}
          </p>
        </div>
      </header>

      <Game />
    </main>
  );
}
