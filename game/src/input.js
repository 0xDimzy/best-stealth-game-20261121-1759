// Night Ledger — keyboard and mouse input.
export function makeInput(canvas) {
  const input = {
    up: false, down: false, left: false, right: false, sneak: false,
    mouseX: 0, mouseY: 0, clicked: false, anyKey: false,
    pausePressed: false, restartPressed: false, mutePressed: false,
  };
  const keys = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
  };
  window.addEventListener('keydown', (e) => {
    input.anyKey = true;
    if (keys[e.code]) { input[keys[e.code]] = true; e.preventDefault(); }
    if (e.code === 'KeyP' || e.code === 'Escape') input.pausePressed = true;
    if (e.code === 'KeyR') input.restartPressed = true;
    if (e.code === 'KeyM') input.mutePressed = true;
  });
  window.addEventListener('keyup', (e) => {
    if (keys[e.code]) input[keys[e.code]] = false;
  });
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    input.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    input.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
  });
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    input.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    input.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    input.clicked = true;
    input.anyKey = true;
  });
  return input;
}

export function consumeFrame(input) {
  const frame = { ...input };
  input.clicked = false;
  input.pausePressed = false;
  input.restartPressed = false;
  input.mutePressed = false;
  return frame;
}
