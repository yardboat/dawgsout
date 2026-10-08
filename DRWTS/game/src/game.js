// State machine: TITLE → PLAY(P1) → REVEAL → PLAY(P2) → WIN_CUT → WIN, with CAUGHT → restart from either phase.
import { Maze } from './maze.js';
import { Player } from './player.js';
import { Joby } from './joby.js';
import { Words } from './words.js';
import { Camera, drawWorld, drawOverlay, drawTokens, drawPlayer, drawJoby } from './render.js';
import { drawHUD, drawFooter, drawStick, drawCard, drawBubble, hit } from './ui.js';
import { drawPortrait, drawMelt } from './cutscenes.js';

const CORNERS = [[1, 2], [18, 2], [1, 27], [18, 27]];

export class Game {
  constructor(level, phrases, lines, input, debug, bg) {
    this.bg = bg;
    this.maze = new Maze(level);
    this.phrases = phrases.phases;
    this.tun = phrases.tunables;
    this.lines = lines;
    this.input = input;
    this.debug = debug;
    this.cam = new Camera(this.maze.W * this.maze.T, this.maze.H * this.maze.T);
    this.time = 0;
    this.toast = null;
    this.newRun();
    this.set('title');
  }

  newRun() {
    const L = this.maze.level;
    this.phase = 0;
    this.input.reset();
    this.player = new Player(this.maze, ...L.spawns.player, this.tun.player_speed, this.input);
    this.joby = new Joby(this.maze, ...L.spawns.joby, this.tun.joby_ticks, this.player);
    this.words = new Words(this.maze, this.phrases[0], L.word_spawn_candidates, [L.spawns.player], this.tun);
    this.cam.home();
  }

  set(state) { this.state = state; this.st = 0; this.button = null; }
  say(text, color = '#ffd23a') { this.toast = { text, color, t: 1.6 }; }

  wakeJoby() {
    // Never spawn Joby on top of the player: use the farthest corner if the player is near his spawn.
    const p = this.player.tile();
    if (this.maze.dist(p, [this.joby.c, this.joby.r]) < 8) {
      const far = CORNERS.slice().sort((a, b) => this.maze.pathLen(p, b) - this.maze.pathLen(p, a))[0];
      this.joby.c = far[0]; this.joby.r = far[1]; this.joby.t = 0;
    }
    this.joby.wake();
  }

  update(dt) {
    this.time += dt; this.st += dt;
    if (this.toast && (this.toast.t -= dt) <= 0) this.toast = null;
    const taps = this.input.takeTaps();
    const tapped = taps.length > 0;

    if (this.debug) this.debugInput(taps);

    switch (this.state) {
      case 'title':
        if (tapped) { this.newRun(); this.set('play'); }
        break;

      case 'play': {
        this.player.update(dt);
        this.joby.update(dt);
        this.words.update(dt);
        const ev = this.words.check(this.maze, [this.player.x, this.player.y], this.tun.catch_distance);
        if (ev === 'collect') {
          if (this.phase === 1 && this.joby.awake) this.joby.speedUp();
          if (this.words.done) {
            if (this.phase === 0) { this.set('reveal'); this.revealWasAwake = this.joby.awake; }
            else this.set('wincut');
            return;
          }
        } else if (ev === 'wrong') {
          if (!this.joby.awake) { this.wakeJoby(); this.say('WRONG WORD! NASTY JOBY WOKE UP', '#ff4a4a'); }
          else { this.joby.speedUp(); this.say('WRONG WORD! JOBY SPEEDS UP', '#ff4a4a'); }
        }
        if (this.joby.awake && this.maze.dist([this.player.x, this.player.y], [this.joby.x, this.joby.y]) < this.tun.catch_distance) {
          this.caughtLine = this.lines.caught[(Math.random() * this.lines.caught.length) | 0];
          this.set('caught');
        }
        break;
      }

      case 'reveal':
        if (this.st > 0.6 && tapped || this.st > 3) {
          this.phase = 1;
          if (!this.joby.awake) this.wakeJoby();
          const L = this.maze.level;
          this.words = new Words(this.maze, this.phrases[1], L.word_spawn_candidates, [this.player.tile(), [this.joby.c, this.joby.r]], this.tun);
          this.input.reset();
          this.set('play');
        }
        break;

      case 'caught': {
        const T = this.maze.T;
        this.cam.ease((this.joby.x + 0.5) * T, (this.joby.y + 0.5) * T, 3, Math.min(1, dt * 5));
        if (this.st > 1.2 && tapped) { this.newRun(); this.set('play'); }
        break;
      }

      case 'wincut': {
        const T = this.maze.T;
        this.cam.ease((this.joby.x + 0.5) * T, (this.joby.y + 0.5) * T, 3.5, Math.min(1, dt * 8));
        if (this.st > 3.4) this.set('win');
        break;
      }

      case 'win':
        for (const t of taps) if (t.key || hit(this.button, t)) { this.newRun(); this.set('play'); }
        break;
    }
  }

  render(ctx, w, h) {
    const T = this.maze.T;
    ctx.fillStyle = '#1d2240'; ctx.fillRect(0, 0, w, h);

    ctx.save();
    this.cam.apply(ctx, w, h);
    drawWorld(ctx, this.maze, this.debug, this.bg);
    drawTokens(ctx, this.maze, this.words, this.time);
    drawPlayer(ctx, this.maze, this.player);
    if (this.joby.awake && this.state !== 'wincut' && this.state !== 'win') drawJoby(ctx, this.maze, this.joby);
    drawOverlay(ctx, this.maze, this.bg);
    const jInfo = this.joby.awake ? `JOBY SPEED ${this.joby.speed.toFixed(1)}` : '';
    drawHUD(ctx, this.maze, this.phrases[this.phase], this.words.next, this.phase + 1, jInfo);
    drawFooter(ctx, this.maze, this.debug ? 'DEBUG · click tile = toggle · E = export · J = wake · N = next word' : 'swipe or drag to move');
    ctx.restore();

    if (this.state === 'play') drawStick(ctx, this.input.stick);

    if (this.toast) {
      ctx.globalAlpha = Math.min(1, this.toast.t * 2);
      const u = Math.min(w, h * 0.66) / 10;
      ctx.font = `900 ${u * 0.5}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,.6)'; const tw = Math.min(ctx.measureText(this.toast.text).width, w * 0.92) + u;
      const ty = worldToScreen(this.cam, 0, (this.maze.H - 1.6) * T)[1];
      ctx.fillRect(w / 2 - tw / 2, ty - u * 0.45, tw, u * 0.9);
      ctx.fillStyle = this.toast.color; ctx.fillText(this.toast.text, w / 2, ty, w * 0.92);
      ctx.globalAlpha = 1;
    }

    const js = () => this.cam.toWorld ? worldToScreen(this.cam, (this.joby.x + 0.5) * T, (this.joby.y + 0.5) * T) : [w / 2, h / 2];
    const u = Math.min(w, h * 0.66);

    switch (this.state) {
      case 'title':
        drawCard(ctx, w, h, { title: 'DAWGS OUT', lines: ['Grab the words of the chant in order.', 'Wrong word wakes up Nasty Joby.', 'Swipe / drag (or arrow keys) to move.'], button: 'TAP TO PLAY' });
        break;
      case 'reveal':
        drawCard(ctx, w, h, { title: 'NASTY JOBY IS OUT', lines: ['DAWGS RISE WITH THE SUN ✓', 'Now finish the second chant', 'before Joby gets you.'], color: '#ff4a4a', dim: 0.75 });
        drawPortrait(ctx, w / 2, h * 0.17, u * 0.24);
        break;
      case 'caught': {
        const [sx, sy] = js();
        if (this.st > 0.5) drawBubble(ctx, w, h, this.caughtLine, sx, sy - u * 0.12);
        if (this.st > 1.2) { ctx.fillStyle = 'rgba(10,12,30,.85)'; ctx.fillRect(0, h * 0.84, w, h * 0.08); ctx.fillStyle = '#f4e9c6'; ctx.font = `800 ${u * 0.05}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.fillText('CAUGHT · TAP TO START OVER', w / 2, h * 0.88); }
        break;
      }
      case 'wincut': {
        const [sx, sy] = js();
        const t = Math.max(0, (this.st - 0.5) / 2.6);
        ctx.fillStyle = `rgba(10,12,30,${Math.min(0.5, this.st)})`; ctx.fillRect(0, 0, w, h);
        if (this.st < 0.5) drawPortrait(ctx, sx, sy, u * 0.12 + u * 0.4 * (this.st / 0.5));
        else drawMelt(ctx, sx, sy, u * 0.52, Math.min(1, t));
        if (this.st > 0.5) drawBubble(ctx, w, h, this.lines.melt, sx, sy - u * 0.3);
        break;
      }
      case 'win':
        this.button = drawCard(ctx, w, h, { title: 'DAWGS OUT!', lines: ['TITS OUT FOR THE DAWGS ✓', 'Nasty Joby has melted.'], button: 'PLAY AGAIN', dim: 0.85 });
        break;
    }
  }

  debugInput(taps) {
    for (const t of taps) {
      if (!t.mouse || this.state !== 'play') continue;
      const [wx, wy] = this.cam.toWorld(t.x, t.y);
      this.maze.toggle(Math.floor(wx / this.maze.T), Math.floor(wy / this.maze.T));
    }
  }

  debugKey(code) {
    if (code === 'KeyE') {
      const blob = new Blob([JSON.stringify(this.maze.exportLevel(), null, 1)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'level.json'; a.click();
    }
    if (code === 'KeyJ' && this.state === 'play' && !this.joby.awake) this.wakeJoby();
    if (code === 'KeyN' && this.state === 'play') {
      const tk = this.words.tokens.find(k => k.index === this.words.next);
      if (tk) { this.player.c = tk.c; this.player.r = tk.r; this.player.t = 0; }
    }
  }
}

function worldToScreen(cam, wx, wy) { return [(wx - cam.fx) * cam.s + cam.w / 2, (wy - cam.fy) * cam.s + cam.h / 2]; }
