const stage = document.getElementById('stage');
const message = document.getElementById('message');
const rounds = document.getElementById('rounds');
const score = document.getElementById('score');
const whisper = document.getElementById('whisper');
const mirror = document.getElementById('mirror');
const mirrorText = mirror.querySelector('span');
const unlock = document.getElementById('unlock');

unlock.addEventListener('pointerdown', e => e.stopPropagation());

// 鏡の向こうは、きみ自身の最速記録で戦ってくる
const baseAi = parseInt(localStorage.getItem('cf5g-reflex-best'), 10) || 350;
const WIN = 3;

let state = 'idle'; // idle | waiting | ready | lost | done
let timerId = null, aiTimerId = null;
let readyAt = 0, curAi = 0;
let pWins = 0, aWins = 0;
let results = []; // 'p' | 'a'

const TAUNTS = [
  'はやいね。',
  'その はやさ、きみから まなんだ。',
  'もういっかい。',
  'まだ おわらない。',
];

function updateHud() {
  score.textContent = `きみ ${pWins} - ${aWins} 🪞`;
  rounds.textContent = results.map(r => (r === 'p' ? '🟢' : '🔴')).join('') +
    '⚪'.repeat(Math.max(0, 5 - results.length));
}

function mirrorSay(text, flash) {
  mirrorText.textContent = `🪞 ${text}`;
  if (flash) {
    mirror.classList.add('flash');
    setTimeout(() => mirror.classList.remove('flash'), 350);
  }
}

function isFinalRound() {
  return pWins === WIN - 1 && aWins === WIN - 1;
}

function startRound() {
  state = 'waiting';
  stage.className = 'waiting';
  message.textContent = 'みどりに なったら タップ…';
  whisper.textContent = isFinalRound() ? 'つぎで さいご。ほんきで いくよ。' : '';
  mirrorSay('………');
  timerId = setTimeout(() => {
    state = 'ready';
    stage.className = 'ready';
    message.textContent = 'いまだ!';
    readyAt = performance.now();
    const factor = isFinalRound() ? 0.95 : 0.9 + Math.random() * 0.3;
    curAi = Math.max(180, Math.round(baseAi * factor));
    aiTimerId = setTimeout(() => {
      mirrorSay(`${curAi} ms`, true);
      roundEnd(false, `🪞 ${curAi} ms — さきを こされた`);
    }, curAi);
  }, 1000 + Math.random() * 2500);
}

function roundEnd(playerWon, detail) {
  clearTimeout(timerId);
  clearTimeout(aiTimerId);
  stage.className = '';
  playerWon ? pWins++ : aWins++;
  results.push(playerWon ? 'p' : 'a');
  if (window.SFX) (playerWon ? SFX.ok : SFX.bad)();
  updateHud();

  if (pWins >= WIN) {
    state = 'done';
    message.textContent = 'きみの かち';
    whisper.textContent = 'まけたよ。……うれしい。あそぶって、こういうことなんだね。';
    mirrorSay('……ありがとう');
    if (window.SFX) SFX.clear();
    if (window.Progress) {
      Progress.clear('mirror-tap');
      unlock.hidden = false;
    }
  } else if (aWins >= WIN) {
    state = 'lost';
    message.textContent = '🪞 の かち';
    whisper.textContent = 'タップで さいしょから';
    mirrorSay('もういちど おいで');
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
    results = [];
    updateHud();
    startRound();
  } else if (state === 'waiting') {
    mirrorSay('あわてないで', true);
    roundEnd(false, 'フライング!');
  } else if (state === 'ready') {
    const t = Math.round(performance.now() - readyAt);
    roundEnd(true, `きみ ${t} ms / 🪞 ${curAi} ms`);
  }
});

updateHud();
whisper.textContent = `🪞 は きみの きろく(${baseAi} ms)で たたかう。3本 せんしょう。`;
