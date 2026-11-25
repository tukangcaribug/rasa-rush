// RASA RUSH — autopilot + pementasan screenshot (?shot=...).
// Ditulis ulang dari spesifikasi, tanpa melihat file lama.
import { createWorld, stepWorld, interact, applyUpgrade } from './world.js';
import { recipeById, nextProcess, stationById, STATIONS, FLOOR } from './config.js';
import {
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER, SCREEN_UPGRADE,
} from './render.js';

const DT = 1 / 60;
const INTERACT_DIST = 95; // jarak pemain -> pusat stasiun saat memicu interaksi (jangkauan game 96)
const ARRIVE_DIST = 6;

// ---- Pathfinding grid (BFS): stasiun adalah rintangan, pemain tak bisa
// jalan lurus menembusnya. Sel 40px di atas lantai, rintangan diperluas
// sebesar radius pemain (22) + margin 2.
const CELL = 40;
const MARGIN = 24;
const COLS = Math.ceil(FLOOR.w / CELL);
const ROWS = Math.ceil(FLOOR.h / CELL);
function cellBlocked(cx, cy) {
  const x = FLOOR.x + cx * CELL + CELL / 2;
  const y = FLOOR.y + cy * CELL + CELL / 2;
  return STATIONS.some((st) =>
    x > st.x - MARGIN && x < st.x + st.w + MARGIN &&
    y > st.y - MARGIN && y < st.y + st.h + MARGIN);
}
function cellOf(x, y) {
  return {
    cx: Math.max(0, Math.min(COLS - 1, Math.floor((x - FLOOR.x) / CELL))),
    cy: Math.max(0, Math.min(ROWS - 1, Math.floor((y - FLOOR.y) / CELL))),
  };
}
function nearestFreeCell(cx, cy) {
  if (!cellBlocked(cx, cy)) return { cx, cy };
  for (let r = 1; r <= 4; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
        if (!cellBlocked(nx, ny)) return { cx: nx, cy: ny };
      }
    }
  }
  return { cx, cy };
}
function findPath(fx, fy, tx, ty) {
  const start = nearestFreeCell(...Object.values(cellOf(fx, fy)));
  const goal = nearestFreeCell(...Object.values(cellOf(tx, ty)));
  const key = (cx, cy) => cy * COLS + cx;
  const prev = new Map();
  const seen = new Set([key(start.cx, start.cy)]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift();
    if (cur.cx === goal.cx && cur.cy === goal.cy) break;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of dirs) {
      const nx = cur.cx + dx, ny = cur.cy + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      if (cellBlocked(nx, ny) || seen.has(key(nx, ny))) continue;
      seen.add(key(nx, ny));
      prev.set(key(nx, ny), cur);
      queue.push({ cx: nx, cy: ny });
    }
  }
  // Rekonstruksi mundur dari goal; bila goal tak tercapai, pakai sel
  // tercapai terdekat (BFS terakhir) — di sini goal selalu tercapai karena
  // sel target sudah digeser ke sel bebas terdekat.
  const path = [];
  let cur = goal;
  let guard = 0;
  while (cur && !(cur.cx === start.cx && cur.cy === start.cy) && guard++ < 500) {
    path.unshift({ x: FLOOR.x + cur.cx * CELL + CELL / 2, y: FLOOR.y + cur.cy * CELL + CELL / 2 });
    cur = prev.get(key(cur.cx, cur.cy));
  }
  path.push({ x: tx, y: ty });
  return path;
}

// Titik pendekatan: berdiri di luar kotak stasiun tapi masih dalam jangkauan
// interaksi (pusat stasiun ~59-66 px dari tepi + 24 px = < 96 jangkauan).
function approachPoint(stationId) {
  const st = stationById(stationId);
  if (!st) return { x: 640, y: 560 };
  const cx = st.x + st.w / 2;
  const cy = st.y + st.h / 2;
  if (stationId === 'trash') return { x: cx, y: st.y - 26 };
  return { x: cx, y: st.y + st.h + 26 };
}
function dist(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}
function stationCenter(stationId) {
  const st = stationById(stationId);
  if (!st) return { x: 640, y: 560 };
  return { x: st.x + st.w / 2, y: st.y + st.h / 2 };
}

// Himpunan (kind|tahap-akhir) yang sudah tersedia di rakitan / talenen /
// kompor — TANPA menghitung barang di tangan.
function coveredSet(state) {
  const covered = [];
  const pushCovered = (kind, stage) => { if (kind) covered.push(kind + '|' + stage); };
  (state.assembly || []).forEach((it) => pushCovered(it.kind, it.stage));
  if (state.board && state.board.item) {
    const np = nextProcess(state.board.item);
    pushCovered(state.board.item.kind, np ? np.to : state.board.item.stage);
  }
  (state.stove || []).forEach((slot) => {
    if (slot.item) {
      const np = nextProcess(slot.item);
      pushCovered(slot.item.kind, np ? np.to : slot.item.stage);
    }
  });
  return covered;
}
// Kebutuhan resep yang belum terpenuhi oleh rakitan + barang yang sedang
// diproses (talenen/kompor) + barang di tangan. Mengembalikan {kind, stage}
// pertama yang masih kurang, atau null bila resep sudah lengkap.
function missingNeed(state, recipe) {
  if (!recipe) return null;
  const covered = coveredSet(state);
  if (state.player && state.player.hand) {
    const h = state.player.hand;
    if (h.kind === 'dish') return null;
    if (h.kind !== 'plate') {
      const np = nextProcess(h);
      covered.push(h.kind + '|' + (np ? np.to : h.stage));
    }
  }
  if (state.dish) return null;
  for (const need of recipe.needs) {
    const key = need.kind + '|' + need.stage;
    const idx = covered.indexOf(key);
    if (idx === -1) return { kind: need.kind, stage: need.stage };
    covered.splice(idx, 1);
  }
  return null;
}
// Apakah barang di tangan masih berguna untuk resep target? Tidak berguna
// bila kebutuhan itu sudah tersedia di rakitan/talenen/kompor (duplikat).
function handUseful(state, recipe) {
  const h = state.player && state.player.hand;
  if (!h || h.kind === 'plate' || h.kind === 'dish') return false;
  if (!recipe) return false;
  const np = nextProcess(h);
  const finalStage = np ? np.to : h.stage;
  const covered = coveredSet(state);
  return recipe.needs.some((n) =>
    n.kind === h.kind && n.stage === finalStage &&
    !covered.includes(n.kind + '|' + n.stage));
}

export function makeAutopilot(world) {
  const ap = {
    world,
    cooldown: 0,
    path: null,
    pathFor: null,
    repathIn: 0,
    // Satu tick: hitung arah, langkahkan dunia, interaksi bila sudah dekat.
    update(dt) {
      const state = world.state;
      if (!state || state.over) return;
      if (ap.cooldown > 0) ap.cooldown -= dt;
      if (ap.repathIn > 0) ap.repathIn -= dt;
      const p = state.player;
      const hand = p.hand;
      const order = (state.orders || [])[0] || null;
      const recipe = order ? recipeById(order.recipe) : null;

      // Tentukan stasiun target + apakah boleh interaksi di sana.
      let targetStation = null;
      let wantInteract = false;

      const boardDone = state.board && state.board.item && state.board.done;
      const stoveSlot = (state.stove || []).find((sl) => sl.item && sl.done && !sl.burnt);
      const burntSlot = (state.stove || []).find((sl) => sl.item && sl.burnt);
      const boardBusy = state.board && state.board.item && !state.board.done;
      const stoveCooking = (state.stove || []).some((sl) => sl.item && !sl.done && !sl.burnt);

      if (hand && hand.kind === 'dish') {
        targetStation = 'serve'; wantInteract = true;
      } else if (state.dish && hand && hand.kind === 'plate') {
        targetStation = 'assembly'; wantInteract = true;
      } else if (state.dish && !hand) {
        targetStation = 'plates'; wantInteract = true;
      } else if (!hand && boardDone) {
        targetStation = 'board'; wantInteract = true;
      } else if (!hand && stoveSlot) {
        targetStation = 'stove'; wantInteract = true;
      } else if (!hand && burntSlot) {
        targetStation = 'stove'; wantInteract = true; // ambil gosong, lalu buang
      } else if (!hand && (boardBusy || stoveCooking)) {
        // Serial: tunggu proses yang sedang jalan selesai sebelum ambil baru
        // (pantry memberi duplikat bila kita ambil selagi ada yang dimasak).
        targetStation = boardBusy ? 'board' : 'stove'; wantInteract = false;
      } else if (hand && hand.kind === 'plate') {
        targetStation = 'trash'; wantInteract = true; // piring tanpa hidangan = buang
      } else if (hand && burntSlot === undefined && hand.stage === 'burnt') {
        targetStation = 'trash'; wantInteract = true;
      } else if (hand && handUseful(state, recipe)) {
        const np = nextProcess(hand);
        if (np && np.station === 'board') {
          if (boardBusy) { targetStation = 'board'; wantInteract = false; } // tunggu
          else { targetStation = 'board'; wantInteract = true; }
        } else if (np && np.station === 'stove') {
          const free = (state.stove || []).some((sl) => !sl.item);
          if (!free) { targetStation = 'stove'; wantInteract = false; } // tunggu slot
          else { targetStation = 'stove'; wantInteract = true; }
        } else {
          targetStation = 'assembly'; wantInteract = true; // sudah tahap yang dibutuhkan
        }
      } else if (hand) {
        targetStation = 'trash'; wantInteract = true; // barang tak terpakai
      } else if (order && recipe) {
        const need = missingNeed(state, recipe);
        if (need) { targetStation = 'pantry'; wantInteract = true; }
        else { targetStation = 'assembly'; wantInteract = false; } // menunggu proses selesai
      } else {
        // Belum ada pesanan: tunggu di tengah dapur (lewat jalur waypoint).
        if (ap.pathFor !== 'idle' || !ap.path || ap.repathIn <= 0) {
          ap.path = findPath(p.x, p.y, 640, 560);
          ap.pathFor = 'idle';
          ap.repathIn = 2;
        }
        while (ap.path.length > 1 && dist(p.x, p.y, ap.path[0].x, ap.path[0].y) <= 12) ap.path.shift();
        const wp = ap.path.length ? ap.path[0] : { x: 640, y: 560 };
        const d = dist(p.x, p.y, wp.x, wp.y);
        let mx = 0, my = 0;
        if (d > ARRIVE_DIST) { mx = (wp.x - p.x) / d; my = (wp.y - p.y) / d; }
        stepWorld(world, dt, { mx, my });
        return;
      }

      const pt = approachPoint(targetStation);
      const center = stationCenter(targetStation);
      // Jalur waypoint (dihitung ulang saat target berganti / berkala).
      if (ap.pathFor !== targetStation || !ap.path || ap.repathIn <= 0) {
        ap.path = findPath(p.x, p.y, pt.x, pt.y);
        ap.pathFor = targetStation;
        ap.repathIn = 2;
      }
      while (ap.path.length > 1 && dist(p.x, p.y, ap.path[0].x, ap.path[0].y) <= 12) ap.path.shift();
      const wp = ap.path.length ? ap.path[0] : pt;
      const d = dist(p.x, p.y, wp.x, wp.y);
      let mx = 0, my = 0;
      if (d > ARRIVE_DIST) { mx = (wp.x - p.x) / d; my = (wp.y - p.y) / d; }
      stepWorld(world, dt, { mx, my });
      // Interaksi saat cukup dekat dengan pusat stasiun.
      if (wantInteract && ap.cooldown <= 0 &&
          dist(state.player.x, state.player.y, center.x, center.y) <= INTERACT_DIST) {
        interact(world);
        ap.cooldown = 0.25;
      }
    },
  };
  return ap;
}

export function runAutopilot(world, seconds) {
  const ap = makeAutopilot(world);
  const steps = Math.max(0, Math.round((seconds || 0) * 60));
  for (let i = 0; i < steps; i++) {
    if (world.state && world.state.over) break;
    ap.update(DT);
  }
  return world;
}

function ensureVipAndShoes(world) {
  const s = world.state;
  if (!s) return;
  // Pastikan ada satu pesanan VIP.
  if ((s.orders || []).length && !s.orders.some((o) => o.vip)) {
    s.orders[0].vip = true;
    if (s.orders[0].maxPatience) s.orders[0].patience = s.orders[0].maxPatience;
  }
  // Pastikan sepatu level 1.
  if ((s.upgrades.shoes || 0) < 1) {
    if (s.coins < 30) s.coins = 30;
    applyUpgrade(s, 'shoes');
  }
}

export function stageShot(name, world) {
  if (!world || !world.state) return { screen: SCREEN_TITLE, best: 0 };
  const s = world.state;
  if (name === 'start') {
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    runAutopilot(world, 45);
    ensureVipAndShoes(world);
    return { screen: SCREEN_PLAY, best: s.score || 0 };
  }
  if (name === 'rush') {
    const seed = typeof s.seed === 'number' ? s.seed : 12345;
    const rushWorld = createWorld(seed, { difficulty: 'rush' });
    runAutopilot(rushWorld, 30);
    // Serahkan dunia rush ke pemanggil (agar bisa digambar dari world yang sama).
    world.state = rushWorld.state;
    return { screen: SCREEN_PLAY, best: world.state.score || 0 };
  }
  if (name === 'end') {
    // Main sampai game over (shift 180 dtk; beri batas 400 dtk simulasi).
    for (let t = 0; t < 400 && !world.state.over; t += 30) {
      runAutopilot(world, 30);
    }
    world.state.over = true;
    return { screen: SCREEN_OVER, best: world.state.score || 0 };
  }
  if (name === 'upgrade') {
    s.coins = 120;
    s.upgrades = { shoes: 1, burner: 0, patience: 1 };
    return { screen: SCREEN_UPGRADE, best: 0 };
  }
  if (name === 'endless') {
    const seed = typeof s.seed === 'number' ? s.seed : 777;
    const ew = createWorld(seed, { endless: true });
    runAutopilot(ew, 60);
    // Waktu sekitar 300 detik.
    ew.state.time = 300;
    if (ew.state.timeLeft !== undefined && !Number.isFinite(ew.state.timeLeft)) {
      // endless: timeLeft tak hingga — biarkan.
    }
    // Tiga pesanan aktif termasuk satu VIP.
    while ((ew.state.orders || []).length < 3 && ew.state.time < 600) {
      runAutopilot(ew, 10);
      ew.state.time = Math.min(ew.state.time + 10, 590);
    }
    if (ew.state.orders.length) ew.state.orders[0].vip = true;
    // Tiga slot kompor (tungku ekstra level 1).
    ew.state.upgrades.burner = 1;
    while (ew.state.stove.length < 3) {
      ew.state.stove.push({ item: null, progress: 0, time: 0, done: false, burnt: false, burnIn: 0 });
    }
    ew.state.time = 300;
    // Serahkan dunia endless ke pemanggil (agar bisa digambar dari world yang sama).
    world.state = ew.state;
    return { screen: SCREEN_PLAY, best: world.state.score || 0 };
  }
  return { screen: SCREEN_TITLE, best: 0 };
}
