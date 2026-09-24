import { useState } from "react";
import { Dwarf } from "./math/Dwarf";
import { NumberAxis } from "./math/NumberAxis";

type Mode = "idle" | "active";

/**
 * Hra na počítání 0–10 pro prvňáčky: trpaslíci v jeskyni + svislá osa.
 * Samostatná sekce mimo ztišení (viz VerseMenu – "🔢 Matematické objevování").
 */
export function MathExploreView() {
  const [value, setValue] = useState(5);
  const [mode, setMode] = useState<Mode>("idle");

  return (
    <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full">
      <header className="mb-4">
        <p className="text-sm uppercase tracking-widest text-indigo-700 font-semibold mb-1">
          Matematické objevování
        </p>
        <h2 className="text-xl md:text-2xl font-serif text-stone-800">
          Kolik je v jeskyni trpaslíků?
        </h2>
      </header>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode("idle")}
          aria-pressed={mode === "idle"}
          className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-colors cursor-pointer ${
            mode === "idle"
              ? "bg-indigo-100 border-indigo-500"
              : "bg-stone-50 border-stone-200 hover:bg-stone-100"
          }`}
        >
          <Dwarf active={false} size={36} />
          <span className="text-xs font-medium text-stone-600">Stojí</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("active")}
          aria-pressed={mode === "active"}
          className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-colors cursor-pointer ${
            mode === "active"
              ? "bg-indigo-100 border-indigo-500"
              : "bg-stone-50 border-stone-200 hover:bg-stone-100"
          }`}
        >
          <Dwarf active size={36} />
          <span className="text-xs font-medium text-stone-600">
            Kope poklad
          </span>
        </button>
      </div>

      <div className="flex gap-4 items-stretch">
        <div className="relative flex-1 min-w-0 rounded-t-[100px] rounded-b-2xl bg-gradient-to-b from-stone-600 via-stone-700 to-stone-900 border-4 border-stone-900 p-4 min-h-[320px] md:min-h-[360px] flex items-end justify-center overflow-hidden">
          <div className="absolute inset-x-8 top-3 h-14 rounded-t-full bg-black/30 blur-[2px]" />

          {value === 0 ? (
            <p className="text-stone-300 text-sm italic pb-6">
              V jeskyni teď nikdo není.
            </p>
          ) : (
            <div className="relative flex flex-wrap items-end justify-center gap-1.5 pb-2">
              {Array.from({ length: value }).map((_, i) => (
                <Dwarf
                  key={i}
                  active={mode === "active"}
                  variant={i}
                  size={48}
                />
              ))}
            </div>
          )}
        </div>

        <NumberAxis value={value} onChange={setValue} />
      </div>
    </main>
  );
}
