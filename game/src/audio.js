// audio.js — all of the game's sounds, synthesized live with WebAudio.
// No sound files are shipped: every effect is a short oscillator or noise
// burst, so the game stays silent until the player first interacts.

let ctx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

// Create the audio context on first use (browsers require a user gesture).
export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch (err) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol, filterFreq) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime;
  const len = Math.floor(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = ac.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
}

// A short click for starting a shift or pressing a button.
export function playClick() {
  tone(700, 0.06, 'square', 0.15, 0, 940);
}

// A soft pop when an ingredient lands on the plate.
export function playPop() {
  tone(520, 0.09, 'sine', 0.25, 0, 880);
}

// A sizzle hiss when something hits the hot stove.
export function playSizzle() {
  noiseBurst(0.35, 0.2, 5200);
}

// A happy two-note ding when a dish is served.
export function playServeDing() {
  tone(660, 0.16, 'triangle', 0.3);
  tone(990, 0.28, 'triangle', 0.3, 0.12);
}

// A low buzz for a wrong serve or a burnt item.
export function playBuzz() {
  tone(160, 0.25, 'sawtooth', 0.18, 0, 110);
}

// A quick tick when an order is about to run out of patience.
export function playTick() {
  tone(1200, 0.05, 'square', 0.12);
}

// A little fanfare when the level (and the rush) rises.
export function playLevelUp() {
  tone(523, 0.12, 'triangle', 0.25);
  tone(659, 0.12, 'triangle', 0.25, 0.1);
  tone(784, 0.22, 'triangle', 0.28, 0.2);
}
