// Golden Tee–style leaderboard: name entry on the win screen, top 10 fastest times.
// Uses /api/scores (shared by everyone); falls back to this phone's own board if the server isn't reachable.
const LOCAL_KEY = 'dawgsout.board', NAME_KEY = 'dawgsout.name';
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };

export const fmt = ms => { const s = ms / 1000, m = Math.floor(s / 60); return `${m}:${(s - m * 60).toFixed(2).padStart(5, '0')}`; };

async function api(method, body) {
  const r = await fetch('api/scores', { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  if (!r.ok) throw new Error('http ' + r.status);
  return r.json();
}
function localBoard(add) {
  let list = []; try { list = JSON.parse(store.get(LOCAL_KEY) || '[]'); } catch {}
  let me = null;
  if (add) { me = { ...add, at: Date.now() }; list.push(me); list.sort((a, b) => a.ms - b.ms || a.at - b.at); list = list.slice(0, 50); store.set(LOCAL_KEY, JSON.stringify(list)); }
  return { scores: list.slice(0, 10), total: list.length, rank: me ? list.indexOf(me) + 1 : 0, me, local: true };
}

const CSS = `
#lb{position:fixed;inset:0;display:none;align-items:flex-end;justify-content:center;z-index:10;pointer-events:none;
  font-family:'Press Start 2P',ui-monospace,monospace;-webkit-user-select:text;user-select:text}
#lb.on{display:flex}
#lb .card{pointer-events:auto;width:min(94vw,440px);margin:0 0 max(14px,env(safe-area-inset-bottom));background:#0b0f0a;
  border:4px solid #d4a92a;box-shadow:0 0 0 4px #0b0f0a,0 0 0 7px #7a5c10,0 14px 40px rgba(0,0,0,.6);border-radius:6px;padding:14px 14px 12px;color:#f3e7cb}
#lb h2{margin:0 0 10px;text-align:center;font-size:15px;letter-spacing:2px;color:#ffd23a;text-shadow:0 2px 0 #7a3b00}
#lb .sub{display:block;font-size:8px;color:#9fb08a;letter-spacing:1px;margin-top:6px}
#lb .time{text-align:center;font-size:20px;color:#fff;margin:2px 0 12px;text-shadow:0 2px 0 #b8261c}
#lb form{display:flex;gap:8px;margin-bottom:10px}
#lb input{flex:1;min-width:0;font:inherit;font-size:14px;text-transform:uppercase;letter-spacing:2px;padding:10px;background:#1b2414;color:#ffd23a;
  border:2px solid #4c6a2e;border-radius:4px;outline:none;touch-action:auto}
#lb input:focus{border-color:#ffd23a}
#lb button{font:inherit;font-size:11px;padding:10px 12px;background:#ffd23a;color:#1b1b1b;border:0;border-radius:4px;box-shadow:0 3px 0 #8a6a12;cursor:pointer;touch-action:manipulation}
#lb button:active{transform:translateY(2px);box-shadow:0 1px 0 #8a6a12}
#lb button.ghost{background:transparent;color:#ffd23a;box-shadow:none;border:2px solid #ffd23a}
#lb ol{list-style:none;margin:0 0 12px;padding:0;font-size:11px;background:#121a0e;border:2px solid #2c3d1c;border-radius:4px}
#lb li{display:grid;grid-template-columns:2.6em 1fr auto;gap:6px;padding:7px 9px;border-bottom:1px solid #1f2b16}
#lb li:last-child{border-bottom:0}
#lb li:nth-child(1){color:#ffd23a} #lb li:nth-child(2){color:#d8dde3} #lb li:nth-child(3){color:#e3a36a}
#lb li.me{background:#ffd23a;color:#1b1b1b;animation:lbBlink 1s steps(2) infinite}
@keyframes lbBlink{50%{background:#b8261c;color:#fff}}
#lb li .n{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
#lb .empty{padding:14px;text-align:center;font-size:9px;color:#9fb08a}
#lb .row{display:flex;gap:8px;justify-content:center}
#lb .note{font-size:7px;color:#7d8c6c;text-align:center;margin-top:8px;line-height:1.6}
#lbBtn{position:fixed;left:50%;transform:translateX(-50%);bottom:max(18px,env(safe-area-inset-bottom));z-index:9;display:none;
  font-family:'Press Start 2P',ui-monospace,monospace;font-size:10px;padding:10px 14px;background:#0b0f0a;color:#ffd23a;border:3px solid #d4a92a;border-radius:6px;touch-action:manipulation}
#lbBtn.on{display:block}
`;

export class Leaderboard {
  constructor({ onPlayAgain }) {
    this.onPlayAgain = onPlayAgain;
    const font = document.createElement('link'); font.rel = 'stylesheet'; font.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'; document.head.appendChild(font);
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'lb'; document.body.appendChild(this.el);
    this.btn = document.createElement('button'); this.btn.id = 'lbBtn'; this.btn.textContent = '🏆 LEADERBOARD'; document.body.appendChild(this.btn);
    this.btn.addEventListener('click', e => { e.stopPropagation(); this.showBoard(); });
    for (const ev of ['pointerdown', 'touchstart', 'keydown']) this.el.addEventListener(ev, e => e.stopPropagation());
  }

  isOpen() { return this.el.classList.contains('on'); }
  hide() { this.el.classList.remove('on'); this.el.innerHTML = ''; }
  setTitleButton(on) { this.btn.classList.toggle('on', on); }

  rows(data) {
    if (!data.scores.length) return `<div class="empty">NO TIMES YET.<br><br>BE THE FIRST.</div>`;
    const meAt = data.me && data.me.at;
    let html = data.scores.map((s, i) => `<li class="${s.at === meAt ? 'me' : ''}"><span>${i + 1}.</span><span class="n">${esc(s.name)}</span><span>${fmt(s.ms)}</span></li>`).join('');
    if (data.rank > 10 && data.me) html += `<li class="me"><span>${data.rank}.</span><span class="n">${esc(data.me.name)}</span><span>${fmt(data.me.ms)}</span></li>`;
    return `<ol>${html}</ol>`;
  }

  // Win screen: time + name entry.
  showWin(ms) {
    this.setTitleButton(false);
    this.el.innerHTML = `<div class="card">
      <h2>NEW TIME<span class="sub">ENTER YOUR NAME FOR THE BOARD</span></h2>
      <div class="time">${fmt(ms)}</div>
      <form><input maxlength="12" autocomplete="nickname" autocapitalize="characters" spellcheck="false" placeholder="YOUR NAME" value="${esc(store.get(NAME_KEY) || '')}"><button type="submit">ENTER</button></form>
      <div class="row"><button class="ghost" data-act="skip">SKIP</button></div>
    </div>`;
    this.el.classList.add('on');
    const form = this.el.querySelector('form'), input = this.el.querySelector('input');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const name = input.value.toUpperCase().replace(/[^A-Z0-9 .'!?-]/g, '').trim().slice(0, 12);
      if (!name) { input.focus(); return; }
      store.set(NAME_KEY, name); input.blur();
      form.querySelector('button').textContent = '…';
      let data;
      try { data = await api('POST', { name, ms }); } catch { data = localBoard({ name, ms }); }
      this.showBoard(data, true);
    });
    this.el.querySelector('[data-act=skip]').addEventListener('click', () => this.showBoard(null, true));
  }

  async showBoard(data, afterWin = false) {
    this.el.innerHTML = `<div class="card"><h2>LEADERBOARD<span class="sub">FASTEST DAWGS IN ATHENS</span></h2><div class="empty">LOADING…</div></div>`;
    this.el.classList.add('on');
    if (!data) { try { data = await api('GET'); } catch { data = localBoard(); } }
    const rankLine = data.rank ? `<div class="note">YOU PLACED #${data.rank} OF ${data.total}</div>` : '';
    this.el.innerHTML = `<div class="card">
      <h2>LEADERBOARD<span class="sub">${data.local ? 'THIS PHONE ONLY' : 'FASTEST DAWGS IN ATHENS'}</span></h2>
      ${this.rows(data)}
      <div class="row">${afterWin ? '<button data-act="again">PLAY AGAIN</button>' : '<button data-act="close">CLOSE</button>'}</div>
      ${rankLine}
    </div>`;
    const b = this.el.querySelector('[data-act]');
    b.addEventListener('click', () => { this.hide(); if (afterWin) this.onPlayAgain(); else this.setTitleButton(true); });
  }
}
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
