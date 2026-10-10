// Floating virtual joystick (touch) + arrows/WASD (desktop). Sets `want` to a 4-way dir.
const KEYS = {
  ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
};
const DEAD = 14; // px

export class Input {
  constructor(canvas) {
    this.want = null;
    this.stick = null; // {ax, ay, x, y}
    this.taps = [];    // pointerdown events for UI (buttons, title)
    this.mouseDebug = false; // set by main when ?debug=1: mouse clicks go to editor, not joystick

    addEventListener('keydown', e => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON')) return; // typing a name
      const k = KEYS[e.code];
      if (k) { this.want = { dx: k[0], dy: k[1] }; e.preventDefault(); }
      if (e.code === 'Space' || e.code === 'Enter') this.taps.push({ x: -1, y: -1, key: true });
    });
    canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      this.taps.push({ x: e.clientX, y: e.clientY, mouse: e.pointerType === 'mouse', shift: e.shiftKey });
      if (this.mouseDebug && e.pointerType === 'mouse') return;
      this.stick = { id: e.pointerId, ax: e.clientX, ay: e.clientY, x: e.clientX, y: e.clientY };
      canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      const s = this.stick;
      if (!s || s.id !== e.pointerId) return;
      s.x = e.clientX; s.y = e.clientY;
      const dx = s.x - s.ax, dy = s.y - s.ay;
      if (Math.hypot(dx, dy) < DEAD) return;
      this.want = Math.abs(dx) > Math.abs(dy) ? { dx: Math.sign(dx), dy: 0 } : { dx: 0, dy: Math.sign(dy) };
      // Re-anchor so the thumb can keep steering without dragging off-screen.
      const max = 50, len = Math.hypot(dx, dy);
      if (len > max) { s.ax = s.x - dx / len * max; s.ay = s.y - dy / len * max; }
    });
    const end = e => { if (this.stick && this.stick.id === e.pointerId) this.stick = null; };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
  }
  takeTaps() { const t = this.taps; this.taps = []; return t; }
  reset() { this.want = null; this.stick = null; this.taps = []; }
}
