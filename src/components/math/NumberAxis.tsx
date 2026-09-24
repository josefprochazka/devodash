import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const MIN = 0;
const MAX = 10;

// Kolečko (i čísla vedle osy) nikdy nejedou úplně až k okraji osy, aby se
// při 0/10 nepřekrývalo s číslem nad osou nebo s textem pod ní.
const TOP_INSET = 9;
const BOTTOM_INSET = 9;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Procenta odshora pro dané číslo n (0 dole, 10 nahoře), s rezervou nahoře/dole. */
function pctForValue(n: number) {
  const ratio = (MAX - n) / (MAX - MIN);
  return TOP_INSET + ratio * (100 - TOP_INSET - BOTTOM_INSET);
}

interface Props {
  value: number;
  onChange: (value: number) => void;
}

/**
 * Svislá osa 0 (dole) – 10 (nahoře). Tažení prstem/myší po celé výšce osy
 * (Pointer Events + setPointerCapture, stejný princip jako u postavičky
 * v OraniGame), hodnota vždy zaokrouhlená na celé číslo.
 */
export function NumberAxis({ value, onChange }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  function valueFromClientY(clientY: number) {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return value;
    const pctFromTop = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);
    const ratio = clamp(
      (pctFromTop - TOP_INSET) / (100 - TOP_INSET - BOTTOM_INSET),
      0,
      1,
    );
    return clamp(Math.round(MAX - ratio * (MAX - MIN)), MIN, MAX);
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    onChange(valueFromClientY(e.clientY));
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    onChange(valueFromClientY(e.clientY));
  }

  function endDrag() {
    setDragging(false);
  }

  return (
    <div className="flex flex-col items-center shrink-0 select-none">
      <div className="flex items-start gap-1.5">
        {/* sloupec s osou – číslo nad ní je zarovnané přesně na její šířku */}
        <div className="flex flex-col items-center">
          <div className="h-28 flex items-end justify-center pb-3">
            <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-white border-4 border-indigo-400 shadow-md">
              <span className="text-5xl font-extrabold text-indigo-700 tabular-nums">
                {value}
              </span>
            </div>
          </div>

          <div
            ref={trackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="relative w-14 h-72 md:h-80 bg-indigo-100 rounded-full border-4 border-indigo-300 cursor-grab active:cursor-grabbing"
            style={{ touchAction: "none" }}
          >
            {Array.from({ length: MAX - MIN + 1 }).map((_, i) => {
              const n = MAX - i;
              return (
                <div
                  key={n}
                  className="absolute left-1/2 -translate-x-1/2 w-6 h-0.5 bg-indigo-300 pointer-events-none"
                  style={{ top: `${pctForValue(n)}%` }}
                />
              );
            })}

            <div
              className={`absolute left-1/2 w-11 h-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 border-4 border-amber-500 shadow-md pointer-events-none transition-transform ${
                dragging ? "scale-110" : ""
              }`}
              style={{ top: `${pctForValue(value)}%` }}
            />
          </div>
        </div>

        {/* čísla vedle osy, ať je vidět, u kterého je zrovna žluté kolečko */}
        <div className="flex flex-col items-center">
          <div className="h-28" />
          <div className="relative w-6 h-72 md:h-80">
            {Array.from({ length: MAX - MIN + 1 }).map((_, i) => {
              const n = MAX - i;
              const isCurrent = n === value;
              return (
                <div
                  key={n}
                  className={`absolute left-0 -translate-y-1/2 tabular-nums pointer-events-none transition-all ${
                    isCurrent
                      ? "text-amber-600 font-extrabold text-lg"
                      : "text-indigo-300 text-sm"
                  }`}
                  style={{ top: `${pctForValue(n)}%` }}
                >
                  {n}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-xs text-stone-500 mt-3 text-center w-24">
        táhni nahoru a dolů
      </p>
    </div>
  );
}
