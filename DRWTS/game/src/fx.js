// Juice: confetti, shockwaves, flying words, foam puddles, screen shake. World-space unless noted.
const CONFETTI = ['#ffd23a', '#ba0c2f', '#ffffff', '#1b1b1b', '#ff8a3d'];

export class FX {
  constructor() { this.reset(); }
  reset() { this.notes = []; this.parts = []; this.rings = []; this.flyers = []; this.puddles = []; this.shake = 0; }

  burst(x, y, n = 26, colors = CONFETTI) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 160 + Math.random() * 320;
      this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 140, life: 0.7 + Math.random() * 0.5, t: 0,
        c: colors[(Math.random() * colors.length) | 0], s: 6 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - 0.5) * 16 });
    }
  }
  ring(x, y, color = '#ff3030') { this.rings.push({ x, y, t: 0, life: 0.5, color }); }
  // Screen-space flyer from (sx,sy) to HUD slot `slot`.
  fly(word, sx, sy, slot) { this.flyers.push({ word, sx, sy, slot, t: 0, life: 0.55 }); }
  puddle(x, y) {
    this.puddles.push({ x: x + (Math.random() - 0.5) * 18, y: y + (Math.random() - 0.5) * 14, t: 0, life: 5, r: 14 + Math.random() * 10,
      bubbles: Array.from({ length: 4 }, () => [(Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 0.8, 2 + Math.random() * 3]) });
    if (this.puddles.length > 40) this.puddles.shift();
  }
  note(x, y) { this.notes = this.notes || []; this.notes.push({ x, y, t: 0, life: 1.4, ch: Math.random() < 0.5 ? '♪' : '♫', ph: Math.random() * 6 }); }
  kick(amount) { this.shake = Math.max(this.shake, amount); }
  flying() { return this.flyers.length; }

  update(dt) {
    for (const p of this.parts) { p.t += dt; p.vy += 900 * dt; p.vx *= 0.98; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; }
    this.parts = this.parts.filter(p => p.t < p.life);
    for (const r of this.rings) r.t += dt;
    this.rings = this.rings.filter(r => r.t < r.life);
    for (const f of this.flyers) f.t += dt;
    this.flyers = this.flyers.filter(f => f.t < f.life);
    for (const p of this.puddles) p.t += dt;
    this.puddles = this.puddles.filter(p => p.t < p.life);
    this.shake = Math.max(0, this.shake - dt * 40);
    if (this.notes) { for (const n of this.notes) { n.t += dt; n.y -= 40 * dt; n.x += Math.sin(n.t * 5 + n.ph) * 20 * dt; } this.notes = this.notes.filter(n => n.t < n.life); }
  }

  shakeOffset() { const s = this.shake; return s ? [(Math.random() - 0.5) * s, (Math.random() - 0.5) * s] : [0, 0]; }

  drawPuddles(ctx) {
    for (const p of this.puddles) {
      const a = Math.min(1, (p.life - p.t) / 1.5) * Math.min(1, p.t * 6);
      const r = p.r * (0.6 + Math.min(1, p.t * 3) * 0.4);
      ctx.globalAlpha = a * 0.85;
      ctx.fillStyle = '#f1d27a'; ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.55, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#fffaf0';
      for (const [bx, by, br] of p.bubbles) { ctx.beginPath(); ctx.arc(p.x + bx * r, p.y + by * r * 0.55, br, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
  }

  drawTop(ctx) {
    if (this.notes) for (const n of this.notes) {
      ctx.globalAlpha = Math.min(1, (n.life - n.t) * 2); ctx.font = '900 30px system-ui,sans-serif'; ctx.textAlign = 'center';
      ctx.lineWidth = 4; ctx.strokeStyle = '#1b1b1b'; ctx.strokeText(n.ch, n.x, n.y); ctx.fillStyle = '#ff3fa4'; ctx.fillText(n.ch, n.x, n.y);
    }
    ctx.globalAlpha = 1;
    for (const r of this.rings) {
      const k = r.t / r.life;
      ctx.strokeStyle = r.color; ctx.globalAlpha = 1 - k; ctx.lineWidth = 10 * (1 - k) + 2;
      ctx.beginPath(); ctx.arc(r.x, r.y, 20 + k * 110, 0, 7); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const p of this.parts) {
      ctx.globalAlpha = Math.min(1, (p.life - p.t) * 3);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  drawFlyers(ctx, slots, u) {
    for (const f of this.flyers) {
      const s = slots[f.slot]; if (!s) continue;
      const k = f.t / f.life, e = 1 - Math.pow(1 - k, 3);
      const tx = s.x + s.w / 2, ty = s.y + s.h / 2;
      const x = f.sx + (tx - f.sx) * e, y = f.sy + (ty - f.sy) * e - Math.sin(k * Math.PI) * u * 1.2;
      const sc = 1.6 - 0.6 * e;
      ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
      ctx.font = `900 ${u * 0.42}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 5; ctx.strokeStyle = '#1b1b1b'; ctx.strokeText(f.word, 0, 0);
      ctx.fillStyle = '#ffd23a'; ctx.fillText(f.word, 0, 0);
      ctx.restore();
    }
  }
}
