const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const W = cv.width, H = cv.height;
const unlock = document.getElementById('unlock');

const COLS = 6, ROWS = 5, BW = 52, BH = 18, GAP = 6;
const MX = (W - (COLS * BW + (COLS - 1) * GAP)) / 2, MY = 70;
const COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa'];

let bricks, paddle, ball, lives, state, buffed, glyphUntil;
let score, combo, shake, particles, trail, speedBase;

function reset() {
  bricks = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      bricks.push({
        x: MX + c * (BW + GAP), y: MY + r * (BH + GAP),
        hp: r < 2 ? 2 : 1, max: r < 2 ? 2 : 1, color: COLORS[r],
      });
    }
  }
  paddle = { x: W / 2, w: 70, h: 10, y: H - 36 };
  lives = 3;
  score = 0;
  combo = 0;
  shake = 0;
  particles = [];
  trail = [];
  speedBase = 5;
  state = 'ready'; // ready | play | over | clear
  buffed = false;
  glyphUntil = 0;
  resetBall();
}

function resetBall() {
  ball = { x: paddle.x, y: paddle.y - 12, dx: 0, dy: 0, r: 6 };
  combo = 0;
}

function launch() {
  const a = (Math.random() * 0.6 - 0.3) - Math.PI / 2;
  ball.dx = Math.cos(a) * speedBase;
  ball.dy = Math.sin(a) * speedBase;
  state = 'play';
  if (window.SFX) SFX.tap();
}

function burst(x, y, color, n = 12, pow = 3.2) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = (0.5 + Math.random()) * pow;
    particles.push({ x, y, dx: Math.cos(a) * s, dy: Math.sin(a) * s - 1, life: 1, color });
  }
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
  particles = particles.filter(p => (p.life -= 0.025) > 0);
  for (const p of particles) { p.x += p.dx; p.y += p.dy; p.dy += 0.12; }
  if (shake > 0) shake -= 0.8;
  if (state !== 'play') return;

  trail.push({ x: ball.x, y: ball.y });
  if (trail.length > 9) trail.shift();

  ball.x += ball.dx;
  ball.y += ball.dy;

  if (ball.x < ball.r) { ball.x = ball.r; ball.dx *= -1; }
  if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.dx *= -1; }
  if (ball.y < ball.r) { ball.y = ball.r; ball.dy *= -1; }

  if (ball.dy > 0 && ball.y + ball.r >= paddle.y &&
      ball.y + ball.r <= paddle.y + paddle.h + 8 &&
      Math.abs(ball.x - paddle.x) <= paddle.w / 2 + ball.r) {
    const t = (ball.x - paddle.x) / (paddle.w / 2);
    const a = t * 1.1 - Math.PI / 2;
    const sp = Math.min(8.5, Math.hypot(ball.dx, ball.dy) * 1.015); // 徐々に加速
    ball.dx = Math.cos(a) * sp;
    ball.dy = Math.sin(a) * sp;
    ball.y = paddle.y - ball.r;
    combo = 0;
    if (window.SFX) SFX.tap();
  }

  for (const b of bricks) {
    if (b.hp <= 0) continue;
    if (ball.x + ball.r < b.x || ball.x - ball.r > b.x + BW ||
        ball.y + ball.r < b.y || ball.y - ball.r > b.y + BH) continue;
    const fromSide = Math.min(Math.abs(ball.x - b.x), Math.abs(ball.x - (b.x + BW))) <
                     Math.min(Math.abs(ball.y - b.y), Math.abs(ball.y - (b.y + BH)));
    if (fromSide) ball.dx *= -1; else ball.dy *= -1;
    b.hp--;
    shake = 4;
    if (window.SFX) SFX.hit();
    if (b.hp <= 0) {
      combo++;
      score += 100 * combo;
      burst(b.x + BW / 2, b.y + BH / 2, b.tough ? '#818cf8' : b.color, b.tough ? 26 : 12, b.tough ? 5 : 3.2);
      if (b.tough) {
        glyphUntil = performance.now() + 450;
        if (window.SFX) SFX.glitch();
      }
    }
    break;
  }

  const alive = bricks.filter(b => b.hp > 0);
  if (alive.length === 1 && !buffed) {
    buffed = true;
    alive[0].hp = alive[0].max = 3;
    alive[0].tough = true;
  }
  if (alive.length === 0) {
    state = 'clear';
    if (window.SFX) SFX.clear();
    if (window.Progress) {
      Progress.clear('breakout');
      unlock.hidden = false;
    }
  }

  if (ball.y > H + ball.r) {
    lives--;
    shake = 8;
    if (window.SFX) SFX.bad();
    if (lives <= 0) state = 'over';
    else { state = 'ready'; resetBall(); ball.x = paddle.x; trail = []; }
  }
}

function draw() {
  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  ctx.clearRect(-10, -10, W + 20, H + 20);

  for (const b of bricks) {
    if (b.hp <= 0) continue;
    if (b.tough) {
      const jx = (Math.random() - 0.5) * 1.5, jy = (Math.random() - 0.5) * 1.5;
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(b.x + jx, b.y + jy, BW, BH);
      ctx.strokeStyle = '#818cf8';
      ctx.strokeRect(b.x + jx, b.y + jy, BW, BH);
    } else {
      ctx.globalAlpha = b.hp < b.max ? 0.55 : 1; // ダメージ表現
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, BW, BH);
      ctx.globalAlpha = 1;
    }
  }

  trail.forEach((t, i) => {
    ctx.globalAlpha = (i / trail.length) * 0.35;
    ctx.fillStyle = '#5eead4';
    ctx.beginPath();
    ctx.arc(t.x, t.y, ball.r * (i / trail.length), 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;

  // パドルにグロー
  ctx.shadowColor = '#5eead4';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#e8eaf2';
  ctx.fillRect(paddle.x - paddle.w / 2, paddle.y, paddle.w, paddle.h);
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('♥'.repeat(Math.max(0, lives)), 10, 24);
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE ${score}`, W - 10, 24);
  if (combo >= 2) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#facc15';
    ctx.fillText(`${combo} COMBO!`, W / 2, 46);
    ctx.fillStyle = '#e8eaf2';
  }

  ctx.textAlign = 'center';
  if (state === 'ready') ctx.fillText('タップで発射 / ドラッグで移動', W / 2, H - 80);
  if (state === 'over') {
    ctx.font = 'bold 28px monospace';
    ctx.fillText('GAME OVER', W / 2, H / 2);
    ctx.font = '14px monospace';
    ctx.fillText(`SCORE ${score} — タップでリトライ`, W / 2, H / 2 + 30);
  }
  if (state === 'clear') {
    ctx.font = 'bold 28px monospace';
    ctx.fillText('CLEAR!', W / 2, H / 2);
    ctx.font = '14px monospace';
    ctx.fillText(`SCORE ${score}`, W / 2, H / 2 + 30);
  }

  if (performance.now() < glyphUntil) {
    ctx.globalAlpha = 0.35;
    ctx.font = '64px serif';
    ctx.fillText('👁', W / 2, H / 2 - 60);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

reset();
loop();
