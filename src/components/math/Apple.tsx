interface Props {
  /** true = list se komíhá ve větru, false = jablíčko je úplně v klidu */
  active: boolean;
  variant?: number;
  size?: number;
}

const VIEW_W = 40;
const VIEW_H = 52;

const APPLE_COLORS = ["#dc2626", "#16a34a", "#f59e0b"];

/** Ručně kreslené SVG jablíčko, viz Dwarf.tsx pro vysvětlení přístupu. */
export function Apple({ active, variant = 0, size = 48 }: Props) {
  const color = APPLE_COLORS[variant % APPLE_COLORS.length];
  const delay = `${(variant % 5) * 0.13}s`;

  return (
    <svg
      viewBox={`0 -6 ${VIEW_W} ${VIEW_H}`}
      width={size}
      height={Math.round((size * VIEW_H) / VIEW_W)}
      className={active ? "creature--active" : "creature--idle"}
      aria-hidden="true"
    >
      <g className="apple-body-group" style={{ animationDelay: delay }}>
        <rect x="18.5" y="0" width="3" height="8" rx="1.2" fill="#6b4226" />
        <path
          d="M20 8 C14 2 4 8 4 20 C4 32 12 42 20 42 C28 42 36 32 36 20 C36 8 26 2 20 8 Z"
          fill={color}
        />
        <ellipse cx="14" cy="16" rx="3.5" ry="5" fill="#ffffff" opacity="0.25" />

        <path
          className="apple-leaf"
          d="M21 3 Q30 -2 28 7 Q21 7 21 3 Z"
          fill="#16a34a"
          style={{ animationDelay: delay }}
        />
      </g>
    </svg>
  );
}
