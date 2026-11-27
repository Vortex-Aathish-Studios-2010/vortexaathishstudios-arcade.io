export const RUNNER_SIZE = 28;
export function gravityDifficulty(score: number) {
  const tier = Math.floor(Math.max(0, score) / 100);
  const speed = 300 + 400 * (1 - Math.exp(-Math.max(0, score) / 420));
  const gap = Math.max(RUNNER_SIZE + 30, 248 - Math.max(0, score) * 0.24);
  const reaction = Math.max(0.18, 1.0 - Math.max(0, score) * 0.0012);
  // A complete floor-to-ceiling trip remains possible between opposite gates.
  const spacing = 54 + speed * (0.74 + reaction);
  return { tier, speed, gap, spacing };
}
