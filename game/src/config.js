// RASA RUSH — konfigurasi: ukuran layar, stasiun dapur, bahan, resep, dan tuning.
// Satu sumber kebenaran untuk angka-angka yang dipakai world.js, render.js dan shots.js.

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
export function spawnInterval(elapsed) {
  const t = elapsed / SHIFT_SECONDS;
  return 14 - 6 * t;
}
export function orderPatience(elapsed) {
  const t = elapsed / SHIFT_SECONDS;
  return 52 - 16 * t;
}
export const MAX_ORDERS = 4;
export const MAX_STARS = 3;
export const TIP_MAX = 10;
