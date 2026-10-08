// State machine: TITLE → PLAY(P1) → REVEAL → PLAY(P2) → WIN_CUT → WIN, with CAUGHT → restart from either phase.
import { Maze } from './maze.js';
import { Player } from './player.js';
import { Joby } from './joby.js';
import { Words } from './words.js';
import { Camera, drawWorld, drawOverlay, drawTokens, drawPlayer, drawJoby, drawOccluder } from './render.js';
import { drawHUDScreen, drawVignette, drawStick, drawCard, drawBubble, hit } from './ui.js';
import { FX } from './fx.js';
import { Ambient } from './ambient.js';
import { sfx } from './audio.js';
import { drawPortrait, drawMelt } from './cutscenes.js';
import { ComicReveal } from './comic.js';

const CORNERS = [[1, 2], [18, 2], [1, 27], [18, 27]];

export class Game {
  constructor(level, phrases, lines, input, debug, bg, art = {}) {
    this.bg = bg;
    this.art = art;
    this.maze = new Maze(level);
    this.phrases = phrases.phases;
    this.tun = phrases.tunables;
    this.lines = lines;
    this.input = input;
    this.debug = debug;
    this.cam = new Camera(this.maze.W * this.maze.T, this.maze.H * this.maze.T);
    this.time = 0;
    this.toast = null;
    this.fx = new FX();
    this.amb = new Ambient(this.maze);
    this.vw = 400; this.vh = 800; this.safeTop = 0;
    this.danger = 0; this.beat = 0; this.pulse = 0; this.slots = []; this.wipe = 0;
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
    this.fx.reset(); this.danger = 0; this.stun = 0; this.lastJobyTile = '';
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
    this.fx.update(dt);
    this.amb.update(dt);
    this.pulse = Math.max(0, this.pulse - dt * 3);
    if (this.wipe > 0) this.wipe -= dt;
    if (this.toast && (this.toast.t -= dt) <= 0) this.toast = null;
    const taps = this.input.takeTaps();
    const tapped = taps.length > 0;

    if (this.debug) this.debugInput(taps);

    switch (this.state) {
      case 'title':
        if (tapped) { this.newRun(); this.set('play'); }
        break;

      case 'play': {
        this.follow(dt);
        if (this.stun > 0) this.stun -= dt; else {
          const before = this.player.dir;
          this.player.update(dt);
          const d = this.player.dir;
          if ((d.dx || d.dy) && (d.dx !== before.dx || d.dy !== before.dy)) { const T = this.maze.T; this.amb.puff((this.player.x + 0.5) * T, (this.player.y + 0.8) * T); }
        }
        this.joby.update(dt);
        this.words.update(dt);
        this.jobyTrail();
        this.updateDanger(dt);
        const ev = this.words.check(this.maze, [this.player.x, this.player.y], this.tun.catch_distance);
        if (ev === 'collect') {
          const tk = this.words.tokens.find(k => k.index === this.words.next - 1), T = this.maze.T;
          const wx = (tk.c + 0.5) * T, wy = (tk.r + 0.5) * T;
          this.fx.burst(wx, wy); this.fx.kick(7); sfx.collect(tk.index);
          const [sx, sy] = worldToScreen(this.cam, wx, wy);
          this.fx.fly(tk.word, sx, sy, tk.index);
          if (this.phase === 1 && this.joby.awake) this.joby.speedUp();
          if (this.words.done) {
            if (this.phase === 0) { this.set('reveal'); this.comic = new ComicReveal(this.art, this.lines); }
            else this.set('wincut');
            return;
          }
        } else if (ev === 'wrong') {
          const tk = this.words.tokens.find(k => k.flash > 0.55), T = this.maze.T;
          if (tk) this.fx.ring((tk.c + 0.5) * T, (tk.r + 0.5) * T);
          this.fx.kick(12); this.stun = 0.3; sfx.wrong();
          if (!this.joby.awake) { this.wakeJoby(); this.say('WRONG WORD! NASTY JOBY WOKE UP', '#ff4a4a'); }
          else { this.joby.speedUp(); this.say('WRONG WORD! JOBY SPEEDS UP', '#ff4a4a'); }
        }
        if (this.joby.awake && this.maze.dist([this.player.x, this.player.y], [this.joby.x, this.joby.y]) < this.tun.catch_distance) {
          this.caughtLine = this.lines.caught[(Math.random() * this.lines.caught.length) | 0];
          this.fx.kick(16); sfx.thump(1.2); this.danger = 0;
          this.set('caught');
        }
        break;
      }

      case 'reveal':
        this.follow(dt);
        this.comic.update(dt);
        if (tapped) this.comic.skip();
        if (this.comic.done) {
          this.wipe = 0.5;
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
        this.fx.update(0);
        for (const t of taps) if (t.key || hit(this.button, t)) { this.newRun(); this.set('play'); }
        break;
    }
  }

  render(ctx, w, h) {
    const T = this.maze.T;
    ctx.fillStyle = '#1d2240'; ctx.fillRect(0, 0, w, h);

    this.vw = w; this.vh = h;
    const [ox, oy] = this.fx.shakeOffset();
    ctx.save();
    ctx.translate(ox, oy);
    this.cam.apply(ctx, w, h);
    drawWorld(ctx, this.maze, this.debug, this.bg);
    this.fx.drawPuddles(ctx);
    this.amb.drawGround(ctx);
    drawTokens(ctx, this.maze, this.words, this.time);
    const jobyVisible = this.joby.awake && this.state !== 'wincut' && this.state !== 'win';
    const occ = this.art.occluder;
    const actors = [[this.player.y, () => { drawPlayer(ctx, this.maze, this.player, this.art, this.time); drawOccluder(ctx, occ, this.maze, this.player.x, this.player.y, 0.95); }]];
    if (jobyVisible) actors.push([this.joby.y, () => { drawJoby(ctx, this.maze, this.joby, this.art.joby, this.time); drawOccluder(ctx, occ, this.maze, this.joby.x, this.joby.y, 0.7); }]);
    actors.sort((a, b) => a[0] - b[0]).forEach(a => a[1]());
    drawOverlay(ctx, this.maze, this.bg);
    this.amb.drawSky(ctx);
    this.fx.drawTop(ctx);
    ctx.restore();

    if (this.state === 'play' || this.state === 'caught') drawVignette(ctx, w, h, this.danger * (0.45 + 0.25 * this.pulse));

    const jInfo = this.debug && this.joby.awake ? `JOBY ${this.joby.speed.toFixed(1)}` : '';
    const u10 = Math.min(w, h * 0.66) / 10;
    if (this.state !== 'title') {
      this.slots = drawHUDScreen(ctx, w, h, this.safeTop, this.phrases[this.phase], this.words.next - this.fx.flying(), this.phase + 1, jInfo);
      this.fx.drawFlyers(ctx, this.slots, u10);
    }
    if (this.state === 'play' && (this.debug || (this.phase === 0 && this.st < 5))) {
      ctx.fillStyle = 'rgba(18,22,48,.7)'; ctx.fillRect(0, h - u10 * 1.1, w, u10 * 1.1);
      ctx.fillStyle = '#f4e9c6'; ctx.font = `600 ${u10 * 0.3}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(this.debug ? 'DEBUG · click tile = toggle · E export · J wake · N next' : 'swipe or drag anywhere to steer', w / 2, h - u10 * 0.55, w * 0.94);
    }

    if (this.state === 'play') drawStick(ctx, this.input.stick);

    if (this.toast) {
      ctx.globalAlpha = Math.min(1, this.toast.t * 2);
      const u = Math.min(w, h * 0.66) / 10;
      ctx.font = `900 ${u * 0.5}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,.6)'; const tw = Math.min(ctx.measureText(this.toast.text).width, w * 0.92) + u;
      const ty = this.safeTop + u * 2.1;
      ctx.fillRect(w / 2 - tw / 2, ty - u * 0.45, tw, u * 0.9);
      ctx.fillStyle = this.toast.color; ctx.fillText(this.toast.text, w / 2, ty, w * 0.92);
      ctx.globalAlpha = 1;
    }

    const js = () => this.cam.toWorld ? worldToScreen(this.cam, (this.joby.x + 0.5) * T, (this.joby.y + 0.5) * T) : [w / 2, h / 2];
    const u = Math.min(w, h * 0.66);

    if (this.wipe > 0 && this.state === 'play') {
      const k = this.wipe / 0.5, edge = (1 - k) * (w + h);
      ctx.fillStyle = '#f3e7cb'; ctx.beginPath(); ctx.moveTo(edge, 0); ctx.lineTo(w + h, 0); ctx.lineTo(w + h, h); ctx.lineTo(edge - h, h); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#1d140e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(edge, 0); ctx.lineTo(edge - h, h); ctx.stroke();
    }

    switch (this.state) {
      case 'title':
        drawCard(ctx, w, h, { title: 'DAWGS OUT', lines: ['Grab the words of the chant in order.', 'Wrong word wakes up Nasty Joby.', 'Swipe / drag (or arrow keys) to move.'], button: 'TAP TO PLAY', image: this.art.front });
        break;
      case 'reveal':
        this.comic.draw(ctx, w, h);
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
        this.button = drawCard(ctx, w, h, { title: 'DAWGS OUT!', lines: ['TITS OUT FOR THE DAWGS ✓', 'Nasty Joby has melted.'], button: 'PLAY AGAIN', dim: 0.85, image: this.art.win });
        break;
    }
  }

  // Camera glides with the dawg, zoomed in, clamped to the map edges.
  follow(dt) {
    const T = this.maze.T, WW = this.maze.W * T, WH = this.maze.H * T;
    const Z = this.tun.cam_zoom || 1.45, s = Math.min(this.vw / WW, this.vh / WH) * Z;
    const hw = this.vw / (2 * s), hh = this.vh / (2 * s);
    const clamp = (v, lo, hi) => lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v));
    const fx = clamp((this.player.x + 0.5) * T, hw, WW - hw), fy = clamp((this.player.y + 0.5) * T, hh - 1.2 * T, WH - hh);
    this.cam.ease(fx, fy, Z, Math.min(1, dt * 5));
  }

  jobyTrail() {
    if (!this.joby.awake) return;
    const key = this.joby.c + ',' + this.joby.r;
    if (key !== this.lastJobyTile) { this.lastJobyTile = key; const T = this.maze.T; this.fx.puddle((this.joby.c + 0.5) * T, (this.joby.r + 0.85) * T); }
  }

  updateDanger(dt) {
    let target = 0;
    if (this.joby.awake) {
      const d = this.maze.pathLen(this.player.tile(), this.joby.tile());
      target = Math.max(0, Math.min(1, (9 - d) / 7));
    }
    this.danger += (target - this.danger) * Math.min(1, dt * 4);
    if (this.danger > 0.05) {
      this.beat -= dt;
      if (this.beat <= 0) { this.beat = 1.1 - 0.72 * this.danger; this.pulse = 1; sfx.thump(0.4 + 0.6 * this.danger); }
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
