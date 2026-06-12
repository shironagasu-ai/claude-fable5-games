import * as THREE from '../../lib/three/three.module.min.js';

const cv = document.getElementById('cv');
const overlay = document.getElementById('overlay');
const fade = document.getElementById('fade');
const msg = document.getElementById('msg');
const shieldEl = document.getElementById('shield');
const bar = document.getElementById('bar');
const unlock = document.getElementById('unlock');

const GOAL = 2000, SPEED = 48, XMAX = 8;

const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e1a);
scene.fog = new THREE.Fog(0x0b0e1a, 30, 140);
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 300);

function resize() {
  const w = cv.clientWidth, h = cv.clientHeight;
  if (!w || !h) { requestAnimationFrame(resize); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 300));

// 自機
const ship = new THREE.Group();
{
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(0.6, 1.8, 6),
    new THREE.MeshStandardMaterial({ color: 0x5eead4, emissive: 0x114b44 })
  );
  body.rotation.x = -Math.PI / 2;
  ship.add(body);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.8 })
  );
  glow.position.z = 1.1;
  glow.name = 'glow';
  ship.add(glow);
}
scene.add(ship);

scene.add(new THREE.AmbientLight(0x8888aa, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(3, 5, 4);
scene.add(sun);

// 星(二層パララックス)
function makeStars(count, spread, size, color, depth) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread;
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.5;
    pos[i * 3 + 2] = -Math.random() * 280;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color, size }));
  p.userData.depth = depth;
  scene.add(p);
  return p;
}
const starsFar = makeStars(700, 260, 0.35, 0x9aa0b8, 0.15);
const starsNear = makeStars(300, 200, 0.6, 0xc7d2fe, 0.5);

// エンジントレイル
const TRAIL_N = 60;
const trailPos = new Float32Array(TRAIL_N * 3).fill(9999);
const trailGeo = new THREE.BufferGeometry();
trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
const trail = new THREE.Points(trailGeo, new THREE.PointsMaterial({
  color: 0x5eead4, size: 0.5, transparent: true, opacity: 0.5,
}));
scene.add(trail);
let trailIdx = 0;

// 障害物(形と色にバリエーション)
const rockGeos = [new THREE.IcosahedronGeometry(1, 0), new THREE.OctahedronGeometry(1, 0), new THREE.DodecahedronGeometry(1, 0)];
const rockMats = [0x6b7280, 0x7c6f64, 0x4c5566].map(c =>
  new THREE.MeshStandardMaterial({ color: c, flatShading: true }));
const rocks = [];
for (let i = 0; i < 90; i++) {
  const m = new THREE.Mesh(rockGeos[i % 3], rockMats[i % 3]);
  const s = 1 + Math.random() * 1.6;
  m.scale.setScalar(s);
  m.userData = {
    x: (Math.random() - 0.5) * 2 * (XMAX + 1),
    zWorld: -40 - (i / 90) * (GOAL - 80) - Math.random() * 10,
    r: s * 0.9,
    spin: Math.random() * 2 - 1,
    alive: true,
  };
  scene.add(m);
  rocks.push(m);
}

function makeWall(lines, w, h, zWorld, name) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#101426';
  g.fillRect(0, 0, 1024, 512);
  g.fillStyle = '#5eead4';
  g.font = 'bold 96px monospace';
  g.textAlign = 'center';
  lines.forEach((l, i) => g.fillText(l, 512, 220 + i * 120));
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: name === 'mid', opacity: name === 'mid' ? 0.55 : 1 })
  );
  wall.userData = { zWorld };
  wall.name = name;
  scene.add(wall);
  return wall;
}
// 中間で一瞬すれ違う、小さな声
const midWall = makeWall(['ヒトリハ', 'サミシイ'], 26, 13, -(GOAL * 0.55), 'mid');
midWall.position.x = -14;
midWall.rotation.y = 0.5;
// 終端の構造物
makeWall(['キミノ ナマエヲ', 'オシエテ'], 80, 40, -(GOAL + 60), 'wall');

let state = 'ready'; // ready | play | cinematic | over | clear
let traveled = 0, shields = 3, shipX = 0, targetX = 0, hitFlash = 0, cineT = 0;

function start() {
  traveled = 0;
  shields = 3;
  shipX = targetX = 0;
  cineT = 0;
  rocks.forEach(r => { r.userData.alive = true; r.visible = true; });
  trailPos.fill(9999);
  shieldEl.textContent = '♥♥♥';
  fade.style.opacity = 0;
  overlay.hidden = true;
  state = 'play';
  if (window.SFX) SFX.tap();
}

overlay.addEventListener('pointerdown', () => {
  if (state === 'ready' || state === 'over') start();
});
unlock.addEventListener('pointerdown', e => e.stopPropagation());

cv.addEventListener('pointermove', (e) => {
  if (state !== 'play') return;
  const rect = cv.getBoundingClientRect();
  targetX = ((e.clientX - rect.left) / rect.width * 2 - 1) * XMAX;
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') targetX = Math.max(-XMAX, targetX - 2.5);
  if (e.key === 'ArrowRight') targetX = Math.min(XMAX, targetX + 2.5);
});

function gameOver() {
  state = 'over';
  msg.innerHTML = 'SIGNAL LOST<br>タップでリトライ';
  overlay.hidden = false;
  if (window.SFX) SFX.bad();
}

function finish() {
  state = 'clear';
  msg.textContent = 'CLEAR!';
  overlay.hidden = false;
  if (window.SFX) SFX.clear();
  if (window.Progress) {
    Progress.clear('signal-drive');
    unlock.hidden = false;
  }
}

let prev = performance.now();
function loop(t) {
  const dt = Math.min((t - prev) / 1000, 0.05);
  prev = t;

  if (state === 'play') {
    traveled += SPEED * dt;
    bar.style.width = `${Math.min(100, traveled / GOAL * 100)}%`;
    if (traveled >= GOAL) {
      // ラストは操作を手放して、構造物へ吸い込まれていく
      state = 'cinematic';
      targetX = 0;
      fade.style.opacity = 1;
      if (window.SFX) SFX.glitch();
    }
  } else if (state === 'cinematic') {
    traveled += SPEED * 0.45 * dt;
    cineT += dt;
    if (cineT > 2.8) finish();
  }

  shipX += (targetX - shipX) * Math.min(1, dt * 10);
  ship.position.set(shipX, 0, 0);
  ship.rotation.z = (shipX - targetX) * 0.08;
  const glow = ship.getObjectByName('glow');
  glow.scale.setScalar(0.8 + Math.random() * 0.5);

  // トレイル更新
  trailPos[trailIdx * 3] = shipX + (Math.random() - 0.5) * 0.3;
  trailPos[trailIdx * 3 + 1] = (Math.random() - 0.5) * 0.3;
  trailPos[trailIdx * 3 + 2] = 1.2;
  trailIdx = (trailIdx + 1) % TRAIL_N;
  for (let i = 0; i < TRAIL_N; i++) {
    if (trailPos[i * 3 + 2] < 999) trailPos[i * 3 + 2] += SPEED * dt * 0.5;
  }
  trailGeo.attributes.position.needsUpdate = true;

  camera.position.set(shipX * 0.6, 2.4, 7.5);
  camera.lookAt(shipX * 0.8, 0, -20);

  // 星のパララックス
  for (const stars of [starsFar, starsNear]) {
    const arr = stars.geometry.attributes.position.array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 2] += SPEED * dt * stars.userData.depth;
      if (arr[i + 2] > 10) arr[i + 2] -= 280;
    }
    stars.geometry.attributes.position.needsUpdate = true;
  }

  for (const r of rocks) {
    const rel = r.userData.zWorld + traveled;
    r.position.set(r.userData.x, 0, rel);
    r.visible = r.userData.alive && rel < 20;
    r.rotation.x += r.userData.spin * dt;
    r.rotation.y += r.userData.spin * dt * 0.7;
    if (state === 'play' && r.userData.alive && Math.abs(rel) < 1.6 &&
        Math.abs(r.userData.x - shipX) < r.userData.r + 0.6) {
      r.userData.alive = false;
      r.visible = false;
      shields--;
      hitFlash = 0.25;
      shieldEl.textContent = '♥'.repeat(Math.max(0, shields));
      if (window.SFX) SFX.hit();
      if (shields <= 0) gameOver();
    }
  }

  for (const name of ['wall', 'mid']) {
    const w = scene.getObjectByName(name);
    w.position.z = w.userData.zWorld + traveled;
    w.position.y = name === 'wall' ? 6 : 4;
  }

  if (hitFlash > 0) {
    hitFlash -= dt;
    scene.background.setHex(0x3a1020);
  } else {
    scene.background.setHex(0x0b0e1a);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

resize();
requestAnimationFrame(loop);
window.__sdReady = true;
