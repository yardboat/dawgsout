// Tile grid, walkability (with wrap rows), BFS pathing.
export const DIRS = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];

export class Maze {
  constructor(level) {
    this.level = level;
    this.T = level.tile;
    this.W = level.size[0];
    this.H = level.size[1];
    this.g = level.grid.map(r => r.split(''));
    this.wrap = new Set(level.wrap_rows || []);
  }
  wc(c) { return ((c % this.W) + this.W) % this.W; }
  open(c, r) {
    if (r < 0 || r >= this.H) return false;
    if (c < 0 || c >= this.W) {
      if (!this.wrap.has(r)) return false;
      c = this.wc(c);
    }
    return this.g[r][c] !== '#';
  }
  // Tile distance that respects wrap rows (cheap approximation, fine for catch/placement).
  dist(a, b) {
    let dx = Math.abs(a[0] - b[0]);
    dx = Math.min(dx, this.W - dx);
    return Math.hypot(dx, a[1] - b[1]);
  }
  // Path length in tiles (BFS), or Infinity.
  pathLen(from, to) {
    const p = this._bfs(from, to);
    if (!p) return Infinity;
    let n = 0, k = p.goal;
    while (k !== p.start) { k = p.prev[k]; n++; }
    return n;
  }
  // First step direction from `from` toward `to`, or null.
  step(from, to) {
    const p = this._bfs(from, to);
    if (!p || p.start === p.goal) return null;
    let k = p.goal;
    while (p.prev[k] !== p.start) k = p.prev[k];
    const c = k % this.W, r = (k / this.W) | 0;
    let dx = c - from[0];
    if (dx > 1) dx = -1; else if (dx < -1) dx = 1;
    return { dx, dy: r - from[1] };
  }
  _bfs(from, to) {
    const W = this.W, key = (c, r) => r * W + c;
    const start = key(from[0], from[1]), goal = key(to[0], to[1]);
    const prev = new Int32Array(W * this.H).fill(-1);
    prev[start] = start;
    const q = [start];
    for (let i = 0; i < q.length; i++) {
      const k = q[i];
      if (k === goal) break;
      const c = k % W, r = (k / W) | 0;
      for (const d of DIRS) {
        if (!this.open(c + d.dx, r + d.dy)) continue;
        const nk = key(this.wc(c + d.dx), r + d.dy);
        if (prev[nk] !== -1) continue;
        prev[nk] = k;
        q.push(nk);
      }
    }
    return prev[goal] === -1 ? null : { prev, start, goal };
  }
  toggle(c, r) {
    if (r < 0 || r >= this.H || c < 0 || c >= this.W) return;
    this.g[r][c] = this.g[r][c] === '#' ? '.' : '#';
  }
  exportLevel() {
    return { ...this.level, grid: this.g.map(r => r.join('')) };
  }
}
