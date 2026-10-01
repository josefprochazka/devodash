import { useState } from "react";
import { OUTCOME_EVENT, usePhaserGame } from "./phaser/usePhaserGame";
import { GameCanvas, ResultCard } from "./phaser/ui";
import { H, StavitelScene, W, type Plot } from "./stavitel/StavitelScene";

/**
 * Hra k Matouši 7:24 – dům na skále, nebo na písku.
 *
 * React tu jen drží plátno, nadpis a kartu s výsledkem; celá hra běží ve
 * StavitelScene (Phaser).
 */
export default function StavitelGame() {
  const [outcome, setOutcome] = useState<Plot | null>(null);
  const { hostRef, restart } = usePhaserGame({
    scene: StavitelScene,
    width: W,
    height: H,
    background: "#bae6fd",
    onReady: (game) => game.events.on(OUTCOME_EVENT, (result: Plot) => setOutcome(result)),
  });

  function reset() {
    setOutcome(null);
    restart("stavitel");
  }

  return (
    <div className="mt-6">
      <h2 className="font-semibold text-stone-700 mb-3">
        🏠 Postav dům – na skále, nebo na písku?
      </h2>

      <GameCanvas hostRef={hostRef} width={W} height={H} />

      {outcome === null && (
        <p className="text-sm text-stone-500 mt-2">
          👉 Ťukni, kde chceš stavět, a pak prstem přetáhni díly domu na
          místo. Uvidíš, co se stane, až přijde bouřka.
        </p>
      )}

      {outcome === "rock" && (
        <ResultCard good title="Dům na skále vydržel! 🪨🏠🌈" onReset={reset}>
          Přišel déšť, voda i vítr, ale dům nespadl, protože stál na pevné
          skále. Tak je to s každým, kdo Ježíše poslouchá a dělá, co říká.
        </ResultCard>
      )}

      {outcome === "sand" && (
        <ResultCard good={false} title="Dům na písku spadl… 🏖️🌊" onReset={reset}>
          Písek vypadal hezky a stavělo se na něm snadno, ale když přišla
          bouřka, voda ho odnesla i s domem. Zkus to znovu a postav dům tam,
          kde vydrží.
        </ResultCard>
      )}
    </div>
  );
}
