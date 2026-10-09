// State machine: TITLE → PLAY(P1) → REVEAL → PLAY(P2) → WIN_CUT → WIN, with CAUGHT → restart from either phase.
import { Maze } from './maze.js';
import { Player } from './player.js';
import { Joby } from './joby.js';
import { Words } from './words.js';
import { Camera, drawWorld, drawOverlay, drawTokens, drawPlayer, drawJoby, drawOccluder } from './render.js';
import { drawHUDScreen, drawVignette, drawStick, drawCard, drawBubble, hit } from './ui.js';
import { FX } from './fx.js';
import { Ambient } from './ambient.js';
import { sfx, music } from './audio.js';
import { drawPortrait, drawMelt } from './cutscenes.js';
import { ComicReveal, ComicWake, MeltScene, ComicToppers } from './comic.js';

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
    this.hideout = (L.landmarks.find(l => l.hideout) || {}).hideout || null;
    this.hidden = 0; this.hideCd = 0; this.grace = 0;
    this.player.atCenter = () => this.tryEnterHideout();
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
    let taps = this.input.takeTaps();
    taps = taps.filter(t => { if (hit(this.muteBtn, t)) { music.toggleMute(); return false; } return true; });
    const tapped = taps.length > 0;

    if (this.debug) this.debugInput(taps);

    switch (this.state) {
      case 'title':
        if (tapped) this.begin();
        break;

      case 'play': {
        this.follow(dt);
        if (this.hideCd > 0) this.hideCd -= dt;
        if (this.grace > 0) this.grace -= dt;
        if (this.hidden > 0) {
          this.hidden -= dt;
          this.topComic.update(dt);
          if (tapped) this.topComic.skip();
          if (this.topComic.done || this.hidden <= 0) { this.leaveHideout(); break; }
          this.joby.update(dt); this.words.update(dt); this.jobyTrail(); this.danger = Math.max(0, this.danger - dt * 2);
          if (Math.random() < dt * 6) { const T = this.maze.T, [dc, dr] = this.hideout.door; this.fx.note((dc + 0.5) * T + (Math.random() - 0.5) * T * 1.6, (dr + 1.2) * T); }
          break;
        }
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
            else { this.set('wincut'); this.melt = new MeltScene(this.art, this.lines); music.stop(); }
            return;
          }
        } else if (ev === 'wrong') {
          const tk = this.words.tokens.find(k => k.flash > 0.55), T = this.maze.T;
          if (tk) this.fx.ring((tk.c + 0.5) * T, (tk.r + 0.5) * T);
          this.fx.kick(12); this.stun = 0.3; sfx.wrong();
          if (!this.joby.awake) { this.wakeJoby(); this.comic = new ComicWake(this.art, this.lines); this.set('wake'); this.input.reset(); break; }
          else { this.joby.speedUp(); this.say('WRONG WORD! JOBY SPEEDS UP', '#ff4a4a'); }
        }
        if (this.joby.awake && this.grace <= 0 && this.maze.dist([this.player.x, this.player.y], [this.joby.x, this.joby.y]) < this.tun.catch_distance) {
          this.caughtLine = this.lines.caught[(Math.random() * this.lines.caught.length) | 0];
          this.fx.kick(16); sfx.thump(1.2); this.danger = 0; music.stop();
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
          music.setFast(true);
          if (!this.joby.awake) this.wakeJoby();
          const L = this.maze.level;
          this.words = new Words(this.maze, this.phrases[1], L.word_spawn_candidates, [this.player.tile(), [this.joby.c, this.joby.r]], this.tun);
          this.input.reset();
          this.set('play');
        }
        break;

      case 'wake':
        this.comic.update(dt);
        if (tapped) this.comic.skip();
        if (this.comic.done) { this.wipe = 0.5; this.grace = 1.0; this.input.reset(); this.set('play'); this.say('NASTY JOBY IS HUNTING YOU', '#ff4a4a'); }
        break;

      case 'caught': {
        const T = this.maze.T;
        this.cam.ease((this.joby.x + 0.5) * T, (this.joby.y + 0.5) * T, 3, Math.min(1, dt * 5));
        if (this.st > 1.2 && tapped) this.begin();
        break;
      }

      case 'intro': {
        const T = this.maze.T;
        if (this.st < 2.0) this.cam.ease(this.maze.W * T / 2, this.maze.H * T / 2, 1, Math.min(1, dt * 6));
        else this.follow(dt * 1.6);
        if (this.st > 2.9) { this.set('play'); this.input.reset(); }
        break;
      }

      case 'wincut': {
        const T = this.maze.T;
        this.cam.ease((this.joby.x + 0.5) * T, (this.joby.y + 0.5) * T, 3.5, Math.min(1, dt * 8));
        this.melt.update(dt);
        if (tapped) this.melt.skip();
        if (this.melt.done) this.set('win');
        break;
      }

      case 'win':
        this.cam.ease(this.maze.W * this.maze.T / 2, this.maze.H * this.maze.T / 2, 1, Math.min(1, dt * 3));
        for (const t of taps) if (t.key || hit(this.button, t)) this.begin();
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
    if (this.hideout && this.state !== 'title') drawHideout(ctx, this.maze, this.hideout, this, this.time);
    this.amb.drawGround(ctx);
    drawTokens(ctx, this.maze, this.words, this.time);
    const jobyVisible = this.joby.awake && this.state !== 'wincut' && this.state !== 'win';
    const occ = this.art.occluder;
    const showPlayer = !(this.hidden > 0) && !(this.grace > 0 && Math.floor(this.time * 12) % 2);
    const actors = [[this.player.y, () => { if (!showPlayer) return; drawPlayer(ctx, this.maze, this.player, this.art, this.time); drawOccluder(ctx, occ, this.maze, this.player.x, this.player.y, 0.95); }]];
    if (jobyVisible) actors.push([this.joby.y, () => { drawJoby(ctx, this.maze, this.joby, this.art.joby, this.time); if (this.hidden > 0) drawHuh(ctx, this.maze, this.joby, this.time); drawOccluder(ctx, occ, this.maze, this.joby.x, this.joby.y, 0.7); }]);
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
    if (this.state === 'play' && this.hidden > 0 && this.topComic) this.topComic.draw(ctx, w, h);
    if (this.state === 'play' && !(this.hidden > 0) && (this.debug || (this.phase === 0 && this.st < 5))) {
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

    if (this.state !== 'wincut') {
      const b = 38; this.muteBtn = { x: w - b - 10, y: h - b - 10, w: b, h: b };
      ctx.fillStyle = 'rgba(18,22,48,.7)'; ctx.beginPath(); ctx.arc(w - b / 2 - 10, h - b / 2 - 10, b / 2, 0, 7); ctx.fill();
      ctx.font = '20px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
      ctx.fillText(music.muted ? '🔇' : '🎵', w - b / 2 - 10, h - b / 2 - 9);
    }

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
      case 'wake':
        this.comic.draw(ctx, w, h);
        break;
      case 'caught': {
        const [sx, sy] = js();
        if (this.st > 0.5) drawBubble(ctx, w, h, this.caughtLine, sx, sy - u * 0.12);
        if (this.st > 1.2) { ctx.fillStyle = 'rgba(10,12,30,.85)'; ctx.fillRect(0, h * 0.84, w, h * 0.08); ctx.fillStyle = '#f4e9c6'; ctx.font = `800 ${u * 0.05}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.fillText('CAUGHT · TAP TO START OVER', w / 2, h * 0.88); }
        break;
      }
      case 'wincut': {
        this.melt.draw(ctx, w, h);
        break;
      }
      case 'intro': {
        const u10 = Math.min(w, h * 0.66) / 10;
        const txt = this.st < 2.0 ? 'FIND THE WORDS' : 'GO!';
        const sc = this.st < 2.0 ? 1 + Math.sin(this.st * 5) * 0.03 : 1 + (this.st - 2.0) * 0.6;
        ctx.save(); ctx.globalAlpha = this.st < 2.0 ? Math.min(1, this.st * 3) : Math.max(0, 1 - (this.st - 2.4) * 2);
        ctx.translate(w / 2, h * 0.5); ctx.scale(sc, sc);
        ctx.font = `900 ${u10 * (this.st < 2.0 ? 0.9 : 1.6)}px Impact,'Arial Black',system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = u10 * 0.18; ctx.strokeStyle = '#1b1b1b'; ctx.lineJoin = 'round'; ctx.strokeText(txt, 0, 0);
        ctx.fillStyle = '#ffd23a'; ctx.fillText(txt, 0, 0);
        if (this.st < 2.0) { ctx.font = `800 ${u10 * 0.36}px system-ui,sans-serif`; ctx.lineWidth = 4; ctx.strokeText('in order. Don\'t wake Nasty Joby.', 0, u10 * 0.8); ctx.fillStyle = '#fff'; ctx.fillText('in order. Don\'t wake Nasty Joby.', 0, u10 * 0.8); }
        ctx.restore();
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

  begin() {
    this.newRun(); this.set('intro');
    music.stop(); music.start(false);
  }

  tryEnterHideout() {
    const h = this.hideout, w = this.input.want, p = this.player;
    if (!h || this.hideCd > 0 || this.hidden > 0 || !w || p.t !== 0) return false;
    if (p.c !== h.door[0] || p.r !== h.door[1] || w.dx !== h.enter[0] || w.dy !== h.enter[1]) return false;
    this.topComic = new ComicToppers(this.art, this.lines);
    this.hidden = Math.max(h.duration, this.topComic.len); this.input.want = null; p.dir = { dx: 0, dy: 0 };
    if (this.joby.awake) this.joby.roam = this.joby.pickRoam(h.door);
    sfx.door();
    return true;
  }

  leaveHideout() {
    const h = this.hideout;
    this.hidden = 0; this.hideCd = h.cooldown; this.grace = h.grace; this.joby.roam = null;
    this.input.want = null;
    this.say('HE KICKED YOU OUT!', '#ff8a3d'); sfx.door();
    const T = this.maze.T; this.amb.puff((h.door[0] + 0.5) * T, (h.door[1] + 0.9) * T);
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

function drawHideout(ctx, maze, h, g, time) {
  // A quiet secret: a floating purple diamond over Toppers when the hideout is available.
  if (g.hideCd > 0 || g.hidden > 0) return;
  const T = maze.T, [dc, dr] = h.door, x = (dc + 0.5) * T, y = (dr + 1.05) * T + Math.sin(time * 2.4) * T * 0.08;
  const r = T * 0.26, spin = Math.cos(time * 1.8);
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(40,10,60,.25)'; ctx.beginPath(); ctx.ellipse(0, T * 0.42, r * 0.8, r * 0.25, 0, 0, 7); ctx.fill();
  ctx.scale(Math.max(0.25, Math.abs(spin)), 1);
  ctx.shadowColor = '#b46cff'; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.moveTo(0, -r * 1.3); ctx.lineTo(r, 0); ctx.lineTo(0, r * 1.3); ctx.lineTo(-r, 0); ctx.closePath();
  const grd = ctx.createLinearGradient(-r, -r, r, r); grd.addColorStop(0, '#e2c4ff'); grd.addColorStop(0.5, '#9a4dff'); grd.addColorStop(1, '#5a1fa8');
  ctx.fillStyle = grd; ctx.fill(); ctx.shadowBlur = 0; ctx.lineWidth = 2; ctx.strokeStyle = '#2a0f45'; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.moveTo(0, -r * 1.1); ctx.lineTo(r * 0.35, -r * 0.2); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawHuh(ctx, maze, j, time) {
  const T = maze.T, x = (j.x + 0.5) * T, y = (j.y + 0.5) * T - T * 1.35 + Math.sin(time * 6) * 3;
  ctx.font = `900 ${T * 0.55}px Impact,'Arial Black',sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 5; ctx.strokeStyle = '#1b1b1b'; ctx.strokeText('?', x, y); ctx.fillStyle = '#fff'; ctx.fillText('?', x, y);
}

function worldToScreen(cam, wx, wy) { return [(wx - cam.fx) * cam.s + cam.w / 2, (wy - cam.fy) * cam.s + cam.h / 2]; }
