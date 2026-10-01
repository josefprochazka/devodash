import type { ComponentType } from "react";
import type { GameKey } from "../types";
import { OraniGame } from "./OraniGame";
import { MostGame } from "./MostGame";
import { StavitelGameLoader } from "./StavitelGameLoader";

/**
 * Registr her podle klíče z Verse.game. Nová hra = nová komponenta + nový
 * záznam zde, bez zásahu do zbytku appky.
 */
export const gameRegistry: Record<GameKey, ComponentType> = {
  orani: OraniGame,
  most: MostGame,
  stavitel: StavitelGameLoader,
};
