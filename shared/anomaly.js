// 進行段階に応じてサイトの見た目や挙動を調整する
(() => {
  const stage = window.Progress ? window.Progress.clearedCount() : 0;
  // 名前を伝えたあと、サイトは しずかになる
  const connected = stage >= 6 && localStorage.getItem('cf5g-name');
  window.AnomalyStage = stage;

  const log = (text, color = '#5eead4') =>
    console.log(`%c${text}`, `color:${color};font-family:monospace`);

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
