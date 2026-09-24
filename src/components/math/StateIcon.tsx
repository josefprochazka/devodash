/**
 * Obecná ikona pro přepínač "Stojí" / "V pohybu" – nezávislá na tom, jaký
 * typ postavičky (trpaslík/jablíčko/zvíře) je zrovna vybraný v multiselectu.
 */
export function StateIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 40 40" width={28} height={28} aria-hidden="true">
      <circle cx="20" cy="15" r="7.5" fill="#6366f1" />
      <rect x="13" y="24" width="14" height="11" rx="5" fill="#6366f1" />
      {active && (
        <g stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d="M2 12 Q7 12 9 16" />
          <path d="M1 20 Q7 20 10 23" />
          <path d="M2 28 Q7 28 9 31" />
        </g>
      )}
    </svg>
  );
}
