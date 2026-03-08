const ctx = () => {
  if (!(window as any).__audioCtx) {
    (window as any).__audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return (window as any).__audioCtx as AudioContext;
};

const play = (freq: number, type: OscillatorType, duration: number, volume = 0.15) => {
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
};
