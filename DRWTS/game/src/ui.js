// HUD (world space, top margin) and full-screen cards (screen space).
import { roundRect, wrapText } from './render.js';

export function drawHUD(ctx, maze, phrase, next, phaseNum, jobyInfo) {
  const T = maze.T, W = maze.W * T;
  const n = phrase.length, gap = T * 0.15, sw = (W - T * 0.6 - gap * (n - 1)) / n, sh = T * 0.8, y = T * 0.25;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const x = T * 0.3 + i * (sw + gap);
    roundRect(ctx, x, y, sw, sh, 10);
    ctx.fillStyle = i < next ? '#ffd23a' : 'rgba(255,255,255,.08)'; ctx.fill();
    ctx.strokeStyle = i === next ? '#ffd23a' : 'rgba(255,255,255,.3)'; ctx.lineWidth = 3; ctx.stroke();
    if (i < next) { ctx.fillStyle = '#1b1b1b'; ctx.font = `900 ${T * 0.38}px system-ui,sans-serif`; ctx.fillText(phrase[i], x + sw / 2, y + sh / 2 + 2); }
  }
  ctx.fillStyle = 'rgba(244,233,198,.75)'; ctx.font = `600 ${T * 0.26}px system-ui,sans-serif`;
  ctx.fillText(`PHRASE ${phaseNum} of 2` + (jobyInfo ? `   ·   ${jobyInfo}` : ''), W / 2, T * 1.55);
}

export function drawFooter(ctx, maze, text) {
  const T = maze.T;
  ctx.fillStyle = 'rgba(244,233,198,.6)'; ctx.textAlign = 'center'; ctx.font = `600 ${T * 0.26}px system-ui,sans-serif`;
  ctx.fillText(text, maze.W * T / 2, (maze.H - 1) * T);
}

export function drawStick(ctx, stick) {
  if (!stick) return;
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(stick.ax, stick.ay, 50, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath();
  const dx = stick.x - stick.ax, dy = stick.y - stick.ay, l = Math.min(Math.hypot(dx, dy), 50) / (Math.hypot(dx, dy) || 1);
  ctx.arc(stick.ax + dx * l, stick.ay + dy * l, 22, 0, 7); ctx.fill();
}

// Screen-space card: dim + title + lines + optional button. Returns button rect for hit testing.
export function drawCard(ctx, w, h, { title, lines = [], button, color = '#ffd23a', dim = 0.7, image }) {
  ctx.fillStyle = `rgba(10,12,30,${dim})`; ctx.fillRect(0, 0, w, h);
  const u = Math.min(w, h * 0.66) / 10;
  if (image) { const ih = Math.min(h * 0.22, u * 3.6), iw = ih * image.width / image.height; ctx.drawImage(image, w / 2 - iw / 2, h * 0.3 - u * 0.9 - ih, iw, ih); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = color; ctx.font = `900 ${u * 1.1}px system-ui,sans-serif`;
  wrapText(ctx, title, w / 2, h * 0.38, w * 0.9, u * 1.2);
  ctx.fillStyle = '#f4e9c6'; ctx.font = `600 ${u * 0.45}px system-ui,sans-serif`;
  lines.forEach((l, i) => ctx.fillText(l, w / 2, h * 0.38 + u * 1.6 + i * u * 0.65));
  if (!button) return null;
  const bw = u * 5, bh = u * 1.1, bx = w / 2 - bw / 2, by = h * 0.68;
  roundRect(ctx, bx, by, bw, bh, bh / 2); ctx.fillStyle = color; ctx.fill();
  ctx.fillStyle = '#1b1b1b'; ctx.font = `900 ${u * 0.5}px system-ui,sans-serif`; ctx.fillText(button, w / 2, by + bh / 2 + 1);
  return { x: bx, y: by, w: bw, h: bh };
}

export function drawBubble(ctx, w, h, text, ax, ay) {
  const u = Math.min(w, h * 0.66) / 10;
  ctx.font = `800 ${u * 0.55}px system-ui,sans-serif`;
  const tw = Math.min(ctx.measureText(text).width, w * 0.8), bw = tw + u, bh = u * 1.1;
  const bx = Math.max(10, Math.min(w - bw - 10, ax - bw / 2)), by = Math.max(10, ay - bh - u * 0.8);
  ctx.fillStyle = '#fff'; roundRect(ctx, bx, by, bw, bh, 14); ctx.fill();
  ctx.beginPath(); ctx.moveTo(ax - 10, by + bh - 1); ctx.lineTo(ax, ay - u * 0.2); ctx.lineTo(ax + 10, by + bh - 1); ctx.fill();
  ctx.fillStyle = '#1b1b1b'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + bw / 2, by + bh / 2, w * 0.8);
}

export function hit(r, t) { return r && t.x >= r.x && t.x <= r.x + r.w && t.y >= r.y && t.y <= r.y + r.h; }

// Screen-space HUD (stays put while the camera follows). Returns slot rects for flying words.
export function drawHUDScreen(ctx, w, h, top, phrase, shown, phaseNum, info) {
  const u = Math.min(w, h * 0.66) / 10, n = phrase.length;
  const pad = u * 0.3, gap = u * 0.12, sh = u * 0.85, sw = Math.min((w - pad * 2 - gap * (n - 1)) / n, u * 2.6);
  const total = sw * n + gap * (n - 1), x0 = (w - total) / 2, y = top + u * 0.25;
  const g = ctx.createLinearGradient(0, 0, 0, y + sh + u * 0.9);
  g.addColorStop(0, 'rgba(18,22,48,.92)'); g.addColorStop(0.75, 'rgba(18,22,48,.75)'); g.addColorStop(1, 'rgba(18,22,48,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, y + sh + u * 0.9);
  const slots = [];
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const x = x0 + i * (sw + gap); slots.push({ x, y, w: sw, h: sh });
    roundRect(ctx, x, y, sw, sh, 8);
    ctx.fillStyle = i < shown ? '#ffd23a' : 'rgba(255,255,255,.08)'; ctx.fill();
    ctx.strokeStyle = i === shown ? '#ffd23a' : 'rgba(255,255,255,.3)'; ctx.lineWidth = 2; ctx.stroke();
    if (i < shown) { ctx.fillStyle = '#1b1b1b'; ctx.font = `900 ${u * 0.36}px system-ui,sans-serif`; ctx.fillText(phrase[i], x + sw / 2, y + sh / 2 + 1, sw - 6); }
  }
  ctx.fillStyle = 'rgba(244,233,198,.8)'; ctx.font = `700 ${u * 0.26}px system-ui,sans-serif`;
  ctx.fillText(`PHRASE ${phaseNum} of 2` + (info ? `  ·  ${info}` : ''), w / 2, y + sh + u * 0.32);
  return slots;
}

export function drawVignette(ctx, w, h, a) {
  if (a <= 0.01) return;
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) * 0.55);
  g.addColorStop(0, 'rgba(200,0,0,0)'); g.addColorStop(1, `rgba(200,0,0,${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}
