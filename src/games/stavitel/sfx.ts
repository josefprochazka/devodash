/**
 * Jednoduché zvukové efekty syntetizované přes Web Audio API – žádné
 * zvukové soubory (a tedy ani licence k nim) nejsou potřeba.
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
) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const buffer = a.createBuffer(1, Math.floor(a.sampleRate * duration), a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buffer;
  const filter = a.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = cutoff;
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
};
