import { Actor } from './actor.js';

// Nasty Joby. Direct chase: BFS to the player at every tile center.
export class Joby extends Actor {
  constructor(maze, c, r, ticks, target) {
    super(maze, c, r, ticks[0]);
    this.ticks = ticks;
    this.tick = 0;
    this.target = target; // the player
    this.awake = false;
  }
  wake() { this.awake = true; }
  speedUp() {
    this.tick = Math.min(this.tick + 1, this.ticks.length - 1);
    this.speed = this.ticks[this.tick];
  }
  // While the dawg is hidden Joby loses the scent and roams to random spots.
  choose() {
    if (this.roam) {
      if (this.c === this.roam[0] && this.r === this.roam[1]) this.roam = this.pickRoam();
      return this.m.step([this.c, this.r], this.roam);
    }
    return this.m.step([this.c, this.r], this.target.tile());
  }
  pickRoam(avoid) {
    const open = [];
    for (let r = 0; r < this.m.H; r++) for (let c = 0; c < this.m.W; c++) if (this.m.g[r][c] !== '#') open.push([c, r]);
    const far = avoid ? open.filter(p => this.m.dist(p, avoid) > 7) : open;
    const pool = far.length ? far : open;
    return pool[(Math.random() * pool.length) | 0];
  }
  update(dt) { if (this.awake) super.update(dt); }
}
