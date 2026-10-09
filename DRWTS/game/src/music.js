// 8-bit arrangement of "Battle Hymn of the Republic" (William Steffe tune, 1856; public domain).
// Square-wave lead, triangle bass, noise drums. Phase 2 plays at double speed.
const N = { G3: 196.0, A3: 220.0, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
const alt = n => Array.from({ length: n }, (_, i) => (i % 2 ? 1 : 3)); // dotted-eighth / sixteenth swing

// [notes, durations in 16ths, chord roots for the bass]
const L1 = [['G4','G4','G4','G4','F4','E4','G4','C5','D5','E5','E5','E5','D5','C5'], [...alt(13), 8], ['C4']];
const L2 = [['C5','B4','A4','A4','A4','B4','C5','B4','C5','A4','G4','A4','G4','E4','G4'], [...alt(14), 8], ['F4', 'C4']];
const L3 = [['G4','G4','G4','G4','G4','F4','E4','G4','C5','D5','E5','E5','E5','D5','C5'], [...alt(14), 8], ['C4']];
const L4 = [['C5','D5','D5','C5','B4','C5'], [4, 4, 6, 2, 4, 12], ['G3', 'C4']];
const C1 = [['G4','F4','E4','G4','C5','D5','E5','C5'], [6, 2, 3, 1, 3, 1, 8, 8], ['C4']];
const C2 = [['A4','B4','C5','B4','C5','A4','G4','E4'], [6, 2, 3, 1, 3, 1, 8, 8], ['F4', 'C4']];
const SONG = [L1, L2, L3, L4, C1, C2, C1, L4];

export class Music {
  constructor() { this.ac = null; this.on = false; this.fast = false; this.muted = false; this.timer = null; }

  attach(ac) {
    if (this.ac || !ac) return;
    this.ac = ac;
    this.out = ac.createGain(); this.out.gain.value = 0.16; this.out.connect(ac.destination);
    const len = ac.sampleRate * 0.2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
  }

  // Flatten the song into events once.
  events() {
    if (this._ev) return this._ev;
    const ev = []; let t = 0;
    for (const [notes, durs, roots] of SONG) {
      const lineLen = durs.reduce((a, b) => a + b, 0);
      notes.forEach((n, i) => { ev.push({ t, k: 'lead', f: N[n], d: durs[i] }); t += durs[i]; });
      // bass: root on every 8th, alternating octave; chord changes halfway through the line
      const start = t - lineLen;
      for (let s = 0; s < lineLen; s += 2) {
        const root = roots[Math.min(roots.length - 1, Math.floor(s / lineLen * roots.length))];
        ev.push({ t: start + s, k: 'bass', f: N[root] / ((s / 2) % 2 ? 1 : 2), d: 2 });
        if (s % 4 === 0) ev.push({ t: start + s, k: 'kick' });
        ev.push({ t: start + s + 1, k: 'hat' });
      }
    }
    this._ev = { list: ev.sort((a, b) => a.t - b.t), len: t };
    return this._ev;
  }

  start(fast = false) {
    if (!this.ac) return;
    this.fast = fast;
    if (this.on) return;
    this.on = true; this.pos = 0; this.idx = 0; this.next = this.ac.currentTime + 0.1;
    this.timer = setInterval(() => this.tick(), 25);
  }
  setFast(f) { this.fast = f; }
  stop() { this.on = false; clearInterval(this.timer); this.timer = null; }
  toggleMute() { this.muted = !this.muted; if (this.out) this.out.gain.value = this.muted ? 0 : 0.16; return this.muted; }

  tick() {
    if (!this.on || this.ac.state !== 'running') return;
    const { list, len } = this.events();
    const step = this.fast ? 0.052 : 0.095; // seconds per 16th
    while (this.next < this.ac.currentTime + 0.15) {
      while (this.idx < list.length && list[this.idx].t <= this.pos) { this.play(list[this.idx], this.next, step); this.idx++; }
      this.pos++; this.next += step;
      if (this.pos >= len) { this.pos = 0; this.idx = 0; }
    }
  }

  play(e, at, step) {
    const ac = this.ac;
    if (e.k === 'kick') {
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.setValueAtTime(150, at); o.frequency.exponentialRampToValueAtTime(40, at + 0.12);
      g.gain.setValueAtTime(0.9, at); g.gain.exponentialRampToValueAtTime(0.001, at + 0.14);
      o.connect(g).connect(this.out); o.start(at); o.stop(at + 0.15); return;
    }
    if (e.k === 'hat') {
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = this.noise; f.type = 'highpass'; f.frequency.value = 7000;
      g.gain.setValueAtTime(0.25, at); g.gain.exponentialRampToValueAtTime(0.001, at + 0.04);
      s.connect(f).connect(g).connect(this.out); s.start(at); s.stop(at + 0.05); return;
    }
    const o = ac.createOscillator(), g = ac.createGain(), dur = e.d * step;
    o.type = e.k === 'lead' ? 'square' : 'triangle';
    o.frequency.setValueAtTime(e.f, at);
    const v = e.k === 'lead' ? 0.32 : 0.55;
    g.gain.setValueAtTime(v, at); g.gain.setValueAtTime(v, at + Math.max(0.01, dur * 0.8)); g.gain.linearRampToValueAtTime(0.0001, at + dur * 0.95);
    o.connect(g).connect(this.out); o.start(at); o.stop(at + dur);
  }
}
