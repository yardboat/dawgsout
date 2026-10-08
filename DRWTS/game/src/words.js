// Word tokens for one phase. Only the next word in order collects; anything else is a wrong grab.
export class Words {
  constructor(maze, phrase, candidates, avoid, tun) {
    this.phrase = phrase;
    this.next = 0;
    this.tokens = place(maze, phrase, candidates, avoid, tun);
    this.touching = new Set();
  }
  get done() { return this.next >= this.phrase.length; }

  // Returns 'collect' | 'wrong' | null for this frame.
  check(maze, pos, catchDist = 0.6) {
    let event = null;
    const nowTouching = new Set();
    for (const tk of this.tokens) {
      if (tk.collected) continue;
      if (maze.dist(pos, [tk.c, tk.r]) > catchDist) continue;
      nowTouching.add(tk);
      if (this.touching.has(tk)) continue; // already handled this overlap
      if (tk.index === this.next) {
        tk.collected = true; this.next++; event = 'collect';
      } else {
        tk.flash = 0.6; event = event || 'wrong';
      }
    }
    this.touching = nowTouching;
    return event;
  }
  update(dt) { for (const tk of this.tokens) if (tk.flash > 0) tk.flash -= dt; }
}

function place(maze, phrase, candidates, avoid, tun) {
  // Try strict spacing first, relax if the map can't fit it.
  for (let relax = 0; relax <= 4; relax++) {
    const minP = tun.token_min_dist_player - relax, minE = tun.token_min_dist_each - relax;
    const pool = shuffle(candidates.filter(c => avoid.every(a => maze.dist(c, a) >= minP)));
    const picked = [];
    for (const c of pool) {
      if (picked.every(p => maze.dist(c, p) >= minE)) picked.push(c);
      if (picked.length === phrase.length) break;
    }
    if (picked.length === phrase.length) {
      const order = shuffle(picked);
      return phrase.map((word, index) => ({ word, index, c: order[index][0], r: order[index][1], collected: false, flash: 0 }));
    }
  }
  throw new Error('Not enough word spawn candidates');
}

function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
