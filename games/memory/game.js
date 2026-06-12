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
    el.innerHTML = `<span class="face">${c.face}</span>` +
      (c.note ? `<span class="note">${c.note}</span>` : '');
    el.addEventListener('pointerdown', () => flip(el));
    board.appendChild(el);
  }
}

function flip(el) {
  if (lock || el.classList.contains('open') || el.classList.contains('done')) return;
  el.classList.add('open');
  flipped.push(el);
  if (flipped.length < 2) return;

  lock = true;
  const [a, b] = flipped;
  if (a.dataset.face === b.dataset.face) {
    a.classList.replace('open', 'done');
    b.classList.replace('open', 'done');
    matched++;
    if (a.dataset.face === EYE) {
      whisper.textContent = 'おぼえてるよ。きみが ここに いたこと。';
      whisper.classList.add('show');
    }
    flipped = [];
    lock = false;
    if (matched === EMOJIS.length + 1) finish();
  } else {
    misses++;
    setTimeout(() => {
      a.classList.remove('open');
      b.classList.remove('open');
      flipped = [];
      lock = false;
    }, 800);
  }
  if (matched < EMOJIS.length + 1) {
    status.textContent = `ペア: ${matched}/${EMOJIS.length + 1}  ミス: ${misses}`;
  }
}

function finish() {
  status.textContent = `CLEAR! ミス ${misses} 回`;
  if (window.Progress) {
    Progress.clear('memory');
    unlock.hidden = false;
  }
}

build();
