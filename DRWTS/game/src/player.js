import { Actor } from './actor.js';

// The dawg. Input direction is buffered and applied at the next legal turn.
export class Player extends Actor {
  constructor(maze, c, r, speed, input) {
    super(maze, c, r, speed);
    this.input = input;
  }
  choose() { return this.input.want; }
  wantsReverse() {
    const w = this.input.want;
    return w && w.dx === -this.dir.dx && w.dy === -this.dir.dy && (w.dx || w.dy);
  }
}
