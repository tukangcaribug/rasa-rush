// Scene ?shot=start|play|end untuk screenshot.
// Setiap scene memainkan aturan sungguhan dari state fresh dengan seed tetap,
// digerakkan autopilot yang berjalan ke stasiun dan memakai interact() yang sama
// dengan tombol E pemain — jadi frame yang dihasilkan adalah game sungguhan.

import { STATIONS, STEP, nextProcess, stationById } from './config.js';
import { interact, resetWorld, stepWorld } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const SAMPLE = STEP;
const RANGE = 96;

// Titik pendekatan stasiun: tengah stasiun, digeser ke arah lantai.
function approachPoint(id) {
  const s = stationById(id);
  return { x: s.x + s.w / 2, y: s.y + s.h + 46 };
}

function moveToward(state, point) {
  const p = state.player;
  const dx = point.x - p.x;
  const dy = point.y - p.y;
  const d = Math.hypot(dx, dy);
  if (d < 14) return { mx: 0, my: 0, interact: false };
  return { mx: dx / d, my: dy / d, interact: false };
}

// Stasiun terdekat pemain (dalam jangkauan), atau null. Dipakai autopilot supaya
// ia hanya berinteraksi di stasiun yang dituju — stasiun bersebelahan bisa saja
// lebih dekat dari posisi pendekatan.
function nearestStationId(state) {
  let best = null;
  let bestD = Infinity;
  for (const s of STATIONS) {
    const cx = Math.max(s.x, Math.min(state.player.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(state.player.y, s.y + s.h));
    const d = Math.hypot(state.player.x - cx, state.player.y - cy);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return bestD <= RANGE ? best.id : null;
}

// Jalan ke stasiun `id`, lalu panggil `act` sekali saat stasiun itu yang terdekat.
// Mengembalikan true bila aksi sudah dilakukan.
function goAndAct(world, id, act) {
  const state = world.state;
  if (nearestStationId(state) === id) {
    act();
    return true;
  }
  return false;
}

// Autopilot: mesin state kecil yang menyelesaikan satu pesanan demi satu pesanan.
// pick (pantry) -> process (potong/masak) -> assembly -> plate -> dish -> serve.
export function makeAutopilot(world) {
  const pilot = { mode: 'pick' };

  pilot.input = function input(state) {
    const order = state.orders[0];
    if (!order) return moveToward(state, { x: 640, y: 560 });
    if (state.dish && !state.player.hand && pilot.mode !== 'plate' && pilot.mode !== 'dish') {
      pilot.mode = 'plate';
    }

    switch (pilot.mode) {
      case 'pick': {
        if (state.player.hand) {
          pilot.mode = 'process';
          return { mx: 0, my: 0, interact: false };
        }
        if (goAndAct(world, 'pantry', () => interact(world))) pilot.mode = 'process';
        return moveToward(state, approachPoint('pantry'));
      }
      case 'process': {
        const hand = state.player.hand;
        if (!hand) {
          pilot.mode = 'pick';
          return { mx: 0, my: 0, interact: false };
        }
        const proc = nextProcess(hand);
        if (!proc) {
          pilot.mode = 'assembly';
          return { mx: 0, my: 0, interact: false };
        }
        const stationId = proc.station;
        if (goAndAct(world, stationId, () => interact(world))) {
          if (!state.player.hand) pilot.mode = stationId === 'board' ? 'waitBoard' : 'waitStove';
        }
        return moveToward(state, approachPoint(stationId));
      }
      case 'waitBoard': {
        if (!state.board.item) {
          pilot.mode = 'pick';
          return { mx: 0, my: 0, interact: false };
        }
        if (state.board.done && goAndAct(world, 'board', () => interact(world))) {
          pilot.mode = state.player.hand ? 'process' : 'waitBoard';
        }
        return moveToward(state, approachPoint('board'));
      }
      case 'waitStove': {
        const slot = state.stove.find((b) => b.item);
        if (!slot) {
          pilot.mode = 'pick';
          return { mx: 0, my: 0, interact: false };
        }
        if (slot.done && !slot.burnt && goAndAct(world, 'stove', () => interact(world))) {
          pilot.mode = state.player.hand ? 'process' : 'waitStove';
        }
        return moveToward(state, approachPoint('stove'));
      }
      case 'assembly': {
        if (!state.player.hand) {
          pilot.mode = state.dish ? 'plate' : 'pick';
          return { mx: 0, my: 0, interact: false };
        }
        if (goAndAct(world, 'assembly', () => interact(world))) {
          pilot.mode = state.dish ? 'plate' : 'pick';
        }
        return moveToward(state, approachPoint('assembly'));
      }
      case 'plate': {
        if (state.player.hand && state.player.hand.kind === 'plate') {
          pilot.mode = 'dish';
          return { mx: 0, my: 0, interact: false };
        }
        goAndAct(world, 'plates', () => interact(world));
        return moveToward(state, approachPoint('plates'));
      }
      case 'dish': {
        if (!state.dish) {
          pilot.mode = 'pick';
          return { mx: 0, my: 0, interact: false };
        }
        if (goAndAct(world, 'assembly', () => interact(world))) {
          if (state.player.hand && state.player.hand.kind === 'dish') pilot.mode = 'serve';
        }
        return moveToward(state, approachPoint('assembly'));
      }
      case 'serve': {
        if (!state.player.hand || state.player.hand.kind !== 'dish') {
          pilot.mode = 'pick';
          return { mx: 0, my: 0, interact: false };
        }
        goAndAct(world, 'serve', () => interact(world));
        return moveToward(state, approachPoint('serve'));
      }
      default:
        pilot.mode = 'pick';
        return { mx: 0, my: 0, interact: false };
    }
  };

  return pilot;
}

// Simulasikan `seconds` detik permainan dengan autopilot.
export function runAutopilot(world, seconds) {
  const pilot = makeAutopilot(world);
  const steps = Math.round(seconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) {
    if (world.state.over) break;
    stepWorld(world, SAMPLE, pilot.input(world.state));
  }
}

/**
 * Siapkan scene bernama (start, play, end) dari world fresh dan kembalikan
 * layar yang harus digambar + skor terbaik untuk ditampilkan.
 */
export function stageShot(name, world) {
  resetWorld(world, world.state.seed);
  if (name !== 'play' && name !== 'end') {
    // Title: dunia berjalan sebentar di belakang layar judul.
    for (let i = 0; i < 5 / SAMPLE; i += 1) {
      stepWorld(world, SAMPLE, { mx: 0, my: 0, interact: false });
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'end') {
    // Main sampai shift habis (atau bintang habis): layar akhir yang sesungguhnya.
    runAutopilot(world, 200);
    return { screen: SCREEN_OVER, best: world.state.score };
  }
  // Play: main ~48 detik — cukup untuk menyajikan hidangan dan merakit yang berikut.
  runAutopilot(world, 48);
  return { screen: SCREEN_PLAY, best: world.state.score };
}
