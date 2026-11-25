// RASA RUSH — semua gambar: dapur top-down, koki, makanan, HUD, dan layar title/pause/akhir.
// Semua art digambar lewat canvas (tanpa aset eksternal).

import { FLOOR, PLAYER_RADIUS, RECIPES, SHIFT_SECONDS, STATIONS, VIEW, recipeById } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_OVER = 'over';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// ---- Ikon makanan (vektor, tanpa emoji) ----
export function drawIngredient(ctx, kind, stage, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  if (stage === 'burnt') {
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#616161';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.2);
    ctx.lineTo(s * 0.2, s * 0.2);
    ctx.moveTo(s * 0.2, -s * 0.2);
    ctx.lineTo(-s * 0.2, s * 0.2);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (kind === 'plate') {
    ctx.fillStyle = '#eceff1';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#90a4ae';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (kind === 'dish') {
    // Piring berisi hidangan (stage = id resep).
    drawIngredient(ctx, 'plate', 'plate', 0, 0, s);
    const recipe = recipeById(stage);
    ctx.fillStyle = recipe ? recipe.color : '#ff8f00';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(s * 0.34)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', 0, 1);
    ctx.restore();
    return;
  }
  switch (kind) {
    case 'nasi':
      ctx.fillStyle = '#fffde7';
      ctx.beginPath();
      ctx.arc(0, s * 0.08, s * 0.42, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-s * 0.42, s * 0.08, s * 0.84, s * 0.12);
      ctx.fillStyle = '#ffe082';
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.arc(i * s * 0.14, -s * 0.1 + Math.abs(i) * s * 0.06, s * 0.05, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'telur':
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.46, s * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = stage === 'cooked' ? '#ffb300' : '#ffca28';
      ctx.beginPath();
      ctx.arc(s * 0.05, 0, s * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'cabai':
      ctx.strokeStyle = '#e53935';
      ctx.lineWidth = s * 0.16;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-s * 0.35, -s * 0.25);
      ctx.quadraticCurveTo(0, s * 0.35, s * 0.35, -s * 0.3);
      ctx.stroke();
      ctx.strokeStyle = '#43a047';
      ctx.lineWidth = s * 0.08;
      ctx.beginPath();
      ctx.moveTo(s * 0.35, -s * 0.3);
      ctx.lineTo(s * 0.45, -s * 0.42);
      ctx.stroke();
      break;
    case 'mie':
      ctx.strokeStyle = '#ffca28';
      ctx.lineWidth = s * 0.09;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i += 1) {
        const yy = -s * 0.22 + i * s * 0.2;
        ctx.beginPath();
        ctx.moveTo(-s * 0.4, yy);
        ctx.bezierCurveTo(-s * 0.15, yy - s * 0.12, s * 0.15, yy + s * 0.12, s * 0.4, yy);
        ctx.stroke();
      }
      break;
    case 'ayam':
      ctx.fillStyle = '#ffb74d';
      ctx.beginPath();
      ctx.ellipse(-s * 0.08, s * 0.05, s * 0.34, s * 0.26, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff3e0';
      ctx.lineWidth = s * 0.09;
      ctx.beginPath();
      ctx.moveTo(s * 0.2, -s * 0.15);
      ctx.lineTo(s * 0.42, -s * 0.38);
      ctx.stroke();
      if (stage === 'chopped') {
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, -s * 0.2);
        ctx.lineTo(s * 0.15, s * 0.25);
        ctx.stroke();
      }
      break;
    case 'sayur':
      ctx.fillStyle = '#66bb6a';
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.ellipse(-s * 0.25 + i * s * 0.25, -s * 0.05, s * 0.16, s * 0.3, (i - 1) * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#43a047';
      ctx.fillRect(-s * 0.1, s * 0.2, s * 0.2, s * 0.18);
      break;
    case 'tusuk':
      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = s * 0.08;
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, s * 0.35);
      ctx.lineTo(s * 0.4, -s * 0.35);
      ctx.stroke();
      ctx.fillStyle = '#ffb74d';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.arc(i * s * 0.18, -i * s * 0.16, s * 0.11, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'sambal':
      ctx.fillStyle = '#d32f2f';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.36, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#b71c1c';
      ctx.beginPath();
      ctx.arc(0, -s * 0.05, s * 0.26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff8a65';
      ctx.beginPath();
      ctx.arc(-s * 0.1, -s * 0.12, s * 0.06, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'kacang':
      ctx.fillStyle = '#a1887f';
      for (const [ox, oy] of [[-0.2, -0.12], [0.18, -0.18], [0, 0.18], [-0.05, -0.02]]) {
        ctx.beginPath();
        ctx.ellipse(ox * s, oy * s, s * 0.16, s * 0.11, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'teh':
      ctx.fillStyle = '#eceff1';
      ctx.fillRect(-s * 0.3, -s * 0.28, s * 0.6, s * 0.56);
      ctx.fillStyle = stage === 'cooked' ? '#8d6e63' : '#bcaaa4';
      ctx.fillRect(-s * 0.22, -s * 0.2, s * 0.44, s * 0.4);
      ctx.strokeStyle = '#eceff1';
      ctx.lineWidth = s * 0.07;
      ctx.beginPath();
      ctx.arc(s * 0.34, 0, s * 0.14, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      break;
    case 'es':
      ctx.fillStyle = '#4fc3f7';
      ctx.globalAlpha = 0.85;
      for (const [ox, oy, r] of [[-0.16, 0.1, 0.2], [0.18, -0.08, -0.3], [0.05, 0.22, 0.4]]) {
        ctx.save();
        ctx.translate(ox * s, oy * s);
        ctx.rotate(r);
        ctx.fillRect(-s * 0.18, -s * 0.18, s * 0.36, s * 0.36);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      break;
    default:
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  // Tanda tahap: potongan (garis) / matang (uap) / mentah (tanpa tanda).
  if (stage === 'chopped') {
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, s * 0.34);
    ctx.lineTo(s * 0.3, s * 0.34);
    ctx.stroke();
  }
  if (stage === 'cooked') {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.15, -s * 0.42);
    ctx.quadraticCurveTo(-s * 0.25, -s * 0.55, -s * 0.15, -s * 0.62);
    ctx.moveTo(s * 0.12, -s * 0.42);
    ctx.quadraticCurveTo(s * 0.02, -s * 0.55, s * 0.12, -s * 0.62);
    ctx.stroke();
  }
  ctx.restore();
}

function drawProgressBar(ctx, x, y, w, frac, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  rr(ctx, x, y, w, 10, 5);
  ctx.fill();
  ctx.fillStyle = color;
  if (frac > 0.01) {
    rr(ctx, x + 1, y + 1, Math.max(8, (w - 2) * Math.min(1, frac)), 8, 4);
    ctx.fill();
  }
}

// ---- Dapur ----
function drawStations(ctx, state) {
  for (const s of STATIONS) {
    ctx.fillStyle = s.color;
    rr(ctx, s.x, s.y, s.w, s.h, 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    rr(ctx, s.x, s.y, s.w, 26, 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(s.x, s.y + 14, s.w, 12);
    text(ctx, s.name, s.x + s.w / 2, s.y + 13, 15, '#fff');
    text(ctx, s.hint, s.x + s.w / 2, s.y + s.h - 12, 11, 'rgba(255,255,255,0.75)', 'center', 'normal');

    if (s.id === 'pantry') {
      const kinds = ['nasi', 'telur', 'cabai', 'mie', 'ayam', 'sayur'];
      kinds.forEach((k, i) => {
        drawIngredient(ctx, k, 'raw', s.x + 28 + i * 30, s.y + 62, 34);
      });
      const kinds2 = ['tusuk', 'sambal', 'kacang', 'teh', 'es'];
      kinds2.forEach((k, i) => {
        drawIngredient(ctx, k, 'raw', s.x + 44 + i * 30, s.y + 94, 30);
      });
    }
    if (s.id === 'board') {
      const slot = state.board;
      if (slot.item) {
        drawIngredient(ctx, slot.item.kind, slot.item.stage, s.x + s.w / 2, s.y + 62, 52);
        drawProgressBar(ctx, s.x + 30, s.y + 92, s.w - 60, slot.progress, slot.done ? '#66bb6a' : '#ffca28');
        if (slot.done) text(ctx, 'SIAP!', s.x + s.w / 2, s.y + 62, 13, '#fff');
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 5]);
        rr(ctx, s.x + 50, s.y + 40, s.w - 100, 56, 8);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    if (s.id === 'stove') {
      state.stove.forEach((b, i) => {
        const cx = s.x + 58 + i * 116;
        const cy = s.y + 66;
        ctx.fillStyle = '#37474f';
        ctx.beginPath();
        ctx.arc(cx, cy, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = b.item && !b.done ? '#ff7043' : '#607d8b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, 34, 0, Math.PI * 2);
        ctx.stroke();
        if (b.item) {
          drawIngredient(ctx, b.item.kind, b.item.stage, cx, cy, 52);
          drawProgressBar(ctx, cx - 36, cy + 40, 72, b.progress, b.burnt ? '#212121' : b.done ? '#66bb6a' : '#ff7043');
          if (b.done && !b.burnt) text(ctx, 'MATANG', cx, cy - 46, 11, '#c8e6c9');
          if (b.burnt) text(ctx, 'GOSONG!', cx, cy - 46, 11, '#ff8a65');
        }
      });
    }
    if (s.id === 'plates') {
      for (let i = 0; i < 3; i += 1) drawIngredient(ctx, 'plate', 'plate', s.x + 36 + i * 38, s.y + 62, 44);
    }
    if (s.id === 'serve') {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      rr(ctx, s.x + 16, s.y + 36, s.w - 32, 56, 8);
      ctx.fill();
      text(ctx, 'ANTAR DI SINI', s.x + s.w / 2, s.y + 64, 16, '#ffe0b2');
    }
    if (s.id === 'assembly') {
      if (state.dish) {
        const recipe = recipeById(state.dish.recipe);
        drawIngredient(ctx, 'dish', state.dish.recipe, s.x + s.w / 2, s.y + 66, 84);
        text(ctx, recipe.name, s.x + s.w / 2, s.y + 112, 15, '#fff');
      } else {
        state.assembly.forEach((item, i) => {
          drawIngredient(ctx, item.kind, item.stage, s.x + 60 + i * 90, s.y + 62, 56);
        });
        if (state.assembly.length === 0) {
          text(ctx, 'Taruh bahan di sini untuk merakit', s.x + s.w / 2, s.y + 62, 13, 'rgba(255,255,255,0.6)', 'center', 'normal');
        }
      }
    }
    if (s.id === 'trash') {
      ctx.fillStyle = '#424242';
      rr(ctx, s.x + s.w / 2 - 34, s.y + 40, 68, 56, 8);
      ctx.fill();
      ctx.fillStyle = '#757575';
      ctx.fillRect(s.x + s.w / 2 - 40, s.y + 32, 80, 10);
    }
  }
}

function drawPlayer(ctx, state) {
  const p = state.player;
  // Bayangan.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 18, 24, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  // Badan koki.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(p.x, p.y, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b0bec5';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Celemek merah.
  ctx.fillStyle = '#e53935';
  ctx.beginPath();
  ctx.arc(p.x, p.y + 6, 15, 0, Math.PI);
  ctx.fill();
  // Topi koki.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(p.x - 10, p.y - 20, 9, 0, Math.PI * 2);
  ctx.arc(p.x, p.y - 24, 10, 0, Math.PI * 2);
  ctx.arc(p.x + 10, p.y - 20, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(p.x - 14, p.y - 24, 28, 8);
  // Mata.
  ctx.fillStyle = '#212121';
  ctx.beginPath();
  ctx.arc(p.x - 7, p.y - 2, 2.5, 0, Math.PI * 2);
  ctx.arc(p.x + 7, p.y - 2, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Bahan di tangan.
  if (p.hand) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(p.x, p.y - 34, 20, 0, Math.PI * 2);
    ctx.fill();
    if (p.hand.kind === 'dish') drawIngredient(ctx, 'dish', p.hand.stage, p.x, p.y - 34, 34);
    else drawIngredient(ctx, p.hand.kind, p.hand.stage, p.x, p.y - 34, 34);
  }
}

// ---- Papan pesanan + HUD ----
function drawOrderBoard(ctx, state) {
  ctx.fillStyle = '#3e2723';
  rr(ctx, 16, 8, 1248, 116, 12);
  ctx.fill();
  text(ctx, 'PESANAN', 88, 66, 20, '#ffcc80', 'center');
  state.orders.forEach((order, i) => {
    const recipe = recipeById(order.recipe);
    const x = 170 + i * 220;
    const y = 16;
    const w = 210;
    const h = 100;
    const frac = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = '#5d4037';
    rr(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.fillStyle = recipe.color;
    rr(ctx, x, y, w, 8, 4);
    ctx.fill();
    drawIngredient(ctx, 'dish', recipe.id, x + 30, y + 40, 50);
    text(ctx, recipe.name, x + 58, y + 24, 14, '#fff', 'left');
    text(ctx, `${recipe.coins} koin`, x + 58, y + 44, 12, '#ffcc80', 'left', 'normal');
    recipe.needs.forEach((n, j) => {
      drawIngredient(ctx, n.kind, n.stage, x + 70 + j * 34, y + 68, 30);
    });
    drawProgressBar(ctx, x + 14, y + 86, w - 28, frac, frac > 0.5 ? '#66bb6a' : frac > 0.25 ? '#ffca28' : '#e53935');
  });
  if (state.orders.length === 0) {
    text(ctx, 'Belum ada pesanan — bersiaplah!', 640, 66, 16, '#bcaaa4', 'center', 'normal');
  }
  // Panel kanan: skor, koin, waktu, combo, bintang.
  const hudX = 170 + 4 * 220 + 8;
  ctx.fillStyle = '#4e342e';
  rr(ctx, hudX, 16, 1264 - hudX - 8, 100, 10);
  ctx.fill();
  const mins = Math.floor(state.timeLeft / 60);
  const secs = Math.floor(state.timeLeft % 60);
  const cx = hudX + (1264 - hudX - 8) / 2;
  text(ctx, `WAKTU ${mins}:${String(secs).padStart(2, '0')}`, cx, 36, 19, state.timeLeft < 30 ? '#ff8a65' : '#fff');
  drawProgressBar(ctx, hudX + 14, 52, 1264 - hudX - 36, state.timeLeft / SHIFT_SECONDS, '#29b6f6');
  text(ctx, `Skor ${state.score}  •  Koin ${state.coins}`, cx, 74, 15, '#fff');
  text(ctx, `Combo ${state.combo}  •  Bintang ${state.stars}/3`, cx, 98, 12, '#ffcc80', 'center', 'normal');
}

function drawHud(ctx, state, muted) {
  // Bintang + combo di bawah papan pesanan.
  let stars = '';
  for (let i = 0; i < 3; i += 1) stars += i < state.stars ? '★' : '☆';
  text(ctx, stars, 60, 700, 26, '#ffca28', 'left');
  if (state.combo >= 2) {
    text(ctx, `COMBO x${(1 + 0.1 * state.combo).toFixed(1)} (${state.combo})`, 640, 700, 20, '#ff7043');
  }
  text(ctx, `M: ${muted ? 'Bisu' : 'Suara'}  •  P: Jeda  •  R: Ulang`, 1264, 700, 12, 'rgba(255,255,255,0.65)', 'right', 'normal');
  if (state.message && state.messageT > 0) {
    text(ctx, state.message, 640, 340, 20, '#fff');
  }
}

function drawKitchen(ctx, state, muted) {
  // Lantai papan catur hangat.
  for (let ty = 0; ty < 6; ty += 1) {
    for (let tx = 0; tx < 13; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? '#d7a86e' : '#c99a5f';
      ctx.fillRect(FLOOR.x + tx * 96, FLOOR.y + ty * 96, 96, 96);
    }
  }
  // Dinding bawah.
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(0, 700, VIEW.width, 20);
  drawStations(ctx, state);
  drawPlayer(ctx, state);
  drawOrderBoard(ctx, state);
  drawHud(ctx, state, muted);
}

function drawTitle(ctx, state, best) {
  ctx.fillStyle = '#2d1b12';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Dapur redup di belakang.
  ctx.save();
  ctx.globalAlpha = 0.35;
  drawKitchen(ctx, state, false);
  ctx.restore();
  ctx.fillStyle = 'rgba(20,10,5,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'RASA RUSH', 640, 150, 84, '#ffb74d');
  text(ctx, 'Dapur paling sibuk di kota — masak cepat, saji tepat waktu!', 640, 215, 22, '#fff', 'center', 'normal');
  text(ctx, 'WASD / Panah: gerak  •  Klik: jalan  •  E / Spasi: ambil & taruh', 640, 300, 18, '#ffcc80', 'center', 'normal');
  text(ctx, 'Pantry → Talenen / Kompor → Meja Rakit → Piring → Jendela Saji', 640, 332, 18, '#ffcc80', 'center', 'normal');
  text(ctx, 'Jangan sampai gosong. Jangan biarkan pelanggan kabur!', 640, 364, 18, '#ffcc80', 'center', 'normal');
  // Kartu resep.
  RECIPES.forEach((r, i) => {
    const x = 190 + i * 180;
    ctx.fillStyle = '#4e342e';
    rr(ctx, x, 400, 164, 110, 10);
    ctx.fill();
    drawIngredient(ctx, 'dish', r.id, x + 82, 438, 56);
    text(ctx, r.name, x + 82, 478, 13, '#fff');
    text(ctx, `${r.coins} koin`, x + 82, 498, 12, '#ffcc80', 'center', 'normal');
  });
  text(ctx, 'Tekan tombol apa saja untuk mulai', 640, 570, 20, '#fff');
  if (best > 0) text(ctx, `Skor terbaik: ${best}`, 640, 606, 16, '#ffcc80', 'center', 'normal');
  text(ctx, 'Shift 3 menit  •  3 bintang  •  Combo menaikkan tip', 640, 640, 14, '#bcaaa4', 'center', 'normal');
}

function drawPause(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'JEDA', 640, 330, 64, '#fff');
  text(ctx, 'Tekan P untuk lanjut  •  R untuk mulai ulang', 640, 390, 18, '#ffcc80', 'center', 'normal');
}

function drawOver(ctx, state, best) {
  ctx.fillStyle = 'rgba(20,10,5,0.82)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'SHIFT SELESAI!', 640, 150, 56, '#ffb74d');
  text(ctx, `Skor akhir: ${state.score}   •   Koin: ${state.coins}`, 640, 220, 26, '#fff');
  text(ctx, `Hidangan tersaji: ${state.served}   •   Gagal: ${state.failed}   •   Kabur: ${state.missed}   •   Gosong: ${state.burned}`, 640, 268, 18, '#ffcc80', 'center', 'normal');
  text(ctx, `Combo terbaik: x${(1 + 0.1 * state.bestCombo).toFixed(1)} (${state.bestCombo})`, 640, 304, 18, '#fff', 'center', 'normal');
  if (state.score >= best && state.score > 0) text(ctx, '★ SKOR TERBAIK BARU! ★', 640, 344, 22, '#ffca28');
  else if (best > 0) text(ctx, `Skor terbaik: ${best}`, 640, 344, 18, '#ffcc80', 'center', 'normal');
  text(ctx, 'Tekan R untuk main lagi', 640, 420, 20, '#fff');
}

export function drawScreen(ctx, screen, state, best, muted) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  if (screen === SCREEN_TITLE) {
    drawTitle(ctx, state, best);
    return;
  }
  drawKitchen(ctx, state, muted);
  if (screen === SCREEN_PAUSE) drawPause(ctx);
  if (screen === SCREEN_OVER) drawOver(ctx, state, best);
}

// Garis status untuk pembaca layar.
export function statusText(screen, state) {
  if (screen === SCREEN_TITLE) return 'Rasa Rush. Tekan tombol apa saja untuk mulai memasak.';
  if (screen === SCREEN_OVER) return `Shift selesai. Skor ${state.score}, ${state.served} hidangan tersaji.`;
  return `Skor ${state.score}, koin ${state.coins}, sisa waktu ${Math.ceil(state.timeLeft)} detik, ${state.orders.length} pesanan aktif, combo ${state.combo}.`;
}
