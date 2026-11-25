// Suara dan musik synth WebAudio — tanpa file audio, tanpa network.
// Semua bunyi dibuat dari osilator dan noise buffer saat dipanggil.

let ctx = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;

// Melodi loop sederhana (nada pentatonik), satu langkah tiap 240 ms.
const MELODY = [523, 587, 659, 784, 880, 784, 659, 587, 523, 0, 659, 784, 0, 659, 587, 0];
const BASS = [131, 131, 165, 196, 196, 165, 131, 98];

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

export function unlockAudio() {
  const c = ensureCtx();
  if (c && c.state === 'suspended') c.resume();
}

function tone(freq, dur, type, vol, when = 0) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noiseBurst(dur, vol, filterFreq) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = c.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(c.destination);
  src.start();
}

// Nama efek yang dipakai world.js / main.js.
export function playSfx(name) {
  if (muted) return;
  switch (name) {
    case 'chop':
      noiseBurst(0.08, 0.5, 1800);
      tone(180, 0.06, 'square', 0.12);
      break;
    case 'sizzle':
      noiseBurst(0.25, 0.18, 4200);
      break;
    case 'ding':
      tone(880, 0.12, 'sine', 0.25);
      tone(1318, 0.2, 'sine', 0.2, 0.1);
      break;
    case 'serve':
      tone(523, 0.12, 'triangle', 0.25);
      tone(659, 0.12, 'triangle', 0.25, 0.1);
      tone(784, 0.25, 'triangle', 0.25, 0.2);
      break;
    case 'fail':
      tone(220, 0.25, 'sawtooth', 0.18);
      tone(165, 0.35, 'sawtooth', 0.18, 0.18);
      break;
    case 'pickup':
      tone(660, 0.07, 'sine', 0.18);
      break;
    case 'place':
      tone(440, 0.07, 'sine', 0.15);
      break;
    case 'burn':
      noiseBurst(0.3, 0.25, 900);
      tone(110, 0.3, 'sawtooth', 0.15);
      break;
    case 'click':
      tone(700, 0.05, 'square', 0.1);
      break;
    default:
      break;
  }
}

export function startMusic() {
  if (musicTimer) return;
  musicTimer = setInterval(() => {
    if (muted) return;
    const note = MELODY[musicStep % MELODY.length];
    if (note) tone(note, 0.22, 'triangle', 0.07);
    if (musicStep % 2 === 0) {
      const bass = BASS[(musicStep / 2) % BASS.length];
      tone(bass, 0.4, 'sine', 0.08);
    }
    musicStep += 1;
  }, 240);
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}
