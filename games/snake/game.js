const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const unlock = document.getElementById('unlock');

const N = 20, CELL = 18, GOAL = 15;

let snake, prevSnake, dir, nextDir, food, eaten, state, lastStep, ghostUntil, stepMs, pops;

function reset() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  prevSnake = snake.map(s => ({ ...s }));
  dir = { x: 1, y: 0 };
  nextDir = dir;
  eaten = 0;
  state = 'ready'; // ready | play | over | clear
  lastStep = 0;
  ghostUntil = 0;
  stepMs = 140;
  pops = [];
  placeFood();
}

function placeFood() {
  do {
    food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N), born: performance.now() };
  } while (snake.some(s => s.x === food.x && s.y === food.y));
}

function step() {
  dir = nextDir;
  prevSnake = snake.map(s => ({ ...s }));
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  if (head.x < 0 || head.x >= N || head.y < 0 || head.y >= N ||
      snake.some(s => s.x === head.x && s.y === head.y)) {
    state = 'over';
    if (window.SFX) SFX.bad();
    return;
  }
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    eaten++;
    stepMs = Math.max(90, 140 - eaten * 3); // だんだん速く
    pops.push({ x: head.x, y: head.y, life: 1, text: `+${eaten}` });
    if (window.SFX) SFX.ok();
    if (eaten === 8 || eaten === 12) {
      ghostUntil = performance.now() + 700;
      if (window.SFX) SFX.glitch();
    }
    if (eaten >= GOAL) {
      state = 'clear';
      if (window.SFX) SFX.clear();
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

const px = (v) => v * CELL + CELL / 2;

function draw(now) {
  ctx.clearRect(0, 0, cv.width, cv.height);

  // うっすらグリッド
  ctx.strokeStyle = '#ffffff08';
  ctx.beginPath();
  for (let i = 1; i < N; i++) {
    ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, cv.height);
    ctx.moveTo(0, i * CELL); ctx.lineTo(cv.width, i * CELL);
  }
  ctx.stroke();

  if (now < ghostUntil) {
    ctx.globalAlpha = 0.08;
    ctx.font = 'bold 90px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8eaf2';
    ctx.fillText('みてる', cv.width / 2, cv.height / 2 + 30);
    ctx.globalAlpha = 1;
  }

  // 餌(脈動)
  const pulse = 1 + Math.sin((now - food.born) / 180) * 0.18;
  ctx.fillStyle = '#f87171';
  ctx.shadowColor = '#f87171';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(px(food.x), px(food.y), (CELL / 2 - 3) * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // ヘビ(セル間を補間して滑らかに)
  const t = state === 'play' ? Math.min(1, (now - lastStep) / stepMs) : 1;
  snake.forEach((s, i) => {
    const p = prevSnake[i] || prevSnake[prevSnake.length - 1] || s;
    const x = px(p.x + (s.x - p.x) * t), y = px(p.y + (s.y - p.y) * t);
    const r = i === 0 ? CELL / 2 - 1 : CELL / 2 - 2 - Math.min(3, i * 0.15);
    ctx.fillStyle = i === 0 ? '#86efac' : `hsl(${142 - i * 2} 60% ${48 - i * 0.8}%)`;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(3, r), 0, Math.PI * 2);
    ctx.fill();
    if (i === 0) { // 目
      ctx.fillStyle = '#0b0e1a';
      const ex = dir.x * 3, ey = dir.y * 3;
      ctx.beginPath();
      ctx.arc(x + ex - dir.y * 3.5, y + ey - dir.x * 3.5, 2, 0, Math.PI * 2);
      ctx.arc(x + ex + dir.y * 3.5, y + ey + dir.x * 3.5, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // スコアポップ
  pops = pops.filter(p => (p.life -= 0.02) > 0);
  for (const p of pops) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(p.text, px(p.x), px(p.y) - (1 - p.life) * 24);
  }
  ctx.globalAlpha = 1;

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
  if (state === 'play' && t - lastStep >= stepMs) {
    lastStep = t;
    step();
  }
  draw(t);
  requestAnimationFrame(loop);
}

reset();
requestAnimationFrame(loop);
