// Night Ledger — tiny WebAudio synth: footsteps, pebble clicks, alarm stings.
// No audio files; everything is generated. Starts on first user gesture.
let ctx = null;
let muted = false;
let lastStepAt = 0;

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
}

export function toggleMute() { muted = !muted; return muted; }
export function isMuted() { return muted; }

function blip(freq, dur, type, gain, slideTo) {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t); osc.stop(t + dur);
}

export function playFootstep(sneaking) {
  if (!ctx || muted) return;
  const now = performance.now();
  if (now - lastStepAt < (sneaking ? 340 : 220)) return;
  lastStepAt = now;
  blip(sneaking ? 90 : 120, 0.07, 'sine', sneaking ? 0.02 : 0.05, 60);
}

export function playPebble() { blip(1400, 0.06, 'square', 0.05, 700); setTimeout(() => blip(900, 0.08, 'square', 0.04, 500), 90); }
export function playPickup() { blip(660, 0.09, 'triangle', 0.08); setTimeout(() => blip(990, 0.12, 'triangle', 0.08), 80); }
export function playCoin() { blip(1180, 0.07, 'square', 0.05); setTimeout(() => blip(1560, 0.1, 'square', 0.05), 60); }
export function playSuspicious() { blip(520, 0.12, 'sawtooth', 0.04, 640); }
export function playAlarm() { blip(880, 0.16, 'sawtooth', 0.09, 440); setTimeout(() => blip(880, 0.16, 'sawtooth', 0.09, 440), 180); }
export function playCaught() { blip(300, 0.4, 'sawtooth', 0.1, 90); }
export function playWin() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.16, 'triangle', 0.08), i * 110)); }
export function playLevelClear() { [440, 554, 659].forEach((f, i) => setTimeout(() => blip(f, 0.14, 'triangle', 0.07), i * 100)); }
