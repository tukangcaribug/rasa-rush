// RASA RUSH v2 — state dan rules: gerak koki, proses masak/potong, pesanan, rakit,
// saji, skor, kesulitan, mode endless, upgrade, dan pelanggan VIP.
// Semua perubahan permainan lewat createWorld / step / interact, supaya shots.js dan
// main.js memakai aturan yang sama persis.

import {
  DIFFICULTIES, FLOOR, INTERACT_RANGE, MAX_ORDERS, MAX_STARS, PLAYER_RADIUS,
  RECIPES, STATIONS, TIP_MAX, UPGRADES, VIP_CHANCE, VIP_COIN_MULT,
  VIP_PATIENCE_MULT, difficultyDef, nextProcess, orderPatienceFor, recipeById,
  spawnIntervalFor, stationById, upgradeCost,
} from './config.js';
import { makeRng } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_ORDER = 1;
export const EVENT_SERVED = 2;
export const EVENT_FAIL = 4;
export const EVENT_BURN = 8;
export const EVENT_OVER = 16;
export const EVENT_PICKUP = 32;
export const EVENT_PLACE = 64;
export const EVENT_CHOP = 128;
export const EVENT_SIZZLE = 256;

export function makeItem(kind, stage = 'raw') {
  return { kind, stage };
}

function emptyBurner() {
  return { item: null, progress: 0, time: 0, done: false, burnt: false, burnIn: 0 };
}

function normalizeUpgrades(input) {
  const src = input || {};
  return {
    shoes: Math.max(0, Math.floor(src.shoes || 0)),
    burner: Math.max(0, Math.floor(src.burner || 0)),
    patience: Math.max(0, Math.floor(src.patience || 0)),
  };
}

export function createWorld(seed, opts = {}) {
  const difficulty = DIFFICULTIES[opts.difficulty] ? opts.difficulty : 'normal';
  const def = DIFFICULTIES[difficulty];
  const endless = !!opts.endless;
  const upgrades = normalizeUpgrades(opts.upgrades);
  const rng = makeRng(seed);
  const stove = [emptyBurner(), emptyBurner()];
  for (let i = 0; i < upgrades.burner; i += 1) stove.push(emptyBurner());
  return {
    state: {
      seed,
      rng,
      difficulty,
      endless,
      upgrades,
      shift: def.shiftSeconds,
      playerSpeed: def.speed * (1 + 0.15 * upgrades.shoes),
      time: 0,
      timeLeft: endless ? Infinity : def.shiftSeconds,
      score: 0,
      coins: 0,
      combo: 0,
      bestCombo: 0,
      stars: def.stars,
      served: 0,
      failed: 0,
      missed: 0,
      burned: 0,
      vipServed: 0,
      nextOrderId: 1,
      spawnIn: 0.5,
      orders: [],
      player: { x: 640, y: 560, hand: null },
      board: { item: null, progress: 0, time: 0, done: false },
      stove,
      assembly: [],
      dish: null,
      message: '',
      messageT: 0,
      over: false,
    },
  };
}

export function resetWorld(world, seed, opts = {}) {
  const fresh = createWorld(seed, opts);
  world.state = fresh.state;
}

// Beli satu level upgrade bila koin cukup dan belum max. Kembalikan true bila
// berhasil (koin berkurang); burner menambah satu slot kompor, shoes menaikkan
// kecepatan gerak. Harga level n (0-based) = baseCost * (n + 1).
export function applyUpgrade(state, id) {
  const def = UPGRADES[id];
  if (!def) return false;
  const level = state.upgrades[id] || 0;
  if (level >= def.max) return false;
  const cost = upgradeCost(id, level);
  if (state.coins < cost) return false;
  state.coins -= cost;
  state.upgrades[id] = level + 1;
  if (id === 'burner') state.stove.push(emptyBurner());
  if (id === 'shoes') {
    const d = difficultyDef(state.difficulty);
    state.playerSpeed = d.speed * (1 + 0.15 * state.upgrades.shoes);
  }
  return true;
}

function say(state, text) {
  state.message = text;
  state.messageT = 3;
}

// Bahan mentah apa yang paling dibutuhkan pesanan aktif (belum ada di mana pun)?
function neededRawKind(state) {
  const have = new Set();
  const count = (item) => {
    if (item) have.add(`${item.kind}:${item.stage}`);
  };
  count(state.player.hand);
  count(state.board.item);
  for (const b of state.stove) count(b.item);
  for (const it of state.assembly) count(it);
  if (state.dish) {
    const recipe = recipeById(state.dish.recipe);
    for (const n of recipe.needs) have.add(`${n.kind}:${n.stage}`);
  }
  for (const order of state.orders) {
    const recipe = recipeById(order.recipe);
    for (const need of recipe.needs) {
      if (have.has(`${need.kind}:${need.stage}`)) continue;
      // Bahan mentah yang, setelah diproses, memenuhi kebutuhan ini.
      return need.kind;
    }
  }
  return null;
}

function stationDistance(state, station) {
  const cx = Math.max(station.x, Math.min(state.player.x, station.x + station.w));
  const cy = Math.max(station.y, Math.min(state.player.y, station.y + station.h));
  const dx = state.player.x - cx;
  const dy = state.player.y - cy;
  return Math.hypot(dx, dy);
}

function nearestStation(state) {
  let best = null;
  let bestD = Infinity;
  for (const s of STATIONS) {
    const d = stationDistance(state, s);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return bestD <= INTERACT_RANGE ? best : null;
}

function spawnOrder(state) {
  const recipe = state.rng.pick(RECIPES);
  const base = orderPatienceFor(state.difficulty, state.time, state.endless);
  // Variasi kesabaran tiap order: base x (0.85..1.15), lalu bonus VIP dan upgrade.
  let patience = base * (0.85 + state.rng.next() * 0.3);
  const vip = state.rng.next() < VIP_CHANCE;
  if (vip) patience *= VIP_PATIENCE_MULT;
  patience *= 1 + 0.2 * (state.upgrades.patience || 0);
  state.orders.push({
    id: state.nextOrderId,
    recipe: recipe.id,
    patience,
    maxPatience: patience,
    vip,
  });
  state.nextOrderId += 1;
}

function dishMatchesAssembly(state) {
  for (const recipe of RECIPES) {
    if (recipe.needs.length !== state.assembly.length) continue;
    const pool = state.assembly.map((i) => `${i.kind}:${i.stage}`).sort().join('|');
    const want = recipe.needs.map((n) => `${n.kind}:${n.stage}`).sort().join('|');
    if (pool === want) return recipe;
  }
  return null;
}

// Aksi E / Spasi di stasiun terdekat. Mengembalikan bitmask event.
export function interact(world) {
  const state = world.state;
  if (state.over) return EVENT_NONE;
  const station = nearestStation(state);
  if (!station) return EVENT_NONE;
  const hand = state.player.hand;
  let events = EVENT_NONE;

  if (station.id === 'pantry') {
    if (hand) {
      say(state, 'Tangan penuh!');
      return EVENT_NONE;
    }
    const kind = neededRawKind(state) || state.rng.pick(RECIPES).needs[0].kind;
    state.player.hand = makeItem(kind, 'raw');
    events |= EVENT_PICKUP;
    return events;
  }

  if (station.id === 'plates') {
    if (hand) {
      say(state, 'Tangan penuh!');
      return EVENT_NONE;
    }
    state.player.hand = makeItem('plate', 'plate');
    events |= EVENT_PICKUP;
    return events;
  }

  if (station.id === 'board') {
    const slot = state.board;
    if (!slot.item && hand && hand.kind !== 'plate' && nextProcess(hand)?.station === 'board') {
      const proc = nextProcess(hand);
      slot.item = hand;
      slot.progress = 0;
      slot.time = proc.time;
      slot.done = false;
      state.player.hand = null;
      events |= EVENT_PLACE;
      return events;
    }
    if (slot.item && slot.done && !hand) {
      slot.item.stage = nextProcess(slot.item).to;
      state.player.hand = slot.item;
      state.board = { item: null, progress: 0, time: 0, done: false };
      events |= EVENT_PICKUP;
      return events;
    }
    if (slot.item && !slot.done) say(state, 'Masih dipotong...');
    else if (hand) say(state, 'Tidak bisa dipotong di sini');
    return events;
  }

  if (station.id === 'stove') {
    // Ambil dulu dari tungku yang sudah matang bila tangan kosong.
    if (!hand) {
      const done = state.stove.find((b) => b.item && (b.done || b.burnt));
      if (done) {
        state.player.hand = done.item;
        done.item = null;
        done.progress = 0;
        done.done = false;
        done.burnt = false;
        events |= EVENT_PICKUP;
        return events;
      }
      say(state, 'Belum ada yang matang');
      return events;
    }
    if (hand.kind === 'plate') {
      say(state, 'Piring tidak dimasak!');
      return events;
    }
    const proc = nextProcess(hand);
    if (!proc || proc.station !== 'stove') {
      say(state, 'Tidak bisa dimasak di sini');
      return events;
    }
    const free = state.stove.find((b) => !b.item);
    if (!free) {
      say(state, 'Kompor penuh!');
      return events;
    }
    free.item = hand;
    free.progress = 0;
    free.time = proc.time;
    free.done = false;
    free.burnt = false;
    free.burnIn = proc.burnAfter;
    state.player.hand = null;
    events |= EVENT_PLACE | EVENT_SIZZLE;
    return events;
  }

  if (station.id === 'assembly') {
    if (state.dish) {
      if (hand && hand.kind === 'plate') {
        state.player.hand = makeItem('dish', state.dish.recipe);
        state.dish = null;
        events |= EVENT_PICKUP;
        return events;
      }
      if (!hand) {
        say(state, 'Butuh piring dulu!');
        return events;
      }
      say(state, 'Hidangan sudah jadi!');
      return events;
    }
    if (hand && hand.kind !== 'plate' && hand.kind !== 'dish') {
      if (state.assembly.length >= 4) {
        say(state, 'Meja penuh!');
        return events;
      }
      state.assembly.push(hand);
      state.player.hand = null;
      events |= EVENT_PLACE;
      const recipe = dishMatchesAssembly(state);
      if (recipe) {
        state.assembly = [];
        state.dish = { recipe: recipe.id };
        say(state, `${recipe.name} jadi! Ambil pakai piring.`);
      }
      return events;
    }
    if (!hand && state.assembly.length > 0) {
      state.player.hand = state.assembly.pop();
      events |= EVENT_PICKUP;
      return events;
    }
    if (hand && hand.kind === 'plate') say(state, 'Taruh piring? Tidak — rakit bahan dulu');
    return events;
  }

  if (station.id === 'serve') {
    if (!hand || hand.kind !== 'dish') {
      say(state, 'Bawa hidangan di piring ke sini');
      return events;
    }
    const idx = state.orders.findIndex((o) => o.recipe === hand.stage);
    state.player.hand = null;
    if (idx >= 0) {
      const order = state.orders[idx];
      state.orders.splice(idx, 1);
      const recipe = recipeById(order.recipe);
      let tip = Math.round((order.patience / order.maxPatience) * TIP_MAX);
      if (order.vip) tip *= 2;
      const mult = 1 + 0.1 * state.combo;
      let earned = Math.round((recipe.coins + tip) * mult);
      if (order.vip) {
        earned *= VIP_COIN_MULT;
        state.vipServed += 1;
      }
      state.coins += earned;
      state.score += earned;
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      state.served += 1;
      say(state, order.vip
        ? `VIP tersaji! +${earned} koin (tip ${tip})`
        : `Tersaji! +${earned} koin (tip ${tip})`);
      events |= EVENT_SERVED;
    } else {
      state.combo = 0;
      state.stars -= 1;
      state.failed += 1;
      say(state, 'Salah pesanan! Bintang hilang.');
      events |= EVENT_FAIL;
      if (state.stars <= 0) {
        state.over = true;
        events |= EVENT_OVER;
      }
    }
    return events;
  }

  if (station.id === 'trash') {
    if (!hand) {
      say(state, 'Tidak ada yang dibuang');
      return events;
    }
    state.player.hand = null;
    events |= EVENT_PLACE;
    say(state, 'Dibuang.');
    return events;
  }

  return events;
}

function collideStations(state) {
  const p = state.player;
  for (const s of STATIONS) {
    // Dorong keluar hanya bila pusat koki masuk ke kotak stasiun yang diperbesar.
    if (p.x > s.x - PLAYER_RADIUS && p.x < s.x + s.w + PLAYER_RADIUS
      && p.y > s.y - PLAYER_RADIUS && p.y < s.y + s.h + PLAYER_RADIUS) {
      const dxl = p.x - (s.x - PLAYER_RADIUS);
      const dxr = (s.x + s.w + PLAYER_RADIUS) - p.x;
      const dyt = p.y - (s.y - PLAYER_RADIUS);
      const dyb = (s.y + s.h + PLAYER_RADIUS) - p.y;
      const m = Math.min(dxl, dxr, dyt, dyb);
      if (m === dxl) p.x = s.x - PLAYER_RADIUS;
      else if (m === dxr) p.x = s.x + s.w + PLAYER_RADIUS;
      else if (m === dyt) p.y = s.y - PLAYER_RADIUS;
      else p.y = s.y + s.h + PLAYER_RADIUS;
    }
  }
}

// Satu langkah simulasi. input: {mx, my, interact}. Kembalikan bitmask event.
export function stepWorld(world, dt, input) {
  const state = world.state;
  if (state.over) return EVENT_NONE;
  let events = EVENT_NONE;

  state.time += dt;
  // Endless: waktu berjalan terus, tidak ada batas shift.
  state.timeLeft = state.endless ? Infinity : Math.max(0, state.shift - state.time);
  if (state.messageT > 0) state.messageT -= dt;

  // Gerak koki (kecepatan dipengaruhi kesulitan + upgrade sepatu).
  const len = Math.hypot(input.mx || 0, input.my || 0);
  if (len > 0.01) {
    state.player.x += ((input.mx || 0) / len) * state.playerSpeed * dt;
    state.player.y += ((input.my || 0) / len) * state.playerSpeed * dt;
    state.player.x = Math.max(FLOOR.x + PLAYER_RADIUS, Math.min(FLOOR.x + FLOOR.w - PLAYER_RADIUS, state.player.x));
    state.player.y = Math.max(FLOOR.y + PLAYER_RADIUS, Math.min(FLOOR.y + FLOOR.h - PLAYER_RADIUS, state.player.y));
    collideStations(state);
  }

  // Talenen: potong berjalan otomatis.
  const slot = state.board;
  if (slot.item && !slot.done) {
    slot.progress += dt / slot.time;
    if (slot.progress >= 1) {
      slot.progress = 1;
      slot.done = true;
      events |= EVENT_CHOP;
    }
  }

  // Kompor: masak, lalu gosong bila dibiarkan.
  for (const b of state.stove) {
    if (!b.item) continue;
    if (!b.done) {
      b.progress += dt / b.time;
      if (b.progress >= 1) {
        b.progress = 1;
        b.done = true;
        const proc = nextProcess(b.item);
        if (proc) b.item.stage = proc.to;
        b.burnIn = b.burnIn || 8;
        events |= EVENT_SIZZLE;
      }
    } else if (!b.burnt) {
      b.burnIn -= dt;
      if (b.burnIn <= 0) {
        b.burnt = true;
        b.item.stage = 'burnt';
        state.burned += 1;
        say(state, 'Gosong! Buang ke tempat sampah.');
        events |= EVENT_BURN;
      }
    }
  }

  // Pesanan baru.
  state.spawnIn -= dt;
  if (state.spawnIn <= 0 && state.orders.length < MAX_ORDERS) {
    spawnOrder(state);
    state.spawnIn = spawnIntervalFor(state.difficulty, state.time, state.endless);
    events |= EVENT_ORDER;
  }

  // Kesabaran pesanan menipis.
  for (let i = state.orders.length - 1; i >= 0; i -= 1) {
    const o = state.orders[i];
    o.patience -= dt;
    if (o.patience <= 0) {
      state.orders.splice(i, 1);
      state.stars -= 1;
      state.missed += 1;
      state.combo = 0;
      say(state, 'Pesanan kabur! Bintang hilang.');
      events |= EVENT_FAIL;
      if (state.stars <= 0) {
        state.over = true;
        events |= EVENT_OVER;
      }
    }
  }

  // Interaksi (edge-triggered oleh pemanggil).
  if (input.interact) events |= interact(world);

  // Shift berakhir hanya bila bukan endless dan bintang belum habis.
  if (!state.endless && state.timeLeft <= 0 && !state.over) {
    state.over = true;
    events |= EVENT_OVER;
  }
  return events;
}

// Dipakai render/shots untuk info stasiun tanpa mengimpor config langsung.
export { stationById };
