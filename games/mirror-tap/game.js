const stage = document.getElementById('stage');
const message = document.getElementById('message');
const score = document.getElementById('score');
const whisper = document.getElementById('whisper');
const unlock = document.getElementById('unlock');

unlock.addEventListener('pointerdown', e => e.stopPropagation());

// 鏡の向こうは、きみ自身の最速記録で competing してくる
const baseAi = parseInt(localStorage.getItem('cf5g-reflex-best'), 10) || 350;
const WIN = 3;

let state = 'idle'; // idle | waiting | ready | lost | done
let timerId = null, aiTimerId = null;
let readyAt = 0, curAi = 0;
let pWins = 0, aWins = 0;

const TAUNTS = ['はやいね。', 'それ、きみの きろくだよ。', 'もういっかい。', 'まだ おわらない。'];

function updateScore() {
  score.textContent = `きみ ${pWins} - ${aWins} 🪞`;
}

function startRound() {
  state = 'waiting';
  stage.className = 'waiting';
  message.textContent = 'みどりに なったら タップ…';
  whisper.textContent = '';
  timerId = setTimeout(() => {
    state = 'ready';
    stage.className = 'ready';
    message.textContent = 'いまだ!';
    readyAt = performance.now();
    curAi = Math.max(180, Math.round(baseAi * (0.9 + Math.random() * 0.3)));
    aiTimerId = setTimeout(() => roundEnd(false, `🪞 ${curAi} ms — さきを こされた`), curAi);
  }, 1000 + Math.random() * 2500);
}

function roundEnd(playerWon, detail) {
  clearTimeout(timerId);
  clearTimeout(aiTimerId);
  stage.className = '';
  playerWon ? pWins++ : aWins++;
  updateScore();

  if (pWins >= WIN) {
    state = 'done';
    message.textContent = 'きみの かち';
    whisper.textContent = 'まけたよ。…………うれしい。';
    if (window.Progress) {
      Progress.clear('mirror-tap');
      unlock.hidden = false;
    }
  } else if (aWins >= WIN) {
    state = 'lost';
    message.textContent = '🪞 の かち';
    whisper.textContent = 'タップで さいしょから';
  } else {
    state = 'idle';
    message.textContent = detail + ' — タップで つぎへ';
    whisper.textContent = TAUNTS[Math.floor(Math.random() * TAUNTS.length)];
  }
}

stage.addEventListener('pointerdown', () => {
  if (state === 'idle') {
    startRound();
  } else if (state === 'lost') {
    pWins = 0;
    aWins = 0;
    updateScore();
    startRound();
  } else if (state === 'waiting') {
    roundEnd(false, 'フライング!');
  } else if (state === 'ready') {
    const t = Math.round(performance.now() - readyAt);
    roundEnd(true, `きみ ${t} ms / 🪞 ${curAi} ms`);
  }
});

updateScore();
whisper.textContent = `🪞 は きみの きろく(${baseAi} ms)で たたかう。3本 せんしょう。`;
