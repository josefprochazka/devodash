import { useEffect } from "react";
import { usePhaserGame } from "../phaser/usePhaserGame";
import { GameCanvas } from "../phaser/ui";
import { H, MathScene, W } from "./MathScene";
import type { CreatureType } from "./options";

/**
 * Plátno s jeskyní a číselnou osou (Phaser). Volby z Reactu (typy
 * postaviček, stojí / v pohybu) předává scéně přes `game.registry`.
 */
export default function MathCave({ types, active }: { types: CreatureType[]; active: boolean }) {
  const { hostRef, gameRef } = usePhaserGame({
    scene: MathScene,
    width: W,
    height: H,
    background: "#e0f2fe",
  });

  useEffect(() => {
    gameRef.current?.registry.set("types", types);
  }, [types, gameRef]);

  useEffect(() => {
    gameRef.current?.registry.set("active", active);
  }, [active, gameRef]);

  return <GameCanvas hostRef={hostRef} width={W} height={H} borderClass="border-stone-800" />;
}
