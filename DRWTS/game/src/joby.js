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
  choose() { return this.m.step([this.c, this.r], this.target.tile()); }
  update(dt) { if (this.awake) super.update(dt); }
}
