const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const unlock = document.getElementById('unlock');

const N = 20, CELL = 18, GOAL = 15;
const STEP_MS = 130;

let snake, dir, nextDir, food, eaten, state, lastStep, ghostUntil;

function reset() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir = { x: 1, y: 0 };
  nextDir = dir;
  eaten = 0;
  state = 'ready'; // ready | play | over | clear
  lastStep = 0;
  ghostUntil = 0;
  placeFood();
}

function placeFood() {
  do {
    food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
  } while (snake.some(s => s.x === food.x && s.y === food.y));
}

function step() {
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  if (head.x < 0 || head.x >= N || head.y < 0 || head.y >= N ||
      snake.some(s => s.x === head.x && s.y === head.y)) {
    state = 'over';
    return;
  }
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    eaten++;
    if (eaten === 8 || eaten === 12) ghostUntil = performance.now() + 700;
    if (eaten >= GOAL) {
      state = 'clear';
      if (window.Progress) {
        Progress.clear('snake');
        unlock.hidden = false;
      }
      return;
    }
    placeFood();
  } else {
    snake.pop();
  }
}

function setDir(x, y) {
  if (x === -dir.x && y === -dir.y) return; // 逆走禁止
  nextDir = { x, y };
  if (state === 'ready') state = 'play';
}

// スワイプ操作
let touchStart = null;
cv.addEventListener('pointerdown', (e) => {
  if (state === 'over') { reset(); return; }
  touchStart = { x: e.clientX, y: e.clientY };
});
cv.addEventListener('pointerup', (e) => {
  if (!touchStart) return;
  const dx = e.clientX - touchStart.x, dy = e.clientY - touchStart.y;
  touchStart = null;
  if (Math.hypot(dx, dy) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) setDir(Math.sign(dx), 0);
  else setDir(0, Math.sign(dy));
});

document.addEventListener('keydown', (e) => {
  const map = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
  };
  if (map[e.key]) {
    e.preventDefault();
    if (state === 'over') reset();
    setDir(...map[e.key]);
  }
});

function draw() {
  ctx.clearRect(0, 0, cv.width, cv.height);

  if (performance.now() < ghostUntil) {
    ctx.globalAlpha = 0.08;
    ctx.font = 'bold 90px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8eaf2';
    ctx.fillText('みてる', cv.width / 2, cv.height / 2 + 30);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = '#f87171';
  ctx.beginPath();
  ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2);
  ctx.fill();

  snake.forEach((s, i) => {
    ctx.fillStyle = i === 0 ? '#86efac' : '#4ade80';
    ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
  });

  ctx.fillStyle = '#e8eaf2';
  ctx.font = '14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`🍎 ${eaten}/${GOAL}`, 8, 20);

  ctx.textAlign = 'center';
  if (state === 'ready') ctx.fillText('スワイプ(or 矢印キー)でスタート', cv.width / 2, cv.height - 30);
  if (state === 'over') {
    ctx.font = 'bold 28px monospace';
    ctx.fillText('GAME OVER', cv.width / 2, cv.height / 2);
    ctx.font = '14px monospace';
    ctx.fillText('タップでリトライ', cv.width / 2, cv.height / 2 + 30);
  }
  if (state === 'clear') {
    ctx.font = 'bold 28px monospace';
    ctx.fillText('CLEAR!', cv.width / 2, cv.height / 2);
  }
}

function loop(t) {
  if (state === 'play' && t - lastStep >= STEP_MS) {
    lastStep = t;
    step();
  }
  draw();
  requestAnimationFrame(loop);
}

reset();
requestAnimationFrame(loop);
