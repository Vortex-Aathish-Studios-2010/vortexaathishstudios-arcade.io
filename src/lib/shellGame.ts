export const shellSettings = (level: number) => ({
  duration: 280 + 720 / (1 + (Math.max(1, level) - 1) * 0.18),
  swaps: 3 + Math.min(7, Math.floor((Math.max(1, level) - 1) / 3)),
});
export const nextShellLevel = (level: number, won: boolean) => Math.max(1, level + (won ? 1 : -1));
