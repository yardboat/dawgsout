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
