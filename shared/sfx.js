// 効果音: WebAudio で合成する(音声アセット不要)
(() => {
  let ac;
  const ctx = () => (ac ??= new (window.AudioContext || window.webkitAudioContext)());

  function tone(freq, dur = 0.08, type = 'sine', gain = 0.04, slide = 0) {
    try {
      const a = ctx();
      if (a.state === 'suspended') a.resume();
      const o = a.createOscillator(), g = a.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, a.currentTime);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), a.currentTime + dur);
      g.gain.setValueAtTime(gain, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
      o.connect(g).connect(a.destination);
      o.start();
      o.stop(a.currentTime + dur);
    } catch { /* 音はなくてもゲームは動く */ }
  }

  window.SFX = {
    tap: () => tone(660, 0.05, 'square', 0.025),
    ok: () => { tone(523, 0.09); setTimeout(() => tone(784, 0.12), 70); },
    bad: () => tone(170, 0.2, 'sawtooth', 0.045, -60),
    hit: () => tone(340, 0.06, 'triangle', 0.05, -150),
    clear: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.16, 'sine', 0.05), i * 110)),
    glitch: () => tone(90 + Math.random() * 280, 0.12, 'sawtooth', 0.02, 250),
  };
})();
