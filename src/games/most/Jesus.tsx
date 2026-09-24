interface Props {
  /** paže napřažená dolů/ke straně, nabízí pomoc */
  reaching?: boolean;
  /** letí spolu s dítětem za ruku */
  flying?: boolean;
  size?: number;
}

/**
 * Zjednodušená, uctivá SVG postava – roucho, pás, svatozář; žádný detailní
 * obličej. Viz Dwarf.tsx pro vysvětlení celkového přístupu (žádné externí
 * obrázky, jen SVG tvary + CSS animace).
 */
export function Jesus({ reaching = false, flying = false, size = 64 }: Props) {
  const armOut = reaching || flying;

  return (
    <svg
      viewBox="-10 -16 60 80"
      width={size}
      height={Math.round((size * 80) / 60)}
      className={`jesus ${flying ? "jesus--flying" : ""}`}
      aria-hidden="true"
    >
      <circle className="jesus-halo" cx="20" cy="4" r="13" fill="#fde68a" />

      <path d="M8 60 Q6 30 14 18 L26 18 Q34 30 32 60 Z" fill="#f8fafc" />
      <path
        d="M11 34 L29 42"
        stroke="#a78bfa"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <rect x="9" y="19" width="5" height="15" rx="2.5" fill="#f8fafc" />
      {armOut ? (
        <rect
          x="26"
          y="18"
          width="5"
          height="17"
          rx="2.5"
          fill="#f8fafc"
          transform="rotate(60 28.5 19)"
        />
      ) : (
        <rect x="26" y="19" width="5" height="15" rx="2.5" fill="#f8fafc" />
      )}

      <circle cx="20" cy="8" r="8" fill="#e4b58c" />
      <path
        d="M12 6 Q20 -6 28 6 Q28 14 24 13 Q26 6 20 5 Q14 6 16 13 Q12 14 12 6 Z"
        fill="#3f2d1c"
      />
      <circle cx="17" cy="8" r="1.1" fill="#292524" />
      <circle cx="23" cy="8" r="1.1" fill="#292524" />
    </svg>
  );
}
