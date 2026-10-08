import { useState } from "react";
import { OUTCOME_EVENT, usePhaserGame } from "./phaser/usePhaserGame";
import { GameCanvas, ResultCard } from "./phaser/ui";
import { H, HodinyScene, W } from "./hodiny/HodinyScene";

/**
 * Hra ke Kazateli 3:1–8 – „Boží hodiny a čas pro všechno“.
 *
 * Dítě se učí analogové hodiny (točí velkou i malou ručičkou, vedle vidí
 * digitální čas a slyší ho česky) a u každé části dne objeví, k čemu je
 * podle Kazatele „ten pravý čas“. Celá hra běží v HodinyScene (Phaser);
 * React drží jen nadpis, návod a závěrečnou kartu.
 */
export default function HodinyGame() {
  const [done, setDone] = useState(false);
  const { hostRef, restart } = usePhaserGame({
    scene: HodinyScene,
    width: W,
    height: H,
    background: "#ecfccb",
    onReady: (game) => game.events.on(OUTCOME_EVENT, () => setDone(true)),
  });

  function reset() {
    setDone(false);
    restart("hodiny");
  }

  return (
    <div className="mt-6">
      <h2 className="font-semibold text-stone-700 mb-3">🕰️ Boží hodiny – čas pro všechno</h2>

      <GameCanvas hostRef={hostRef} width={W} height={H} borderClass="border-emerald-800" />

      {!done && (
        <p className="text-sm text-stone-500 mt-2">
          👉 Chyť prstem velkou (žlutou) nebo malou (zelenou) ručičku a toč –
          druhá se pohne s ní. Ťukni na kartičku s časem a uvidíš, na co je
          ten čas. Až budete chtít, zkuste ⭐ úkoly.
        </p>
      )}

      {done && (
        <ResultCard good title="Všechno má svůj čas! ⏰💛" onReset={reset}>
          Bůh má v rukou každý tvůj den i každou hodinu. Neboj se, On ví, co
          v který čas potřebuješ!
          <blockquote className="mt-3 text-sm italic text-amber-900 border-l-4 border-amber-400 pl-3 text-left inline-block">
            „Všechno má svou chvíli, každý záměr pod nebem má svůj čas.“ – Kazatel 3:1
          </blockquote>
        </ResultCard>
      )}
    </div>
  );
}
