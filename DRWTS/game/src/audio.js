// Tiny WebAudio synth. unlock() must be called from a user-gesture handler (iOS).
let ac = null;
export const sfx = {
  unlock() {
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
    } catch (e) { ac = null; }
  },
  tone(freq, dur, type = 'sine', vol = 0.2, slide = 0) {
    if (!ac || ac.state !== 'running') return;
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
  },
  collect(i) { const f = 520 * Math.pow(1.19, i); this.tone(f, 0.12, 'triangle', 0.22); setTimeout(() => this.tone(f * 1.5, 0.16, 'triangle', 0.18), 70); },
  wrong() { this.tone(160, 0.28, 'sawtooth', 0.14, 0.5); },
  glug() { this.tone(180, 0.16, 'sine', 0.3, 0.45); setTimeout(() => this.tone(120, 0.12, 'sine', 0.2, 0.6), 60); },
  thump(v = 1) { this.tone(70, 0.12, 'sine', 0.5 * v, 0.6); setTimeout(() => this.tone(58, 0.14, 'sine', 0.38 * v, 0.6), 140); },
};
