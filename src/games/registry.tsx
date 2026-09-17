import type { ComponentType } from "react";
import type { GameKey } from "../types";
import { OraniGame } from "./OraniGame";

/**
 * Registr her podle klíče z Verse.game. Nová hra = nová komponenta + nový
 * záznam zde, bez zásahu do zbytku appky.
 */
export const gameRegistry: Record<GameKey, ComponentType> = {
  orani: OraniGame,
};
