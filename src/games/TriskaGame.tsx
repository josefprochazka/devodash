import { useState } from "react";
import { OUTCOME_EVENT, usePhaserGame } from "./phaser/usePhaserGame";
import { GameCanvas, ResultCard } from "./phaser/ui";
import { H, TriskaScene, W } from "./triska/TriskaScene";

/**
 * Hra k Matouši 7:1–5 – tříska v oku kamaráda a trám ve vlastním oku.
 *
 * React tu jen drží plátno, nadpis a kartu s výsledkem; celá hra běží
 * v TriskaScene (Phaser).
 */
export default function TriskaGame() {
  const [done, setDone] = useState(false);
  const { hostRef, restart } = usePhaserGame({
    scene: TriskaScene,
    width: W,
    height: H,
    background: "#bae6fd",
    onReady: (game) => game.events.on(OUTCOME_EVENT, () => setDone(true)),
  });

  function reset() {
    setDone(false);
    restart("triska");
  }

  return (
    <div className="mt-6">
      <h2 className="font-semibold text-stone-700 mb-3">🪵 Tříska a trám</h2>

      <GameCanvas hostRef={hostRef} width={W} height={H} />

      {!done && (
        <p className="text-sm text-stone-500 mt-2">
          👉 Přetáhni Tomovu pinzetu k Bářinu oku (nebo ťukni na Báru). Když
          to nepůjde, chyť prstem trám v Tomově oku a vytáhni ho.
        </p>
      )}

      {done && (
        <ResultCard good title="Nejdřív trám, pak tříska! 🪵👀💛" onReset={reset}>
          Tom chtěl Báře pomoct, ale s trámem v oku nic neviděl. Až když vyndal
          trám ze svého oka, mohl kamarádce opravdu pomoct. Každý máme svoje
          chyby – než začneme ukazovat na chyby druhých, podívejme se nejdřív
          na ty svoje.
          <blockquote className="mt-3 text-sm italic text-amber-900 border-l-4 border-amber-400 pl-3 text-left inline-block">
            „Nejprve vyjmi trám ze svého oka, a pak jasně uvidíš, jak vyjmout
            třísku z oka svého bratra.“ – Matouš 7:5
          </blockquote>
        </ResultCard>
      )}
    </div>
  );
}
