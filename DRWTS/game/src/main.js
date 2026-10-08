// Boot: load data, size canvas for DPR, run the loop, pause when hidden.
import { Input } from './input.js';
import { Game } from './game.js';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const debug = new URLSearchParams(location.search).has('debug');
let w = 0, h = 0, dpr = 1;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  w = innerWidth; h = innerHeight;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
}
addEventListener('resize', resize);
resize();

const load = p => fetch(p, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(p + ' ' + r.status); return r.json(); });

try {
  const [level, phrases, lines] = await Promise.all([load('data/level.json'), load('data/phrases.json'), load('data/joby_lines.json')]);
  const bg = level.background ? await new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = level.background; }) : null;
  const input = new Input(canvas);
  input.mouseDebug = debug;
  const game = new Game(level, phrases, lines, input, debug, bg);
  window.game = game; // handy in the console
  if (debug) addEventListener('keydown', e => game.debugKey(e.code));

  let last = performance.now(), paused = false;
  document.addEventListener('visibilitychange', () => { paused = document.hidden; last = performance.now(); });
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!paused) game.update(dt);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    game.render(ctx, w, h);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
} catch (err) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#fff'; ctx.font = '16px system-ui'; ctx.fillText('Load error: ' + err.message, 20, 40);
  ctx.fillText('Run a local server: python3 -m http.server', 20, 64);
}
