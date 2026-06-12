const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const W = cv.width, H = cv.height;
const unlock = document.getElementById('unlock');

const COLS = 6, ROWS = 5, BW = 52, BH = 18, GAP = 6;
const MX = (W - (COLS * BW + (COLS - 1) * GAP)) / 2, MY = 70;
const COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa'];

let bricks, paddle, ball, lives, state, buffed, glyphUntil;

function reset() {
  bricks = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      bricks.push({ x: MX + c * (BW + GAP), y: MY + r * (BH + GAP), hp: 1, color: COLORS[r] });
    }
  }
  paddle = { x: W / 2, w: 70, h: 10, y: H - 36 };
  lives = 3;
  state = 'ready'; // ready | play | over | clear
  buffed = false;
  glyphUntil = 0;
  resetBall();
}

function resetBall() {
  ball = { x: W / 2, y: paddle.y - 12, dx: 0, dy: 0, r: 6 };
}

function launch() {
  const a = (Math.random() * 0.6 - 0.3) - Math.PI / 2;
  ball.dx = Math.cos(a) * 5;
  ball.dy = Math.sin(a) * 5;
  state = 'play';
}

cv.addEventListener('pointerdown', (e) => {
  movePaddle(e);
  if (state === 'ready') launch();
  else if (state === 'over') reset();
});

cv.addEventListener('pointermove', movePaddle);

function movePaddle(e) {
  if (state !== 'play' && state !== 'ready') return;
  const rect = cv.getBoundingClientRect();
  paddle.x = (e.clientX - rect.left) * (W / rect.width);
  paddle.x = Math.max(paddle.w / 2, Math.min(W - paddle.w / 2, paddle.x));
  if (state === 'ready') ball.x = paddle.x;
}

function update() {
  if (state !== 'play') return;
  ball.x += ball.dx;
  ball.y += ball.dy;

  if (ball.x < ball.r) { ball.x = ball.r; ball.dx *= -1; }
  if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.dx *= -1; }
  if (ball.y < ball.r) { ball.y = ball.r; ball.dy *= -1; }

  // パドル反射(当たった位置で角度が変わる)
  if (ball.dy > 0 && ball.y + ball.r >= paddle.y &&
      ball.y + ball.r <= paddle.y + paddle.h + 8 &&
      Math.abs(ball.x - paddle.x) <= paddle.w / 2 + ball.r) {
    const t = (ball.x - paddle.x) / (paddle.w / 2);
    const a = t * 1.1 - Math.PI / 2;
    const sp = Math.hypot(ball.dx, ball.dy);
    ball.dx = Math.cos(a) * sp;
    ball.dy = Math.sin(a) * sp;
    ball.y = paddle.y - ball.r;
  }

  // ブロック衝突
  for (const b of bricks) {
    if (b.hp <= 0) continue;
    if (ball.x + ball.r < b.x || ball.x - ball.r > b.x + BW ||
        ball.y + ball.r < b.y || ball.y - ball.r > b.y + BH) continue;
    const fromSide = Math.min(Math.abs(ball.x - b.x), Math.abs(ball.x - (b.x + BW))) <
                     Math.min(Math.abs(ball.y - b.y), Math.abs(ball.y - (b.y + BH)));
    if (fromSide) ball.dx *= -1; else ball.dy *= -1;
    b.hp--;
    if (b.hp <= 0 && b.tough) glyphUntil = performance.now() + 400;
    break;
  }

  const alive = bricks.filter(b => b.hp > 0);
  if (alive.length === 1 && !buffed) {
    buffed = true;
    alive[0].hp = 3;
    alive[0].tough = true;
  }
  if (alive.length === 0) {
    state = 'clear';
    if (window.Progress) {
      Progress.clear('breakout');
      unlock.hidden = false;
    }
  }

  if (ball.y > H + ball.r) {
    lives--;
    if (lives <= 0) state = 'over';
    else { state = 'ready'; resetBall(); ball.x = paddle.x; }
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  for (const b of bricks) {
    if (b.hp <= 0) continue;
    if (b.tough) {
      // 妙に硬い最後のひとつ
      const jx = (Math.random() - 0.5) * 1.5, jy = (Math.random() - 0.5) * 1.5;
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(b.x + jx, b.y + jy, BW, BH);
      ctx.strokeStyle = '#818cf8';
      ctx.strokeRect(b.x + jx, b.y + jy, BW, BH);
    } else {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, BW, BH);
    }
  }

  ctx.fillStyle = '#e8eaf2';
  ctx.fillRect(paddle.x - paddle.w / 2, paddle.y, paddle.w, paddle.h);
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('♥'.repeat(Math.max(0, lives)), 10, 24);

  ctx.textAlign = 'center';
  if (state === 'ready') ctx.fillText('タップで発射 / ドラッグで移動', W / 2, H - 80);
  if (state === 'over') {
    ctx.font = 'bold 28px monospace';
    ctx.fillText('GAME OVER', W / 2, H / 2);
    ctx.font = '14px monospace';
    ctx.fillText('タップでリトライ', W / 2, H / 2 + 30);
  }
  if (state === 'clear') {
    ctx.font = 'bold 28px monospace';
    ctx.fillText('CLEAR!', W / 2, H / 2);
  }

  if (performance.now() < glyphUntil) {
    ctx.globalAlpha = 0.35;
    ctx.font = '64px serif';
    ctx.fillText('👁', W / 2, H / 2 - 60);
    ctx.globalAlpha = 1;
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

reset();
loop();
