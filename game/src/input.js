// Input keyboard + mouse untuk RASA RUSH v2.
// WASD/panah gerak, klik mouse jalan ke titik, E/Spasi interaksi, P jeda, M bisu,
// R ulang, U toko upgrade, ArrowUp/Down + Enter untuk menu, klik canvas untuk tombol UI.

export function createInput(canvas) {
  const keys = new Set();
  let clickTarget = null;
  let clickPoint = null;
  let interactQueued = false;
  let pauseQueued = false;
  let muteQueued = false;
  let restartQueued = false;
  let anyKeyQueued = false;
  let upgradeQueued = false;
  let upQueued = false;
  let downQueued = false;
  let confirmQueued = false;
  let toggleQueued = false;

  function keyName(e) {
    return e.key.toLowerCase();
  }

  window.addEventListener('keydown', (e) => {
    const k = keyName(e);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (!e.repeat) {
      if (k === 'e' || k === ' ') interactQueued = true;
      if (k === 'p' || k === 'escape') pauseQueued = true;
      if (k === 'm') muteQueued = true;
      if (k === 'r') restartQueued = true;
      if (k === 'u') upgradeQueued = true;
      if (k === 'arrowup') upQueued = true;
      if (k === 'arrowdown') downQueued = true;
      if (k === 'enter') confirmQueued = true;
      if (k === 't' || k === 'arrowleft' || k === 'arrowright') toggleQueued = true;
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
    const pt = {
      x: (e.clientX - rect.left) / sx,
      y: (e.clientY - rect.top) / sy,
    };
    clickTarget = pt;
    clickPoint = { x: pt.x, y: pt.y };
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
    // Tombol U: buka/tutup toko upgrade.
    consumeUpgrade() {
      const v = upgradeQueued;
      upgradeQueued = false;
      return v;
    },
    // Navigasi menu: ArrowUp / ArrowDown / Enter.
    consumeUp() {
      const v = upQueued;
      upQueued = false;
      return v;
    },
    consumeDown() {
      const v = downQueued;
      downQueued = false;
      return v;
    },
    consumeConfirm() {
      const v = confirmQueued;
      confirmQueued = false;
      return v;
    },
    // Toggle (T atau panah kiri/kanan): dipakai untuk saklar Endless di menu.
    consumeToggle() {
      const v = toggleQueued;
      toggleQueued = false;
      return v;
    },
    // Klik canvas terakhir (koordinat game 1280x720), sekali pakai.
    consumeClick() {
      const v = clickPoint;
      clickPoint = null;
      return v;
    },
    // Dipanggil tombol HTML di index.html (btn-interact / btn-upgrade / btn-pause).
    pressInteract() {
      interactQueued = true;
    },
    pressUpgrade() {
      upgradeQueued = true;
    },
    pressPause() {
      pauseQueued = true;
    },
    clearClick() {
      clickTarget = null;
      clickPoint = null;
    },
  };
}
