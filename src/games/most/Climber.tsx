interface Props {
  /** "climb" = drží se žebříku, "fly" = letí s Ježíšem za ruku */
  pose: "climb" | "fly";
  /** běží animace šplhání (paže/nohy se střídají) – jen pro pose="climb" */
  climbing?: boolean;
  size?: number;
}

/**
 * Ručně kreslená SVG postavička dítěte, viz Dwarf.tsx (src/components/math)
 * pro vysvětlení přístupu. Otáčení paží v ramenním kloubu používá stejnou
 * opravenou techniku jako trpaslíkův krumpáč: transform-box: view-box +
 * pevný bod v souřadnicích kresby (viz index.css), ne fill-box procenta.
 */
export function Climber({ pose, climbing = false, size = 56 }: Props) {
  return (
    <svg
      viewBox="-6 -8 48 66"
      width={size}
      height={Math.round((size * 66) / 48)}
      className={`climber ${pose === "fly" ? "climber--fly" : "climber--climb"} ${
        climbing ? "climber--climbing" : ""
      }`}
      aria-hidden="true"
    >
      {pose === "climb" ? (
        <>
          <g className="climber-leg-left">
            <rect x="12" y="34" width="5" height="13" rx="2.5" fill="#1d4ed8" />
          </g>
          <g className="climber-leg-right">
            <rect x="19" y="34" width="5" height="13" rx="2.5" fill="#1d4ed8" />
          </g>

          <rect x="11" y="20" width="14" height="16" rx="6" fill="#ef4444" />

          {/* paže – obě natažené nahoru, drží se příčky žebříku */}
          <g className="climber-arm-left">
            <rect
              x="4"
              y="5"
              width="5"
              height="17"
              rx="2.5"
              fill="#ef4444"
              transform="rotate(24 11 21)"
            />
          </g>
          <g className="climber-arm-right">
            <rect
              x="27"
              y="5"
              width="5"
              height="17"
              rx="2.5"
              fill="#ef4444"
              transform="rotate(-24 25 21)"
            />
          </g>

          <circle cx="18" cy="13" r="8" fill="#f2c9a0" />
          <path d="M10 10 Q18 -1 26 10 Q18 6 10 10 Z" fill="#5b3a29" />
          <circle cx="15" cy="13" r="1.1" fill="#292524" />
          <circle cx="21" cy="13" r="1.1" fill="#292524" />
        </>
      ) : (
        <>
          {/* let: nohy natažené dozadu, jedna ruka nahoře drží Ježíšovu ruku */}
          <rect
            x="14"
            y="30"
            width="5"
            height="16"
            rx="2.5"
            fill="#1d4ed8"
            transform="rotate(20 16.5 30)"
          />
          <rect
            x="19"
            y="30"
            width="5"
            height="16"
            rx="2.5"
            fill="#1d4ed8"
            transform="rotate(10 21.5 30)"
          />

          <rect
            x="10"
            y="17"
            width="16"
            height="16"
            rx="7"
            fill="#ef4444"
            transform="rotate(-8 18 25)"
          />

          <rect
            x="24"
            y="6"
            width="5"
            height="16"
            rx="2.5"
            fill="#ef4444"
            transform="rotate(-40 26.5 20)"
          />
          <rect
            x="5"
            y="18"
            width="5"
            height="14"
            rx="2.5"
            fill="#ef4444"
            transform="rotate(50 7.5 20)"
          />

          <circle cx="18" cy="11" r="8" fill="#f2c9a0" />
          <path d="M10 8 Q18 -3 26 8 Q18 4 10 8 Z" fill="#5b3a29" />
          <circle cx="15" cy="11" r="1.1" fill="#292524" />
          <circle cx="21" cy="11" r="1.1" fill="#292524" />
        </>
      )}
    </svg>
  );
}
