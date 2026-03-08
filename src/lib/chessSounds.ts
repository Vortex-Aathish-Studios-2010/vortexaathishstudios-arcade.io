// Realistic chess piece sounds using Web Audio API

const ctx = () => {
  if (!(window as any).__chessAudioCtx) {
    (window as any).__chessAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return (window as any).__chessAudioCtx as AudioContext;
};

const noise = (duration: number, volume: number) => {
  const c = ctx();
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * volume;
  return buffer;
};

// Wooden piece placement sound
export const chessSfx = {
  move: () => {
    try {
      const c = ctx();
      // Thud component
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.08);
      gain.gain.setValueAtTime(0.25, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
      osc.connect(gain).connect(c.destination);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 0.12);

      // Click/tap component
      const noiseSource = c.createBufferSource();
      noiseSource.buffer = noise(0.04, 0.15);
      const noiseGain = c.createGain();
      const noiseFilter = c.createBiquadFilter();
      noiseFilter.type = "highpass";
      noiseFilter.frequency.setValueAtTime(2000, c.currentTime);
      noiseGain.gain.setValueAtTime(0.2, c.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
      noiseSource.connect(noiseFilter).connect(noiseGain).connect(c.destination);
      noiseSource.start(c.currentTime);
    } catch {}
  },

  capture: () => {
    try {
      const c = ctx();
      // Heavier thud
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(180, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.15);
      gain.gain.setValueAtTime(0.35, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
      osc.connect(gain).connect(c.destination);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 0.2);

      // Knock sound
      const noiseSource = c.createBufferSource();
      noiseSource.buffer = noise(0.06, 0.25);
      const noiseGain = c.createGain();
      noiseGain.gain.setValueAtTime(0.3, c.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
      noiseSource.connect(noiseGain).connect(c.destination);
      noiseSource.start(c.currentTime);

      // Secondary tap
      setTimeout(() => {
        try {
          const osc2 = c.createOscillator();
          const gain2 = c.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(100, c.currentTime);
          gain2.gain.setValueAtTime(0.15, c.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
          osc2.connect(gain2).connect(c.destination);
          osc2.start(c.currentTime);
          osc2.stop(c.currentTime + 0.08);
        } catch {}
      }, 60);
    } catch {}
  },

  check: () => {
    try {
      const c = ctx();
      // Sharp alert tone
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, c.currentTime);
      osc.frequency.setValueAtTime(600, c.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
      osc.connect(gain).connect(c.destination);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 0.25);
    } catch {}
  },

  checkmate: () => {
    try {
      const c = ctx();
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        setTimeout(() => {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, c.currentTime);
          gain.gain.setValueAtTime(0.15, c.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
          osc.connect(gain).connect(c.destination);
          osc.start(c.currentTime);
          osc.stop(c.currentTime + 0.3);
        }, i * 150);
      });
    } catch {}
  },

  castling: () => {
    try {
      const c = ctx();
      // Two thuds in quick succession
      chessSfx.move();
      setTimeout(() => chessSfx.move(), 120);
    } catch {}
  },

  select: () => {
    try {
      const c = ctx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, c.currentTime);
      gain.gain.setValueAtTime(0.08, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
      osc.connect(gain).connect(c.destination);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 0.06);
    } catch {}
  },

  illegal: () => {
    try {
      const c = ctx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(200, c.currentTime);
      gain.gain.setValueAtTime(0.08, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
      osc.connect(gain).connect(c.destination);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 0.15);
    } catch {}
  },
};
