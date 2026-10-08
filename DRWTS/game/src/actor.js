// Shared tile-to-tile mover. Position = tile (c,r) + progress t toward the next tile in `dir`.
export const STOP = { dx: 0, dy: 0 };

export class Actor {
  constructor(maze, c, r, speed) {
    this.m = maze;
    this.c = c; this.r = r; this.t = 0;
    this.dir = STOP;
    this.speed = speed;
  }
  get x() { return this.c + this.dir.dx * this.t; }
  get y() { return this.r + this.dir.dy * this.t; }
  tile() { return [this.m.wc(Math.round(this.x)), Math.round(this.y)]; }

  choose() { return null; }      // desired dir at a tile center
  wantsReverse() { return false; } // reverse mid-tile?

  update(dt) {
    let d = this.speed * dt;
    if (this.t > 0 && this.wantsReverse()) {
      this.c = this.m.wc(this.c + this.dir.dx); this.r += this.dir.dy;
      this.dir = { dx: -this.dir.dx, dy: -this.dir.dy };
      this.t = 1 - this.t;
    }
    for (let guard = 0; d > 1e-9 && guard < 8; guard++) {
      if (this.t === 0) {
        if (this.atCenter && this.atCenter()) { this.dir = STOP; return; }
        const nd = this.choose();
        if (nd && this.m.open(this.c + nd.dx, this.r + nd.dy)) this.dir = nd;
        else if (!this.m.open(this.c + this.dir.dx, this.r + this.dir.dy)) this.dir = STOP;
        if (!this.dir.dx && !this.dir.dy) return;
      }
      const s = Math.min(d, 1 - this.t);
      this.t += s; d -= s;
      if (this.t >= 1 - 1e-9) {
        this.c = this.m.wc(this.c + this.dir.dx);
        this.r += this.dir.dy;
        this.t = 0;
      }
    }
  }
}
