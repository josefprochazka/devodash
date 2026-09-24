import { useEffect, useState } from "react";
import { Climber } from "./most/Climber";
import { Jesus } from "./most/Jesus";

/**
 * Hra k veršu 1. Petrův 3:18 – "žebřík k Bohu".
 *
 * Dítě staví z kostek "dobrých skutků" příčky žebříku. Žebřík má ale
 * pevnou, danou délku (viz LADDER_MAX_PCT) a i se všemi skutky na něj
 * dosáhne jen z části – nahoru ke světlu (Bohu) se tak samo nikdy
 * nedostane. Jediná cesta je poprosit Ježíše: ten dítě vezme za ruku a
 * spolu doletí až nahoru.
 *
 * Stavy hry jdou v jednom směru:
 * INITIAL -> TRY_CLIMBING -> CLIMBING -> STUCK -> JESUS_ARRIVING -> FLYING -> SUCCESS
 *
 * JESUS_ARRIVING je krátká mezifáze: Ježíš nejdřív doletí až k postavičce
 * (ne obráceně), a teprve když jsou spolu, začne fáze FLYING, ve které se
 * oba hýbou jen svisle nahoru – žádné "každý letí bokem jinam".
 */

type Phase =
  | "INITIAL"
  | "TRY_CLIMBING"
  | "CLIMBING"
  | "STUCK"
  | "JESUS_ARRIVING"
  | "FLYING"
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

// Vše v procentech výšky scény.
const GROUND_PCT = 8; // kde stojí postavička na zemi
const RUNG_GAP_PCT = 15; // o kolik % výš je každá příčka
const LADDER_MAX_PCT = GOOD_DEEDS.length * RUNG_GAP_PCT; // pevná délka žebříku – i se všemi skutky nahoru nedosáhne
const JESUS_PCT = 66; // kde se objeví Ježíš (vždy pěkně nad koncem žebříku)
const TOGETHER_LEFT_CHAR = 46; // % zleva – kam postavička poodstoupí, aby byla vedle Ježíše
const TOGETHER_LEFT_JESUS = 58; // % zleva – kde je Ježíš, když spolu drží ruce
const FLY_END_PCT = 92; // kam spolu doletí, těsně ke světlu

const CLIMB_DURATION_MS = 1100;
const ARRIVE_DURATION_MS = 800;
const FLY_DURATION_MS = 1300;

const SPARKLES = [
  { left: 40, bottom: 42, delay: 0 },
  { left: 62, bottom: 58, delay: 0.15 },
  { left: 38, bottom: 72, delay: 0.3 },
  { left: 60, bottom: 84, delay: 0.45 },
];

const STARS = [
  { left: 12, top: 8, delay: 0 },
  { left: 82, top: 14, delay: 0.6 },
  { left: 25, top: 22, delay: 1.1 },
  { left: 70, top: 6, delay: 0.3 },
];

export function MostGame() {
  const [phase, setPhase] = useState<Phase>("INITIAL");
  const [placedDeeds, setPlacedDeeds] = useState<string[]>([]);
  const [wobbling, setWobbling] = useState(false);

  function placeDeed(id: string) {
    if (phase !== "INITIAL" && phase !== "TRY_CLIMBING") return;
    if (placedDeeds.includes(id)) return;
    setPlacedDeeds((prev) => [...prev, id]);
    if (phase === "INITIAL") setPhase("TRY_CLIMBING");
  }

  function startClimbing() {
    setPhase("CLIMBING");
  }

  // Postavička leze nahoru po postavených příčkách...
  useEffect(() => {
    if (phase !== "CLIMBING") return;
    const t = window.setTimeout(() => setPhase("STUCK"), CLIMB_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  // ...dojde na konec žebříku, ten se zakymácí a dál to nejde.
  useEffect(() => {
    if (phase !== "STUCK") return;
    setWobbling(true);
    const t = window.setTimeout(() => setWobbling(false), 1000);
    return () => window.clearTimeout(t);
  }, [phase]);

  function askJesus() {
    if (phase !== "STUCK") return;
    setPhase("JESUS_ARRIVING");
  }

  // Ježíš nejdřív doletí k postavičce a chytí ji za ruku...
  useEffect(() => {
    if (phase !== "JESUS_ARRIVING") return;
    const t = window.setTimeout(() => setPhase("FLYING"), ARRIVE_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  // ...a teprve pak letí oba spolu, jen svisle nahoru, rovně ke světlu.
  useEffect(() => {
    if (phase !== "FLYING") return;
    const t = window.setTimeout(() => setPhase("SUCCESS"), FLY_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  function reset() {
    setPhase("INITIAL");
    setPlacedDeeds([]);
    setWobbling(false);
  }

  const stuckPct = GROUND_PCT + placedDeeds.length * RUNG_GAP_PCT;
  const flying = phase === "FLYING" || phase === "SUCCESS";
  const together = flying || phase === "JESUS_ARRIVING";

  // Postavička: leze nahoru po žebříku, pak (jakmile je Ježíš vedle ní)
  // poodstoupí kousek stranou, ať jsou vedle sebe – a od té chvíle se hýbe
  // už jen svisle vzhůru, žádné další stranění.
  const charBottomPct = flying
    ? FLY_END_PCT
    : phase === "CLIMBING" || phase === "STUCK" || phase === "JESUS_ARRIVING"
      ? stuckPct
      : GROUND_PCT;
  const charLeftPct = together ? TOGETHER_LEFT_CHAR : 50;
  const charTransitionMs =
    phase === "FLYING"
      ? FLY_DURATION_MS
      : phase === "JESUS_ARRIVING"
        ? ARRIVE_DURATION_MS
        : CLIMB_DURATION_MS;

  // Ježíš: čeká stranou, pak DOLETÍ k postavičce (JESUS_ARRIVING) a teprve
  // s ní spojenýma rukama stoupá rovně nahoru (FLYING) – ne opačně.
  const showJesus =
    phase === "STUCK" || phase === "JESUS_ARRIVING" || phase === "FLYING";
  const jesusBottomPct = flying
    ? FLY_END_PCT + 4
    : phase === "JESUS_ARRIVING"
      ? stuckPct + 6
      : JESUS_PCT;
  const jesusLeftPct = together ? TOGETHER_LEFT_JESUS : 78;
  const jesusTransitionMs = phase === "FLYING" ? FLY_DURATION_MS : ARRIVE_DURATION_MS;

  return (
    <div className="mt-6">
      {phase !== "SUCCESS" && (
        <h2 className="font-semibold text-stone-700 mb-3">
          🪜 Vylez po žebříku k Bohu
        </h2>
      )}

      {phase !== "SUCCESS" && (
        <>
          <div className="relative h-[32rem] rounded-xl overflow-hidden border-4 border-emerald-800 bg-gradient-to-t from-emerald-950 via-sky-400 to-amber-200">
            {/* nebe: záře, hvězdy, mraky */}
            <div className="absolute inset-x-0 top-0 h-2/5 overflow-hidden pointer-events-none">
              <div className="most-glow absolute left-1/2 top-4 -translate-x-1/2 w-28 h-28 rounded-full bg-amber-200/70 blur-xl" />
              {STARS.map((s, i) => (
                <span
                  key={i}
                  className="most-star absolute text-white text-sm"
                  style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s` }}
                >
                  ✦
                </span>
              ))}
              <div
                className="most-cloud absolute top-8 w-16 h-6 bg-white/70 rounded-full"
                style={{ animationDelay: "-2s" }}
              />
              <div
                className="most-cloud absolute top-20 w-20 h-7 bg-white/55 rounded-full"
                style={{ animationDelay: "-14s" }}
              />
            </div>

            {/* země */}
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-emerald-950" />

            {/* žebřík – pevná, vždy krátká délka */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 bottom-10 w-12 ${
                wobbling ? "most-ladder--wobbling" : ""
              }`}
              style={{ height: `${LADDER_MAX_PCT}%` }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-800 rounded-full" />
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-amber-800 rounded-full" />

              {placedDeeds.map((id, i) => {
                const deed = GOOD_DEEDS.find((d) => d.id === id)!;
                return (
                  <div
                    key={id}
                    className="animate-plow-pop absolute left-0 right-0 flex flex-col items-center"
                    style={{ bottom: `${((i + 1) / GOOD_DEEDS.length) * 100}%` }}
                  >
                    <span className="text-2xl -mb-1.5 drop-shadow">{deed.icon}</span>
                    <span className="w-full h-2.5 bg-amber-700 rounded-full border-b-2 border-amber-900" />
                  </div>
                );
              })}
            </div>

            {/* třpytky během příletu a letu */}
            {(phase === "JESUS_ARRIVING" || phase === "FLYING") &&
              SPARKLES.map((s, i) => (
                <span
                  key={i}
                  className="most-sparkle absolute text-amber-200 text-lg pointer-events-none"
                  style={{ left: `${s.left}%`, bottom: `${s.bottom}%`, animationDelay: `${s.delay}s` }}
                >
                  ✨
                </span>
              ))}

            {/* záblesk světla na konci letu */}
            {phase === "FLYING" && (
              <div
                className="most-flash absolute left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-amber-100 pointer-events-none"
                style={{ bottom: `${FLY_END_PCT - 6}%`, animationDelay: `${FLY_DURATION_MS * 0.55}ms` }}
              />
            )}

            {/* Ježíš */}
            {showJesus && (
              <div
                className="absolute -translate-x-1/2 transition-[left,bottom] ease-in-out"
                style={{
                  left: `${jesusLeftPct}%`,
                  bottom: `${jesusBottomPct}%`,
                  transitionDuration: `${jesusTransitionMs}ms`,
                }}
              >
                <button
                  type="button"
                  onClick={askJesus}
                  disabled={phase !== "STUCK"}
                  aria-label="Ježíš – klepnutím ho poprosíš o pomoc"
                  className="bg-transparent border-0 p-0 cursor-pointer disabled:cursor-default"
                >
                  <Jesus reaching={phase !== "FLYING"} flying={phase === "FLYING"} size={72} />
                </button>
              </div>
            )}

            {/* postavička */}
            <div
              className="absolute -translate-x-1/2 transition-[left,bottom] ease-in-out"
              style={{
                left: `${charLeftPct}%`,
                bottom: `${charBottomPct}%`,
                transitionDuration: `${charTransitionMs}ms`,
              }}
            >
              <Climber
                pose={flying ? "fly" : "climb"}
                climbing={phase === "CLIMBING"}
                size={64}
              />
            </div>
          </div>

          {/* ovládání pod scénou, podle fáze */}
          {(phase === "INITIAL" || phase === "TRY_CLIMBING") && (
            <div className="mt-4">
              <p className="text-sm text-stone-600 mb-2">
                👉 Klepni na dobré skutky – postavička z nich staví příčky
                žebříku.
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

              {phase === "TRY_CLIMBING" && (
                <button
                  type="button"
                  onClick={startClimbing}
                  className="mt-3 px-4 py-2 rounded-full bg-stone-600 hover:bg-stone-700 text-white font-semibold cursor-pointer"
                >
                  Zkusit vylézt nahoru →
                </button>
              )}
            </div>
          )}

          {phase === "CLIMBING" && (
            <p className="text-sm text-stone-500 mt-3 text-center">
              Postavička leze po žebříku nahoru…
            </p>
          )}

          {phase === "STUCK" && (
            <div className="mt-4 rounded-xl bg-stone-100 border-2 border-stone-300 p-4 text-center">
              <p className="text-stone-700 mb-1">
                Žebřík z dobrých skutků je pořád moc krátký – sama se
                postavička ke světlu nedostane.
              </p>
              <p className="text-stone-500 text-sm">
                Klepni na Ježíše – vezme tě za ruku. 👆
              </p>
            </div>
          )}

          {phase === "JESUS_ARRIVING" && (
            <p className="text-sm text-stone-500 mt-3 text-center">
              Ježíš přilétá pro postavičku…
            </p>
          )}

          {phase === "FLYING" && (
            <p className="text-sm text-stone-500 mt-3 text-center">
              Drží se za ruce a letí spolu rovnou nahoru k Bohu…
            </p>
          )}
        </>
      )}

      {phase === "SUCCESS" && (
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
            Ježíš mě vzal za ruku a donesl mě k Bohu!
          </p>
          <p className="text-stone-700">
            Postavička se po vlastním žebříku nahoru nedostala – ale Ježíš ji
            vzal za ruku a doletěl s ní až k Bohu.
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
