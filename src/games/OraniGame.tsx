import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const TILE_COUNT = 6;
const DONE_THRESHOLD = 92;
const START_PERCENT = 8;

const FIELD_HEIGHT = 176; // px, matches h-44
const SCENE_GAP = 12; // px, matches mt-3
const COUCH_HEIGHT = 112; // px, matches h-28
const SCENE_HEIGHT = FIELD_HEIGHT + SCENE_GAP + COUCH_HEIGHT;
const CHAR_MARGIN = 28; // keeps the character from clipping at the very top/bottom
const INITIAL_Y = 130;
const COUCH_DROP_Y = FIELD_HEIGHT + SCENE_GAP;

type Phase = "playing" | "blink" | "result";
type Outcome = "prepared" | "lazy" | null;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function OraniGame() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const posYRef = useRef(INITIAL_Y);

  const [progress, setProgress] = useState({ current: START_PERCENT, max: 0 });
  const [posY, setPosY] = useState(INITIAL_Y);
  const [isDragging, setIsDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("playing");
  const [outcome, setOutcome] = useState<Outcome>(null);

  const plowedTiles =
    progress.max >= DONE_THRESHOLD
      ? TILE_COUNT
      : Math.floor((progress.max / 100) * TILE_COUNT);

  const sunLeftPct = 6 + (progress.max / 100) * 76;

  useEffect(() => {
    if (phase === "playing" && outcome === null && progress.max >= DONE_THRESHOLD) {
      reveal("prepared");
    }
  }, [progress.max, phase, outcome]);

  function percentFromClientX(clientX: number) {
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect) return progress.current;
    return clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
  }

  function yFromClientY(clientY: number) {
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return posYRef.current;
    return clamp(clientY - rect.top, CHAR_MARGIN, SCENE_HEIGHT - CHAR_MARGIN);
  }

  function startDrag(e: ReactPointerEvent) {
    e.preventDefault();
    draggingRef.current = true;
    setIsDragging(true);
  }

  function handlePointerMove(e: ReactPointerEvent) {
    if (!draggingRef.current) return;
    const pct = percentFromClientX(e.clientX);
    const y = yFromClientY(e.clientY);
    setProgress((p) => ({ current: pct, max: Math.max(p.max, pct) }));
    posYRef.current = y;
    setPosY(y);
  }

  function endDrag() {
    if (draggingRef.current && posYRef.current >= COUCH_DROP_Y) {
      reveal("lazy");
    }
    draggingRef.current = false;
    setIsDragging(false);
  }

  function reveal(chosen: Exclude<Outcome, null>) {
    setOutcome(chosen);
    setPhase("blink");
    window.setTimeout(() => setPhase("result"), 500);
  }

  function reset() {
    setProgress({ current: START_PERCENT, max: 0 });
    posYRef.current = INITIAL_Y;
    setPosY(INITIAL_Y);
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
            ref={sceneRef}
            className="relative select-none"
            style={{ touchAction: "none" }}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            onPointerCancel={endDrag}
          >
            <div
              ref={fieldRef}
              className="relative h-44 bg-gradient-to-b from-sky-200 to-sky-100 rounded-xl overflow-hidden border-4 border-emerald-800"
            >
              <div
                className="absolute top-2 text-3xl transition-[left] duration-500 ease-linear"
                style={{ left: `${sunLeftPct}%` }}
              >
                ☀️
              </div>

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
                      <span
                        key={plowed ? `plowed-${i}` : `unplowed-${i}`}
                        className={plowed ? "animate-plow-pop" : ""}
                      >
                        {plowed ? "🟫" : "🌱"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative h-28 mt-3 rounded-xl border-4 border-dashed border-indigo-300 bg-indigo-50 flex flex-col items-center justify-center text-indigo-400">
              <span className="text-3xl">🛋️</span>
              <span className="text-xs mt-1 text-center px-2">
                sem přetáhni postavičku, když chce radši spát
              </span>
            </div>

            <button
              type="button"
              aria-label="Postavička – táhni prstem doprava, ať oře pole, nebo dolů na gauč, když chce jít spát"
              onPointerDown={startDrag}
              className={`absolute text-4xl leading-none -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-transform ${
                isDragging ? "scale-125 drop-shadow-lg" : ""
              }`}
              style={{ left: `${progress.current}%`, top: `${posY}px`, touchAction: "none" }}
            >
              🧑‍🌾
            </button>

            {isDragging && (
              <span
                className="absolute text-lg opacity-60 animate-pulse pointer-events-none"
                style={{
                  left: `${Math.max(0, progress.current - 5)}%`,
                  top: `${posY + 8}px`,
                }}
              >
                💨
              </span>
            )}
          </div>

          <p className="text-sm text-stone-500 mt-2">
            👉 Prstem táhni postavičku po poli doprava, ať zoře celé pole. Nebo
            ji přetáhni dolů na gauč, když chce radši jít spát.
          </p>
        </>
      )}

      {phase === "blink" && (
        <div className="h-44 rounded-xl bg-stone-900 flex items-center justify-center text-stone-100 text-lg animate-pulse">
          🌙 Plyne čas… přichází žně 🌾
        </div>
      )}

      {phase === "result" && outcome === "prepared" && (
        <div className="rounded-xl bg-gradient-to-b from-amber-100 to-amber-50 border-2 border-amber-400 p-6 text-center">
          <div className="text-3xl mb-1">🏡 ☀️ 🌾🌾🌾</div>
          <div className="text-5xl mb-2">
            <span className="inline-block animate-bounce">🧑‍🌾</span>
            <span
              className="inline-block animate-bounce"
              style={{ animationDelay: "150ms" }}
            >
              😄
            </span>
            <span
              className="inline-block animate-bounce"
              style={{ animationDelay: "300ms" }}
            >
              🍞
            </span>
          </div>
          <p className="text-lg font-semibold text-amber-800 mb-1">
            Přišly žně!
          </p>
          <p className="text-stone-700">
            Postavička na podzim pole zorala, a teď má bohatou úrodu. Má dost
            jídla a je šťastná, protože se včas připravila.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-sm font-medium">
            🍞🍞🍞 plná spíž, nikdo nemá hlad
          </div>
          <div>
            <button
              type="button"
              onClick={reset}
              className="mt-4 px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer"
            >
              🔄 Zkusit znovu
            </button>
          </div>
        </div>
      )}

      {phase === "result" && outcome === "lazy" && (
        <div className="rounded-xl bg-gradient-to-b from-stone-200 to-stone-100 border-2 border-stone-400 p-6 text-center">
          <div className="text-3xl mb-1">
            🌙 🛌
            <span className="inline-block animate-float-zzz ml-1 align-top">
              💤
            </span>
          </div>
          <div className="text-5xl mb-2">🌾🥀🥀</div>
          <p className="text-lg font-semibold text-stone-700 mb-1">
            Přišly žně…
          </p>
          <p className="text-stone-700">
            Postavička na podzim neorala a šla radši spát. Teď při žni nemá co
            sklidit – má hlad a je jí smutno, protože se nepřipravila.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-200 border border-stone-400 text-stone-600 text-sm font-medium">
            🍽️ prázdná spíž, kručí jí v bříšku
          </div>
          <div>
            <button
              type="button"
              onClick={reset}
              className="mt-4 px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer"
            >
              🔄 Zkusit znovu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
