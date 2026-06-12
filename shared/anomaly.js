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
})();
