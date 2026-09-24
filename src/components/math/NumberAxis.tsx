import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const MIN = 0;
const MAX = 10;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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
    const ratio = clamp((rect.bottom - clientY) / rect.height, 0, 1);
    return Math.round(ratio * (MAX - MIN)) + MIN;
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

  const thumbFromTopPct = 100 - ((value - MIN) / (MAX - MIN)) * 100;

  return (
    <div className="flex flex-col items-center shrink-0 select-none">
      <div className="text-5xl font-extrabold text-indigo-700 mb-3 tabular-nums w-16 text-center">
        {value}
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
          const pct = (i / (MAX - MIN)) * 100;
          return (
            <div
              key={n}
              className="absolute left-1/2 -translate-x-1/2 w-6 h-0.5 bg-indigo-300 pointer-events-none"
              style={{ top: `${pct}%` }}
            />
          );
        })}

        <div
          className={`absolute left-1/2 w-11 h-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 border-4 border-amber-500 shadow-md pointer-events-none transition-transform ${
            dragging ? "scale-110" : ""
          }`}
          style={{ top: `${thumbFromTopPct}%` }}
        />
      </div>

      <p className="text-xs text-stone-500 mt-2 text-center w-20">
        táhni nahoru a dolů
      </p>
    </div>
  );
}
