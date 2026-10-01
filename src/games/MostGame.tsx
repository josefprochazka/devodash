import { useState } from "react";
import { OUTCOME_EVENT, usePhaserGame } from "./phaser/usePhaserGame";
import { GameCanvas, ResultCard } from "./phaser/ui";
import { H, MostScene, W } from "./most/MostScene";

/**
 * Hra k 1. Petrovu 3:18 – žebřík z dobrých skutků je vždy krátký, k Bohu
 * dítě přivede až Ježíš. Celá hra běží v MostScene (Phaser).
 */
export default function MostGame() {
  const [done, setDone] = useState(false);
  const { hostRef, restart } = usePhaserGame({
    scene: MostScene,
    width: W,
    height: H,
    background: "#38bdf8",
    onReady: (game) => game.events.on(OUTCOME_EVENT, () => setDone(true)),
  });

  function reset() {
    setDone(false);
    restart("most");
  }

  return (
    <div className="mt-6">
      <h2 className="font-semibold text-stone-700 mb-3">🪜 Vylez po žebříku k Bohu</h2>

      <GameCanvas hostRef={hostRef} width={W} height={H} borderClass="border-emerald-800" />

      {!done && (
        <p className="text-sm text-stone-500 mt-2">
          👉 Ťukni na dobré skutky (nebo je přetáhni k žebříku) – postavička
          z nich postaví příčky. Pak zkus vylézt nahoru.
        </p>
      )}

      {done && (
        <ResultCard good title="Ježíš mě vzal za ruku a přivedl k Bohu! ✝️✨" onReset={reset}>
          Po vlastním žebříku z dobrých skutků se postavička nahoru nedostala –
          ale Ježíš ji vzal za ruku a doletěl s ní až k Bohu.
          <blockquote className="mt-3 text-sm italic text-amber-900 border-l-4 border-amber-400 pl-3 text-left inline-block">
            „…aby vás přivedl k Bohu.“ – 1. Petrův 3:18
          </blockquote>
        </ResultCard>
      )}
    </div>
  );
}
