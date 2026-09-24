interface Props {
  /** true = králíček skáče a mává ušima, false = jen sedí */
  active: boolean;
  variant?: number;
  size?: number;
}

const VIEW_W = 44;
const VIEW_H = 58;

const FUR_COLORS = ["#fafaf9", "#a8a29e", "#92400e"];

/** Ručně kreslený SVG králíček, viz Dwarf.tsx pro vysvětlení přístupu. */
export function Animal({ active, variant = 0, size = 48 }: Props) {
  const fur = FUR_COLORS[variant % FUR_COLORS.length];
  const delay = `${(variant % 5) * 0.13}s`;

  return (
    <svg
      viewBox={`0 -8 ${VIEW_W} ${VIEW_H}`}
      width={size}
      height={Math.round((size * VIEW_H) / VIEW_W)}
      className={active ? "creature--active" : "creature--idle"}
      aria-hidden="true"
    >
      <g className="animal-body-group" style={{ animationDelay: delay }}>
        <ellipse cx="15" cy="44" rx="4.5" ry="3" fill={fur} />
        <ellipse cx="29" cy="44" rx="4.5" ry="3" fill={fur} />

        <ellipse cx="22" cy="35" rx="14" ry="11" fill={fur} />
        <circle cx="8" cy="35" r="4" fill={fur} />

        <g
          className="animal-ear-left"
          style={{ animationDelay: delay }}
        >
          <ellipse cx="15" cy="4" rx="3.5" ry="9" fill={fur} />
          <ellipse cx="15" cy="5" rx="1.6" ry="5.5" fill="#fbcfe8" />
        </g>
        <g
          className="animal-ear-right"
          style={{ animationDelay: delay }}
        >
          <ellipse cx="29" cy="4" rx="3.5" ry="9" fill={fur} />
          <ellipse cx="29" cy="5" rx="1.6" ry="5.5" fill="#fbcfe8" />
        </g>

        <circle cx="22" cy="17" r="11" fill={fur} />
        <circle cx="18" cy="16" r="1.4" fill="#292524" />
        <circle cx="26" cy="16" r="1.4" fill="#292524" />
        <circle cx="22" cy="20" r="1.3" fill="#f472b6" />
      </g>
    </svg>
  );
}
