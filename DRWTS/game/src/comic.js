// Comic-page cutscenes. Panels use Gemini art from assets/panels/ when present, otherwise a drawn fallback.
import { sfx } from './audio.js';

const PAPER = '#f3e7cb', INK = '#1d140e';

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
    this.panel(ctx, m - (1 - k1) * w, y1, pw, ph, -1.2, 'reveal_1', (c, x, y, pw2, ph2) => this.fallback1(c, x, y, pw2, ph2, t));
    if (t > 0.2) this.caption(ctx, m + u * 0.25 - (1 - k1) * w, y1 + u * 0.2, 'MEANWHILE, ON THE TOWNIE SIDE OF TOWN…', u);
    if (t > 0.45) this.bubble(ctx, m + pw * 0.52, y1 + ph * 0.22, pw * 0.86, this.rant, u, pop((t - 0.45) / 0.3), m + pw * 0.62, y1 + ph * 0.55);

    // Panel 2 slides in from the right
    if (t > 2.6) {
      const k2 = ease((t - 2.6) / 0.35);
      this.panel(ctx, m + (1 - k2) * w, y2, pw, ph, 1.0, 'reveal_2', (c, x, y, pw2, ph2) => this.fallback2(c, x, y, pw2, ph2, t - 2.6));
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

  panel(ctx, x, y, pw, ph, rotDeg, key, fallback) {
    ctx.save(); ctx.translate(x + pw / 2, y + ph / 2); ctx.rotate(rotDeg * Math.PI / 180); ctx.translate(-pw / 2, -ph / 2);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(6, 8, pw, ph);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, pw, ph); ctx.clip();
    const img = this.art.panels && this.art.panels[key];
    if (img) {
      const s = Math.max(pw / img.width, ph / img.height), iw = img.width * s, ih = img.height * s;
      ctx.drawImage(img, (pw - iw) / 2, (ph - ih) / 2, iw, ih);
    } else fallback(ctx, 0, 0, pw, ph);
    ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.strokeRect(0, 0, pw, ph);
    ctx.restore();
  }

  burst(ctx, x, y, pw, ph, c1, c2) {
    ctx.fillStyle = c1; ctx.fillRect(x, y, pw, ph);
    ctx.fillStyle = c2; const cx = x + pw / 2, cy = y + ph * 0.55, R = Math.hypot(pw, ph);
    for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.lineTo(cx + Math.cos(a + 0.11) * R, cy + Math.sin(a + 0.11) * R); ctx.fill(); }
  }

  fallback1(ctx, x, y, pw, ph, t) {
    this.burst(ctx, x, y, pw, ph, '#f6c444', '#ef9a2e');
    const img = this.art.jobyPortrait; if (!img) return;
    const s = ph * 1.05, shake = t < 2.6 ? Math.sin(t * 60) * 3 : 0;
    ctx.drawImage(img, x + pw * 0.62 - s / 2 + shake, y + ph * 0.18, s, s);
    ctx.fillStyle = '#c41010'; ctx.font = `900 ${ph * 0.22}px Impact,'Arial Black',sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('!!', x + pw * 0.86, y + ph * 0.45);
  }

  fallback2(ctx, x, y, pw, ph, t) {
    this.burst(ctx, x, y, pw, ph, '#c94f3d', '#a83a2c');
    const img = this.art.jobyPortrait; if (!img) return;
    // slow push-in on a determined Joby
    const s = ph * (1.15 + Math.min(1, t / 3) * 0.2);
    ctx.drawImage(img, x + pw * 0.66 - s / 2, y + ph * 0.12, s, s);
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
    this.panel(ctx, m - (1 - k1) * w, y1, pw, ph, -1.2, 'wake_1', (c, x, y, a, b) => this.bed(c, x, y, a, b, t));
    if (t > 0.15) this.caption(ctx, m + u * 0.25 - (1 - k1) * w, y1 + u * 0.2, 'SOMEONE GRABBED THE WRONG WORD…', u);
    if (t < 0.9 && t > 0.2) ['Z', 'z', 'z'].forEach((z, i) => this.sfxText(ctx, m + pw * (0.62 + i * 0.08), y1 + ph * (0.42 - i * 0.09) - (t * 12 % 8), z, u * (0.7 - i * 0.12), 1, -10));
    if (t > 0.95) this.bubble(ctx, m + pw * 0.36, y1 + ph * 0.3, pw * 0.62, this.yell, u * 1.1, pop((t - 0.95) / 0.25), m + pw * 0.6, y1 + ph * 0.52);

    if (t > 2.5) {
      const k2 = ease((t - 2.5) / 0.3);
      this.panel(ctx, m + (1 - k2) * w, y2, pw, ph, 1.0, 'wake_2', (c, x, y, a, b) => this.suitUp(c, x, y, a, b, t - 2.5));
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
    ctx.fillStyle = '#26315e'; ctx.fillRect(x, y, pw, ph);
    // window + moon
    ctx.fillStyle = '#3d4c8a'; ctx.fillRect(x + pw * 0.06, y + ph * 0.2, pw * 0.22, ph * 0.3);
    ctx.fillStyle = '#f8eec6'; ctx.beginPath(); ctx.arc(x + pw * 0.2, y + ph * 0.3, ph * 0.06, 0, 7); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(x + pw * 0.06, y + ph * 0.2, pw * 0.22, ph * 0.3);
    ctx.beginPath(); ctx.moveTo(x + pw * 0.17, y + ph * 0.2); ctx.lineTo(x + pw * 0.17, y + ph * 0.5); ctx.stroke();
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
      // pajama body sitting bolt upright
      ctx.fillStyle = '#c94f3d'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
      ctx.fillRect(bx + bw * 0.62 + shake, by - ph * 0.14, bw * 0.18, ph * 0.18); ctx.strokeRect(bx + bw * 0.62 + shake, by - ph * 0.14, bw * 0.18, ph * 0.18);
      this.head(ctx, bx + bw * 0.71 + shake, by - ph * 0.25 - jolt * ph * 0.08, ph * 0.34, Math.sin(t * 40) * 0.05);
      // shock lines
      ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 4;
      for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.15 + i * 0.12), cx = bx + bw * 0.71, cy = by - ph * 0.27, r1 = ph * 0.22, r2 = ph * 0.32;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); ctx.stroke(); }
    }
  }

  // Panel 2 fallback: pulls the beer can up over the pajamas.
  suitUp(ctx, x, y, pw, ph, t) {
    this.burst(ctx, x, y, pw, ph, '#f6c444', '#ef9a2e');
    const img = this.art.jobyPortrait; if (!img) return;
    const k = img.width / 512, S = ph * 1.15, cx = x + pw * 0.5, top = y + ph * 0.02;
    const scale = S / 512, headCy = top + (HEAD[1] + HEAD[3] / 2) * scale;
    // pajama body
    ctx.fillStyle = '#c94f3d'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.fillRect(cx - S * 0.13, top + CAN_TOP * scale, S * 0.26, ph); ctx.strokeRect(cx - S * 0.13, top + CAN_TOP * scale, S * 0.26, ph);
    this.head(ctx, cx, headCy, HEAD[2] * scale, 0);
    // the can rises from below and lands at the chin
    const land = Math.min(1, Math.max(0, (t - 0.55) / 0.5)), e = 1 - Math.pow(1 - land, 3);
    const rise = (1 - e) * ph * 0.9 + (land >= 1 ? 0 : 0);
    const bounce = land >= 1 ? Math.sin(Math.min(1, (t - 1.05) * 4) * Math.PI) * 6 * Math.max(0, 1 - (t - 1.05) * 3) : 0;
    ctx.drawImage(img, 0, CAN_TOP * k, 512 * k, (512 - CAN_TOP) * k, cx - S / 2, top + CAN_TOP * scale + rise - bounce, S, (512 - CAN_TOP) * scale);
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
    const img = (this.art.panels && this.art.panels.toppers) || this.art.toppersGuy;
    if (img) {
      const push = 1 + Math.min(1, t / this.len) * 0.08, s = Math.max(pw / img.width, ph / img.height) * push;
      const iw = img.width * s, ih = img.height * s;
      ctx.drawImage(img, (pw - iw) / 2, Math.min(0, (ph - ih) * 0.08), iw, ih);
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
      ComicReveal.prototype.bubble.call(this, ctx, x + pw * 0.5 + shake, y + ph * 0.8, pw * 0.92, this.line, u * 1.05, sc, x + pw * 0.5, y + ph * 0.3);
    }
    if (t > 0.8) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = `700 ${u * 0.26}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.fillText('tap to skip', w / 2, Math.min(h - 12, y + ph + u * 0.5)); }
  }
}
