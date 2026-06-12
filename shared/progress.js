// 進行管理: クリア状態を localStorage に保存する共通モジュール
(() => {
  const KEY = 'cf5g-progress';

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || { cleared: {} };
    } catch {
      return { cleared: {} };
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  window.Progress = {
    isCleared: (id) => Boolean(load().cleared[id]),
    clearedAt: (id) => load().cleared[id] || null,
    clearedCount: () => Object.keys(load().cleared).length,
    // 初回クリア時のみ true を返す
    clear(id) {
      const data = load();
      if (data.cleared[id]) return false;
      data.cleared[id] = Date.now();
      save(data);
      return true;
    },
  };
})();
