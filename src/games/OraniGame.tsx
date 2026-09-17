import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const TILE_COUNT = 6;
const DONE_THRESHOLD = 92;

type Phase = "playing" | "blink" | "result";
type Outcome = "prepared" | "lazy" | null;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function OraniGame() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const [progress, setProgress] = useState({ current: 0, max: 0 });
  const [phase, setPhase] = useState<Phase>("playing");
  const [outcome, setOutcome] = useState<Outcome>(null);

  const plowedTiles = Math.floor((progress.max / 100) * TILE_COUNT);

  function percentFromClientX(clientX: number) {
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect) return progress.current;
    return clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
  }

  function startDrag(e: ReactPointerEvent) {
    e.preventDefault();
    draggingRef.current = true;
  }

  function handlePointerMove(e: ReactPointerEvent) {
    if (!draggingRef.current) return;
    const pct = percentFromClientX(e.clientX);
    setProgress((p) => ({ current: pct, max: Math.max(p.max, pct) }));
  }

  function endDrag() {
    draggingRef.current = false;
  }

  function reveal(chosen: Exclude<Outcome, null>) {
    setOutcome(chosen);
    setPhase("blink");
    window.setTimeout(() => setPhase("result"), 500);
  }

  function reset() {
    setProgress({ current: 0, max: 0 });
    setOutcome(null);
    setPhase("playing");
  }

  return (
    <div className="mt-6">
      {phase !== "result" && (
        <h2 className="font-semibold text-stone-700 mb-3">
          🚜 Zorej pole, ať máš na podzim co jíst
        </h2>
      )}

      {phase === "playing" && (
        <>
          <div
            ref={fieldRef}
            className="relative h-44 bg-gradient-to-b from-sky-200 to-sky-100 rounded-xl overflow-hidden border-4 border-emerald-800 select-none"
            style={{ touchAction: "none" }}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            onPointerCancel={endDrag}
          >
            <div className="absolute top-2 right-3 text-3xl">☀️</div>

            <div className="absolute bottom-0 left-0 right-0 h-24 flex">
              {Array.from({ length: TILE_COUNT }).map((_, i) => {
                const plowed = i < plowedTiles;
                return (
                  <div
                    key={i}
                    className={`flex-1 border-r border-black/10 last:border-r-0 flex items-end justify-center pb-1 text-xl transition-colors duration-300 ${
                      plowed ? "bg-amber-800" : "bg-lime-500"
                    }`}
                  >
                    {plowed ? "🟫" : "🌱"}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              aria-label="Postavička – táhni prstem doprava, ať oře pole"
              onPointerDown={startDrag}
              className="absolute bottom-14 text-4xl leading-none -translate-x-1/2 cursor-grab active:cursor-grabbing"
              style={{ left: `${progress.current}%`, touchAction: "none" }}
            >
              🧑‍🌾
            </button>
          </div>

          <p className="text-sm text-stone-500 mt-2">
            👉 Prstem táhni postavičku po poli doprava, ať zoře celé pole.
          </p>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              type="button"
              disabled={progress.max < DONE_THRESHOLD}
              onClick={() => reveal("prepared")}
              className="px-4 py-2 rounded-full bg-amber-500 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold shadow cursor-pointer disabled:cursor-not-allowed"
            >
              ☀️ Pole je hotové – jet na žně
            </button>
            <button
              type="button"
              onClick={() => reveal("lazy")}
              className="px-4 py-2 rounded-full bg-stone-300 hover:bg-stone-400 text-stone-700 font-semibold shadow cursor-pointer"
            >
              😴 Radši jít lehnout
            </button>
          </div>
        </>
      )}

      {phase === "blink" && (
        <div className="h-44 rounded-xl bg-stone-900 flex items-center justify-center text-stone-100 text-lg animate-pulse">
          🌙 Plyne čas… přichází žně 🌾
        </div>
      )}

      {phase === "result" && outcome === "prepared" && (
        <div className="rounded-xl bg-gradient-to-b from-amber-100 to-amber-50 border-2 border-amber-400 p-6 text-center">
          <div className="text-5xl mb-2 animate-bounce">🌾😄🍞</div>
          <p className="text-lg font-semibold text-amber-800 mb-1">
            Přišly žně!
          </p>
          <p className="text-stone-700">
            Postavička na podzim pole zorala, a teď má bohatou úrodu. Má dost
            jídla a je šťastná, protože se včas připravila.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer"
          >
            🔄 Zkusit znovu
          </button>
        </div>
      )}

      {phase === "result" && outcome === "lazy" && (
        <div className="rounded-xl bg-gradient-to-b from-stone-200 to-stone-100 border-2 border-stone-400 p-6 text-center">
          <div className="text-5xl mb-2">🌾😢🥀</div>
          <p className="text-lg font-semibold text-stone-700 mb-1">
            Přišly žně…
          </p>
          <p className="text-stone-700">
            Postavička na podzim neorala a šla radši spát. Teď při žni nemá co
            sklidit – má hlad a je jí smutno, protože se nepřipravila.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer"
          >
            🔄 Zkusit znovu
          </button>
        </div>
      )}
    </div>
  );
}
