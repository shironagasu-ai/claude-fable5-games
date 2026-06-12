const stage = document.getElementById('stage');
const message = document.getElementById('message');
const rank = document.getElementById('rank');
const result = document.getElementById('result');
const history = document.getElementById('history');

// 解放リンクのタップでゲームが反応しないようにする
document.getElementById('unlock').addEventListener('pointerdown', e => e.stopPropagation());

let state = 'idle'; // idle | waiting | ready
let timerId = null;
let readyAt = 0;
let best = null;
let attempts = [];

function rankOf(t) {
  if (t < 200) return ['S', 's'];
  if (t < 260) return ['A', 'a'];
  if (t < 330) return ['B', 'b'];
  return ['C', 'c'];
}

function renderHistory() {
  history.innerHTML = attempts.slice(-5).map(t =>
    `<span>${String(t).padStart(4, ' ')} ms<span class="bar" style="width:${Math.min(120, t / 5)}px"></span></span>`
  ).join('');
}

stage.addEventListener('pointerdown', () => {
  if (state === 'idle') {
    start();
  } else if (state === 'waiting') {
    // フライング
    clearTimeout(timerId);
    state = 'idle';
    stage.className = '';
    message.textContent = 'フライング!タップしてリトライ';
    rank.textContent = '';
    if (window.SFX) SFX.bad();
  } else if (state === 'ready') {
    const time = Math.round(performance.now() - readyAt);
    attempts.push(time);
    if (best === null || time < best) {
      best = time;
      const saved = parseInt(localStorage.getItem('cf5g-reflex-best'), 10);
      if (!saved || best < saved) localStorage.setItem('cf5g-reflex-best', best);
    }
    state = 'idle';
    stage.className = '';
    const [label, cls] = rankOf(time);
    message.textContent = `${time} ms`;
    rank.innerHTML = `<span class="${cls}">${label}</span>`;
    result.textContent = `ベスト: ${best} ms — タップしてもう一度`;
    renderHistory();
    if (window.SFX) (label === 'S' || label === 'A' ? SFX.ok : SFX.tap)();
    if (window.Progress) {
      Progress.clear('reflex-tap');
      document.getElementById('unlock').hidden = false;
    }
  }
});

function start() {
  state = 'waiting';
  stage.className = 'waiting';
  message.textContent = '緑になったらタップ…';
  rank.textContent = '';
  timerId = setTimeout(() => {
    state = 'ready';
    stage.className = 'ready';
    message.textContent = 'タップ!';
    readyAt = performance.now();
  }, 1000 + Math.random() * 3000);
}
