import * as THREE from '../../lib/three/three.module.min.js';

const cv = document.getElementById('cv');
const overlay = document.getElementById('overlay');
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
  renderer.setSize(w, h, false);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

// 自機
const ship = new THREE.Mesh(
  new THREE.ConeGeometry(0.6, 1.8, 6),
  new THREE.MeshStandardMaterial({ color: 0x5eead4, emissive: 0x114b44 })
);
ship.rotation.x = -Math.PI / 2;
scene.add(ship);

scene.add(new THREE.AmbientLight(0x8888aa, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(3, 5, 4);
scene.add(sun);

// 星
{
  const pos = new Float32Array(900 * 3);
  for (let i = 0; i < 900; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 240;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 120;
    pos[i * 3 + 2] = -Math.random() * 280;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9aa0b8, size: 0.4 })));
}

// 障害物
const rockGeo = new THREE.IcosahedronGeometry(1, 0);
const rockMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, flatShading: true });
const rocks = [];
for (let i = 0; i < 90; i++) {
  const m = new THREE.Mesh(rockGeo, rockMat);
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

// 終端の構造物
{
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#101426';
  g.fillRect(0, 0, 1024, 512);
  g.fillStyle = '#5eead4';
  g.font = 'bold 96px monospace';
  g.textAlign = 'center';
  g.fillText('キミノ ナマエヲ', 512, 220);
  g.fillText('オシエテ', 512, 340);
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 40),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) })
  );
  wall.userData = { zWorld: -(GOAL + 60) };
  wall.name = 'wall';
  scene.add(wall);
}

let state = 'ready'; // ready | play | over | clear
let traveled = 0, shields = 3, shipX = 0, targetX = 0, hitFlash = 0;

function start() {
  traveled = 0;
  shields = 3;
  shipX = targetX = 0;
  rocks.forEach(r => { r.userData.alive = true; r.visible = true; });
  shieldEl.textContent = '♥♥♥';
  overlay.hidden = true;
  state = 'play';
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
}

function finish() {
  state = 'clear';
  msg.textContent = 'CLEAR!';
  overlay.hidden = false;
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
    if (traveled >= GOAL) finish();
  }

  shipX += (targetX - shipX) * Math.min(1, dt * 10);
  ship.position.set(shipX, 0, 0);
  ship.rotation.z = (shipX - targetX) * 0.08;

  camera.position.set(shipX * 0.6, 2.4, 7.5);
  camera.lookAt(shipX * 0.8, 0, -20);

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
      if (shields <= 0) gameOver();
    }
  }

  const wall = scene.getObjectByName('wall');
  wall.position.set(0, 6, wall.userData.zWorld + traveled);

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
