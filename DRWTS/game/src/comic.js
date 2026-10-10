// Comic-page cutscenes. Panels use Gemini art from assets/panels/ when present, otherwise a drawn fallback.
import { sfx } from './audio.js';

const PAPER = '#f3e7cb', INK = '#1d140e';
// How each Gemini panel sits in its frame: horizontal focus, how much of the frame height the art fills, backdrop.
const FRAMING = {
  reveal_1: { focus: 0.57, fill: 0.66, bg: '#121833', lines: 'focus', fx: 0.6, fy: 0.55, bokeh: true },
  reveal_2: { focus: 0.6, fill: 1, lines: 'speed-h', bokeh: true },
  wake_1: { focus: 0.5, fill: 1, lines: 'focus', fx: 0.6, fy: 0.4 },
  wake_2: { focus: 0.5, fill: 1, lines: 'speed-v' },
  toppers: { focus: 0.55, fill: 1, bg: '#121833', lines: 'focus', fx: 0.47, fy: 0.42, bokeh: true },
};

function ease(t) { t = Math.min(1, Math.max(0, t)); return 1 - Math.pow(1 - t, 3); }
function pop(t) { t = Math.min(1, Math.max(0, t)); const s = 1.70158 * 1.4; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); }

export class ComicReveal {
  constructor(art, lines) {
    this.art = art; this.t = 0; this.done = false; this.fired = new Set();
    this.rant = lines.reveal || "WHAT ARE THEY DOING?! THEY'RE GONNA RUIN IT!";
    this.beats = [
      { at: 0.05, fn: () => sfx.thump(0.8) },
      { at: 2.7, fn: () => sfx.thump(0.8) },
      { at: 4.6, fn: () => sfx.thump(1.1) },
    ];
    this.resolve = lines.resolve || "I'VE GOTTA STOP THIS.";
    this.len = 6.0;
  }
  skip() { if (this.t > 1) this.done = true; }
  update(dt) {
    this.t += dt;
    for (const b of this.beats) if (this.t >= b.at && !this.fired.has(b)) { this.fired.add(b); b.fn(); }
    if (this.t >= this.len) this.done = true;
  }

  draw(ctx, w, h) {
    const t = this.t, u = Math.min(w, h * 0.66) / 10;
    // paper + halftone
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(160,110,60,.10)';
    for (let y = 0; y < h; y += 9) for (let x = (y / 9) % 2 ? 4 : 0; x < w; x += 9) { ctx.beginPath(); ctx.arc(x, y, 1.3, 0, 7); ctx.fill(); }

    const m = u * 0.35, pw = w - m * 2, gap = u * 0.3;
    const ph = Math.min((h - m * 3 - gap) / 2, pw * 0.95);
    const y1 = (h - (ph * 2 + gap)) / 2, y2 = y1 + ph + gap;

    // Panel 1 slides in from the left
    const k1 = ease(t / 0.35);
    this.panel(ctx, m - (1 - k1) * w, y1, pw, ph, -1.2, 'reveal_1', (c, x, y, pw2, ph2) => this.fallback1(c, x, y, pw2, ph2, t), t, k1, -1);
    if (t > 0.2) this.caption(ctx, m + u * 0.25 - (1 - k1) * w, y1 + u * 0.2, 'MEANWHILE, ON THE TOWNIE SIDE OF TOWN…', u);
    if (t > 0.45) this.bubble(ctx, m + pw * 0.52, y1 + ph * 0.22, pw * 0.86, this.rant, u, pop((t - 0.45) / 0.3), m + pw * 0.62, y1 + ph * 0.55);

    // Panel 2 slides in from the right
    if (t > 2.6) {
      const k2 = ease((t - 2.6) / 0.35);
      this.panel(ctx, m + (1 - k2) * w, y2, pw, ph, 1.0, 'reveal_2', (c, x, y, pw2, ph2) => this.fallback2(c, x, y, pw2, ph2, t - 2.6), t - 2.6, k2, 1);
      if (t > 3.0) this.bubble(ctx, m + pw * 0.34, y2 + ph * 0.2, pw * 0.6, this.resolve, u * 1.05, pop((t - 3.0) / 0.25), m + pw * 0.55, y2 + ph * 0.4);
    }

    // Stamp
    if (t > 4.6) {
      const s = pop((t - 4.6) / 0.3);
      ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(-0.12); ctx.scale(s, s);
      ctx.font = `900 ${u * 0.95}px Impact,'Arial Black',system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const tw = Math.min(ctx.measureText("HE'S COMING FOR YOU").width, w * 0.86), bh = u * 1.4;
      ctx.fillStyle = 'rgba(200,20,20,.92)'; ctx.fillRect(-tw / 2 - u * 0.3, -bh / 2, tw + u * 0.6, bh);
      ctx.strokeStyle = PAPER; ctx.lineWidth = 4; ctx.strokeRect(-tw / 2 - u * 0.15, -bh / 2 + u * 0.15, tw + u * 0.3, bh - u * 0.3);
      ctx.fillStyle = PAPER; ctx.fillText("HE'S COMING FOR YOU", 0, 3, w * 0.86);
      ctx.restore();
    }
    if (t > 1) { ctx.fillStyle = 'rgba(29,20,14,.5)'; ctx.font = `700 ${u * 0.26}px system-ui,sans-serif`; ctx.textAlign = 'right'; ctx.fillText('tap to skip', w - m, h - m * 0.6); }
  }

  // pt = seconds since this panel started; enter = 0..1 slide-in progress; dir = slide direction (-1 from left, 1 from right)
  panel(ctx, x, y, pw, ph, rotDeg, key, fallback, pt = 1, enter = 1, dir = -1, opts = {}) {
    const f = Object.assign({ focus: 0.5, fill: 1 }, FRAMING[key] || {}, opts);
    // whip trail while sliding in
    if (enter < 1) for (let g = 1; g <= 3; g++) {
      ctx.fillStyle = `rgba(29,20,14,${0.12 * (1 - enter) * (4 - g) / 3})`;
      ctx.fillRect(x - dir * g * pw * 0.12 * (1 - enter), y + 4, pw, ph - 8);
    }
    // slam shake right after landing
    const land = pt - 0.32, shake = land > 0 && land < 0.18 ? (1 - land / 0.18) * 7 : 0;
    ctx.save(); ctx.translate(x + pw / 2 + (Math.random() - 0.5) * shake, y + ph / 2 + (Math.random() - 0.5) * shake);
    ctx.rotate(rotDeg * Math.PI / 180); ctx.translate(-pw / 2, -ph / 2);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(6, 8, pw, ph);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, pw, ph); ctx.clip();
    const img = this.art.panels && this.art.panels[key];
    if (img) {
      if (f.bg) { ctx.fillStyle = f.bg; ctx.fillRect(0, 0, pw, ph); }
      // background layer: slow push-in + drift (Ken Burns)
      const push = 1.03 + Math.min(1, pt / 5) * 0.07;
      const s = Math.max(pw / img.width, ph * f.fill / img.height) * push, iw = img.width * s, ih = img.height * s;
      const ix = Math.min(0, Math.max(pw - iw, pw / 2 - iw * f.focus - pt * pw * 0.012));
      ctx.drawImage(img, ix, ph - ih + Math.min(1, pt / 5) * ph * 0.02, iw, ih);
    } else fallback(ctx, 0, 0, pw, ph);
    // foreground layers move faster than the background → depth
    if (f.bokeh) this.bokeh(ctx, pw, ph, pt, key);
    if (f.lines === 'focus') this.focusLines(ctx, pw, ph, f.fx * pw, f.fy * ph, pt);
    if (f.lines === 'speed-h') this.speedLines(ctx, pw, ph, pt, 'h');
    if (f.lines === 'speed-v') this.speedLines(ctx, pw, ph, pt, 'v');
    ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.strokeRect(0, 0, pw, ph);
    ctx.restore();
  }

  // Cheap deterministic noise so lines "boil" a few times a second like hand-drawn frames.
  rnd(seed) { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  focusLines(ctx, pw, ph, fx, fy, t, strength = 1) {
    const frame = Math.floor(t * 12), R = Math.hypot(pw, ph), r0 = Math.min(pw, ph) * (0.34 + 0.03 * Math.sin(t * 9));
    ctx.save();
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2 + this.rnd(i + frame * 0.37) * 0.12;
      const inner = r0 * (1 + this.rnd(i * 3.1 + frame) * 0.5), wdt = 0.006 + this.rnd(i * 7.7) * 0.014;
      ctx.fillStyle = i % 3 ? `rgba(15,10,25,${0.32 * strength})` : `rgba(255,255,255,${0.28 * strength})`;
      ctx.beginPath();
      ctx.moveTo(fx + Math.cos(a) * inner, fy + Math.sin(a) * inner);
      ctx.lineTo(fx + Math.cos(a - wdt) * R, fy + Math.sin(a - wdt) * R);
      ctx.lineTo(fx + Math.cos(a + wdt) * R, fy + Math.sin(a + wdt) * R);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  speedLines(ctx, pw, ph, t, axis = 'h', strength = 1) {
    ctx.save();
    for (let i = 0; i < 26; i++) {
      const lane = this.rnd(i * 5.3), len = (0.25 + this.rnd(i * 9.1) * 0.5) * (axis === 'h' ? pw : ph);
      const speed = (1.6 + this.rnd(i * 2.2) * 2.4) * (axis === 'h' ? pw : ph);
      const span = (axis === 'h' ? pw : ph) + len;
      const p = ((t * speed + this.rnd(i) * span) % span) - len;
      ctx.strokeStyle = i % 4 ? `rgba(255,255,255,${0.45 * strength})` : `rgba(15,10,25,${0.4 * strength})`;
      ctx.lineWidth = 1.5 + this.rnd(i * 4.4) * 3; ctx.lineCap = 'round';
      ctx.beginPath();
      if (axis === 'h') { const yy = lane * ph; ctx.moveTo(pw - p, yy); ctx.lineTo(pw - p - len, yy); }
      else { const xx = lane * pw; ctx.moveTo(xx, ph - p); ctx.lineTo(xx, ph - p + len * 0.6); }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Out-of-focus lights drifting across the front of the panel, faster than the art behind them.
  bokeh(ctx, pw, ph, t, key) {
    const cols = ['255,210,120', '255,120,180', '140,220,255', '255,255,200'];
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const sp = 0.05 + this.rnd(i * 3.3 + key.length) * 0.08, r = ph * (0.03 + this.rnd(i * 1.7) * 0.06);
      const xx = ((this.rnd(i * 8.1) + t * sp) % 1.2 - 0.1) * pw, yy = (0.15 + this.rnd(i * 6.6) * 0.8) * ph + Math.sin(t * 1.3 + i) * ph * 0.02;
      const g = ctx.createRadialGradient(xx, yy, 0, xx, yy, r), c = cols[i % cols.length];
      g.addColorStop(0, `rgba(${c},.35)`); g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(xx, yy, r, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  burst(ctx, x, y, pw, ph, c1, c2, rot = 0) {
    ctx.fillStyle = c1; ctx.fillRect(x, y, pw, ph);
    ctx.fillStyle = c2; const cx = x + pw / 2, cy = y + ph * 0.55, R = Math.hypot(pw, ph);
    for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2 + rot; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.lineTo(cx + Math.cos(a + 0.11) * R, cy + Math.sin(a + 0.11) * R); ctx.fill(); }
  }

  fallback1(ctx, x, y, pw, ph, t) {
    this.burst(ctx, x, y, pw, ph, '#f6c444', '#ef9a2e', t * 0.15);
    const img = this.art.jobyPortrait; if (!img) return;
    const s = ph * 1.05, shake = t < 2.6 ? Math.sin(t * 60) * 3 : 0;
    ctx.drawImage(img, x + pw * 0.62 - s / 2 + shake, y + ph * 0.18, s, s);
    ctx.fillStyle = '#c41010'; ctx.font = `900 ${ph * 0.22}px Impact,'Arial Black',sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('!!', x + pw * 0.86, y + ph * 0.45);
  }

  fallback2(ctx, x, y, pw, ph, t) {
    this.burst(ctx, x, y, pw, ph, '#c94f3d', '#a83a2c', -t * 0.12);
    const img = this.art.jobyPortrait; if (!img) return;
    // foreground: Joby pushes in faster than the background spins, with a determined bob
    const s = ph * (1.15 + Math.min(1, t / 3) * 0.25), bob = Math.sin(t * 7) * ph * 0.012;
    ctx.drawImage(img, x + pw * 0.66 - s / 2 - Math.min(1, t / 3) * pw * 0.04, y + ph * 0.12 + bob, s, s);
  }

  caption(ctx, x, y, text, u) {
    ctx.font = `800 ${u * 0.28}px 'Comic Sans MS','Chalkboard SE',system-ui,sans-serif`;
    const tw = ctx.measureText(text).width + u * 0.4, bh = u * 0.5;
    ctx.fillStyle = '#fff3b0'; ctx.fillRect(x, y, tw, bh); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.strokeRect(x, y, tw, bh);
    ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, x + u * 0.2, y + bh / 2 + 1);
  }

  bubble(ctx, cx, cy, maxW, text, u, s, tx, ty) {
    if (s <= 0) return;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
    ctx.font = `900 ${u * 0.42}px 'Comic Sans MS','Chalkboard SE',system-ui,sans-serif`;
    const words = text.split(' '), lines = []; let line = '';
    for (const wd of words) { const tt = line ? line + ' ' + wd : wd; if (ctx.measureText(tt).width > maxW - u && line) { lines.push(line); line = wd; } else line = tt; }
    lines.push(line);
    const lh = u * 0.5, bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + u * 0.8, bh = lines.length * lh + u * 0.5;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, 0, bw / 2 + u * 0.15, bh / 2 + u * 0.1, 0, 0, 7); ctx.fill(); ctx.stroke();
    const dx = (tx - cx) / s, dy = (ty - cy) / s;
    const by = dy < 0 ? -bh / 2 : bh / 2, inset = dy < 0 ? 2 : -2;
    ctx.beginPath(); ctx.moveTo(-u * 0.25, by + inset); ctx.lineTo(dx * 0.6, dy * 0.6); ctx.lineTo(u * 0.25, by + inset); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-u * 0.25, by); ctx.lineTo(dx * 0.6, dy * 0.6); ctx.lineTo(u * 0.25, by); ctx.stroke();
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, 0, (i - (lines.length - 1) / 2) * lh + 1));
    ctx.restore();
  }

  sfxText(ctx, x, y, text, size, s, rot, maxW) {
    if (s <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot * Math.PI / 180); ctx.scale(s, s);
    ctx.font = `900 ${size}px Impact,'Arial Black',sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = size * 0.16; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.strokeText(text, 0, 0, maxW);
    ctx.fillStyle = '#ffd23a'; ctx.fillText(text, 0, 0, maxW);
    ctx.restore();
  }
}

// Early wake-up: Joby bolts out of bed ("WHAT are you DOING?!") and pulls on his beer can.
const HEAD = [180, 22, 160, 108];   // head crop in joby_portrait.png (512²)
const CAN_TOP = 116;                // can starts here in the portrait

export class ComicWake extends ComicReveal {
  constructor(art, lines) {
    super(art, lines);
    this.yell = lines.wake || 'WHAT are you DOING?!';
    this.beats = [
      { at: 0.05, fn: () => sfx.thump(0.6) },
      { at: 0.9, fn: () => { sfx.thump(1.1); sfx.wrong(); } },
      { at: 2.5, fn: () => sfx.thump(0.8) },
      { at: 3.25, fn: () => sfx.glug() },
      { at: 3.55, fn: () => sfx.door() },
      { at: 4.3, fn: () => sfx.thump(1.1) },
    ];
    this.len = 5.6;
  }

  draw(ctx, w, h) {
    const t = this.t, u = Math.min(w, h * 0.66) / 10;
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(160,110,60,.10)';
    for (let y = 0; y < h; y += 9) for (let x = (y / 9) % 2 ? 4 : 0; x < w; x += 9) { ctx.beginPath(); ctx.arc(x, y, 1.3, 0, 7); ctx.fill(); }
    const m = u * 0.35, pw = w - m * 2, gap = u * 0.3;
    const ph = Math.min((h - m * 3 - gap) / 2, pw * 0.95);
    const y1 = (h - (ph * 2 + gap)) / 2, y2 = y1 + ph + gap;

    const k1 = ease(t / 0.3);
    this.panel(ctx, m - (1 - k1) * w, y1, pw, ph, -1.2, 'wake_1', (c, x, y, a, b) => this.bed(c, x, y, a, b, t), t, k1, -1, { lines: t > 0.9 ? 'focus' : 'none' });
    if (t > 0.15) this.caption(ctx, m + u * 0.25 - (1 - k1) * w, y1 + u * 0.2, 'SOMEONE GRABBED THE WRONG WORD…', u);
    if (t < 0.9 && t > 0.2) ['Z', 'z', 'z'].forEach((z, i) => this.sfxText(ctx, m + pw * (0.62 + i * 0.08), y1 + ph * (0.42 - i * 0.09) - (t * 12 % 8), z, u * (0.7 - i * 0.12), 1, -10));
    if (t > 0.95) this.bubble(ctx, m + pw * 0.3, y1 + ph * 0.36, pw * 0.5, this.yell, u * 1.05, pop((t - 0.95) / 0.25), m + pw * 0.6, y1 + ph * 0.52);

    if (t > 2.5) {
      const k2 = ease((t - 2.5) / 0.3);
      this.panel(ctx, m + (1 - k2) * w, y2, pw, ph, 1.0, 'wake_2', (c, x, y, a, b) => this.suitUp(c, x, y, a, b, t - 2.5), t - 2.5, k2, 1, { lines: (t - 2.5) > 0.5 && (t - 2.5) < 1.1 ? 'speed-v' : (t - 2.5) >= 1.1 ? 'focus' : 'none', fx: 0.5, fy: 0.3 });
      if (t > 3.55) this.sfxText(ctx, m + pw * 0.24, y2 + ph * 0.3, 'SHLOOMP!', u * 0.85, pop((t - 3.55) / 0.25), -10);
      if (t > 3.8) this.sfxText(ctx, m + pw * 0.8, y2 + ph * 0.62, 'CLANK!', u * 0.75, pop((t - 3.8) / 0.25), 12);
    }
    if (t > 4.3) {
      const s = pop((t - 4.3) / 0.3);
      ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(-0.12); ctx.scale(s, s);
      ctx.font = `900 ${u * 0.95}px Impact,'Arial Black',system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const label = 'NASTY JOBY IS UP!', tw = Math.min(ctx.measureText(label).width, w * 0.86), bh = u * 1.4;
      ctx.fillStyle = 'rgba(200,20,20,.92)'; ctx.fillRect(-tw / 2 - u * 0.3, -bh / 2, tw + u * 0.6, bh);
      ctx.strokeStyle = PAPER; ctx.lineWidth = 4; ctx.strokeRect(-tw / 2 - u * 0.15, -bh / 2 + u * 0.15, tw + u * 0.3, bh - u * 0.3);
      ctx.fillStyle = PAPER; ctx.fillText(label, 0, 3, w * 0.86);
      ctx.restore();
    }
    if (t > 1) { ctx.fillStyle = 'rgba(29,20,14,.5)'; ctx.font = `700 ${u * 0.26}px system-ui,sans-serif`; ctx.textAlign = 'right'; ctx.fillText('tap to skip', w - m, h - m * 0.6); }
  }

  head(ctx, cx, cy, size, rot = 0) {
    const img = this.art.jobyPortrait; if (!img) return;
    const [sx, sy, sw, sh] = HEAD, k = img.width / 512, hw = size, hh = size * sh / sw;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    ctx.drawImage(img, sx * k, sy * k, sw * k, sh * k, -hw / 2, -hh / 2, hw, hh);
    ctx.restore();
  }

  // Panel 1 fallback: night bedroom, asleep → bolt upright.
  bed(ctx, x, y, pw, ph, t) {
    const awake0 = t > 0.9, cam = awake0 ? Math.min(1, (t - 0.9) * 4) : 0;
    // camera: slow drift while asleep, snaps in when he wakes; background moves less than foreground
    const bgX = -t * pw * 0.008 - cam * pw * 0.02, fgX = -t * pw * 0.02 - cam * pw * 0.06;
    ctx.fillStyle = '#26315e'; ctx.fillRect(x, y, pw, ph);
    // wallpaper stripes (far background)
    ctx.fillStyle = 'rgba(255,255,255,.04)';
    for (let i = -1; i < 12; i++) ctx.fillRect(x + i * pw * 0.1 + bgX % (pw * 0.1), y, pw * 0.04, ph * 0.8);
    // window + moon (background layer)
    ctx.save(); ctx.translate(bgX, 0);
    ctx.fillStyle = '#3d4c8a'; ctx.fillRect(x + pw * 0.06, y + ph * 0.2, pw * 0.22, ph * 0.3);
    ctx.fillStyle = '#f8eec6'; ctx.beginPath(); ctx.arc(x + pw * 0.2, y + ph * 0.3, ph * 0.06, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 4; i++) { const tw = 0.5 + 0.5 * Math.sin(t * 4 + i * 2); ctx.globalAlpha = tw; ctx.fillRect(x + pw * (0.08 + i * 0.05), y + ph * (0.24 + (i % 2) * 0.12), 2, 2); }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(x + pw * 0.06, y + ph * 0.2, pw * 0.22, ph * 0.3);
    ctx.beginPath(); ctx.moveTo(x + pw * 0.17, y + ph * 0.2); ctx.lineTo(x + pw * 0.17, y + ph * 0.5); ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.translate(fgX, 0);
    // floor
    ctx.fillStyle = '#5a3d2b'; ctx.fillRect(x, y + ph * 0.8, pw, ph * 0.2);
    // bed
    const bx = x + pw * 0.3, by = y + ph * 0.55, bw = pw * 0.62, bh = ph * 0.3;
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(bx + bw - 14, by - ph * 0.22, 14, bh + ph * 0.22); ctx.strokeRect(bx + bw - 14, by - ph * 0.22, 14, bh + ph * 0.22);
    ctx.fillStyle = '#efe6d2'; ctx.fillRect(bx, by, bw - 14, bh * 0.45); ctx.strokeRect(bx, by, bw - 14, bh * 0.45);
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(bx, by + bh * 0.45, bw - 14, bh * 0.55); ctx.strokeRect(bx, by + bh * 0.45, bw - 14, bh * 0.55);
    const awake = t > 0.9, jolt = awake ? Math.max(0, 1 - (t - 0.9) * 3) : 0;
    // pillow
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(bx + bw * 0.78, by - 2, bw * 0.13, bh * 0.22, 0, 0, 7); ctx.fill(); ctx.stroke();
    // blanket (thrown off when awake)
    ctx.save(); ctx.translate(bx + bw * 0.35, by + 4); ctx.rotate(awake ? -0.5 * Math.min(1, (t - 0.9) * 5) : 0);
    ctx.fillStyle = '#4a7bb5'; ctx.fillRect(-bw * 0.35, -bh * 0.25, bw * 0.75, bh * 0.5); ctx.strokeRect(-bw * 0.35, -bh * 0.25, bw * 0.75, bh * 0.5);
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
    for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-bw * 0.35 + i * bw * 0.125, -bh * 0.25); ctx.lineTo(-bw * 0.35 + i * bw * 0.125, bh * 0.25); ctx.stroke(); }
    ctx.restore();
    if (!awake) {
      this.head(ctx, bx + bw * 0.74, by - bh * 0.18, ph * 0.38, -Math.PI / 2 + 0.15 + Math.sin(t * 3) * 0.03);
    } else {
      const shake = Math.sin(t * 70) * 6 * (0.3 + jolt);
      // pajama-clad Joby sitting bolt upright, arms flung up in alarm
      const hs = ph * 0.34, hx = bx + bw * 0.71 + shake, hy = by - ph * 0.27 - jolt * ph * 0.08;
      this.pajamas(ctx, hx, hy + hs * 0.28, hs * 0.95, by - (hy + hs * 0.28) + bh * 0.35, 'shock', t);
      // blanket bunched over his lap: a lumpy mound with the same stripes as the thrown-off end
      const lw = hs * 0.85, ly = by + bh * 0.02;
      ctx.save(); ctx.beginPath();
      ctx.moveTo(hx - lw, ly + bh * 0.3);
      ctx.quadraticCurveTo(hx - lw * 0.9, ly - bh * 0.12, hx - lw * 0.4, ly - bh * 0.05);
      ctx.quadraticCurveTo(hx, ly - bh * 0.22, hx + lw * 0.45, ly - bh * 0.06);
      ctx.quadraticCurveTo(hx + lw * 0.95, ly - bh * 0.1, hx + lw, ly + bh * 0.3);
      ctx.closePath(); ctx.fillStyle = '#4a7bb5'; ctx.fill();
      ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
      for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(hx + i * lw * 0.25, ly - bh * 0.3); ctx.lineTo(hx + i * lw * 0.25 + 6, ly + bh * 0.4); ctx.stroke(); }
      ctx.restore(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      this.head(ctx, hx, hy, hs, Math.sin(t * 40) * 0.05);
      // shock lines
      ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 4;
      for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.15 + i * 0.12), cx = bx + bw * 0.71, cy = by - ph * 0.27, r1 = ph * 0.22, r2 = ph * 0.32;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); ctx.stroke(); }
    }
    ctx.restore();
  }

  // Joby's pajamas: striped top with collar, buttons, sleeves and hands.
  // (cx, neckY) = base of the neck, sw = shoulder width, h = torso height. pose: 'shock' (arms up) | 'pull' (hands down at hips)
  pajamas(ctx, cx, neckY, sw, h, pose, t, gripY, gripDX) {
    const SKIN = '#f3c4a2', PJ = '#9cc3ec', STRIPE = '#3b5e9e';
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const sh = sw / 2, hip = sw * 0.46;
    // arms first (behind the torso edge)
    const arm = (side) => {
      const sx = cx + side * sh * 0.92, sy = neckY + h * 0.12;
      let ex, ey, hx, hy;
      if (pose === 'shock') { const wob = Math.sin(t * 30 + side) * sw * 0.025;
        ex = sx + side * sw * 0.3; ey = sy + sw * 0.05; hx = ex + side * sw * 0.08 + wob; hy = ey - sw * 0.36; }
      else { hx = cx + side * (gripDX ?? sh * 0.95); hy = gripY ?? (sy + h * 0.6); ex = (sx + hx) / 2 + side * sw * 0.18; ey = (sy + hy) / 2; }
      ctx.strokeStyle = INK; ctx.lineWidth = sw * 0.2 + 5; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.strokeStyle = PJ; ctx.lineWidth = sw * 0.2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.strokeStyle = STRIPE; ctx.lineWidth = 2.5; // cuff
      const cxx = ex + (hx - ex) * 0.82, cyy = ey + (hy - ey) * 0.82, nx = -(hy - ey), ny = hx - ex, nl = Math.hypot(nx, ny) || 1;
      ctx.beginPath(); ctx.moveTo(cxx + nx / nl * sw * 0.1, cyy + ny / nl * sw * 0.1); ctx.lineTo(cxx - nx / nl * sw * 0.1, cyy - ny / nl * sw * 0.1); ctx.stroke();
      return [hx, hy];
    };
    const hands = [arm(-1), arm(1)];
    // torso
    ctx.beginPath();
    ctx.moveTo(cx - sw * 0.14, neckY - 2);
    ctx.quadraticCurveTo(cx - sh, neckY, cx - sh, neckY + h * 0.22);
    ctx.lineTo(cx - hip, neckY + h); ctx.lineTo(cx + hip, neckY + h); ctx.lineTo(cx + sh, neckY + h * 0.22);
    ctx.quadraticCurveTo(cx + sh, neckY, cx + sw * 0.14, neckY - 2); ctx.closePath();
    ctx.fillStyle = PJ; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = STRIPE;
    for (let i = -6; i <= 6; i++) ctx.fillRect(cx + i * sw * 0.13 - 1.5, neckY - 4, 3, h + 8);
    ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
    // collar (white lapels) + placket + buttons
    ctx.fillStyle = '#fff';
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx, neckY + h * 0.2); ctx.lineTo(cx + side * sw * 0.16, neckY - 3); ctx.lineTo(cx + side * sw * 0.3, neckY + h * 0.06); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(cx, neckY + h * 0.2); ctx.lineTo(cx, neckY + h); ctx.stroke();
    ctx.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(cx + sw * 0.04, neckY + h * (0.32 + i * 0.2), Math.max(2, sw * 0.025), 0, 7); ctx.fill(); ctx.stroke(); }
    // pocket
    ctx.strokeRect(cx - sh * 0.62, neckY + h * 0.3, sw * 0.16, sw * 0.13);
    // hands (open, fingers splayed in shock; fists when gripping)
    for (const [hx, hy] of hands) {
      ctx.fillStyle = SKIN; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      if (pose === 'shock') for (let f = -2; f <= 2; f++) { const a = -Math.PI / 2 + f * 0.34; ctx.beginPath(); ctx.ellipse(hx + Math.cos(a) * sw * 0.085, hy + Math.sin(a) * sw * 0.085, sw * 0.026, sw * 0.055, a + Math.PI / 2, 0, 7); ctx.fill(); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(hx, hy, sw * 0.075, 0, 7); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  // Panel 2 fallback: pulls the beer can up over the pajamas.
  suitUp(ctx, x, y, pw, ph, t) {
    this.burst(ctx, x, y, pw, ph, '#f6c444', '#ef9a2e');
    const img = this.art.jobyPortrait; if (!img) return;
    const k = img.width / 512, S = ph * 1.15, cx = x + pw * 0.5, top = y + ph * 0.02;
    const scale = S / 512, headCy = top + (HEAD[1] + HEAD[3] / 2) * scale;
    // the can rises from below and lands at the chin
    const land = Math.min(1, Math.max(0, (t - 0.55) / 0.5)), e = 1 - Math.pow(1 - land, 3);
    const rise = (1 - e) * ph * 0.9;
    const bounce = land >= 1 ? Math.sin(Math.min(1, (t - 1.05) * 4) * Math.PI) * 6 * Math.max(0, 1 - (t - 1.05) * 3) : 0;
    const canY = top + CAN_TOP * scale + rise - bounce, hw = HEAD[2] * scale;
    // pajama Joby (hidden once the can is on), gripping the rim as he hauls it up
    if (land >= 1) {   // suited up: the full Joby art
      ctx.drawImage(img, cx - S / 2, top - bounce, S, S);
      return;
    }
    const can = this.art.jobyCan || img, grip = canY + S * 0.035;
    this.pajamas(ctx, cx, headCy + hw * 0.28, hw * 1.0, ph, 'pull', t, Math.max(headCy + hw * 0.9, grip), S * 0.25);
    this.head(ctx, cx, headCy + Math.sin(t * 25) * 2, hw, 0);
    ctx.drawImage(can, 0, CAN_TOP * k, 512 * k, (512 - CAN_TOP) * k, cx - S / 2, canY, S, (512 - CAN_TOP) * scale);
    // fists over the rim while pulling
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#f3c4a2'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx + side * S * 0.25, grip, hw * 0.09, 0, 7); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + side * S * 0.25 - hw * 0.06, grip - hw * 0.02); ctx.lineTo(cx + side * S * 0.25 + hw * 0.06, grip - hw * 0.02); ctx.stroke();
    }
  }
}


// Win: a big, drawn-out melt. Shake → can bursts → Joby slumps and liquefies into a bubbling puddle.
export class MeltScene {
  constructor(art, lines) {
    this.art = art; this.t = 0; this.done = false; this.fired = new Set();
    this.scream = (lines.melt || 'NOOOOOOO!!!!!!').toUpperCase();
    this.len = 5.6;
    this.drips = []; this.spray = []; this.steam = [];
    this.noise = Array.from({ length: 36 }, () => 0.4 + Math.random() * 1.2);
    this.beats = [
      { at: 0.0, fn: () => sfx.thump(1.2) },
      { at: 0.9, fn: () => { sfx.noise(1.4, 0.35, 1500); sfx.thump(1.3); } },
      { at: 1.0, fn: () => sfx.scream() },
      { at: 4.6, fn: () => sfx.tone(140, 0.25, 'sine', 0.3, 0.5) },
      { at: 5.0, fn: () => sfx.fanfare() },
    ];
  }
  skip() { if (this.t > 1.5) this.done = true; }
  update(dt) {
    this.t += dt;
    for (const b of this.beats) if (this.t >= b.at && !this.fired.has(b)) { this.fired.add(b); b.fn(); }
    for (const a of [this.drips, this.spray, this.steam]) for (const p of a) { p.t += dt; p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    this.drips = this.drips.filter(p => p.t < p.life); this.spray = this.spray.filter(p => p.t < p.life); this.steam = this.steam.filter(p => p.t < p.life);
    if (this.t >= this.len) this.done = true;
  }

  draw(ctx, w, h) {
    const t = this.t, u = Math.min(w, h * 0.66) / 10, img = this.art.jobyPortrait;
    const cx = w / 2, S = Math.min(w * 0.9, h * 0.5), base = h * 0.66;
    // background: dark red with spinning rays, flashes on the burst
    ctx.fillStyle = '#2a0608'; ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.translate(cx, base - S * 0.45); ctx.rotate(t * 0.4);
    ctx.fillStyle = 'rgba(200,30,30,.35)';
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * h, Math.sin(a) * h); ctx.lineTo(Math.cos(a + 0.12) * h, Math.sin(a + 0.12) * h); ctx.fill(); }
    ctx.restore();

    if (t > 0.9 && t < 4.4) this.focusLines(ctx, w, h, cx, base - S * 0.5, t, 0.9);
    const melt = Math.max(0, Math.min(1, (t - 1.0) / 3.4));
    // puddle
    const pr = S * (0.15 + melt * 0.55);
    ctx.fillStyle = '#b8261c'; ctx.beginPath(); ctx.ellipse(cx, base + S * 0.02, pr, pr * 0.22, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#f1d27a'; ctx.beginPath(); ctx.ellipse(cx + pr * 0.15, base + S * 0.02, pr * 0.55, pr * 0.12, 0, 0, 7); ctx.fill();
    if (melt > 0.2) for (let i = 0; i < 7; i++) { // bubbles
      const ph = (t * 1.7 + i * 0.37) % 1, bx = cx + Math.sin(i * 7.3) * pr * 0.7, r = 3 + ph * 9;
      ctx.strokeStyle = `rgba(255,240,200,${1 - ph})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx, base - ph * 6, r, 0, 7); ctx.stroke();
    }

    if (img && t < 4.6) {
      const shake = t < 1.0 ? (Math.random() - 0.5) * 18 * t : (Math.random() - 0.5) * 6 * (1 - melt);
      const off = document.createElement('canvas'), W = Math.round(S), H = Math.round(S * 2.2);
      off.width = W; off.height = H; const o = off.getContext('2d');
      const n = this.noise.length, sw = img.width / n, dw = W / n;
      for (let i = 0; i < n; i++) {
        const drop = Math.pow(melt, 1.5) * S * 1.1 * this.noise[i];
        const stretch = 1 + melt * 0.9 * this.noise[i];
        const squash = 1 - Math.pow(melt, 2) * 0.85;               // everything sinks into the puddle
        o.drawImage(img, i * sw, 0, sw, img.height, i * dw, drop + (1 - squash) * S, dw + 0.6, S * stretch * squash);
      }
      o.globalCompositeOperation = 'source-atop';
      o.fillStyle = `rgba(120,200,60,${melt * 0.55})`; o.fillRect(0, 0, W, H);
      o.fillStyle = `rgba(255,60,40,${Math.max(0, 0.5 - Math.abs(t - 0.9) * 2)})`; o.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - 4.0) * 1.6);
      ctx.beginPath(); ctx.rect(0, 0, w, base + S * 0.03); ctx.clip();   // he sinks INTO the puddle
      ctx.drawImage(off, cx - W / 2 + shake, base - S + S * 0.02);
      ctx.restore();
      // drips off the bottom edge
      if (melt > 0 && Math.random() < 0.7) this.drips.push({ x: cx + (Math.random() - 0.5) * S * 0.6, y: base - S * (0.5 - melt * 0.4), vx: 0, vy: 40, g: 900, t: 0, life: 0.6, r: 3 + Math.random() * 5, c: Math.random() < 0.5 ? '#c41010' : '#f1d27a' });
      if (t < 1.0 && Math.random() < 0.5) this.steam.push({ x: cx + (Math.random() - 0.5) * S * 0.5, y: base - S * 0.8, vx: (Math.random() - 0.5) * 30, vy: -60, t: 0, life: 1, r: 8 });
    }
    if (t > 0.9 && t < 1.4 && this.spray.length < 160) for (let i = 0; i < 20; i++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 300 + Math.random() * 600;
      this.spray.push({ x: cx, y: base - S * 0.75, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 1200, t: 0, life: 1.4, r: 3 + Math.random() * 6, c: Math.random() < 0.7 ? '#fffaf0' : '#f1d27a' }); }

    // puddle surface over the sinking body
    ctx.fillStyle = '#b8261c'; ctx.beginPath(); ctx.ellipse(cx, base + S * 0.02, pr, pr * 0.22, 0, 0, Math.PI); ctx.fill();
    for (const p of this.steam) { ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - p.t / p.life)})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + p.t * 3), 0, 7); ctx.fill(); }
    for (const p of [...this.drips, ...this.spray]) { ctx.fillStyle = p.c; ctx.globalAlpha = Math.min(1, (p.life - p.t) * 3); ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;

    // white flash on the burst
    if (t > 0.88 && t < 1.15) { ctx.fillStyle = `rgba(255,255,255,${1 - (t - 0.88) / 0.27})`; ctx.fillRect(0, 0, w, h); }

    // comic SFX
    if (t < 0.95) this.sfxText(ctx, cx + S * 0.38, base - S * 0.95, '!!', u * 1.2, pop(t / 0.2), 10);
    if (t > 0.9 && t < 2.2) this.sfxText(ctx, cx - S * 0.25, base - S * 1.02, 'PSSSHHH!', u * 1.0, pop((t - 0.9) / 0.2), -12);
    if (t > 1.0) {
      const grow = Math.min(1, (t - 1.0) / 3.0), jitter = (Math.random() - 0.5) * 6;
      const label = this.scream.replace(/O+/, 'O'.repeat(3 + Math.floor(grow * 8)));
      this.sfxText(ctx, cx + jitter, h * 0.16, label, u * (0.7 + grow * 0.5), 1, -4 + Math.sin(t * 20) * 2, w * 0.9);
    }
    if (t > 4.6) this.sfxText(ctx, cx, base - S * 0.25, '…blub.', u * 0.6, pop((t - 4.6) / 0.3), 0);
    if (t > 1.5) { ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = `700 ${u * 0.26}px system-ui,sans-serif`; ctx.textAlign = 'right'; ctx.fillText('tap to skip', w - u * 0.4, h - u * 0.3); }
  }
}
MeltScene.prototype.sfxText = ComicReveal.prototype.sfxText;
for (const k of ['rnd', 'focusLines', 'speedLines', 'bokeh']) { MeltScene.prototype[k] = ComicReveal.prototype[k]; }


// Hiding in Toppers: the regular who owns the spot tells you to leave. Plays over the paused-looking map.
export class ComicToppers {
  constructor(art, lines) {
    this.art = art; this.t = 0; this.done = false; this.len = 3.4;
    this.line = lines.toppers || 'HEY NO YOU HAVE TO LEAVE, THIS IS MY SPOT';
    this.fired = false;
  }
  skip() { if (this.t > 0.8) this.done = true; }
  update(dt) {
    this.t += dt;
    if (!this.fired && this.t > 0.45) { this.fired = true; sfx.thump(0.9); }
    if (this.t >= this.len) this.done = true;
  }
  draw(ctx, w, h) {
    const t = this.t, u = Math.min(w, h * 0.66) / 10;
    const out = Math.max(0, (t - (this.len - 0.3)) / 0.3);
    ctx.fillStyle = `rgba(20,8,30,${0.6 * Math.min(1, t * 4) * (1 - out)})`; ctx.fillRect(0, 0, w, h);
    const pw = Math.min(w * 0.9, h * 0.5), ph = pw * 1.25, k = ease(t / 0.3);
    const x = (w - pw) / 2, y = (h - ph) / 2 + (1 - k) * h * 0.7 + out * h;
    ctx.save(); ctx.translate(x + pw / 2, y + ph / 2); ctx.rotate(1.5 * Math.PI / 180); ctx.translate(-pw / 2, -ph / 2);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(7, 9, pw, ph);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, pw, ph); ctx.clip();
    // bar-light backdrop
    const g = ctx.createRadialGradient(pw / 2, ph * 0.3, 10, pw / 2, ph * 0.4, ph);
    g.addColorStop(0, '#6b3fa0'); g.addColorStop(1, '#1d0f33'); ctx.fillStyle = g; ctx.fillRect(0, 0, pw, ph);
    const art = this.art.panels && this.art.panels.toppers, img = art || this.art.toppersGuy;
    if (img) {
      const push = 1 + Math.min(1, t / this.len) * 0.08, s = Math.max(pw / img.width, ph / img.height) * push;
      const iw = img.width * s, ih = img.height * s;
      const fx = art ? FRAMING.toppers.focus : 0.5;
      ctx.drawImage(img, Math.min(0, Math.max(pw - iw, pw / 2 - iw * fx)), art ? (ph - ih) * 0.35 : Math.min(0, (ph - ih) * 0.08), iw, ih);
    }
    if (img) {
      this.bokeh(ctx, pw, ph, t, 'toppers');
      if (t > 0.45) this.focusLines(ctx, pw, ph, pw * 0.47, ph * 0.42, t, Math.min(1, (t - 0.45) * 4) * 0.8);
    }
    if (img && !art) {
      // halftone + ink vignette so a photo reads as a comic panel
      ctx.fillStyle = 'rgba(20,10,30,.18)';
      for (let yy = 0; yy < ph; yy += 6) for (let xx = (yy / 6) % 2 ? 3 : 0; xx < pw; xx += 6) { ctx.beginPath(); ctx.arc(xx, yy, 1.1, 0, 7); ctx.fill(); }
    }
    ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.strokeRect(0, 0, pw, ph);
    ctx.restore();
    // caption + bubble
    if (t > 0.2) ComicReveal.prototype.caption.call(this, ctx, x + u * 0.2, y + u * 0.2, 'MEANWHILE, INSIDE TOPPERS…', u);
    if (t > 0.45) {
      const sc = pop((t - 0.45) / 0.25), shake = Math.sin(t * 50) * 2;
      ComicReveal.prototype.bubble.call(this, ctx, x + pw * 0.5 + shake, y + ph * 0.2, pw * 0.92, this.line, u * 1.05, sc, x + pw * 0.46, y + ph * 0.44);
    }
    if (t > 0.8) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = `700 ${u * 0.26}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.fillText('tap to skip', w / 2, Math.min(h - 12, y + ph + u * 0.5)); }
  }
}

for (const k of ['rnd', 'focusLines', 'speedLines', 'bokeh']) ComicToppers.prototype[k] = ComicReveal.prototype[k];
