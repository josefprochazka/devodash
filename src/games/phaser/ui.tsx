import type { ReactNode, Ref } from "react";

/** Div, do kterého Phaser kreslí; drží poměr stran scény. */
export function GameCanvas({
  hostRef,
  width,
  height,
  borderClass = "border-sky-800",
}: {
  hostRef: Ref<HTMLDivElement>;
  width: number;
  height: number;
  borderClass?: string;
}) {
  return (
    <div
      ref={hostRef}
      className={`w-full rounded-xl overflow-hidden border-4 select-none ${borderClass}`}
      style={{ aspectRatio: `${width} / ${height}`, touchAction: "none" }}
    />
  );
}

/** Karta s výsledkem pod hrou – dobrý (zlatý), nebo smutný (šedý) konec. */
export function ResultCard({
  good,
  title,
  children,
  onReset,
}: {
  good: boolean;
  title: string;
  children: ReactNode;
  onReset: () => void;
}) {
  return (
    <div
      className={`mt-4 rounded-xl border-2 p-5 text-center ${
        good
          ? "bg-gradient-to-b from-amber-100 to-amber-50 border-amber-400"
          : "bg-gradient-to-b from-stone-200 to-stone-100 border-stone-400"
      }`}
    >
      <p className={`text-lg font-semibold mb-1 ${good ? "text-amber-800" : "text-stone-700"}`}>
        {title}
      </p>
      <div className="text-stone-700">{children}</div>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer"
      >
        🔄 Zkusit znovu
      </button>
    </div>
  );
}
