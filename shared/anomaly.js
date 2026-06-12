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
})();
