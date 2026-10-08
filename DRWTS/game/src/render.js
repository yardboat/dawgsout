// Greybox renderer: world layers + camera. Swap layer 1 for map_beauty.png on Thursday.
const COLORS = {
  townie: '#6ec6c6', bourbon: '#ad7a2b', watt40: '#d93d34', ga_theatre: '#9547c9',
  city_bar: '#2a96dc', buddha_bar: '#e43f8c', last_resort: '#2bb36e', sideways: '#ee8a2c', arch: '#f8db96',
};
const STREET = '#f3e8c7', BLOCK = '#474855', BG = '#1d2240';

export class Camera {
  constructor(WW, WH) { this.WW = WW; this.WH = WH; this.home(); }
  home() { this.fx = this.WW / 2; this.fy = this.WH / 2; this.zoom = 1; }
  apply(ctx, w, h) {
    this.w = w; this.h = h;
    this.s = Math.min(w / this.WW, h / this.WH) * this.zoom;
    ctx.translate(w / 2, h / 2); ctx.scale(this.s, this.s); ctx.translate(-this.fx, -this.fy);
  }
  toWorld(sx, sy) { return [(sx - this.w / 2) / this.s + this.fx, (sy - this.h / 2) / this.s + this.fy]; }
  // Ease toward a focus point / zoom.
  ease(fx, fy, zoom, k) { this.fx += (fx - this.fx) * k; this.fy += (fy - this.fy) * k; this.zoom += (zoom - this.zoom) * k; }
}

export function drawWorld(ctx, maze, debug, bg) {
  const T = maze.T, L = maze.level;
  if (bg) {
    ctx.drawImage(bg, 0, 0, maze.W * T, maze.H * T);
    drawSigns(ctx, maze);
    if (debug) {
      ctx.fillStyle = 'rgba(0,160,255,.28)';
      for (let r = 0; r < maze.H; r++) for (let c = 0; c < maze.W; c++) if (maze.g[r][c] !== '#') ctx.fillRect(c * T, r * T, T, T);
      drawGrid(ctx, maze);
    }
    return;
  }
  ctx.fillStyle = BLOCK; ctx.fillRect(0, 2 * T, maze.W * T, (maze.H - 4) * T);
  ctx.fillStyle = BG; ctx.fillRect(0, 0, maze.W * T, 2 * T); ctx.fillRect(0, (maze.H - 2) * T, maze.W * T, 2 * T);
  ctx.fillStyle = STREET;
  for (let r = 0; r < maze.H; r++) for (let c = 0; c < maze.W; c++) if (maze.g[r][c] !== '#') ctx.fillRect(c * T, r * T, T + 0.5, T + 0.5);

  // Street names
  ctx.font = `600 ${T * 0.22}px system-ui,sans-serif`; ctx.fillStyle = 'rgba(70,60,40,.55)'; ctx.textBaseline = 'middle';
  for (const [r, name] of Object.entries(L.streets.horizontal)) { ctx.textAlign = 'left'; ctx.fillText(name, 1.15 * T, (+r + 0.5) * T); }

  // Landmarks (blocks with names). The Arch is an overlay drawn later.
  for (const lm of L.landmarks) {
    if (lm.id === 'arch') continue;
    const [x1, y1, x2, y2] = lm.rect;
    const x = x1 * T + 4, y = y1 * T + 4, w = (x2 - x1 + 1) * T - 8, h = (y2 - y1 + 1) * T - 8;
    ctx.fillStyle = COLORS[lm.id] || '#888'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 ${T * 0.26}px system-ui,sans-serif`;
    wrapText(ctx, lm.name, x + w / 2, y + h / 2, w - 10, T * 0.32);
  }

  if (debug) drawGrid(ctx, maze);
}

function drawGrid(ctx, maze) {
  const T = maze.T;
  {
    ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 1;
    for (let c = 0; c <= maze.W; c++) { ctx.beginPath(); ctx.moveTo(c * T, 0); ctx.lineTo(c * T, maze.H * T); ctx.stroke(); }
    for (let r = 0; r <= maze.H; r++) { ctx.beginPath(); ctx.moveTo(0, r * T); ctx.lineTo(maze.W * T, r * T); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.font = `${T * 0.18}px monospace`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    for (let r = 0; r < maze.H; r++) for (let c = 0; c < maze.W; c++) if (maze.g[r][c] !== '#') ctx.fillText(`${c},${r}`, c * T + 2, r * T + 2);
    ctx.textBaseline = 'middle';
  }
}

export function drawOverlay(ctx, maze, bg) {
  if (bg) return; // the art already has the arch
  const T = maze.T, arch = maze.level.landmarks.find(l => l.id === 'arch');
  if (!arch) return;
  const [x1, y1, x2] = arch.rect, y = (y1 + 0.5) * T;
  ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = T * 0.12;
  ctx.beginPath(); ctx.moveTo(x1 * T + 6, y + T * 0.4); ctx.lineTo(x1 * T + 6, y - T * 0.2);
  ctx.quadraticCurveTo((x1 + x2 + 1) * T / 2, y - T * 0.9, (x2 + 1) * T - 6, y - T * 0.2); ctx.lineTo((x2 + 1) * T - 6, y + T * 0.4); ctx.stroke();
  ctx.fillStyle = '#1b1b1b'; ctx.font = `800 ${T * 0.2}px system-ui,sans-serif`; ctx.textAlign = 'center';
  ctx.fillText('THE ARCH', (x1 + x2 + 1) * T / 2, y - T * 0.15);
}

export function drawTokens(ctx, maze, words, time) {
  const T = maze.T;
  for (const tk of words.tokens) {
    if (tk.collected) continue;
    const cx = (tk.c + 0.5) * T, cy = (tk.r + 0.5) * T, w = T * 1.8, h = T * 0.7;
    const pulse = 1 + Math.sin(time * 4 + tk.index) * 0.04;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(pulse, pulse);
    ctx.shadowColor = 'rgba(255,200,0,.8)'; ctx.shadowBlur = 14;
    ctx.fillStyle = tk.flash > 0 && Math.floor(tk.flash * 12) % 2 === 0 ? '#e02020' : '#ffd23a';
    roundRect(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.lineWidth = 3; ctx.strokeStyle = '#1b1b1b'; ctx.stroke();
    ctx.fillStyle = '#1b1b1b'; ctx.textAlign = 'center'; ctx.font = `900 ${T * 0.34}px system-ui,sans-serif`;
    ctx.fillText(tk.word, 0, 2);
    ctx.restore();
  }
}

export function drawPlayer(ctx, maze, p, art = {}, time = 0) {
  const T = maze.T;
  drawWrapped(ctx, maze, p.x, (x) => {
    const cx = (x + 0.5) * T, cy = (p.y + 0.5) * T;
    const moving = p.dir.dx || p.dir.dy;
    const img = (p.dir.dx || p.dir.dy < 0) ? art.walk : art.front;
    if (img) {
      if (p.dir.dx) p.face = p.dir.dx;
      const w0 = img === art.walk ? T * 1.7 : T * 1.3, h = w0 * img.height / img.width;
      const bob = moving ? Math.abs(Math.sin(time * 14)) * T * 0.07 : 0;
      ctx.save(); ctx.translate(cx, cy + T * 0.4 - bob); if (img === art.walk && p.face < 0) ctx.scale(-1, 1);
      ctx.drawImage(img, -w0 / 2, -h, w0, h); ctx.restore();
      return;
    }
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, T * 0.38, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ba0c2f'; ctx.lineWidth = T * 0.09; ctx.stroke();
    ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.font = `900 ${T * 0.36}px system-ui,sans-serif`; ctx.fillText('D', cx, cy + 2);
  });
}

export function drawJoby(ctx, maze, j, sprite, time = 0) {
  const T = maze.T;
  drawWrapped(ctx, maze, j.x, (x) => {
    const cx = (x + 0.5) * T, cy = (j.y + 0.5) * T;
    if (sprite) {
      const h = T * 1.6, w = h * sprite.width / sprite.height;
      const bob = Math.abs(Math.sin(time * 10)) * T * 0.06, flip = j.dir.dx < 0;
      ctx.save(); ctx.translate(cx, cy + T * 0.45 - bob); if (flip) ctx.scale(-1, 1);
      ctx.drawImage(sprite, -w / 2, -h, w, h); ctx.restore();
      return;
    }
    ctx.fillStyle = j.awake ? '#c41010' : 'rgba(196,16,16,.35)';
    ctx.beginPath(); ctx.arc(cx, cy, T * 0.42, 0, 7); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `900 ${T * 0.38}px system-ui,sans-serif`; ctx.fillText('J', cx, cy + 2);
  });
}

// Draw twice near the wrap edges so actors slide smoothly through the tunnel.
function drawWrapped(ctx, maze, x, fn) {
  fn(x);
  if (x > maze.W - 1) fn(x - maze.W);
  if (x < 0) fn(x + maze.W);
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' '), lines = [];
  let line = '';
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, x, y + (i - (lines.length - 1) / 2) * lh));
}

// Hand-lettered plaques on rooftops. Anchored inside block rects, clamped so they never spill onto a street.
export function drawSigns(ctx, maze) {
  const T = maze.T;
  for (const lm of maze.level.landmarks) {
    if (!lm.sign) continue;
    const [x1, , x2] = lm.rect, maxW = (x2 - x1 + 1) * T - 14;
    ctx.font = `800 ${T * 0.36}px Georgia,'Times New Roman',serif`;
    const words = lm.name.split(' ');
    let lines = [lm.name];
    if (ctx.measureText(lm.name).width > maxW - 16 && words.length > 1) {
      const mid = Math.ceil(words.length / 2); lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
    }
    const lh = T * 0.4, tw = Math.min(maxW, Math.max(...lines.map(l => ctx.measureText(l).width)) + 18), th = lines.length * lh + 10;
    const cx = (lm.sign[0] + 0.5) * T, cy = (lm.sign[1] + 0.5) * T;
    const minX = x1 * T + 7 + tw / 2, maxX = (x2 + 1) * T - 7 - tw / 2;
    const x = Math.min(Math.max(cx, minX), maxX) - tw / 2, y = cy - th / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(40,25,10,.35)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
    roundRect(ctx, x, y, tw, th, 7); ctx.fillStyle = '#fbf3e1'; ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.lineWidth = 2.5; ctx.strokeStyle = '#2a1d14'; ctx.stroke();
    roundRect(ctx, x + 4, y + 4, tw - 8, th - 8, 4); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(160,40,30,.7)'; ctx.stroke();
    ctx.fillStyle = '#2a1d14'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, x + tw / 2, y + 5 + lh * (i + 0.5) + 1, tw - 12));
    ctx.restore();
  }
}
