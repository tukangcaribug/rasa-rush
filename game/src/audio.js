// RASA RUSH — synthesizer WebAudio tanpa aset.
// Ditulis ulang dari spesifikasi, tanpa melihat file lama.
// AudioContext dibuat malas (hanya setelah unlockAudio / gestur pengguna).
// Semua fungsi aman bila audio belum tersedia; tanpa window di level atas.

let ctx = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;

function audioContext() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try { ctx = new AC(); } catch (e) { ctx = null; }
  }
  return ctx;
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  if (ctx && ctx.destination) {
    try { ctx.destination.gain && null; } catch (e) { /* abaikan */ }
  }
  return muted;
}

export function unlockAudio() {
  const ac = audioContext();
  if (!ac) return false;
  if (ac.state === 'suspended') {
    ac.resume().catch(() => {});
  }
  return true;
}

// Satu nada oscillator pendek.
function tone(freq, dur, type, vol, delay, slideTo) {
  const ac = audioContext();
  if (!ac || muted) return;
  const t0 = ac.currentTime + (delay || 0);
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol || 0.18, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// Desis noise pendek (untuk sizzle / chop).
function noise(dur, vol, delay, filterFreq) {
  const ac = audioContext();
  if (!ac || muted) return;
  const t0 = ac.currentTime + (delay || 0);
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq || 4000;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol || 0.12, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  src.start(t0);
}

const SFX = {
  click() { tone(660, 0.07, 'square', 0.10); },
  ding() { tone(880, 0.18, 'sine', 0.18); tone(1320, 0.25, 'sine', 0.12, 0.07); },
  serve() { tone(523, 0.12, 'triangle', 0.18); tone(659, 0.12, 'triangle', 0.18, 0.09); tone(784, 0.22, 'triangle', 0.2, 0.18); },
  fail() { tone(330, 0.2, 'sawtooth', 0.14, 0, 220); tone(220, 0.3, 'sawtooth', 0.12, 0.14, 147); },
  buy() { tone(784, 0.1, 'square', 0.12); tone(988, 0.14, 'square', 0.12, 0.08); tone(1175, 0.2, 'square', 0.1, 0.16); },
  vip() { tone(1047, 0.12, 'sine', 0.16); tone(1319, 0.12, 'sine', 0.16, 0.09); tone(1568, 0.3, 'sine', 0.16, 0.18); },
  chop() { noise(0.09, 0.2, 0, 1800); tone(180, 0.08, 'square', 0.1); },
  sizzle() { noise(0.35, 0.1, 0, 5200); },
  pickup() { tone(440, 0.08, 'triangle', 0.14, 0, 660); },
  place() { tone(330, 0.09, 'triangle', 0.14, 0, 220); },
  burn() { tone(196, 0.25, 'sawtooth', 0.16, 0, 98); noise(0.3, 0.1, 0.05, 900); },
};

export function playSfx(name) {
  if (muted) return;
  const fn = SFX[name];
  if (fn) {
    try { fn(); } catch (e) { /* audio opsional — jangan jatuhkan game */ }
  } else {
    // Efek tak dikenal: bunyi netral pendek.
    try { tone(520, 0.08, 'sine', 0.1); } catch (e) { /* abaikan */ }
  }
}

// Loop musik sederhana: bassline + melodi ringan, dijadwalkan per langkah.
const BASS = [131, 131, 175, 196, 131, 131, 220, 196];
const MELODY = [523, 659, 784, 659, 587, 698, 880, 784, 523, 659, 784, 880, 784, 659, 587, 523];
const STEP_MS = 300;

export function startMusic() {
  if (musicTimer) return true;
  if (!unlockAudio()) return false;
  musicTimer = setInterval(() => {
    if (muted) { musicStep++; return; }
    const i = musicStep % 8;
    const m = musicStep % 16;
    try {
      tone(BASS[i], 0.26, 'triangle', 0.11);
      if (musicStep % 2 === 0) tone(MELODY[m], 0.22, 'sine', 0.08);
    } catch (e) { /* abaikan */ }
    musicStep++;
  }, STEP_MS);
  return true;
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  musicStep = 0;
  return true;
}
