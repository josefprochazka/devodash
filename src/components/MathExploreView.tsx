import { useMemo, useState } from "react";
import { Creature, CREATURE_OPTIONS } from "./math/creatures";
import type { CreatureType } from "./math/creatures";
import { StateIcon } from "./math/StateIcon";
import { NumberAxis } from "./math/NumberAxis";

type Mode = "idle" | "active";

/**
 * Hra na počítání 0–10 pro prvňáčky: postavičky v jeskyni + svislá osa.
 * Samostatná sekce mimo ztišení (viz VerseMenu – "🔢 Matematické objevování").
 */
export function MathExploreView() {
  const [value, setValue] = useState(5);
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

  // Pro daný počet a vybranou sadu typů náhodně přiřadí typ každé postavičce.
  // Přepočítá se jen když se změní počet nebo výběr typů, ne při každém
  // překreslení (jinak by se trpaslíci/jablíčka/zvířata míchaly i jen kvůli
  // přepnutí stojí/v pohybu).
  const typesKey = [...selectedTypes].sort().join(",");
  const assignments = useMemo(() => {
    return Array.from(
      { length: value },
      () => selectedTypes[Math.floor(Math.random() * selectedTypes.length)],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, typesKey]);

  return (
    <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full">
      <header className="mb-4">
        <p className="text-sm uppercase tracking-widest text-indigo-700 font-semibold mb-1">
          Matematické objevování
        </p>
        <h2 className="text-xl md:text-2xl font-serif text-stone-800 mb-1">
          Kolik je v jeskyni?
        </h2>
        <p className="text-sm text-stone-600">
          Pomáhá dětem trénovat počítání od 0 do 10 a vidět, kolik dané číslo
          doopravdy znamená.
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
          <StateIcon active={false} />
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
          <StateIcon active />
          <span className="text-xs font-medium text-stone-600">
            V pohybu
          </span>
        </button>
      </div>

      <div className="flex gap-4 items-stretch">
        <div className="relative flex-1 min-w-0 rounded-t-[100px] rounded-b-2xl bg-gradient-to-b from-stone-600 via-stone-700 to-stone-900 border-4 border-stone-900 p-4 min-h-[320px] md:min-h-[360px] flex items-end justify-center overflow-hidden">
          <div className="absolute inset-x-8 top-3 h-14 rounded-t-full bg-black/30 blur-[2px]" />

          {value === 0 ? (
            <p className="text-5xl md:text-6xl font-black tracking-widest text-stone-300 pb-6">
              NIC
            </p>
          ) : (
            <div className="relative flex flex-wrap items-end justify-center gap-1.5 pb-2">
              {assignments.map((type, i) => (
                <Creature
                  key={i}
                  type={type}
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
