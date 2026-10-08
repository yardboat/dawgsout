// Ambient life (visual only, never affects play): cars on the streets, fountain spray, drifting leaves, dust puffs.
const CAR_COLORS = ['#c94f3d', '#e9c46a', '#5b8fb9', '#7aa874', '#d98c5f', '#8a6fb0', '#f2efe6'];

export class Ambient {
  constructor(maze) {
    this.m = maze; this.T = maze.T;
    this.runs = findRuns(maze);
    this.cars = []; this.drops = []; this.leaves = []; this.puffs = [];
    this.fountain = maze.level.fountain || [747, 863];
    for (let i = 0; i < 5; i++) this.spawnCar(Math.random());
  }

  spawnCar(startAt = 0) {
    const run = this.runs[(Math.random() * this.runs.length) | 0], fwd = Math.random() < 0.5;
    this.cars.push({ run, fwd, p: startAt * run.len, speed: 1.3 + Math.random() * 1.2, color: CAR_COLORS[(Math.random() * CAR_COLORS.length) | 0] });
  }

  puff(x, y) {
    for (let i = 0; i < 4; i++) this.puffs.push({ x: x + (Math.random() - 0.5) * 16, y: y + (Math.random() - 0.5) * 8, vx: (Math.random() - 0.5) * 40, vy: -10 - Math.random() * 20, t: 0, life: 0.45, r: 5 + Math.random() * 5 });
  }

  update(dt) {
    for (const c of this.cars) c.p += c.speed * dt;
    const before = this.cars.length;
    this.cars = this.cars.filter(c => c.p < c.run.len);
    for (let i = this.cars.length; i < before; i++) this.spawnCar(0);

    // fountain spray
    const [fx, fy] = this.fountain;
    for (let i = 0; i < 2; i++) this.drops.push({ x: fx, y: fy - 14, vx: (Math.random() - 0.5) * 70, vy: -90 - Math.random() * 60, t: 0, life: 0.9 });
    for (const d of this.drops) { d.t += dt; d.vy += 260 * dt; d.x += d.vx * dt; d.y += d.vy * dt; }
    this.drops = this.drops.filter(d => d.t < d.life);

    // leaves drift across the map now and then
    if (Math.random() < dt * 0.9 && this.leaves.length < 12) {
      const W = this.m.W * this.T;
      this.leaves.push({ x: -20, y: Math.random() * this.m.H * this.T, vx: 40 + Math.random() * 50, ph: Math.random() * 6, t: 0, life: W / 40,
        c: ['#c9772f', '#d9a441', '#9a5b2a', '#7d9a4a'][(Math.random() * 4) | 0], r: 0 });
    }
    for (const l of this.leaves) { l.t += dt; l.x += l.vx * dt; l.y += Math.sin(l.t * 2 + l.ph) * 30 * dt + 12 * dt; l.r += dt * 3; }
    this.leaves = this.leaves.filter(l => l.x < this.m.W * this.T + 30);

    for (const p of this.puffs) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    this.puffs = this.puffs.filter(p => p.t < p.life);
  }

  // Under the actors.
  drawGround(ctx) {
    const T = this.T;
    for (const c of this.cars) {
      const { run } = c, k = c.fwd ? c.p : run.len - c.p;
      const a = Math.min(1, c.p * 2, (run.len - c.p) * 2);
      const dirSign = c.fwd ? 1 : -1, lane = 0.17 * T * dirSign;
      let x, y, ang;
      if (run.horiz) { x = (run.start + k + 0.5) * T - T * 0.5 + T * 0.5; y = (run.line + 0.5) * T + lane; ang = c.fwd ? 0 : Math.PI; }
      else { x = (run.line + 0.5) * T - lane; y = (run.start + k) * T + T * 0.5; ang = c.fwd ? Math.PI / 2 : -Math.PI / 2; }
      ctx.save(); ctx.globalAlpha = a * 0.95; ctx.translate(x, y); ctx.rotate(ang);
      const L = T * 0.62, Wd = T * 0.34;
      ctx.fillStyle = 'rgba(40,30,20,.18)'; ctx.fillRect(-L / 2 + 2, -Wd / 2 + 3, L, Wd);
      ctx.fillStyle = c.color; rr(ctx, -L / 2, -Wd / 2, L, Wd, 5); ctx.fill();
      ctx.strokeStyle = '#2a1d14'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.fillStyle = 'rgba(190,220,235,.95)'; rr(ctx, L * 0.02, -Wd / 2 + 3, L * 0.2, Wd - 6, 2); ctx.fill(); rr(ctx, -L * 0.3, -Wd / 2 + 3, L * 0.14, Wd - 6, 2); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    for (const p of this.puffs) {
      ctx.globalAlpha = (1 - p.t / p.life) * 0.6; ctx.fillStyle = '#d8ccb4';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + p.t * 2), 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Over everything in world space.
  drawSky(ctx) {
    ctx.fillStyle = 'rgba(170,220,245,.9)';
    for (const d of this.drops) { ctx.globalAlpha = 1 - d.t / d.life; ctx.beginPath(); ctx.arc(d.x, d.y, 2.2, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    for (const l of this.leaves) {
      ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.r); ctx.fillStyle = l.c;
      ctx.beginPath(); ctx.ellipse(0, 0, 7, 3.5, 0, 0, 7); ctx.fill(); ctx.restore();
    }
  }
}

function findRuns(maze) {
  const runs = [], H = maze.level.streets.horizontal, V = maze.level.streets.vertical;
  for (const r of Object.keys(H).map(Number)) {
    let s = -1;
    for (let c = 0; c <= maze.W; c++) {
      const open = c < maze.W && maze.g[r][c] !== '#';
      if (open && s < 0) s = c;
      if (!open && s >= 0) { if (c - s >= 4) runs.push({ horiz: true, line: r, start: s, len: c - s - 1 }); s = -1; }
    }
  }
  for (const c of Object.keys(V).map(Number)) {
    let s = -1;
    for (let r = 0; r <= maze.H; r++) {
      const open = r < maze.H && maze.g[r][c] !== '#';
      if (open && s < 0) s = r;
      if (!open && s >= 0) { if (r - s >= 4) runs.push({ horiz: false, line: c, start: s, len: r - s - 1 }); s = -1; }
    }
  }
  return runs;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
