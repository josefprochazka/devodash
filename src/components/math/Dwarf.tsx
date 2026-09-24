interface Props {
  /** true = trpaslík kope (animovaný), false = jen stojí */
  active: boolean;
  /** mění barvu čepice/košile a fázi animace, ať trpaslíci nejsou identičtí */
  variant?: number;
  /** šířka v px, výška se dopočítá podle poměru stran kresby */
  size?: number;
}

const VIEW_W = 46;
const VIEW_H = 68;

const HAT_COLORS = ["#dc2626", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#db2777"];
const SHIRT_COLORS = ["#7c2d12", "#1e3a8a", "#14532d", "#78350f", "#4c1d95", "#831843"];

/**
 * Ručně kreslená SVG postavička trpaslíka + CSS animace (viz src/index.css,
 * třídy .dwarf--idle / .dwarf--active). Žádné externí obrázky ani sprite
 * soubory – jen SVG tvary a keyframes, takže se dá libovolně obarvit a
 * animovat přímo v kódu.
 */
export function Dwarf({ active, variant = 0, size = 48 }: Props) {
  const hat = HAT_COLORS[variant % HAT_COLORS.length];
  const shirt = SHIRT_COLORS[variant % SHIRT_COLORS.length];
  const delay = `${(variant % 5) * 0.13}s`;

  return (
    <svg
      viewBox={`0 -8 ${VIEW_W} ${VIEW_H}`}
      width={size}
      height={Math.round((size * VIEW_H) / VIEW_W)}
      className={active ? "creature--active" : "creature--idle"}
      aria-hidden="true"
    >
      <g className="dwarf-legs">
        <rect
          className="dwarf-leg-left"
          x="10"
          y="44"
          width="7"
          height="14"
          rx="3"
          fill="#3f2d1c"
          style={{ animationDelay: delay }}
        />
        <rect
          className="dwarf-leg-right"
          x="23"
          y="44"
          width="7"
          height="14"
          rx="3"
          fill="#3f2d1c"
          style={{ animationDelay: delay }}
        />
      </g>

      <g className="dwarf-body-group" style={{ animationDelay: delay }}>
        <rect x="7" y="27" width="26" height="19" rx="9" fill={shirt} />
        <rect x="7" y="39" width="26" height="4" fill="#2a1c10" />
        <rect x="2" y="28" width="7" height="15" rx="3" fill={shirt} />

        <circle cx="20" cy="19" r="10" fill="#f0bd8e" />
        <path d="M10 19 Q20 35 30 19 L28 24 Q20 30 12 24 Z" fill="#f5f5f4" />
        <polygon points="9,11 20,-6 31,11" fill={hat} />
        <circle cx="20" cy="-6" r="2.5" fill={hat} />

        <g
          className="dwarf-arm-right"
          style={{ animationDelay: delay }}
        >
          <rect x="28" y="28" width="7" height="15" rx="3" fill={shirt} />
          {active && (
            <g className="dwarf-pickaxe">
              <rect x="33" y="14" width="2.5" height="18" rx="1" fill="#8a5a2b" />
              <polygon points="27,12 41,12 34,6" fill="#a8a29e" />
              <polygon
                className="dwarf-spark"
                points="41,7 43.5,10.5 41,14 38.5,10.5"
                fill="#fde68a"
                style={{ animationDelay: delay }}
              />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}
