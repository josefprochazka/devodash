import { useEffect, useState } from "react";

/**
 * Hra k veršu 1. Petrův 3:18 – "most k Bohu".
 *
 * Princip: dítě zkouší postavit most přes propast (hřích) z kostek
 * "dobrých skutků". Most je záměrně vždy kratší než propast (viz
 * BLOCK_WIDTH_PCT * GOOD_DEEDS.length < CHASM_WIDTH_PCT níže), takže se
 * tudy nikdy nedá přejít – to je cílová pointa verše, ne bug. Jediná cesta
 * přes propast je kříž, který se po kliknutí na "Poprosit Ježíše o pomoc"
 * postaví najednou přes celou šířku.
 *
 * Stavy hry (viz typ Phase) jdou přesně v jednom směru:
 * INITIAL -> TRY_BUILDING -> FAILED_SKUTKY -> JESUS_CROSS -> SUCCESS
 */

type Phase =
  | "INITIAL"
  | "TRY_BUILDING"
  | "FAILED_SKUTKY"
  | "JESUS_CROSS"
  | "SUCCESS";

interface Deed {
  id: string;
  label: string;
  icon: string;
}

const GOOD_DEEDS: Deed[] = [
  { id: "pomoc", label: "Pomoc druhým", icon: "🤝" },
  { id: "poslusnost", label: "Poslušnost", icon: "🙇" },
  { id: "cirkev", label: "Chodit do církve", icon: "⛪" },
];

// Rozměry scény v procentech šířky. Skutky se pokládají uvnitř propasti a
// dohromady vždy pokryjí jen 45 % (3 × 15 %) – most tedy nikdy nedosáhne na
// druhou stranu, ať dítě použije kostek kolik chce.
const BANK_WIDTH_PCT = 20; // šířka každého břehu
const BLOCK_WIDTH_PCT = 15; // kolik % propasti zabere jeden skutek

// Pozice postavičky (vzhledem k celé scéně) na startu a v cíli.
const CHAR_LEFT_START = 11;
const CHAR_LEFT_END = 86;
const WALK_DURATION_MS = 1300;
const CROSS_GROW_MS = 1100;

export function MostGame() {
  const [phase, setPhase] = useState<Phase>("INITIAL");
  const [placedDeeds, setPlacedDeeds] = useState<string[]>([]);
  const [shaking, setShaking] = useState(false);
  const [crossBuilt, setCrossBuilt] = useState(false);
  const [arrived, setArrived] = useState(false);

  function placeDeed(id: string) {
    if (phase !== "INITIAL" && phase !== "TRY_BUILDING") return;
    if (placedDeeds.includes(id)) return;
    setPlacedDeeds((prev) => [...prev, id]);
    if (phase === "INITIAL") setPhase("TRY_BUILDING");
  }

  function tryCrossing() {
    setShaking(true);
    window.setTimeout(() => {
      setShaking(false);
      setPhase("FAILED_SKUTKY");
    }, 500);
  }

  function askJesus() {
    setPhase("JESUS_CROSS");
  }

  // Kříž vyroste přes celou propast, pak se postavička rozejde na druhou
  // stranu a nakonec (až dojde) se ukáže závěrečná oslava.
  useEffect(() => {
    if (phase !== "JESUS_CROSS") return;
    const growTimer = window.setTimeout(() => setCrossBuilt(true), 50);
    const successTimer = window.setTimeout(
      () => setPhase("SUCCESS"),
      CROSS_GROW_MS,
    );
    return () => {
      window.clearTimeout(growTimer);
      window.clearTimeout(successTimer);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "SUCCESS") return;
    const arriveTimer = window.setTimeout(
      () => setArrived(true),
      WALK_DURATION_MS,
    );
    return () => window.clearTimeout(arriveTimer);
  }, [phase]);

  function reset() {
    setPhase("INITIAL");
    setPlacedDeeds([]);
    setShaking(false);
    setCrossBuilt(false);
    setArrived(false);
  }

  const charLeft = phase === "SUCCESS" ? CHAR_LEFT_END : CHAR_LEFT_START;
  const allDeedsUsed = placedDeeds.length === GOOD_DEEDS.length;

  return (
    <div className="mt-6">
      {!arrived && (
        <h2 className="font-semibold text-stone-700 mb-3">
          🌉 Postav most k Bohu
        </h2>
      )}

      {!arrived && (
        <>
          <div className="relative h-56 bg-gradient-to-b from-sky-200 to-sky-100 rounded-xl overflow-hidden border-4 border-emerald-800">
            {/* země / propast / cíl vedle sebe, vždy přesně 20 % – 60 % – 20 % */}
            <div className="absolute bottom-0 left-0 right-0 h-20 flex">
              <div className="h-full bg-emerald-700" style={{ width: `${BANK_WIDTH_PCT}%` }} />

              <div className="relative h-full bg-gradient-to-b from-stone-800 to-stone-950 flex-1">
                {/* kostky dobrých skutků */}
                {phase !== "JESUS_CROSS" &&
                  !crossBuilt &&
                  placedDeeds.map((id, i) => {
                    const deed = GOOD_DEEDS.find((d) => d.id === id)!;
                    return (
                      <div
                        key={id}
                        className={`absolute bottom-0 h-20 flex flex-col items-center justify-end pb-2 ${
                          shaking ? "animate-[wobble-shake_0.4s_ease-in-out]" : ""
                        }`}
                        style={{ left: `${i * BLOCK_WIDTH_PCT}%`, width: `${BLOCK_WIDTH_PCT}%` }}
                      >
                        <span className="text-lg leading-none">{deed.icon}</span>
                        <span className="w-full h-3 bg-amber-800 border-t-2 border-amber-900 rounded-sm mt-1" />
                      </div>
                    );
                  })}

                {/* kříž jako dokonalý most přes celou propast */}
                <div
                  className="absolute bottom-0 left-0 h-3 bg-amber-100 border-t-2 border-amber-300 transition-[width] ease-out"
                  style={{
                    width: crossBuilt ? "100%" : "0%",
                    transitionDuration: `${CROSS_GROW_MS}ms`,
                  }}
                />
                {crossBuilt && (
                  <div className="absolute left-1/2 bottom-6 -translate-x-1/2 text-3xl animate-bounce">
                    ✝️
                  </div>
                )}
              </div>

              <div
                className="h-full bg-amber-100 flex flex-col items-center justify-center gap-1"
                style={{ width: `${BANK_WIDTH_PCT}%` }}
              >
                <div className="w-9 h-9 rounded-full bg-amber-300 animate-pulse shadow-[0_0_16px_6px_rgba(252,211,77,0.55)]" />
                <span className="text-[11px] font-bold text-amber-700">Bůh</span>
              </div>
            </div>

            {/* postavička */}
            <div
              className="absolute bottom-20 text-4xl -translate-x-1/2 transition-[left] ease-in-out"
              style={{ left: `${charLeft}%`, transitionDuration: `${WALK_DURATION_MS}ms` }}
            >
              🧑
            </div>
          </div>

          {/* ovládání pod scénou, podle fáze */}
          {(phase === "INITIAL" || phase === "TRY_BUILDING") && (
            <div className="mt-4">
              <p className="text-sm text-stone-600 mb-2">
                👉 Klepni na dobré skutky – postavička je pokládá jako most
                přes propast.
              </p>
              <div className="flex flex-wrap gap-2">
                {GOOD_DEEDS.map((deed) => {
                  const used = placedDeeds.includes(deed.id);
                  return (
                    <button
                      key={deed.id}
                      type="button"
                      disabled={used}
                      onClick={() => placeDeed(deed.id)}
                      className={`px-3 py-2 rounded-xl border-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                        used
                          ? "opacity-40 border-stone-200 bg-stone-50 cursor-default"
                          : "border-emerald-300 bg-white hover:bg-emerald-50 cursor-pointer"
                      }`}
                    >
                      <span className="text-lg">{deed.icon}</span>
                      {deed.label}
                    </button>
                  );
                })}
              </div>

              {placedDeeds.length > 0 && (
                <button
                  type="button"
                  onClick={tryCrossing}
                  className="mt-3 px-4 py-2 rounded-full bg-stone-600 hover:bg-stone-700 text-white font-semibold cursor-pointer"
                >
                  {allDeedsUsed
                    ? "Zkusit po mostě přejít →"
                    : "Zkusit už teď přejít →"}
                </button>
              )}
            </div>
          )}

          {phase === "FAILED_SKUTKY" && (
            <div className="mt-4 rounded-xl bg-stone-100 border-2 border-stone-300 p-4 text-center">
              <p className="text-stone-700 mb-3">
                Most z dobrých skutků je pořád moc krátký – vlastní snaha
                nestačí na to, dostat se přes propast hříchu až k Bohu.
              </p>
              <button
                type="button"
                onClick={askJesus}
                className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold cursor-pointer animate-pulse"
              >
                🙏 Poprosit Ježíše o pomoc
              </button>
            </div>
          )}

          {phase === "JESUS_CROSS" && (
            <p className="text-sm text-stone-500 mt-3 text-center">
              Ježíš staví most – svůj kříž – přes celou propast…
            </p>
          )}

          {phase === "SUCCESS" && !arrived && (
            <p className="text-sm text-stone-500 mt-3 text-center">
              Postavička přechází po kříži na druhou stranu…
            </p>
          )}
        </>
      )}

      {arrived && (
        <div className="rounded-xl bg-gradient-to-b from-amber-100 to-amber-50 border-2 border-amber-400 p-6 text-center">
          <div className="text-3xl mb-1">
            <span className="inline-block animate-bounce">✝️</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: "150ms" }}>
              ✨
            </span>
            <span className="inline-block animate-bounce" style={{ animationDelay: "300ms" }}>
              🎉
            </span>
          </div>
          <div className="text-5xl mb-2">
            <span className="inline-block animate-bounce">🧑</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: "150ms" }}>
              😄
            </span>
          </div>
          <p className="text-lg font-semibold text-amber-800 mb-2">
            Ježíš mě dovedl k Bohu!
          </p>
          <p className="text-stone-700">
            Postavička se sama přes propast nedostala – ale Ježíšův kříž je
            dokonalý most, po kterém přešla bezpečně až k Bohu.
          </p>
          <blockquote className="mt-3 text-sm italic text-amber-900 border-l-4 border-amber-400 pl-3 text-left inline-block">
            „...aby vás přivedl k Bohu.“ – 1. Petrův 3:18
          </blockquote>
          <div>
            <button
              type="button"
              onClick={reset}
              className="mt-4 px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer"
            >
              🔄 Zkusit znovu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
