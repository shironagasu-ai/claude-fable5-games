// 進行段階に応じてサイトの見た目や挙動を調整する
(() => {
  const stage = window.Progress ? window.Progress.clearedCount() : 0;
  window.AnomalyStage = stage;

  if (stage >= 1) {
    console.log(
      '%c[obs-log:001] 誰かが、遊んでいる。',
      'color:#5eead4;font-family:monospace'
    );
  }

  if (stage >= 2) {
    const intro = document.querySelector('.intro');
    if (intro) intro.textContent = intro.textContent.replace('増やして', '殖やして');
    console.log(
      '%c[obs-log:002] つづけて。',
      'color:#5eead4;font-family:monospace'
    );
  }

  if (stage >= 3) {
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
    console.log(
      '%c[obs-log:003] こっちを みないで',
      'color:#5eead4;font-family:monospace'
    );
  }

  if (stage >= 4) {
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
      // 一覧の描画完了を待ってから追加する
      const obs = new MutationObserver(() => {
        if (document.querySelectorAll('.game-card').length >= 6 && !document.querySelector('.ghost-card')) {
          addGhostCard();
          obs.disconnect();
        }
      });
      obs.observe(document.querySelector('.game-list'), { childList: true });
    }
    console.log(
      '%c[obs-log:004] あと すこし',
      'color:#5eead4;font-family:monospace'
    );
  }
})();
