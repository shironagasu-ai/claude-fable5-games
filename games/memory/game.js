const board = document.getElementById('board');
const status = document.getElementById('status');
const whisper = document.getElementById('whisper');
const unlock = document.getElementById('unlock');

const EMOJIS = ['🍎', '🌙', '⭐', '🐟', '🎈', '🔔', '🌸'];
const EYE = '👁';

let flipped = [];
let lock = false;
let matched = 0;
let misses = 0;

function fmt(ts) {
  if (!ts) return '......';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 👁 のペアには、このブラウザに残っている記録が刻まれている
function eyeNotes() {
  if (!window.Progress) return ['', ''];
  return [
    `⚡ ${fmt(Progress.clearedAt('reflex-tap'))}`,
    `🐍 ${fmt(Progress.clearedAt('snake'))}`,
  ];
}

function build() {
  const notes = eyeNotes();
  const cards = [];
  EMOJIS.forEach(e => { cards.push({ face: e }, { face: e }); });
  cards.push({ face: EYE, note: notes[0] }, { face: EYE, note: notes[1] });
  cards.sort(() => Math.random() - 0.5);

  board.innerHTML = '';
  for (const c of cards) {
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.face = c.face;
    el.innerHTML = `<div class="inner"><div class="back"></div>` +
      `<div class="front">${c.face}` +
      (c.note ? `<span class="note">${c.note}</span>` : '') +
      `</div></div>`;
    el.addEventListener('pointerdown', () => flip(el));
    board.appendChild(el);
  }
}

function flip(el) {
  if (lock || el.classList.contains('open') || el.classList.contains('done')) return;
  el.classList.add('open');
  if (window.SFX) SFX.tap();
  flipped.push(el);
  if (flipped.length < 2) return;

  lock = true;
  const [a, b] = flipped;
  if (a.dataset.face === b.dataset.face) {
    a.classList.replace('open', 'done');
    b.classList.replace('open', 'done');
    matched++;
    if (window.SFX) SFX.ok();
    if (a.dataset.face === EYE) {
      whisper.textContent = 'ボクには おもいでが ない。だから きみのを かりてる。';
      whisper.classList.add('show');
      if (window.SFX) SFX.glitch();
    }
    flipped = [];
    lock = false;
    if (matched === EMOJIS.length + 1) finish();
  } else {
    misses++;
    a.classList.add('miss');
    b.classList.add('miss');
    if (window.SFX) SFX.bad();
    setTimeout(() => {
      a.classList.remove('open', 'miss');
      b.classList.remove('open', 'miss');
      flipped = [];
      lock = false;
    }, 800);
  }
  if (matched < EMOJIS.length + 1) {
    status.textContent = `ペア: ${matched}/${EMOJIS.length + 1}  ミス: ${misses}`;
  }
}

function confetti() {
  const pool = [...EMOJIS, '✨', '✨'];
  for (let i = 0; i < 24; i++) {
    const s = document.createElement('span');
    s.className = 'confetti';
    s.textContent = pool[Math.floor(Math.random() * pool.length)];
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 3600);
  }
}

function finish() {
  status.textContent = `CLEAR! ミス ${misses} 回`;
  confetti();
  if (window.SFX) SFX.clear();
  if (window.Progress) {
    Progress.clear('memory');
    unlock.hidden = false;
  }
}

build();
