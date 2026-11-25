// Input keyboard + mouse untuk RASA RUSH.
// WASD/panah gerak, klik mouse jalan ke titik, E/Spasi interaksi, P jeda, M bisu, R ulang.

export function createInput(canvas) {
  const keys = new Set();
  let clickTarget = null;
  let interactQueued = false;
  let pauseQueued = false;
  let muteQueued = false;
  let restartQueued = false;
  let anyKeyQueued = false;

  function keyName(e) {
    return e.key.length === 1 ? e.key.toLowerCase() : e.key;
  }

  window.addEventListener('keydown', (e) => {
    const k = keyName(e);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (!e.repeat) {
      if (k === 'e' || k === ' ') interactQueued = true;
      if (k === 'p' || k === 'escape') pauseQueued = true;
      if (k === 'm') muteQueued = true;
      if (k === 'r') restartQueued = true;
      anyKeyQueued = true;
    }
    keys.add(k);
  });
  window.addEventListener('keyup', (e) => keys.delete(keyName(e)));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = rect.width / canvas.width;
    const sy = rect.height / canvas.height;
    clickTarget = {
      x: (e.clientX - rect.left) / sx,
      y: (e.clientY - rect.top) / sy,
    };
    anyKeyQueued = true;
  });

  return {
    // Arah gerak -1..1 dari keyboard, atau menuju titik klik bila ada.
    moveDirection(player) {
      let mx = 0;
      let my = 0;
      if (keys.has('a') || keys.has('arrowleft')) mx -= 1;
      if (keys.has('d') || keys.has('arrowright')) mx += 1;
      if (keys.has('w') || keys.has('arrowup')) my -= 1;
      if (keys.has('s') || keys.has('arrowdown')) my += 1;
      if (mx === 0 && my === 0 && clickTarget) {
        const dx = clickTarget.x - player.x;
        const dy = clickTarget.y - player.y;
        const d = Math.hypot(dx, dy);
        if (d < 10) {
          clickTarget = null;
        } else {
          mx = dx / d;
          my = dy / d;
        }
      } else if (mx !== 0 || my !== 0) {
        clickTarget = null;
      }
      return { mx, my };
    },
    consumeInteract() {
      const v = interactQueued;
      interactQueued = false;
      return v;
    },
    consumePause() {
      const v = pauseQueued;
      pauseQueued = false;
      return v;
    },
    consumeMute() {
      const v = muteQueued;
      muteQueued = false;
      return v;
    },
    consumeRestart() {
      const v = restartQueued;
      restartQueued = false;
      return v;
    },
    consumeAnyKey() {
      const v = anyKeyQueued;
      anyKeyQueued = false;
      return v;
    },
    clearClick() {
      clickTarget = null;
    },
  };
}
