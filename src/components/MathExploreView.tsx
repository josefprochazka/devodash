import { lazy, Suspense, useState } from "react";
import { CREATURE_OPTIONS, type CreatureType } from "../games/math/options";
import { StateIcon } from "./math/StateIcon";

// Jeskyně s osou běží na Phaseru – načte se líně, až když se sekce otevře.
const MathCave = lazy(() => import("../games/math/MathCave"));

type Mode = "idle" | "active";

/**
 * Hra na počítání 0–10 pro prvňáčky: postavičky v jeskyni + svislá osa.
 * Samostatná sekce mimo ztišení (viz VerseMenu – "🔢 Matematické objevování").
 * Tady jsou jen volby nad hrou, samotná jeskyně je v games/math/MathScene.
 */
export function MathExploreView({ wide = false }: { wide?: boolean }) {
  const [mode, setMode] = useState<Mode>("idle");
  const [selectedTypes, setSelectedTypes] = useState<CreatureType[]>(["dwarf"]);

  function toggleType(type: CreatureType) {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev; // musí zůstat vybraný aspoň jeden
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  }

  return (
    <main className={`flex-1 p-4 md:p-8 mx-auto w-full ${wide ? "max-w-5xl pt-16 md:pt-16" : "max-w-3xl"}`}>
      <header className="mb-4">
        <p className="text-sm uppercase tracking-widest text-indigo-700 font-semibold mb-1">
          Matematické objevování
        </p>
        <h2 className="text-xl md:text-2xl font-serif text-stone-800 mb-1">
          Kolik je v jeskyni?
        </h2>
        <p className="text-sm text-stone-600">
          Pomáhá dětem trénovat počítání od 0 do 10 a vidět, kolik dané číslo
          doopravdy znamená. Po puštění osy appka číslo řekne nahlas.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-4">
        {CREATURE_OPTIONS.map((opt) => {
          const selected = selectedTypes.includes(opt.type);
          return (
            <button
              key={opt.type}
              type="button"
              onClick={() => toggleType(opt.type)}
              aria-pressed={selected}
              className={`px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-colors cursor-pointer ${
                selected
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white border-stone-300 text-stone-600 hover:bg-stone-50"
              }`}
            >
              {opt.icon} {opt.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 mb-4">
        {(["idle", "active"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-colors cursor-pointer ${
              mode === m
                ? "bg-indigo-100 border-indigo-500"
                : "bg-stone-50 border-stone-200 hover:bg-stone-100"
            }`}
          >
            <StateIcon active={m === "active"} />
            <span className="text-xs font-medium text-stone-600">
              {m === "idle" ? "Stojí" : "V pohybu"}
            </span>
          </button>
        ))}
      </div>

      <Suspense fallback={<div className="aspect-[5/3] rounded-xl bg-stone-200 animate-pulse" />}>
        <MathCave types={selectedTypes} active={mode === "active"} />
      </Suspense>
    </main>
  );
}
