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
      { at: 3.1, fn: () => sfx.glug() }, { at: 3.45, fn: () => sfx.glug() }, { at: 3.8, fn: () => sfx.glug() },
      { at: 4.9, fn: () => sfx.thump(1.1) },
    ];
    this.len = 6.4;
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
      ['GLUG', 'GLUG', 'GLUG!'].forEach((g, i) => {
        const tt = t - (3.1 + i * 0.35); if (tt < 0) return;
        this.sfxText(ctx, m + pw * (0.2 + i * 0.27), y2 + ph * (0.25 + (i % 2) * 0.12), g, u * 0.9, pop(tt / 0.25), -8 + i * 8);
      });
      if (t > 4.2) this.bubble(ctx, m + pw * 0.5, y2 + ph * 0.84, pw * 0.5, 'AHHH.', u, pop((t - 4.2) / 0.25), m + pw * 0.5, y2 + ph * 0.6);
    }

    // Stamp
    if (t > 4.9) {
      const s = pop((t - 4.9) / 0.3);
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
    this.burst(ctx, x, y, pw, ph, '#9fd0e8', '#7fb7d6');
    const img = this.art.jobyPortrait; if (!img) return;
    const s = ph * 1.05, tilt = -Math.min(1, t / 0.5) * 0.28;
    ctx.save(); ctx.translate(x + pw * 0.5, y + ph * 1.0); ctx.rotate(tilt); ctx.drawImage(img, -s / 2, -s * 0.85, s, s); ctx.restore();
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

  sfxText(ctx, x, y, text, size, s, rot) {
    if (s <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot * Math.PI / 180); ctx.scale(s, s);
    ctx.font = `900 ${size}px Impact,'Arial Black',sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = size * 0.16; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.strokeText(text, 0, 0);
    ctx.fillStyle = '#ffd23a'; ctx.fillText(text, 0, 0);
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
