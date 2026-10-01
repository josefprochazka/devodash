import { useEffect, useRef, useState } from "react";
import * as Phaser from "phaser";
import { H, OUTCOME_EVENT, StavitelScene, W, type Plot } from "./stavitel/StavitelScene";

/**
 * Hra k Matouši 7:24 – dům na skále, nebo na písku.
 *
 * První hra postavená na herním enginu Phaser (kreslí do <canvas> přes
 * WebGL, má herní smyčku, částice, tweeny, kameru). React tu jen drží
 * plátno, nadpis a kartu s výsledkem; celá hra běží ve StavitelScene.
 */
export default function StavitelGame() {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [outcome, setOutcome] = useState<Plot | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: W,
      height: H,
      backgroundColor: "#bae6fd",
      banner: false,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [StavitelScene],
    });
    game.events.on(OUTCOME_EVENT, (result: Plot) => setOutcome(result));
    gameRef.current = game;
    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  function reset() {
    setOutcome(null);
    gameRef.current?.scene.getScene("stavitel")?.scene.restart();
  }

  return (
    <div className="mt-6">
      <h2 className="font-semibold text-stone-700 mb-3">
        🏠 Postav dům – na skále, nebo na písku?
      </h2>

      <div
        ref={hostRef}
        className="w-full rounded-xl overflow-hidden border-4 border-sky-800 select-none"
        style={{ aspectRatio: `${W} / ${H}`, touchAction: "none" }}
      />

      {outcome === null && (
        <p className="text-sm text-stone-500 mt-2">
          👉 Ťukni, kde chceš stavět, a pak prstem přetáhni díly domu na
          místo. Uvidíš, co se stane, až přijde bouřka.
        </p>
      )}

      {outcome === "rock" && (
        <div className="mt-4 rounded-xl bg-gradient-to-b from-amber-100 to-amber-50 border-2 border-amber-400 p-5 text-center">
          <p className="text-lg font-semibold text-amber-800 mb-1">
            Dům na skále vydržel! 🪨🏠🌈
          </p>
          <p className="text-stone-700">
            Přišel déšť, voda i vítr, ale dům nespadl, protože stál na pevné
            skále. Tak je to s každým, kdo Ježíše poslouchá a dělá, co říká.
          </p>
          <ResetButton onClick={reset} />
        </div>
      )}

      {outcome === "sand" && (
        <div className="mt-4 rounded-xl bg-gradient-to-b from-stone-200 to-stone-100 border-2 border-stone-400 p-5 text-center">
          <p className="text-lg font-semibold text-stone-700 mb-1">
            Dům na písku spadl… 🏖️🌊
          </p>
          <p className="text-stone-700">
            Písek vypadal hezky a stavělo se na něm snadno, ale když přišla
            bouřka, voda ho odnesla i s domem. Zkus to znovu a postav dům
            tam, kde vydrží.
          </p>
          <ResetButton onClick={reset} />
        </div>
      )}
    </div>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer"
    >
      🔄 Zkusit znovu
    </button>
  );
}
