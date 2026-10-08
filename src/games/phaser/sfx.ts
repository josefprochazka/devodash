/**
 * Jednoduché zvukové efekty syntetizované přes Web Audio API – žádné
 * zvukové soubory (a tedy ani licence k nim) nejsou potřeba. Sdílené všemi
 * Phaser hrami.
 *
 * iPad Safari pustí zvuk až po dotyku uživatele; AudioContext se proto
 * vytváří/probouzí až při prvním volání, které vždy přijde z dotyku.
 */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  delay = 0,
  slideTo?: number,
) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + duration);
}

function noise(
  duration: number,
  filterType: BiquadFilterType,
  cutoff: number,
  volume: number,
  delay = 0,
  cutoffTo?: number,
) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + delay;
  const buffer = a.createBuffer(1, Math.floor(a.sampleRate * duration), a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buffer;
  const filter = a.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(cutoff, t);
  if (cutoffTo) filter.frequency.exponentialRampToValueAtTime(cutoffTo, t + duration);
  const gain = a.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  src.connect(filter).connect(gain).connect(a.destination);
  src.start(t);
}

export const sfx = {
  /** Probudí audio – volat z prvního dotyku. */
  unlock() {
    audio();
  },
  pop() {
    tone(520, 0.12, "triangle", 0.25);
    tone(780, 0.1, "triangle", 0.2, 0.06);
  },
  thunder() {
    noise(1.6, "lowpass", 220, 0.9);
  },
  splash() {
    noise(0.45, "highpass", 900, 0.35);
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, "triangle", 0.22, i * 0.13));
  },
  sad() {
    tone(392, 0.4, "sine", 0.22, 0, 370);
    tone(349, 0.4, "sine", 0.22, 0.4, 330);
    tone(294, 0.8, "sine", 0.22, 0.8, 262);
  },
  /** Krátké škrábnutí pluhu o hlínu. */
  plow() {
    noise(0.14, "bandpass", 700, 0.22);
  },
  /** Chrápání – nádech a výdech. */
  snore() {
    tone(110, 0.7, "sawtooth", 0.05, 0, 80);
    noise(0.7, "lowpass", 400, 0.12);
    tone(150, 0.5, "sine", 0.06, 0.8, 220);
  },
  /** Kručení v břiše. */
  growl() {
    tone(95, 0.35, "sawtooth", 0.08, 0, 70);
    tone(80, 0.45, "sawtooth", 0.08, 0.35, 60);
    tone(110, 0.3, "sawtooth", 0.06, 0.8, 75);
  },
  /** Přechod času – vítr / zašumění. */
  whoosh() {
    noise(1.1, "bandpass", 300, 0.35, 0, 2400);
  },
  /** Krok po příčce, `i` zvyšuje výšku tónu. */
  step(i: number) {
    tone(330 + i * 110, 0.12, "square", 0.08);
  },
  /** Vratký, vrzající žebřík. */
  creak() {
    tone(210, 0.35, "sawtooth", 0.07, 0, 150);
    tone(180, 0.35, "sawtooth", 0.06, 0.3, 130);
  },
  /** Jemné zazvonění. */
  chime() {
    tone(1047, 1.2, "sine", 0.18);
    tone(1568, 1.0, "sine", 0.1, 0.05);
    tone(2093, 0.8, "sine", 0.06, 0.1);
  },
  /** Slavnostní akord – příchod ke světlu. */
  heaven() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 2.4, "sine", 0.1, i * 0.08));
    tone(262, 2.6, "triangle", 0.12);
  },
  /** Ťuknutí na číselné ose – čím větší číslo, tím vyšší tón. */
  tick(n: number) {
    tone(300 * Math.pow(2, n / 12), 0.09, "triangle", 0.18);
  },
  /** Zmizení postavičky. */
  poof() {
    noise(0.2, "highpass", 2000, 0.15);
  },
  /** Přečte text nahlas česky (pokud to zařízení umí). */
  say(text: string) {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "cs-CZ";
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("cs"));
    if (voice) utter.voice = voice;
    utter.rate = 0.9;
    lastUtterance = utter;
    utter.onend = () => {
      if (lastUtterance === utter) lastUtterance = null;
    };
    if (synth.speaking || synth.pending) {
      // Safari zahodí speak() zavolané hned po cancel() – chvilku počkat
      synth.cancel();
      setTimeout(() => synth.speak(utter), 80);
    } else {
      synth.speak(utter);
    }
  },
};

/**
 * Safari na iPadu/iPhonu pustí řeč jen tehdy, když první speak() přijde
 * přímo z dotyku prstem. Hry ale mluví až po animaci (např. když ručička
 * „cvakne“ na místo), tedy mimo dotyk – a to Safari tiše ignoruje. Proto při
 * prvním dotyku kdekoli na stránce řekneme tiché „nic“ a tím řeč odemkneme;
 * pak už funguje i mimo dotyk.
 */
let speechUnlocked = false;
/** Drží odkaz na právě čtenou větu – Safari ji jinak umí uklidit z paměti uprostřed čtení. */
let lastUtterance: SpeechSynthesisUtterance | null = null;

function unlockSpeech() {
  if (speechUnlocked || !window.speechSynthesis) return;
  speechUnlocked = true;
  const silent = new SpeechSynthesisUtterance(" ");
  silent.volume = 0;
  window.speechSynthesis.speak(silent);
  window.speechSynthesis.getVoices(); // načte seznam hlasů dopředu
  for (const type of ["touchend", "click"]) document.removeEventListener(type, unlockSpeech, true);
}

if (typeof document !== "undefined") {
  // touchend/click – právě tyhle události Safari bere jako „uživatel to chtěl“
  for (const type of ["touchend", "click"]) document.addEventListener(type, unlockSpeech, true);
}
