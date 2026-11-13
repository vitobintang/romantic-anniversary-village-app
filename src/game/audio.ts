// Fully synthesised audio: a gentle music-box lullaby + tiny sound effects.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let timer: ReturnType<typeof setInterval> | null = null;
let nextTime = 0;
let step = 0;

const N = (n: string) => {
  const names: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const m = /^([A-G])(#?)(\d)$/.exec(n)!;
  const semi = names[m[1]] + (m[2] ? 1 : 0) + (parseInt(m[3]) + 1) * 12;
  return 440 * Math.pow(2, (semi - 69) / 12);
};

// 4 chords x 8 eighth-notes, arpeggiated (C - Am - F - G), then a variation
const CHORDS: string[][] = [
  ["C3", "G3", "C4", "E4"],
  ["A2", "E3", "A3", "C4"],
  ["F2", "C3", "F3", "A3"],
  ["G2", "D3", "G3", "B3"],
];
const ARP = [0, 1, 2, 3, 2, 1, 2, 3];
const MELODY: (string | null)[] = [
  "E5", null, "G5", null, "C6", null, "B5", "G5",
  "A5", null, "E5", null, "C5", null, "E5", null,
  "A5", null, "C6", null, "F5", null, "A5", "G5",
  "G5", null, "B5", null, "D6", null, "B5", null,
  "E5", null, "G5", "A5", "C6", null, "E6", null,
  "E6", null, "C6", null, "A5", null, "C6", null,
  "C6", "A5", "F5", null, "A5", null, "C6", null,
  "D6", null, "B5", null, "G5", null, "D5", null,
];

function tone(freq: number, t: number, dur: number, vol: number, type: OscillatorType = "triangle", dest?: AudioNode) {
  if (!ctx || !master) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(dest ?? master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function schedule() {
  if (!ctx) return;
  const eighth = 60 / 76 / 2;
  while (nextTime < ctx.currentTime + 0.4) {
    const bar = Math.floor(step / 8) % 8;
    const chord = CHORDS[bar % 4];
    const i = step % 8;
    tone(N(chord[ARP[i]]), nextTime, 1.1, i === 0 ? 0.11 : 0.06, "triangle");
    if (i === 0) {
      tone(N(chord[0]) / 2, nextTime, 2.4, 0.07, "sine");
      tone(N(chord[2]), nextTime, 3.2, 0.025, "sine");
    }
    const m = MELODY[step % MELODY.length];
    if (m) {
      tone(N(m), nextTime, 1.4, 0.075, "sine");
      tone(N(m) * 2, nextTime, 0.5, 0.018, "sine");
    }
    nextTime += eighth;
    step++;
  }
}

export function startMusic() {
  if (ctx) {
    void ctx.resume();
    return;
  }
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.8;
  master.connect(ctx.destination);
  nextTime = ctx.currentTime + 0.1;
  timer = setInterval(schedule, 120);
  schedule();
}

export function setMuted(m: boolean) {
  muted = m;
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.8, ctx.currentTime, 0.05);
}
export function isMuted() {
  return muted;
}

export function blip(pitch: number) {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  tone(pitch * (0.95 + Math.random() * 0.1), t, 0.07, 0.05, "square");
}

export function chime() {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  [N("C5"), N("E5"), N("G5"), N("C6"), N("E6")].forEach((f, i) => tone(f, t + i * 0.09, 0.9, 0.08, "triangle"));
}

export function pop() {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  tone(660, t, 0.1, 0.07, "sine");
  tone(990, t + 0.06, 0.12, 0.06, "sine");
}

export function sparkleSfx() {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  [N("G6"), N("C7"), N("E7")].forEach((f, i) => tone(f, t + i * 0.06, 0.4, 0.04, "sine"));
}

export function dispose() {
  if (timer) clearInterval(timer);
  timer = null;
  if (ctx) void ctx.close();
  ctx = null;
  master = null;
  step = 0;
}
