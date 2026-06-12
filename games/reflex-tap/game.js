const stage = document.getElementById('stage');
const message = document.getElementById('message');
const result = document.getElementById('result');

// 解放リンクのタップでゲームが反応しないようにする
document.getElementById('unlock').addEventListener('pointerdown', e => e.stopPropagation());

let state = 'idle'; // idle | waiting | ready
let timerId = null;
let readyAt = 0;
let best = null;

stage.addEventListener('pointerdown', () => {
  if (state === 'idle') {
    start();
  } else if (state === 'waiting') {
    // フライング
    clearTimeout(timerId);
    state = 'idle';
    stage.className = '';
    message.textContent = 'フライング!タップしてリトライ';
  } else if (state === 'ready') {
    const time = Math.round(performance.now() - readyAt);
    if (best === null || time < best) best = time;
    state = 'idle';
    stage.className = '';
    message.textContent = `${time} ms`;
    result.textContent = `ベスト: ${best} ms — タップしてもう一度`;
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
  timerId = setTimeout(() => {
    state = 'ready';
    stage.className = 'ready';
    message.textContent = 'タップ!';
    readyAt = performance.now();
  }, 1000 + Math.random() * 3000);
}
