import { Dwarf } from "./Dwarf";
import { Apple } from "./Apple";
import { Animal } from "./Animal";

export type CreatureType = "dwarf" | "apple" | "animal";

interface CreatureProps {
  active: boolean;
  variant: number;
  size: number;
}

/** Volby v multiselectu + jejich vzhled ve scéně. Přidání dalšího typu
 * (např. "bird") = nová komponenta + jeden záznam zde. */
export const CREATURE_OPTIONS: {
  type: CreatureType;
  label: string;
  icon: string;
}[] = [
  { type: "dwarf", label: "Trpaslíci", icon: "🧔" },
  { type: "apple", label: "Jablíčka", icon: "🍎" },
  { type: "animal", label: "Zvířátka", icon: "🐰" },
];

export function Creature({
  type,
  active,
  variant,
  size,
}: CreatureProps & { type: CreatureType }) {
  switch (type) {
    case "apple":
      return <Apple active={active} variant={variant} size={size} />;
    case "animal":
      return <Animal active={active} variant={variant} size={size} />;
    case "dwarf":
    default:
      return <Dwarf active={active} variant={variant} size={size} />;
  }
}
