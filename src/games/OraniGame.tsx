import { useState } from "react";
import { OUTCOME_EVENT, usePhaserGame } from "./phaser/usePhaserGame";
import { GameCanvas, ResultCard } from "./phaser/ui";
import { H, OraniScene, W, type Outcome } from "./orani/OraniScene";

/**
 * Hra k Přísloví 20:4 – zorat pole, nebo jít spát? Celá hra běží
 * v OraniScene (Phaser), React drží jen nadpis a kartu s výsledkem.
 */
export default function OraniGame() {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const { hostRef, restart } = usePhaserGame({
    scene: OraniScene,
    width: W,
    height: H,
    background: "#fef3c7",
    onReady: (game) => game.events.on(OUTCOME_EVENT, (result: Outcome) => setOutcome(result)),
  });

  function reset() {
    setOutcome(null);
    restart("orani");
  }

  return (
    <div className="mt-6">
      <h2 className="font-semibold text-stone-700 mb-3">
        🚜 Zorej pole, ať máš při žni co jíst
      </h2>

      <GameCanvas hostRef={hostRef} width={W} height={H} borderClass="border-emerald-800" />

      {outcome === null && (
        <p className="text-sm text-stone-500 mt-2">
          👉 Chyť farmáře prstem a táhni ho po poli doprava, ať ho celé zoře.
          Nebo ho přetáhni do postele, když se mu nechce.
        </p>
      )}

      {outcome === "prepared" && (
        <ResultCard good title="Přišly žně – plná spíž! 🌾🍞" onReset={reset}>
          Farmář na podzim pole zoral a teď má bohatou úrodu. Má dost jídla a
          je šťastný, protože se včas připravil.
        </ResultCard>
      )}

      {outcome === "lazy" && (
        <ResultCard good={false} title="Přišly žně… a nic není 🍽️" onReset={reset}>
          Farmář na podzim neoral a šel radši spát. Teď při žni nemá co
          sklidit – má hlad a je mu smutno, protože se nepřipravil.
        </ResultCard>
      )}
    </div>
  );
}
