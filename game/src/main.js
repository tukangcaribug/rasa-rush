// RASA RUSH — game loop, layar, wiring input/audio/render.
// ?seed=N untuk RNG deterministik; ?shot=start|play|end menggambar satu scene statis.

import { STEP, VIEW } from './config.js';
import { createWorld, stepWorld, EVENT_FAIL, EVENT_ORDER, EVENT_OVER, EVENT_SERVED } from './world.js';
import { createInput } from './input.js';
import { drawScreen, statusText, SCREEN_OVER, SCREEN_PAUSE, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { isMuted, playSfx, startMusic, stopMusic, toggleMute, unlockAudio } from './audio.js';

const BEST_KEY = 'rasa-rush-best';

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

function main() {
  const canvas = document.getElementById('game');
  const status = document.getElementById('status');
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;

  const seed = readSeed();
  const world = createWorld(seed);
  const shot = readShot();
  let best = readBest();
  let screen = SCREEN_TITLE;
  let lastStatus = '';

  function render() {
    drawScreen(ctx, screen, world.state, best, isMuted());
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
  let last = performance.now();
  let acc = 0;

  function startGame() {
    world.state = createWorld(seed).state;
    screen = SCREEN_PLAY;
    startMusic();
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

    if (screen === SCREEN_TITLE) {
      if (input.consumeAnyKey()) {
        unlockAudio();
        playSfx('click');
        startGame();
      }
      render();
      return;
    }

    if (screen === SCREEN_OVER) {
      if (input.consumeRestart()) {
        playSfx('click');
        startGame();
      }
      render();
      return;
    }

    if (input.consumePause()) {
      screen = screen === SCREEN_PAUSE ? SCREEN_PLAY : SCREEN_PAUSE;
      playSfx('click');
    }
    if (input.consumeRestart()) {
      playSfx('click');
      startGame();
      render();
      return;
    }
    if (screen === SCREEN_PAUSE) {
      render();
      return;
    }

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
        if (world.state.score > best) {
          best = world.state.score;
          writeBest(best);
        }
        playSfx(world.state.stars > 0 ? 'serve' : 'fail');
      }
    }
    render();
  }

  render();
  requestAnimationFrame(frame);
}

main();
