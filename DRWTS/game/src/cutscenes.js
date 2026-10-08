// Canvas-only cutscene effects. Greybox Joby portrait; swap for the real portrait PNG on Thursday.
let portrait = null;

export function setPortrait(img) { portrait = img; }

function greyboxPortrait(size) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d');
  x.fillStyle = '#c41010'; x.beginPath(); x.arc(size / 2, size / 2, size * 0.46, 0, 7); x.fill();
  x.strokeStyle = '#000'; x.lineWidth = size * 0.03; x.stroke();
  x.fillStyle = '#fff'; x.beginPath(); x.arc(size * 0.36, size * 0.42, size * 0.08, 0, 7); x.arc(size * 0.64, size * 0.42, size * 0.08, 0, 7); x.fill();
  x.fillStyle = '#000'; x.beginPath(); x.arc(size * 0.37, size * 0.44, size * 0.035, 0, 7); x.arc(size * 0.63, size * 0.44, size * 0.035, 0, 7); x.fill();
  x.lineWidth = size * 0.035; x.beginPath(); x.moveTo(size * 0.33, size * 0.68); x.quadraticCurveTo(size / 2, size * 0.58, size * 0.67, size * 0.68); x.stroke();
  x.fillStyle = '#fff'; x.font = `900 ${size * 0.12}px system-ui,sans-serif`; x.textAlign = 'center'; x.fillText('NASTY JOBY', size / 2, size * 0.88);
  return c;
}

// Big Joby portrait, centered at (cx, cy) in screen space.
export function drawPortrait(ctx, cx, cy, size) {
  const src = portrait || (portrait = greyboxPortrait(256));
  ctx.drawImage(src, cx - size / 2, cy - size / 2, size, size);
}

// Melt: portrait cut into vertical strips, each sliding down by a growing noisy amount while tinting.
const STRIPS = 28;
const noise = Array.from({ length: STRIPS }, () => 0.5 + Math.random());
export function drawMelt(ctx, cx, cy, size, t) { // t: 0..1
  const src = portrait || (portrait = greyboxPortrait(256));
  const S = Math.round(size);
  const off = document.createElement('canvas'); off.width = S; off.height = S * 3;
  const o = off.getContext('2d');
  const sw = src.width / STRIPS, dw = S / STRIPS;
  for (let i = 0; i < STRIPS; i++) {
    const drop = Math.pow(t, 1.6) * S * 1.4 * noise[i];
    const squash = 1 + t * 0.6 * noise[i];
    o.drawImage(src, i * sw, 0, sw, src.height, i * dw, drop, dw + 0.5, S * squash);
  }
  o.globalCompositeOperation = 'source-atop';
  o.fillStyle = `rgba(90,200,60,${t * 0.6})`; o.fillRect(0, 0, S, S * 3);
  const x0 = cx - S / 2, y0 = cy - S / 2;
  // puddle
  ctx.fillStyle = `rgba(150,20,20,${Math.min(1, t * 1.5) * 0.8})`;
  ctx.beginPath(); ctx.ellipse(cx, y0 + S * 1.25, Math.max(0.1, S * 0.6 * t), Math.max(0.1, S * 0.12 * t), 0, 0, 7); ctx.fill();
  ctx.save(); ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - 0.75) * 4);
  ctx.drawImage(off, x0, y0); ctx.restore();
}
