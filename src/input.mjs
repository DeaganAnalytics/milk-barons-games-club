const keys = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right'
};

function movementVector(directions) {
  return {
    dx: Number(directions.has('right')) - Number(directions.has('left')),
    dy: Number(directions.has('down')) - Number(directions.has('up'))
  };
}

export function bindControls({interact, nudge}) {
  const held = new Set();
  const touch = new Map();
  const directionButtons = document.querySelectorAll('[data-dir]');

  addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const direction = keys[event.code];
    if (direction) {
      held.add(event.code);
      event.preventDefault();
    }
    if ((event.code === 'KeyE' || event.code === 'Space') && !event.repeat) {
      if (event.code === 'Space' && event.target.closest?.('button')) return;
      event.preventDefault();
      interact();
    }
  });
  addEventListener('keyup', event => held.delete(event.code));

  function clearInput() {
    held.clear();
    touch.clear();
    directionButtons.forEach(button => button.classList.remove('pressed'));
  }
  addEventListener('blur', clearInput);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInput();
  });

  directionButtons.forEach(button => {
    const direction = button.dataset.dir;
    const syncPressed = () => {
      button.classList.toggle('pressed', Array.from(touch.values()).includes(direction));
    };
    const release = event => {
      touch.delete(event.pointerId);
      syncPressed();
    };
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      touch.set(event.pointerId, direction);
      syncPressed();
    });
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
    // Enter and Space activate a focused direction button.
    button.addEventListener('click', event => {
      if (event.detail !== 0) return;
      const {dx, dy} = movementVector(new Set([direction]));
      nudge(12 * dx, 12 * dy);
    });
  });
  document.getElementById('interact').addEventListener('click', interact);

  return () => movementVector(new Set([...Array.from(held, code => keys[code]), ...touch.values()]));
}
