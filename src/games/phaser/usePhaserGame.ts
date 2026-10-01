import { useEffect, useRef } from "react";
import * as Phaser from "phaser";

/** Název události, kterou scéna hlásí výsledek hry do Reactu. */
export const OUTCOME_EVENT = "game-outcome";

interface Options {
  scene: Phaser.Types.Scenes.SceneType;
  width: number;
  height: number;
  background: string;
  /** Zavolá se jednou po vytvoření hry – napojení událostí, registry apod. */
  onReady?: (game: Phaser.Game) => void;
}

/**
 * Společný základ všech Phaser her: vytvoří Phaser.Game do `hostRef` divu
 * a při odchodu z hry ho zase zničí. React kolem drží jen nadpis, návod
 * a kartu s výsledkem.
 */
export function usePhaserGame({ scene, width, height, background, onReady }: Options) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width,
      height,
      backgroundColor: background,
      banner: false,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [scene],
    });
    onReady?.(game);
    gameRef.current = game;
    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
    // hra se vytváří jen jednou za život komponenty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Spustí scénu znovu od začátku ("Zkusit znovu"). */
  function restart(sceneKey: string) {
    gameRef.current?.scene.getScene(sceneKey)?.scene.restart();
  }

  return { hostRef, gameRef, restart };
}
