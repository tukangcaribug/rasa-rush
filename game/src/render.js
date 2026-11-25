// RASA RUSH — renderer (ditulis ulang dari spesifikasi, tanpa melihat file lama).
// Semua gambar di canvas 2D 1280x720, palet dapur hangat.
import {
  STATIONS, INGREDIENTS, RECIPES, DIFFICULTIES, DIFFICULTY_ORDER,
  UPGRADES, UPGRADE_ORDER, FLOOR, VIEW, stationById, upgradeCost,
} from './config.js';

export { SHIFT_SECONDS } from './config.js';

// ---- Konstanta layar (nilainya kata-kata itu sendiri) ----
export const SCREEN_TITLE = 'title';
export const SCREEN_DIFFICULTY = 'difficulty';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_UPGRADE = 'upgrade';
export const SCREEN_SCORES = 'scores';
export const SCREEN_OVER = 'over';

const W = VIEW.width;
const H = VIEW.height;

// ---- Palet ----
const C = {
  bg: '#f7ead7', floor: '#e8d3ae', floorLine: '#d9bf8f',
  panel: '#fff8ec', panelEdge: '#d8b98a', ink: '#4a3226', muted: '#8a6d55',
  accent: '#e8590c', accentDark: '#c2410c', red: '#d62828', gold: '#f2b705',
  green: '#2f9e44', cream: '#fff3d6', shadow: 'rgba(74,50,38,0.18)',
};

// ---- Util gambar ----
function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}
function fillRR(ctx, x, y, w, h, r, color) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}
function strokeRR(ctx, x, y, w, h, r, color, lw) {
  rr(ctx, x, y, w, h, r);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw || 2;
  ctx.stroke();
}
function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color || C.ink;
  ctx.font = (weight || 'bold') + ' ' + size + 'px system-ui, sans-serif';
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(str), x, y);
}
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function fmtTime(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
}
function stageLabel(stage) {
  if (stage === 'chopped') return 'potong';
  if (stage === 'cooked') return 'masak';
  if (stage === 'plate') return 'piring';
  return 'mentah';
}
function safeState(state) {
  const s = state || {};
  return {
    seed: s.seed || 0, time: s.time || 0,
    timeLeft: (s.timeLeft === undefined || s.timeLeft === null) ? 180 : s.timeLeft,
    score: s.score || 0, coins: s.coins || 0, combo: s.combo || 0,
    bestCombo: s.bestCombo || 0, stars: (s.stars === undefined ? 3 : s.stars),
    served: s.served || 0, failed: s.failed || 0, missed: s.missed || 0,
    burned: s.burned || 0, vipServed: s.vipServed || 0,
    orders: Array.isArray(s.orders) ? s.orders : [],
    player: s.player || { x: 640, y: 560, hand: null },
    board: s.board || { item: null, progress: 0, time: 0, done: false },
    stove: Array.isArray(s.stove) ? s.stove : [],
    assembly: Array.isArray(s.assembly) ? s.assembly : [],
    dish: s.dish || null, message: s.message || '', messageT: s.messageT || 0,
    over: !!s.over, difficulty: s.difficulty || 'normal', endless: !!s.endless,
    upgrades: s.upgrades || { shoes: 0, burner: 0, patience: 0 },
  };
}
function safeUi(ui) {
  const u = ui || {};
  return {
    bestScore: u.bestScore || 0,
    highScores: Array.isArray(u.highScores) ? u.highScores : [],
    muted: !!u.muted,
    difficulty: u.difficulty || 'normal',
    endless: !!u.endless,
    upgrades: u.upgrades || { shoes: 0, burner: 0, patience: 0 },
    selectedDifficulty: u.selectedDifficulty || u.difficulty || 'normal',
    selectedEndless: !!(u.selectedEndless === undefined ? u.endless : u.selectedEndless),
    selectedUpgrade: u.selectedUpgrade || 'shoes',
  };
}
function diffDef(s) {
  return DIFFICULTIES[s.difficulty] || DIFFICULTIES.normal;
}

// ---- Ikon bahan ----
// kind: nama bahan / 'plate' / 'dish'; stage: raw|chopped|cooked|plate|recipe-id (dish).
export function drawIngredient(ctx, kind, stage, x, y, size) {
  const s = size || 28;
  const r = s / 2;
  if (kind === 'plate') {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
    ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 1.5; ctx.stroke();
    return;
  }
  if (kind === 'dish') {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 2; ctx.stroke();
    const rec = RECIPES.find((q) => q.id === stage);
    ctx.beginPath(); ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
    ctx.fillStyle = rec ? rec.color : '#ff8f00'; ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + Math.max(9, Math.floor(s * 0.32)) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('★', x, y + 1);
    return;
  }
  const def = INGREDIENTS[kind];
  const color = def ? def.color : '#cccccc';
  // Badan utama: cakram warna bahan.
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = 'rgba(74,50,38,0.45)'; ctx.lineWidth = 2; ctx.stroke();
  // Detail kecil per jenis supaya mudah dibedakan.
  ctx.fillStyle = 'rgba(74,50,38,0.55)';
  ctx.strokeStyle = 'rgba(74,50,38,0.55)';
  ctx.lineWidth = 2;
  if (kind === 'telur') {
    ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = '#ffb300'; ctx.fill();
  } else if (kind === 'cabai' || kind === 'sambal') {
    ctx.beginPath(); ctx.arc(x - r * 0.15, y, r * 0.55, Math.PI * 0.15, Math.PI * 1.15);
    ctx.strokeStyle = kind === 'cabai' ? '#b71c1c' : '#7f0000'; ctx.lineWidth = r * 0.45; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + r * 0.45, y - r * 0.35); ctx.lineTo(x + r * 0.8, y - r * 0.7);
    ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 2.5; ctx.stroke();
  } else if (kind === 'ayam') {
    ctx.beginPath(); ctx.arc(x - r * 0.2, y - r * 0.1, r * 0.34, 0, Math.PI * 2);
    ctx.fillStyle = '#fff3e0'; ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.3, y + r * 0.25, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffe0b2'; ctx.fill();
  } else if (kind === 'sayur') {
    ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - r * 0.5, y); ctx.lineTo(x + r * 0.5, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - r * 0.5); ctx.lineTo(x, y + r * 0.5); ctx.stroke();
  } else if (kind === 'nasi' || kind === 'mie') {
    ctx.fillStyle = 'rgba(120,72,20,0.5)';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.arc(x + i * r * 0.4, y + (i % 2) * r * 0.25, r * 0.14, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'tusuk') {
    ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - r * 0.7, y + r * 0.5); ctx.lineTo(x + r * 0.7, y - r * 0.5); ctx.stroke();
    ctx.fillStyle = '#ef6c00';
    ctx.beginPath(); ctx.arc(x - r * 0.25, y + r * 0.2, r * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.3, y - r * 0.25, r * 0.28, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'es') {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(x - r * 0.45, y - r * 0.45, r * 0.9, r * 0.9);
  } else if (kind === 'teh' || kind === 'jeruk' || kind === 'kacang') {
    ctx.beginPath(); ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(74,50,38,0.35)'; ctx.fill();
  }
  // Tanda tahap: dipotong = garis belah, dimasak = pinggir kecokelatan.
  if (stage === 'chopped') {
    ctx.strokeStyle = 'rgba(74,50,38,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - r * 0.6, y - r * 0.6); ctx.lineTo(x + r * 0.6, y + r * 0.6); ctx.stroke();
  } else if (stage === 'cooked') {
    ctx.beginPath(); ctx.arc(x, y, r * 0.92, 0, Math.PI * 2);
    ctx.strokeStyle = '#8d4e1f'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.16, 0, Math.PI * 2); ctx.fill();
  }
}

// ---- Layout tombol (SATU sumber kebenaran: dipakai draw + screenButtons) ----
function titleLayout() {
  return [{ id: 'start', x: W / 2 - 160, y: 520, w: 320, h: 64, label: '▶  MULAI MASAK' }];
}
function difficultyLayout(u) {
  const btns = [];
  const cw = 300, ch = 210, gap = 36, total = cw * 3 + gap * 2;
  const x0 = (W - total) / 2, y0 = 190;
  DIFFICULTY_ORDER.forEach((id, i) => {
    btns.push({ id: 'diff-' + id, x: x0 + i * (cw + gap), y: y0, w: cw, h: ch, label: DIFFICULTIES[id].label });
  });
  btns.push({ id: 'endless-toggle', x: W / 2 - 190, y: 440, w: 380, h: 56, label: u.selectedEndless ? 'ENDLESS: ON' : 'ENDLESS: OFF' });
  btns.push({ id: 'start', x: W / 2 - 160, y: 520, w: 320, h: 64, label: '▶  MULAI SHIFT' });
  return btns;
}
function upgradeLayout() {
  const btns = [];
  const cw = 300, ch = 250, gap = 36, total = cw * 3 + gap * 2;
  const x0 = (W - total) / 2, y0 = 150;
  UPGRADE_ORDER.forEach((id, i) => {
    btns.push({ id: 'buy-' + id, x: x0 + i * (cw + gap) + 45, y: y0 + ch - 62, w: cw - 90, h: 44, label: 'BELI' });
  });
  btns.push({ id: 'resume', x: W / 2 - 130, y: 560, w: 260, h: 56, label: 'TUTUP TOKO' });
  return btns;
}
function pauseLayout() {
  return [
    { id: 'resume', x: W / 2 - 250, y: 618, w: 230, h: 56, label: '▶  LANJUT' },
    { id: 'upgrade', x: W / 2 + 20, y: 618, w: 230, h: 56, label: '🛒  TOKO UPGRADE' },
  ];
}
function scoresLayout() {
  return [
    { id: 'restart', x: W / 2 - 250, y: 618, w: 230, h: 56, label: '↻  MAIN LAGI' },
    { id: 'title', x: W / 2 + 20, y: 618, w: 230, h: 56, label: '⌂  JUDUL' },
  ];
}
function overLayout() {
  return [
    { id: 'scores', x: W / 2 - 250, y: 618, w: 230, h: 56, label: '🏆  LIHAT SKOR' },
    { id: 'restart', x: W / 2 + 20, y: 618, w: 230, h: 56, label: '↻  MAIN LAGI' },
  ];
}
function layoutFor(screen, s, u) {
  if (screen === SCREEN_TITLE) return titleLayout();
  if (screen === SCREEN_DIFFICULTY) return difficultyLayout(u);
  if (screen === SCREEN_UPGRADE) return upgradeLayout();
  if (screen === SCREEN_PAUSE) return pauseLayout();
  if (screen === SCREEN_SCORES) return scoresLayout();
  if (screen === SCREEN_OVER) return overLayout();
  return [];
}

export function screenButtons(screen, state) {
  const s = safeState(state);
  const u = safeUi(null);
  return layoutFor(screen, s, u).map((b) => ({
    id: b.id, x: b.x, y: b.y, w: b.w, h: b.h, width: b.w, height: b.h,
  }));
}

export function statusText(screen, state) {
  const s = safeState(state);
  if (screen === SCREEN_TITLE) return 'RASA RUSH — game masak cepat, 8 resep, 3 kesulitan';
  if (screen === SCREEN_DIFFICULTY) return 'Pilih kesulitan, lalu mulai shift. Endless = tanpa batas waktu.';
  if (screen === SCREEN_PLAY) {
    return 'Skor ' + s.score + '  •  Koin ' + s.coins + '  •  Saji ' + s.served +
      '  •  Waktu ' + (s.endless ? fmtTime(s.time) + ' ENDLESS' : fmtTime(s.timeLeft));
  }
  if (screen === SCREEN_PAUSE) return 'Jeda — intip buku resep, lalu lanjut masak.';
  if (screen === SCREEN_UPGRADE) return 'Toko upgrade — koin ' + s.coins + '. Beli sepuasnya sebelum shift lanjut.';
  if (screen === SCREEN_SCORES) return 'Lima skor terbaikmu di RASA RUSH.';
  if (screen === SCREEN_OVER) return 'Shift selesai — skor ' + s.score + ', ' + s.served + ' hidangan tersaji.';
  return 'RASA RUSH';
}

// ---- Gambar tombol ----
function drawButton(ctx, b, opts) {
  const o = opts || {};
  fillRR(ctx, b.x + 3, b.y + 4, b.w, b.h, 14, C.shadow);
  fillRR(ctx, b.x, b.y, b.w, b.h, 14, o.bg || C.accent);
  strokeRR(ctx, b.x, b.y, b.w, b.h, 14, o.edge || C.accentDark, 2);
  text(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2 + 1, o.size || 22, o.fg || '#ffffff', 'bold');
}
function drawDim(ctx, alpha) {
  ctx.fillStyle = 'rgba(30,18,10,' + alpha + ')';
  ctx.fillRect(0, 0, W, H);
}

// ---- Layar: dapur (play / dasar pause) ----
function drawOrderCard(ctx, order, x, y, w, h) {
  const rec = RECIPES.find((r) => r.id === order.recipe);
  const name = rec ? rec.name : order.recipe;
  const maxP = order.maxPatience || 1;
  const frac = clamp((order.patience || 0) / maxP, 0, 1);
  fillRR(ctx, x, y, w, h, 12, order.vip ? '#fff7d6' : '#ffffff');
  strokeRR(ctx, x, y, w, h, 12, order.vip ? C.gold : '#d8c49a', order.vip ? 3 : 1.5);
  fillRR(ctx, x, y, w, 8, 12, rec ? rec.color : C.accent);
  if (order.vip) {
    text(ctx, '♛ VIP', x + w - 46, y + 22, 16, '#b8860b', 'bold');
  }
  text(ctx, name, x + 12, y + 22, 19, C.ink, 'bold', 'left');
  // Titik-titik bahan yang dibutuhkan.
  if (rec) {
    rec.needs.forEach((need, i) => {
      const ix = x + 26 + i * 40;
      drawIngredient(ctx, need.kind, need.stage, ix, y + 46, 22);
    });
    text(ctx, rec.coins + ' koin', x + w - 14, y + 46, 14, C.muted, 'bold', 'right');
  }
  // Bar kesabaran — di tepi bawah kartu, jauh di bawah teks koin.
  const bx = x + 12, by = y + h - 7, bw = w - 24;
  fillRR(ctx, bx, by, bw, 5, 4, '#e5d5b8');
  const barColor = frac > 0.5 ? C.green : frac > 0.25 ? '#f08c00' : C.red;
  if (frac > 0.01) fillRR(ctx, bx, by, Math.max(8, bw * frac), 5, 4, barColor);
}
function drawStation(ctx, st, s) {
  fillRR(ctx, st.x + 3, st.y + 4, st.w, st.h, 14, C.shadow);
  fillRR(ctx, st.x, st.y, st.w, st.h, 14, st.color);
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.fillRect(st.x, st.y, st.w, 34);
  text(ctx, st.name.toUpperCase(), st.x + st.w / 2, st.y + 22, 18, '#ffffff', 'bold');
  text(ctx, st.hint, st.x + st.w / 2, st.y + st.h - 16, 13, 'rgba(255,255,255,0.85)', 'normal');
  if (st.id === 'board') {
    const b = s.board;
    if (b.item) {
      drawIngredient(ctx, b.item.kind, b.item.stage, st.x + st.w / 2, st.y + 62, 40);
      fillRR(ctx, st.x + 18, st.y + st.h - 36, st.w - 36, 7, 3, 'rgba(0,0,0,0.3)');
      fillRR(ctx, st.x + 18, st.y + st.h - 36, (st.w - 36) * clamp(b.progress || 0, 0, 1), 7, 3, b.done ? C.green : '#ffd43b');
      if (b.done) text(ctx, 'SIAP!', st.x + st.w / 2, st.y + 62, 15, '#ffffff', 'bold');
    } else {
      text(ctx, '— kosong —', st.x + st.w / 2, st.y + 62, 14, 'rgba(255,255,255,0.8)', 'normal');
    }
  }
  if (st.id === 'stove') {
    const n = Math.max(1, s.stove.length);
    s.stove.forEach((slot, i) => {
      const cx = st.x + ((i + 0.5) * st.w) / n;
      const cy = st.y + 66;
      ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.fillStyle = slot.burnt ? '#212121' : '#37474f'; ctx.fill();
      ctx.strokeStyle = slot.done && !slot.burnt ? C.green : '#90a4ae'; ctx.lineWidth = 3; ctx.stroke();
      if (slot.item) {
        drawIngredient(ctx, slot.item.kind, slot.item.stage, cx, cy, 34);
        const p = clamp(slot.progress || 0, 0, 1);
        ctx.beginPath(); ctx.arc(cx, cy, 36, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
        ctx.strokeStyle = slot.burnt ? C.red : (slot.done ? C.green : '#ff7043');
        ctx.lineWidth = 4; ctx.stroke();
        if (slot.burnt) text(ctx, 'GOSONG', cx, cy - 42, 12, '#ff5252', 'bold');
        else if (slot.done) text(ctx, 'MATANG', cx, cy - 42, 12, '#69f0ae', 'bold');
      } else {
        text(ctx, '○', cx, cy, 22, '#78909c', 'normal');
      }
    });
  }
  if (st.id === 'assembly') {
    if (s.dish) {
      drawIngredient(ctx, 'dish', s.dish.recipe, st.x + st.w / 2, st.y + 66, 46);
      const rec = RECIPES.find((r) => r.id === s.dish.recipe);
      text(ctx, rec ? rec.name : s.dish.recipe, st.x + st.w / 2, st.y + 100, 14, '#ffffff', 'bold');
    } else if (s.assembly.length) {
      s.assembly.forEach((it, i) => {
        drawIngredient(ctx, it.kind, it.stage, st.x + 40 + i * 48, st.y + 66, 38);
      });
      text(ctx, s.assembly.length + ' bahan dirakit', st.x + st.w / 2, st.y + 104, 13, 'rgba(255,255,255,0.9)', 'normal');
    } else {
      text(ctx, 'Letakkan bahan di sini', st.x + st.w / 2, st.y + 66, 14, 'rgba(255,255,255,0.85)', 'normal');
    }
  }
  if (st.id === 'serve') {
    text(ctx, 'ANTAR DI SINI →', st.x + st.w / 2, st.y + 62, 16, '#ffe082', 'bold');
  }
  if (st.id === 'trash') {
    text(ctx, '🗑  buang = hilang', st.x + st.w / 2, st.y + 62, 14, 'rgba(255,255,255,0.85)', 'normal');
  }
}
function drawPlayer(ctx, s) {
  const p = s.player;
  const x = p.x, y = p.y;
  ctx.beginPath(); ctx.arc(x, y + 3, 24, 0, Math.PI * 2);
  ctx.fillStyle = C.shadow; ctx.fill();
  // Badan koki.
  ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.strokeStyle = '#d7ccc8'; ctx.lineWidth = 2; ctx.stroke();
  // Wajah + topi koki.
  ctx.beginPath(); ctx.arc(x, y - 2, 13, 0, Math.PI * 2);
  ctx.fillStyle = '#ffcc9e'; ctx.fill();
  ctx.fillStyle = '#4a3226';
  ctx.beginPath(); ctx.arc(x - 5, y - 4, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 5, y - 4, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x - 8, y - 16, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 8, y - 16, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - 19, 10, 0, Math.PI * 2); ctx.fill();
  // Barang di tangan melayang di atas kepala.
  if (p.hand) {
    drawIngredient(ctx, p.hand.kind, p.hand.stage, x, y - 44, 34);
  }
}
function drawPlay(ctx, s, u) {
  const d = diffDef(s);
  // Latar + lantai.
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  fillRR(ctx, FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h, 10, C.floor);
  ctx.strokeStyle = C.floorLine; ctx.lineWidth = 2;
  for (let gy = FLOOR.y + 80; gy < FLOOR.y + FLOOR.h; gy += 80) {
    ctx.beginPath(); ctx.moveTo(FLOOR.x, gy); ctx.lineTo(FLOOR.x + FLOOR.w, gy); ctx.stroke();
  }
  // Baris HUD atas.
  const maxStars = d.stars || 3;
  let starsTxt = '';
  for (let i = 0; i < maxStars; i++) starsTxt += i < s.stars ? '★' : '☆';
  const hud = 'SKOR ' + s.score + '   •   KOIN ' + s.coins + '   •   KOMBO x' + s.combo +
    '   •   ' + starsTxt + '   •   SAJI ' + s.served;
  text(ctx, hud, 16, 18, 18, C.ink, 'bold', 'left');
  const timerTxt = s.endless ? ('ENDLESS ' + fmtTime(s.time)) : fmtTime(s.timeLeft);
  text(ctx, '⏱ ' + timerTxt + '   •   ' + d.label.toUpperCase(), W - 16, 18, 18, s.endless ? C.green : C.ink, 'bold', 'right');
  // Chip upgrade aktif + bisu.
  let chipX = 16;
  ['shoes', 'burner', 'patience'].forEach((id) => {
    const lv = (s.upgrades && s.upgrades[id]) || 0;
    if (lv > 0) {
      const label = UPGRADES[id].name + ' Lv' + lv;
      const wdt = label.length * 8 + 20;
      fillRR(ctx, chipX, 30, wdt, 20, 10, '#ffe8cc');
      text(ctx, label, chipX + wdt / 2, 41, 12, '#8d4e1f', 'bold');
      chipX += wdt + 8;
    }
  });
  text(ctx, u.muted ? '🔇 BISU' : '🔊 SUARA', W - 16, 41, 13, C.muted, 'bold', 'right');
  // Strip pesanan.
  const n = Math.max(1, Math.min(4, s.orders.length));
  const cw = (FLOOR.w - (n - 1) * 12) / 4;
  if (s.orders.length === 0) {
    fillRR(ctx, FLOOR.x, 56, FLOOR.w, 64, 12, '#ffffff');
    text(ctx, 'Belum ada pesanan — pelanggan segera datang…', W / 2, 88, 17, C.muted, 'normal');
  } else {
    s.orders.slice(0, 4).forEach((o, i) => {
      drawOrderCard(ctx, o, FLOOR.x + i * (cw + 12), 56, cw, 64);
    });
  }
  // Stasiun.
  STATIONS.forEach((st) => drawStation(ctx, st, s));
  // Pemain.
  drawPlayer(ctx, s);
  // Toast.
  if (s.message && s.messageT > 0) {
    const tw = s.message.length * 10 + 36;
    fillRR(ctx, W / 2 - tw / 2, 660, tw, 38, 19, 'rgba(74,50,38,0.92)');
    text(ctx, s.message, W / 2, 680, 17, '#fff3d6', 'bold');
  }
}

// ---- Layar menu ----
function drawTitle(ctx, s, u) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffe8cc';
  ctx.fillRect(0, 0, W, 240);
  text(ctx, '🍳', W / 2, 92, 64, C.ink, 'bold');
  text(ctx, 'RASA RUSH', W / 2, 168, 84, C.accent, 'bold');
  text(ctx, 'Masak cepat • Sajikan tepat waktu • Kejar bintang', W / 2, 222, 22, C.muted, 'normal');
  // Baris fitur.
  const feats = ['8 Resep', '3 Kesulitan', 'Mode Endless', 'Upgrade Toko', 'VIP 2x Koin'];
  feats.forEach((f, i) => {
    const fx = W / 2 - 440 + i * 176;
    fillRR(ctx, fx, 268, 160, 44, 22, '#ffffff');
    strokeRR(ctx, fx, 268, 160, 44, 22, C.panelEdge, 1.5);
    text(ctx, f, fx + 80, 291, 16, C.ink, 'bold');
  });
  // Skor terbaik + mini resep.
  if (u.bestScore > 0) {
    text(ctx, '🏆 Skor terbaik: ' + u.bestScore, W / 2, 352, 24, '#b8860b', 'bold');
  } else {
    text(ctx, 'Belum ada skor — jadilah koki pertama yang menaklukkan dapur ini!', W / 2, 352, 20, C.muted, 'normal');
  }
  RECIPES.slice(0, 4).forEach((r, i) => {
    drawIngredient(ctx, r.needs[0].kind, r.needs[0].stage, W / 2 - 90 + i * 60, 408, 40);
    text(ctx, r.coins + '', W / 2 - 90 + i * 60, 438, 13, C.muted, 'bold');
  });
  text(ctx, 'Ambil bahan → potong / masak → rakit → antar ke jendela saji', W / 2, 478, 17, C.muted, 'normal');
  titleLayout().forEach((b) => drawButton(ctx, b));
  text(ctx, 'Klik MULAI atau tekan tombol apa saja', W / 2, 620, 16, C.muted, 'normal');
}
function drawDifficulty(ctx, s, u) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  text(ctx, 'PILIH KESULITAN', W / 2, 84, 44, C.ink, 'bold');
  text(ctx, 'Shift lebih pendek = pelanggan lebih tidak sabar, tapi makin seru.', W / 2, 128, 18, C.muted, 'normal');
  const btns = difficultyLayout(u);
  DIFFICULTY_ORDER.forEach((id, i) => {
    const d = DIFFICULTIES[id];
    const b = btns[i];
    const sel = u.selectedDifficulty === id;
    fillRR(ctx, b.x + 3, b.y + 4, b.w, b.h, 16, C.shadow);
    fillRR(ctx, b.x, b.y, b.w, b.h, 16, sel ? '#fff3d6' : '#ffffff');
    strokeRR(ctx, b.x, b.y, b.w, b.h, 16, sel ? C.accent : C.panelEdge, sel ? 3 : 1.5);
    text(ctx, d.label.toUpperCase(), b.x + b.w / 2, b.y + 42, 30, sel ? C.accent : C.ink, 'bold');
    text(ctx, 'Shift ' + d.shiftSeconds + ' detik', b.x + b.w / 2, b.y + 92, 18, C.ink, 'normal');
    text(ctx, 'Kecepatan ' + d.speed, b.x + b.w / 2, b.y + 122, 18, C.ink, 'normal');
    let st = '';
    for (let k = 0; k < d.stars; k++) st += '★';
    text(ctx, st + '  ' + d.stars + ' bintang', b.x + b.w / 2, b.y + 152, 18, '#b8860b', 'bold');
    text(ctx, 'Pelanggan sabar ' + d.patienceBase + ' dtk', b.x + b.w / 2, b.y + 182, 15, C.muted, 'normal');
  });
  drawButton(ctx, btns[3], { bg: u.selectedEndless ? C.green : '#8a6d55' });
  drawButton(ctx, btns[4]);
  text(ctx, 'Endless: waktu tak terbatas, pesanan terus datang.', W / 2, 612, 15, C.muted, 'normal');
}
function drawUpgrade(ctx, s, u) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  text(ctx, 'TOKO UPGRADE', W / 2, 64, 40, C.ink, 'bold');
  text(ctx, 'Koinmu: ' + s.coins + '  •  Upgrade terbawa ke shift berikutnya', W / 2, 104, 18, C.muted, 'normal');
  const btns = upgradeLayout();
  UPGRADE_ORDER.forEach((id, i) => {
    const up = UPGRADES[id];
    const lv = (s.upgrades && s.upgrades[id]) || 0;
    const maxed = lv >= up.max;
    const cost = maxed ? 0 : upgradeCost(id, lv);
    const afford = !maxed && s.coins >= cost;
    const cw = 300, ch = 250, gap = 36, total = cw * 3 + gap * 2;
    const x0 = (W - total) / 2, y0 = 150;
    const x = x0 + i * (cw + gap);
    const dim = !afford && !maxed;
    fillRR(ctx, x + 3, y0 + 4, cw, ch, 16, C.shadow);
    fillRR(ctx, x, y0, cw, ch, 16, dim ? '#efe6d6' : '#ffffff');
    strokeRR(ctx, x, y0, cw, ch, 16, (u.selectedUpgrade === id) ? C.accent : C.panelEdge, (u.selectedUpgrade === id) ? 3 : 1.5);
    text(ctx, up.name.toUpperCase(), x + cw / 2, y0 + 40, 24, dim ? C.muted : C.ink, 'bold');
    text(ctx, up.desc, x + cw / 2, y0 + 82, 16, dim ? C.muted : C.ink, 'normal');
    // Pip level.
    for (let p = 0; p < up.max; p++) {
      ctx.beginPath(); ctx.arc(x + cw / 2 + (p - (up.max - 1) / 2) * 34, y0 + 122, 11, 0, Math.PI * 2);
      ctx.fillStyle = p < lv ? C.gold : '#e0d3b8'; ctx.fill();
      ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 2; ctx.stroke();
    }
    text(ctx, 'Level ' + lv + ' / ' + up.max, x + cw / 2, y0 + 148, 17, C.ink, 'bold');
    if (maxed) {
      text(ctx, 'MAKS', x + cw / 2, y0 + 172, 18, C.green, 'bold');
    } else {
      text(ctx, 'Berikutnya: ' + cost + ' koin', x + cw / 2, y0 + 172, 18, afford ? C.accent : C.red, 'bold');
    }
    const buy = btns[i];
    drawButton(ctx, buy, { bg: maxed ? '#9e9e9e' : (afford ? C.green : '#bcaaa4'), size: 18 });
  });
  drawButton(ctx, btns[3], { bg: '#6d4c41' });
  text(ctx, 'Beli dengan koin dari shift yang sudah dimainkan.', W / 2, 646, 15, C.muted, 'normal');
}
function drawPause(ctx, s, u) {
  drawPlay(ctx, s, u);
  drawDim(ctx, 0.55);
  const px = W / 2 - 430, py = 40, pw = 860, ph = 560;
  fillRR(ctx, px, py, pw, ph, 18, C.panel);
  strokeRR(ctx, px, py, pw, ph, 18, C.panelEdge, 2);
  text(ctx, '📖  BUKU RESEP — JEDA', W / 2, py + 34, 28, C.ink, 'bold');
  text(ctx, 'Bahan: mentah → potong di talenen / masak di kompor, lalu rakit + piring.', W / 2, py + 66, 15, C.muted, 'normal');
  RECIPES.forEach((r, i) => {
    const ry = py + 96 + i * 52;
    text(ctx, r.name, px + 24, ry, 18, C.ink, 'bold', 'left');
    r.needs.forEach((need, j) => {
      const ing = INGREDIENTS[need.kind];
      drawIngredient(ctx, need.kind, need.stage, px + 330 + j * 84, ry, 30);
      text(ctx, (ing ? ing.name : need.kind) + ' · ' + stageLabel(need.stage), px + 330 + j * 84, ry + 24, 11, C.muted, 'bold');
    });
    text(ctx, r.coins + ' koin', px + pw - 24, ry, 17, C.accent, 'bold', 'right');
  });
  pauseLayout().forEach((b) => drawButton(ctx, b, { bg: b.id === 'upgrade' ? '#6d4c41' : C.accent }));
}
function drawScores(ctx, s, u) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  text(ctx, 'SKOR TERBAIK', W / 2, 72, 40, C.ink, 'bold');
  text(ctx, 'Lima shift terbaikmu — sajikan lebih banyak, kalahkan skor ini!', W / 2, 112, 17, C.muted, 'normal');
  const tx = W / 2 - 400, ty = 150, tw = 800;
  fillRR(ctx, tx, ty, tw, 56, 12, '#6d4c41');
  text(ctx, 'RANK', tx + 60, ty + 28, 17, '#ffffff', 'bold');
  text(ctx, 'SKOR', tx + 190, ty + 28, 17, '#ffffff', 'bold');
  text(ctx, 'SAJI', tx + 330, ty + 28, 17, '#ffffff', 'bold');
  text(ctx, 'KESULITAN', tx + 480, ty + 28, 17, '#ffffff', 'bold');
  text(ctx, 'TANGGAL', tx + 680, ty + 28, 17, '#ffffff', 'bold');
  if (!u.highScores.length) {
    text(ctx, 'Belum ada skor tersimpan. Main satu shift dulu!', W / 2, ty + 130, 19, C.muted, 'normal');
  } else {
    u.highScores.slice(0, 5).forEach((row, i) => {
      const ry = ty + 56 + i * 62;
      if (i % 2 === 0) { ctx.fillStyle = '#fff8ec'; ctx.fillRect(tx, ry, tw, 62); }
      const d = DIFFICULTIES[row.difficulty] || DIFFICULTIES.normal;
      text(ctx, '#' + (i + 1), tx + 60, ry + 31, 20, i === 0 ? '#b8860b' : C.ink, 'bold');
      text(ctx, String(row.score || 0), tx + 190, ry + 31, 20, C.ink, 'bold');
      text(ctx, String(row.served || 0), tx + 330, ry + 31, 18, C.ink, 'normal');
      text(ctx, d.label + (row.endless ? ' · Endless' : ''), tx + 480, ry + 31, 17, C.ink, 'normal');
      text(ctx, row.date ? String(row.date).slice(0, 10) : '—', tx + 680, ry + 31, 16, C.muted, 'normal');
    });
  }
  scoresLayout().forEach((b) => drawButton(ctx, b, { bg: b.id === 'title' ? '#6d4c41' : C.accent }));
}
function drawOver(ctx, s, u) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  text(ctx, '⏰  SHIFT SELESAI!', W / 2, 84, 46, C.ink, 'bold');
  const isBest = s.score > 0 && s.score >= u.bestScore;
  if (isBest) {
    fillRR(ctx, W / 2 - 170, 116, 340, 44, 22, C.gold);
    text(ctx, '🏆  SKOR TERBAIK BARU!', W / 2, 139, 22, '#5d3a00', 'bold');
  } else if (u.bestScore > 0) {
    text(ctx, 'Skor terbaikmu: ' + u.bestScore, W / 2, 138, 19, C.muted, 'normal');
  }
  const px = W / 2 - 300, py = 182, pw = 600;
  fillRR(ctx, px, py, pw, 380, 18, '#ffffff');
  strokeRR(ctx, px, py, pw, 380, 18, C.panelEdge, 2);
  text(ctx, 'SKOR AKHIR', W / 2, py + 40, 18, C.muted, 'bold');
  text(ctx, String(s.score), W / 2, py + 100, 64, C.accent, 'bold');
  const rows = [
    ['Hidangan tersaji', String(s.served)],
    ['Kombo terbaik', 'x' + s.bestCombo],
    ['VIP dilayani', String(s.vipServed)],
    ['Koin dikumpulkan', String(s.coins)],
    ['Pesanan gagal / kabur', String(s.failed + s.missed)],
    ['Hidangan gosong', String(s.burned)],
  ];
  rows.forEach((r, i) => {
    const ry = py + 148 + i * 30;
    text(ctx, r[0], px + 32, ry, 18, C.ink, 'normal', 'left');
    text(ctx, r[1], px + pw - 32, ry, 18, C.ink, 'bold', 'right');
  });
  overLayout().forEach((b) => drawButton(ctx, b, { bg: b.id === 'scores' ? '#6d4c41' : C.accent }));
  text(ctx, 'Terima kasih sudah memasak hari ini, Koki!', W / 2, py + 350, 16, C.muted, 'normal');
}

// ---- Entry utama ----
export function drawScreen(ctx, screen, state, ui) {
  const s = safeState(state);
  const u = safeUi(ui);
  if (!ctx) return;
  if (screen === SCREEN_TITLE) drawTitle(ctx, s, u);
  else if (screen === SCREEN_DIFFICULTY) drawDifficulty(ctx, s, u);
  else if (screen === SCREEN_PLAY) drawPlay(ctx, s, u);
  else if (screen === SCREEN_PAUSE) drawPause(ctx, s, u);
  else if (screen === SCREEN_UPGRADE) drawUpgrade(ctx, s, u);
  else if (screen === SCREEN_SCORES) drawScores(ctx, s, u);
  else if (screen === SCREEN_OVER) drawOver(ctx, s, u);
  else drawTitle(ctx, s, u);
}
