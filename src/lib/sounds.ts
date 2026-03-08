const ctx = () => {
  if (!(window as any).__audioCtx) {
    (window as any).__audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return (window as any).__audioCtx as AudioContext;
};

const play = (freq: number, type: OscillatorType, duration: number, volume = 0.15) => {
  try {
    const c = ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duration);
  } catch {}
};

export const sfx = {
  flip: () => play(600, "sine", 0.1, 0.1),
  match: () => {
    play(523, "sine", 0.15, 0.12);
    setTimeout(() => play(659, "sine", 0.15, 0.12), 80);
    setTimeout(() => play(784, "sine", 0.2, 0.12), 160);
  },
  mismatch: () => {
    play(300, "square", 0.15, 0.06);
    setTimeout(() => play(250, "square", 0.2, 0.06), 120);
  },
  levelComplete: () => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => setTimeout(() => play(n, "sine", 0.25, 0.12), i * 120));
  },
  move: () => play(440, "sine", 0.06, 0.08),
  place: () => play(520, "triangle", 0.12, 0.1),
  rotate: () => play(380, "sine", 0.08, 0.08),
  drop: () => {
    play(200, "square", 0.1, 0.08);
    setTimeout(() => play(150, "square", 0.15, 0.08), 60);
  },
  clear: () => {
    play(660, "sine", 0.12, 0.1);
    setTimeout(() => play(880, "sine", 0.15, 0.1), 80);
  },
  eat: () => {
    play(500, "sine", 0.08, 0.1);
    setTimeout(() => play(700, "sine", 0.1, 0.1), 50);
  },
  gameOver: () => {
    const notes = [400, 350, 300, 200];
    notes.forEach((n, i) => setTimeout(() => play(n, "square", 0.2, 0.08), i * 150));
  },
  click: () => play(800, "sine", 0.05, 0.06),
  error: () => play(200, "square", 0.2, 0.1),
  correct: () => {
    play(600, "sine", 0.1, 0.1);
    setTimeout(() => play(800, "sine", 0.12, 0.1), 70);
  },
  wordFound: () => {
    play(523, "sine", 0.1, 0.1);
    setTimeout(() => play(659, "sine", 0.1, 0.1), 60);
    setTimeout(() => play(784, "sine", 0.15, 0.1), 120);
  },
  shake: () => {
    play(300, "sawtooth", 0.15, 0.06);
    setTimeout(() => play(350, "sawtooth", 0.1, 0.06), 80);
    setTimeout(() => play(400, "sawtooth", 0.08, 0.06), 140);
  },
  speedUp: () => play(600, "triangle", 0.1, 0.08),
  speedDown: () => play(400, "triangle", 0.1, 0.08),
};
