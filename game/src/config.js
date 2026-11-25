// RASA RUSH v2 — konfigurasi: ukuran layar, stasiun dapur, bahan, resep, kesulitan,
// upgrade, dan tuning. Satu sumber kebenaran untuk angka-angka yang dipakai
// world.js, render.js dan shots.js.

export const VIEW = { width: 1280, height: 720 };
export const SHIFT_SECONDS = 180;
export const PLAYER_SPEED = 300;
export const PLAYER_RADIUS = 22;
export const INTERACT_RANGE = 96;
export const STEP = 1 / 60;

// Area lantai tempat koki boleh berjalan (di bawah papan pesanan).
export const FLOOR = { x: 16, y: 132, w: 1248, h: 572 };

// Stasiun dapur: id, nama, posisi, ukuran, warna, dan keterangan singkat.
export const STATIONS = [
  { id: 'pantry', name: 'Pantry', hint: 'Ambil bahan', x: 24, y: 148, w: 196, h: 118, color: '#8d6e63' },
  { id: 'board', name: 'Talenen', hint: 'Potong bahan', x: 244, y: 148, w: 196, h: 118, color: '#a1887f' },
  { id: 'stove', name: 'Kompor', hint: 'Masak di api', x: 464, y: 148, w: 232, h: 118, color: '#546e7a' },
  { id: 'plates', name: 'Piring', hint: 'Ambil piring', x: 720, y: 148, w: 150, h: 118, color: '#78909c' },
  { id: 'serve', name: 'Jendela Saji', hint: 'Antar pesanan', x: 894, y: 148, w: 362, h: 118, color: '#6d4c41' },
  { id: 'assembly', name: 'Meja Rakit', hint: 'Rakit hidangan', x: 420, y: 400, w: 440, h: 132, color: '#795548' },
  { id: 'trash', name: 'Tempat Sampah', hint: 'Buang bahan', x: 1064, y: 560, w: 192, h: 112, color: '#616161' },
];

export function stationById(id) {
  return STATIONS.find((s) => s.id === id);
}

// Tiga tingkat kesulitan: durasi shift, kecepatan koki, laju pesanan,
// kesabaran dasar, dan jumlah bintang awal.
export const DIFFICULTIES = {
  santai: { label: 'Santai', shiftSeconds: 240, speed: 320, spawnBase: 16, patienceBase: 60, stars: 4 },
  normal: { label: 'Normal', shiftSeconds: 180, speed: 300, spawnBase: 14, patienceBase: 52, stars: 3 },
  rush: { label: 'Rush', shiftSeconds: 150, speed: 340, spawnBase: 11, patienceBase: 44, stars: 3 },
};
export const DIFFICULTY_ORDER = ['santai', 'normal', 'rush'];

export function difficultyDef(key) {
  return DIFFICULTIES[key] || DIFFICULTIES.normal;
}

// Upgrade toko antar-aksi: dibeli pakai koin saat permainan dijeda.
// Biaya level n (0-based) = baseCost * (n + 1).
export const UPGRADES = {
  shoes: { id: 'shoes', name: 'Sepatu Cepat', desc: '+15% kecepatan gerak / level', baseCost: 30, max: 3 },
  burner: { id: 'burner', name: 'Tungku Ekstra', desc: '+1 slot kompor / level', baseCost: 50, max: 2 },
  patience: { id: 'patience', name: 'Pelanggan Sabar', desc: '+20% kesabaran order baru / level', baseCost: 40, max: 3 },
};
export const UPGRADE_ORDER = ['shoes', 'burner', 'patience'];

export function upgradeCost(id, level) {
  const def = UPGRADES[id];
  if (!def) return Infinity;
  return def.baseCost * (level + 1);
}

// Bahan mentah: nama, warna ikon, dan proses yang dibutuhkan.
// stage: 'raw' -> 'chopped' (talenen) dan/atau 'cooked' (kompor).
export const INGREDIENTS = {
  nasi: { name: 'Nasi', color: '#fff8e1', cook: 5, burnAfter: 9 },
  telur: { name: 'Telur', color: '#fffde7', cook: 4, burnAfter: 8 },
  cabai: { name: 'Cabai', color: '#e53935', chop: 2 },
  mie: { name: 'Mie', color: '#ffca28', cook: 6, burnAfter: 9 },
  ayam: { name: 'Ayam', color: '#ffb74d', chop: 2.5, cook: 5, burnAfter: 8 },
  sayur: { name: 'Sayur', color: '#66bb6a', chop: 2 },
  tusuk: { name: 'Tusuk', color: '#8d6e63' },
  sambal: { name: 'Sambal', color: '#d32f2f' },
  kacang: { name: 'Kacang', color: '#a1887f', cook: 4, burnAfter: 8 },
  teh: { name: 'Teh', color: '#6d4c41', cook: 4, burnAfter: 8 },
  es: { name: 'Es', color: '#4fc3f7' },
  jeruk: { name: 'Jeruk', color: '#fb8c00' },
};

// Satu kebutuhan resep: bahan + tahap akhir yang harus dipenuhi.
export const RECIPES = [
  {
    id: 'nasi-goreng',
    name: 'Nasi Goreng Kilat',
    color: '#ff8f00',
    needs: [
      { kind: 'nasi', stage: 'cooked' },
      { kind: 'telur', stage: 'cooked' },
      { kind: 'cabai', stage: 'chopped' },
    ],
    coins: 14,
  },
  {
    id: 'mie-ayam',
    name: 'Mie Ayam Rasa',
    color: '#fdd835',
    needs: [
      { kind: 'mie', stage: 'cooked' },
      { kind: 'ayam', stage: 'cooked' },
      { kind: 'sayur', stage: 'chopped' },
    ],
    coins: 16,
  },
  {
    id: 'sate-bakar',
    name: 'Sate Bakar',
    color: '#ef6c00',
    needs: [
      { kind: 'ayam', stage: 'cooked' },
      { kind: 'tusuk', stage: 'raw' },
      { kind: 'sambal', stage: 'raw' },
    ],
    coins: 18,
  },
  {
    id: 'gado-gado',
    name: 'Gado-Gado Ceria',
    color: '#43a047',
    needs: [
      { kind: 'sayur', stage: 'chopped' },
      { kind: 'telur', stage: 'cooked' },
      { kind: 'kacang', stage: 'cooked' },
    ],
    coins: 15,
  },
  {
    id: 'es-teh',
    name: 'Es Teh Melati',
    color: '#29b6f6',
    needs: [
      { kind: 'teh', stage: 'cooked' },
      { kind: 'es', stage: 'raw' },
    ],
    coins: 10,
  },
  {
    id: 'ayam-geprek',
    name: 'Ayam Geprek Pedas',
    color: '#c62828',
    needs: [
      { kind: 'ayam', stage: 'cooked' },
      { kind: 'sambal', stage: 'raw' },
      { kind: 'nasi', stage: 'cooked' },
    ],
    coins: 20,
  },
  {
    id: 'soto-ayam',
    name: 'Soto Ayam Hangat',
    color: '#ffb300',
    needs: [
      { kind: 'ayam', stage: 'cooked' },
      { kind: 'mie', stage: 'cooked' },
      { kind: 'sayur', stage: 'chopped' },
    ],
    coins: 22,
  },
  {
    id: 'es-jeruk',
    name: 'Es Jeruk Segar',
    color: '#fb8c00',
    needs: [
      { kind: 'jeruk', stage: 'raw' },
      { kind: 'es', stage: 'raw' },
    ],
    coins: 12,
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

// Tahap proses berikutnya untuk sebuah bahan, atau null bila sudah selesai.
export function nextProcess(item) {
  const def = INGREDIENTS[item.kind];
  if (!def) return null;
  if (def.chop && item.stage === 'raw') return { station: 'board', time: def.chop, to: 'chopped' };
  if (def.cook && item.stage !== 'cooked' && item.stage !== 'burnt') {
    return { station: 'stove', time: def.cook, to: 'cooked', burnAfter: def.burnAfter };
  }
  return null;
}

// Tuning pesanan: makin lama shift berjalan, pesanan datang makin cepat.
// Varian lama (tanpa argumen) = kesulitan Normal, demi kompatibilitas.
export function spawnInterval(elapsed) {
  return spawnIntervalFor('normal', elapsed, false);
}
export function orderPatience(elapsed) {
  return orderPatienceFor('normal', elapsed, false);
}

// Interval spawn per kesulitan. Endless: mengecil 1 detik tiap 30 detik, min 6.
export function spawnIntervalFor(difficulty, elapsed, endless) {
  const def = difficultyDef(difficulty);
  if (endless) return Math.max(6, def.spawnBase - Math.floor(elapsed / 30));
  const t = elapsed / def.shiftSeconds;
  return Math.max(6, def.spawnBase - 6 * t);
}

// Kesabaran dasar order baru per kesulitan. Endless: mengecil 1 detik tiap
// 20 detik, min 30 (variasi acak + bonus VIP/upgrade diterapkan di world.js).
export function orderPatienceFor(difficulty, elapsed, endless) {
  const def = difficultyDef(difficulty);
  if (endless) return Math.max(30, def.patienceBase - Math.floor(elapsed / 20));
  const t = elapsed / def.shiftSeconds;
  return Math.max(20, def.patienceBase - 16 * t);
}

export const MAX_ORDERS = 4;
export const MAX_STARS = 3;
export const TIP_MAX = 10;

// Pelanggan VIP: ~15% order baru; patience x1.15, koin x2, tip x2.
export const VIP_CHANCE = 0.15;
export const VIP_PATIENCE_MULT = 1.15;
export const VIP_COIN_MULT = 2;
