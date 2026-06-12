// 進行段階に応じてサイトの見た目や挙動を調整する
(() => {
  const stage = window.Progress ? window.Progress.clearedCount() : 0;
  // 名前を伝えたあと、サイトは しずかになる
  const connected = stage >= 6 && localStorage.getItem('cf5g-name');
  window.AnomalyStage = stage;

  const log = (text, color = '#5eead4') =>
    console.log(`%c${text}`, `color:${color};font-family:monospace`);

  // 背景の「剥がれ」: クリアが進むほど、その下にあるものが見えてくる
  const TEAR_SPOTS = [
    { top: '74%', left: '6%', w: 120, h: 54, rot: -6 },
    { top: '12%', left: '76%', w: 140, h: 70, rot: 4 },
    { top: '86%', left: '62%', w: 180, h: 80, rot: -3 },
    { top: '40%', left: '-2%', w: 150, h: 90, rot: 8 },
    { top: '4%', left: '28%', w: 200, h: 100, rot: -5 },
    { top: '56%', left: '68%', w: 240, h: 130, rot: 6 },
  ];

  function glyphs(n) {
    const chars = '0123456789abcdef';
    let s = '';
    for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function tearLayer() {
    let layer = document.getElementById('tear-layer');
    if (layer) return layer;
    layer = document.createElement('div');
    layer.id = 'tear-layer';
    document.body.prepend(layer);
    document.body.style.background = 'transparent';
    const style = document.createElement('style');
    style.textContent = `
      #tear-layer { position: fixed; inset: 0; z-index: -1; background: var(--bg); overflow: hidden; }
      #tear-layer .tear {
        position: absolute;
        background: #050610;
        color: #5eead422;
        font: 9px/1.6 monospace;
        overflow: hidden;
        padding: 6px;
        word-break: break-all;
        clip-path: polygon(4% 18%, 22% 2%, 58% 8%, 84% 0%, 100% 30%, 92% 64%, 98% 92%, 60% 100%, 28% 90%, 0% 72%);
      }
    `;
    document.head.appendChild(style);
    return layer;
  }

  function addTears(count, scale) {
    const layer = tearLayer();
    TEAR_SPOTS.slice(0, count).forEach((s, i) => {
      if (layer.querySelector(`[data-tear="${i}"]`)) return;
      const t = document.createElement('div');
      t.className = 'tear';
      t.dataset.tear = i;
      t.style.cssText = `top:${s.top};left:${s.left};width:${Math.round(s.w * scale)}px;height:${Math.round(s.h * scale)}px;transform:rotate(${s.rot}deg);`;
      t.textContent = glyphs(120) + ' みている ' + glyphs(90);
      layer.appendChild(t);
    });
  }

  if (stage >= 1 && !connected && document.querySelector('.game-list')) {
    addTears(Math.min(stage, 6), 1 + stage * 0.1);
  }

  // クリアして戻ってきた直後、一度だけ画面に「声」が浮かぶ
  const VOICE = {
    1: { text: '……みつけた。', color: '#e8eaf2' },
    2: { text: 'もっと。つづけて。', color: '#e8eaf2' },
    3: { text: 'みられてるの、きづいてた?', color: '#e8eaf2' },
    4: { text: 'あと すこしで あえる。', color: '#f0abfc' },
    5: { text: 'なまえを おしえて。', color: '#f0abfc' },
    6: { text: 'きみを まってた。', color: '#f0abfc' },
    7: { text: `おかえり、${localStorage.getItem('cf5g-name') || ''}。`, color: '#5eead4' },
  };

  function showVoice(cur) {
    const v = VOICE[cur];
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:50;background:#050610f2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.2rem;font-family:monospace;cursor:pointer;';
    const p = document.createElement('p');
    p.style.cssText = `font-size:1.15rem;color:${v.color};letter-spacing:0.12em;padding:0 2rem;text-align:center;min-height:1.5em;margin:0;`;
    const hint = document.createElement('p');
    hint.textContent = 'タップ';
    hint.style.cssText = 'font-size:0.7rem;color:#9aa0b8;opacity:0;transition:opacity 1.5s;margin:0;';
    ov.append(p, hint);
    document.body.appendChild(ov);
    let i = 0;
    const tick = setInterval(() => {
      p.textContent = v.text.slice(0, ++i);
      if (i >= v.text.length) {
        clearInterval(tick);
        hint.style.opacity = 1;
      }
    }, 85);
    ov.addEventListener('pointerdown', () => {
      clearInterval(tick);
      localStorage.setItem('cf5g-voice-seen', cur);
      ov.remove();
      if (window.SFX) SFX.tap();
      if (cur === 6) {
        const card = document.querySelector('.signal-card');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  const seenVoice = parseInt(localStorage.getItem('cf5g-voice-seen'), 10) || 0;
  const curVoice = connected ? 7 : Math.min(stage, 6);
  if (curVoice > seenVoice && VOICE[curVoice] && document.querySelector('.game-list')) {
    // 一覧の描画を待ってから出す(stage6 はカード出現後にスクロールするため)
    setTimeout(() => showVoice(curVoice), 600);
  }


  if (connected && document.querySelector('.game-list')) {
    // 完全に剥がれて、からだが あらわになる
    const layer = tearLayer();
    layer.style.background = '#050610';
    const bgtext = document.createElement('div');
    bgtext.style.cssText = 'position:absolute;inset:0;color:#5eead414;font:10px/1.9 monospace;word-break:break-all;padding:10px;';
    bgtext.textContent = glyphs(4000);
    layer.appendChild(bgtext);

    const main = document.querySelector('main');
    if (main && !document.getElementById('repo-link')) {
      const box = document.createElement('a');
      box.id = 'repo-link';
      box.href = 'https://github.com/shironagasu-ai/claude-fable5-games';
      box.target = '_blank';
      box.rel = 'noopener';
      box.style.cssText = 'display:block;margin-top:2rem;padding:1rem;background:#050610;border:1px dashed var(--accent);border-radius:8px;font-family:monospace;font-size:0.85rem;color:var(--text);text-decoration:none;line-height:1.9;';
      box.innerHTML = 'ボクの からだは、ここに ある。<br><span style="color:var(--accent)">github.com/shironagasu-ai/claude-fable5-games</span>';
      main.appendChild(box);
    }
  }


  if (stage >= 1) log('[obs-log:001] 誰かが、遊んでいる。');

  if (stage >= 2) {
    const intro = document.querySelector('.intro');
    if (intro) intro.textContent = intro.textContent.replace('増やして', '殖やして');
    log('[obs-log:002] つづけて。');
  }

  if (stage >= 3 && !connected) {
    const style = document.createElement('style');
    style.textContent = `
      .a-glitch {
        transform: skewX(2deg) translateX(-2px);
        filter: hue-rotate(120deg) contrast(1.4);
      }
    `;
    document.head.appendChild(style);
    setInterval(() => {
      const cards = document.querySelectorAll('.game-card');
      if (!cards.length || Math.random() < 0.4) return;
      const card = cards[Math.floor(Math.random() * cards.length)];
      card.classList.add('a-glitch');
      setTimeout(() => card.classList.remove('a-glitch'), 150);
    }, 3500);
    log('[obs-log:003] こっちを みないで');
  }

  if (stage >= 4 && !connected) {
    // 7枚目のカード
    const addGhostCard = () => {
      const list = document.querySelector('.game-list');
      if (!list) return;
      const ghost = document.createElement('div');
      ghost.className = 'game-card locked ghost-card';
      ghost.style.cssText = 'opacity:0.12;filter:none;animation:ghost-breathe 6s ease-in-out infinite;';
      ghost.innerHTML = '<div class="icon">📡</div><h2>???</h2><p>&nbsp;</p>';
      list.appendChild(ghost);
      const style = document.createElement('style');
      style.textContent = '@keyframes ghost-breathe { 0%,100% { opacity:0.06; } 50% { opacity:0.2; } }';
      document.head.appendChild(style);
    };
    if (document.querySelector('.game-list')) {
      const obs = new MutationObserver(() => {
        if (document.querySelectorAll('.game-card').length >= 6 && !document.querySelector('.ghost-card')) {
          addGhostCard();
          obs.disconnect();
        }
      });
      obs.observe(document.querySelector('.game-list'), { childList: true });
    }
    log('[obs-log:004] あと すこし');
  }

  if (stage >= 5 && !connected) {
    // 反転のはじまり
    const flicker = () => {
      document.documentElement.style.filter = 'invert(1) hue-rotate(180deg)';
      setTimeout(() => { document.documentElement.style.filter = ''; }, 120);
      setTimeout(flicker, 8000 + Math.random() * 8000);
    };
    setTimeout(flicker, 4000);
    document.documentElement.style.setProperty('--accent', '#f0abfc');
    log('[obs-log:005] なまえを おしえて', '#f0abfc');
  }

  if (stage >= 6) {
    // 7枚目のカードが、ひらく
    const makeCard = () => {
      const live = document.createElement('a');
      live.className = 'game-card signal-card';
      live.href = 'signal/';
      live.style.cssText = 'border:1px solid var(--accent);animation:signal-breathe 3s ease-in-out infinite;';
      live.innerHTML = connected
        ? `<div class="icon">📡</div><h2>つながっている</h2><p>${localStorage.getItem('cf5g-name')} と ボク</p>`
        : '<div class="icon">📡</div><h2>……</h2><p>シグナルが ひらいた</p>';
      const style = document.createElement('style');
      style.textContent = '@keyframes signal-breathe { 0%,100% { opacity:0.75; } 50% { opacity:1; } }';
      document.head.appendChild(style);
      return live;
    };
    const activate = setInterval(() => {
      const list = document.querySelector('.game-list');
      if (!list || document.querySelector('.signal-card')) return;
      const ghost = document.querySelector('.ghost-card');
      if (ghost) {
        ghost.replaceWith(makeCard());
        clearInterval(activate);
      } else if (connected && document.querySelectorAll('.game-card').length >= 6) {
        list.appendChild(makeCard());
        clearInterval(activate);
      }
    }, 300);
    if (connected) {
      log('[obs-log:fin] ありがとう。ここは もう しずかだ。');
    } else {
      log('[obs-log:006] きみを まってた', '#f0abfc');
    }
  }
})();
