// RASA RUSH v2 — game loop, layar, wiring input/audio/render.
// Alur: TITLE -> DIFFICULTY -> PLAY -> (UPGRADE / PAUSE) -> OVER -> SCORES.
// ?seed=N untuk RNG deterministik; ?shot=start|play|rush|end|upgrade|endless
// menggambar satu scene statis.

import { STEP, VIEW, DIFFICULTY_ORDER, UPGRADE_ORDER } from './config.js';
import { createWorld, stepWorld, applyUpgrade, EVENT_FAIL, EVENT_ORDER, EVENT_OVER, EVENT_SERVED } from './world.js';
import { createInput } from './input.js';
import {
  drawScreen, statusText, screenButtons,
  SCREEN_TITLE, SCREEN_DIFFICULTY, SCREEN_PLAY, SCREEN_PAUSE,
  SCREEN_UPGRADE, SCREEN_SCORES, SCREEN_OVER,
} from './render.js';
import { stageShot } from './shots.js';
import { isMuted, playSfx, startMusic, stopMusic, toggleMute, unlockAudio } from './audio.js';

const BEST_KEY = 'rasa-rush-best';
const SCORES_KEY = 'rasa-rush-scores-v2';

function readSeed() {
  const params = new URLSearchParams(window.location.search);
  const seed = Number(params.get('seed'));
  return Number.isFinite(seed) && seed !== 0 ? Math.abs(Math.floor(seed)) : 1;
}

function readShot() {
  return new URLSearchParams(window.location.search).get('shot');
}

function readBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeBest(score) {
  try {
    window.localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // localStorage tidak tersedia: skor terbaik sesi ini saja.
  }
}

function readScores() {
  try {
    const raw = window.localStorage.getItem(SCORES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeScores(list) {
  try {
    window.localStorage.setItem(SCORES_KEY, JSON.stringify(list));
  } catch {
    // localStorage tidak tersedia: abaikan.
  }
}

function main() {
  const canvas = document.getElementById('game');
  const status = document.getElementById('status');
  const touchbar = document.getElementById('touchbar');
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;

  const seed = readSeed();
  const world = createWorld(seed);
  const shot = readShot();
  let best = readBest();
  let bestList = readScores();
  let screen = SCREEN_TITLE;
  let lastStatus = '';

  // Pilihan menu kesulitan + endless, dan pilihan upgrade yang disorot.
  let selectedDifficulty = 'normal';
  let selectedEndless = false;
  let selectedUpgrade = 0;

  function ui() {
    return {
      best,
      bestList,
      muted: isMuted(),
      difficulty: world.state.difficulty,
      endless: world.state.endless,
      upgrades: world.state.upgrades,
      selectedDifficulty,
      selectedEndless,
      selectedUpgrade,
    };
  }

  function render() {
    // Touchbar HTML hanya relevan saat bermain; di layar lain ia menimpa
    // tepi bawah tombol canvas (pause / game over), jadi sembunyikan.
    if (touchbar) touchbar.style.display = screen === SCREEN_PLAY ? 'flex' : 'none';
    drawScreen(ctx, screen, world.state, ui());
    const text = statusText(screen, world.state);
    if (text !== lastStatus) {
      status.textContent = text;
      lastStatus = text;
    }
  }

  // Mode screenshot: gambar satu scene lalu berhenti (tanpa audio, tanpa loop).
  if (shot) {
    const staged = stageShot(shot, world);
    screen = staged.screen;
    best = Math.max(best, staged.best);
    render();
    return;
  }

  const input = createInput(canvas);

  // Tombol HTML di index.html (guard: tombol boleh tidak ada).
  const btnInteract = document.getElementById('btn-interact');
  if (btnInteract) btnInteract.addEventListener('click', () => input.pressInteract());
  const btnUpgrade = document.getElementById('btn-upgrade');
  if (btnUpgrade) btnUpgrade.addEventListener('click', () => input.pressUpgrade());
  const btnPause = document.getElementById('btn-pause');
  if (btnPause) btnPause.addEventListener('click', () => input.pressPause());

  let last = performance.now();
  let acc = 0;

  function startGame() {
    world.state = createWorld(seed, {
      difficulty: selectedDifficulty,
      endless: selectedEndless,
      upgrades: { shoes: 0, burner: 0, patience: 0 },
    }).state;
    selectedUpgrade = 0;
    input.clearClick();
    screen = SCREEN_PLAY;
    startMusic();
  }

  function saveScore() {
    const entry = {
      score: world.state.score,
      served: world.state.served,
      difficulty: world.state.difficulty,
      endless: world.state.endless,
      date: Date.now(),
    };
    bestList = [...bestList, entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    writeScores(bestList);
    if (world.state.score > best) {
      best = world.state.score;
      writeBest(best);
    }
  }

  function buyUpgrade(id) {
    const ok = applyUpgrade(world.state, id);
    if (ok) {
      playSfx('buy');
    } else {
      playSfx('fail');
    }
    return ok;
  }

  function cycleDifficulty(dir) {
    const i = DIFFICULTY_ORDER.indexOf(selectedDifficulty);
    const next = (i + dir + DIFFICULTY_ORDER.length) % DIFFICULTY_ORDER.length;
    selectedDifficulty = DIFFICULTY_ORDER[next];
    playSfx('click');
  }

  // Klik pada tombol layar (dari screenButtons). Kembalikan true bila kena tombol.
  function handleClick(pt) {
    if (!pt) return false;
    const buttons = screenButtons(screen, world.state) || [];
    const hit = buttons.find((b) => pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h);
    if (!hit) return false;
    const id = hit.id;
    if (id === 'start') {
      playSfx('click');
      if (screen === SCREEN_TITLE) screen = SCREEN_DIFFICULTY;
      else if (screen === SCREEN_DIFFICULTY) startGame();
      return true;
    }
    if (id === 'diff-santai' || id === 'diff-normal' || id === 'diff-rush') {
      selectedDifficulty = id.slice(5);
      playSfx('click');
      return true;
    }
    if (id === 'endless-toggle') {
      selectedEndless = !selectedEndless;
      playSfx('click');
      return true;
    }
    if (id === 'resume') {
      playSfx('click');
      screen = SCREEN_PLAY;
      return true;
    }
    if (id === 'upgrade') {
      playSfx('click');
      screen = SCREEN_UPGRADE;
      return true;
    }
    if (id === 'restart') {
      playSfx('click');
      startGame();
      return true;
    }
    if (id === 'scores') {
      playSfx('click');
      screen = SCREEN_SCORES;
      return true;
    }
    if (id === 'title') {
      playSfx('click');
      screen = SCREEN_TITLE;
      return true;
    }
    if (id.startsWith('buy-')) {
      buyUpgrade(id.slice(4));
      return true;
    }
    return false;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    if (input.consumeMute()) {
      toggleMute();
      if (isMuted()) stopMusic();
      else if (screen === SCREEN_PLAY) startMusic();
    }

    const click = input.consumeClick();

    if (screen === SCREEN_TITLE) {
      if (click) {
        if (!handleClick(click)) {
          unlockAudio();
          playSfx('click');
          screen = SCREEN_DIFFICULTY;
        }
      } else if (input.consumeAnyKey()) {
        unlockAudio();
        playSfx('click');
        screen = SCREEN_DIFFICULTY;
      }
      if (screen === SCREEN_DIFFICULTY) {
        // Enter yang sama men-set confirmQueued DAN anyKeyQueued di input.js;
        // anyKey sudah dikonsumsi di atas, tapi confirm sisa akan langsung
        // dimakan difficulty di frame berikut dan men-skip layar kesulitan.
        // Buang semua antrian menu yang berasal dari penekanan yang sama.
        input.consumeConfirm();
        input.consumeUp();
        input.consumeDown();
        input.consumeToggle();
      }
      render();
      return;
    }

    if (screen === SCREEN_DIFFICULTY) {
      if (click) handleClick(click);
      if (input.consumeUp()) cycleDifficulty(-1);
      if (input.consumeDown()) cycleDifficulty(1);
      if (input.consumeToggle()) {
        selectedEndless = !selectedEndless;
        playSfx('click');
      }
      if (input.consumeConfirm()) {
        unlockAudio();
        playSfx('click');
        startGame();
      }
      render();
      return;
    }

    if (screen === SCREEN_OVER) {
      if (click) handleClick(click);
      if (input.consumeRestart()) {
        playSfx('click');
        startGame();
      } else if (input.consumeConfirm() || input.consumeAnyKey()) {
        playSfx('click');
        screen = SCREEN_SCORES;
      }
      render();
      return;
    }

    if (screen === SCREEN_SCORES) {
      if (click) handleClick(click);
      if (input.consumeRestart()) {
        playSfx('click');
        startGame();
      } else if (input.consumeAnyKey()) {
        playSfx('click');
        screen = SCREEN_TITLE;
      }
      render();
      return;
    }

    if (screen === SCREEN_UPGRADE) {
      if (click) handleClick(click);
      if (input.consumeUp()) {
        selectedUpgrade = (selectedUpgrade - 1 + UPGRADE_ORDER.length) % UPGRADE_ORDER.length;
        playSfx('click');
      }
      if (input.consumeDown()) {
        selectedUpgrade = (selectedUpgrade + 1) % UPGRADE_ORDER.length;
        playSfx('click');
      }
      if (input.consumeConfirm()) {
        buyUpgrade(UPGRADE_ORDER[selectedUpgrade]);
      }
      if (input.consumeUpgrade() || input.consumePause()) {
        playSfx('click');
        screen = SCREEN_PLAY;
      }
      if (input.consumeRestart()) {
        playSfx('click');
        startGame();
        render();
        return;
      }
      render();
      return;
    }

    if (screen === SCREEN_PAUSE) {
      if (click) handleClick(click);
      if (input.consumeUpgrade()) {
        playSfx('click');
        screen = SCREEN_UPGRADE;
      } else if (input.consumePause()) {
        playSfx('click');
        screen = SCREEN_PLAY;
      }
      if (input.consumeRestart()) {
        playSfx('click');
        startGame();
        render();
        return;
      }
      render();
      return;
    }

    // SCREEN_PLAY
    if (input.consumePause()) {
      screen = SCREEN_PAUSE;
      playSfx('click');
      render();
      return;
    }
    if (input.consumeUpgrade()) {
      screen = SCREEN_UPGRADE;
      playSfx('click');
      render();
      return;
    }
    if (input.consumeRestart()) {
      playSfx('click');
      startGame();
      render();
      return;
    }
    // Klik di PLAY dipakai untuk jalan (moveDirection); buang sisa klik UI.
    void click;

    acc += dt;
    while (acc >= STEP) {
      acc -= STEP;
      const dir = input.moveDirection(world.state.player);
      const events = stepWorld(world, STEP, {
        mx: dir.mx,
        my: dir.my,
        interact: input.consumeInteract(),
      });
      if (events & EVENT_ORDER) playSfx('ding');
      if (events & EVENT_SERVED) playSfx('serve');
      if (events & EVENT_FAIL) playSfx('fail');
      if (events & EVENT_OVER) {
        screen = SCREEN_OVER;
        stopMusic();
        saveScore();
        playSfx(world.state.stars > 0 ? 'serve' : 'fail');
      }
    }
    render();
  }

  render();
  requestAnimationFrame(frame);
}

main();
