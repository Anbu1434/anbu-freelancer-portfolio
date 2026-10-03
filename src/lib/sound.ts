/**
 * UI sounds, synthesised with Web Audio so there are no files to load. Dry and woody to suit the
 * brutalist look: a "tock" for links and buttons, a lower "thunk" for toggles, a bubbly "pop" for the
 * double-tap tags. Each play is pitched slightly differently so repeats don't sound mechanical.
 */
export type SoundKind = "tap" | "toggle" | "pop";

const STORAGE_KEY = "sound-muted";
const MASTER_VOLUME = 0.35;

let context: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let muted: boolean | null = null;
const listeners = new Set<() => void>();

export function isMuted() {
  if (muted === null) {
    try {
      muted = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      muted = false;
    }
  }
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {}
  listeners.forEach((listener) => listener());
}

export function subscribeMuted(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Created on the first play, which is always inside a user gesture, so browsers allow it. */
function audio() {
  if (!context) {
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(context.destination);

    noise = context.createBuffer(1, Math.round(context.sampleRate * 0.03), context.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (context.state === "suspended") void context.resume();
  return { ctx: context, out: master!, noise: noise! };
}

const vary = (value: number, amount = 0.04) => value * (1 + (Math.random() * 2 - 1) * amount);

/** A pitched body that drops quickly, like a struck block. */
function tone(ctx: AudioContext, out: AudioNode, from: number, to: number, peak: number, decay: number, type: OscillatorType = "sine") {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, now);
  osc.frequency.exponentialRampToValueAtTime(to, now + decay * 0.6);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
  osc.connect(gain).connect(out);
  osc.start(now);
  osc.stop(now + decay + 0.02);
}

/** A very short filtered noise burst: the "contact" at the start of a click. */
function transient(ctx: AudioContext, out: AudioNode, buffer: AudioBuffer, frequency: number, peak: number) {
  const now = ctx.currentTime;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = frequency;
  filter.Q.value = 3;
  gain.gain.setValueAtTime(peak, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
  source.connect(filter).connect(gain).connect(out);
  source.start(now);
}

export function playSound(kind: SoundKind) {
  if (typeof window === "undefined" || isMuted()) return;
  try {
    const { ctx, out, noise } = audio();
    if (kind === "tap") {
      transient(ctx, out, noise, vary(3200), 0.5);
      tone(ctx, out, vary(1250), vary(820), 0.5, 0.06, "triangle");
    } else if (kind === "toggle") {
      transient(ctx, out, noise, vary(1800), 0.4);
      tone(ctx, out, vary(620), vary(380), 0.6, 0.09, "triangle");
    } else {
      tone(ctx, out, vary(380, 0.08), vary(1400, 0.08), 0.55, 0.12);
    }
  } catch {
    // Audio is a nicety; never let it break a click.
  }
}
