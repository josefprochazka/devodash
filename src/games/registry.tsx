import type { ComponentType } from "react";
import type { GameKey } from "../types";
import { lazyGame } from "./phaser/lazyGame";

/**
 * Registr her podle klíče z Verse.game. Nová hra = nová komponenta + nový
 * záznam zde, bez zásahu do zbytku appky. Všechny hry běží na Phaseru a
 * načítají se líně (až při otevření verše).
 */
export const gameRegistry: Record<GameKey, ComponentType> = {
  orani: lazyGame(() => import("./OraniGame")),
  most: lazyGame(() => import("./MostGame")),
  stavitel: lazyGame(() => import("./StavitelGame")),
  hodiny: lazyGame(() => import("./HodinyGame")),
};
