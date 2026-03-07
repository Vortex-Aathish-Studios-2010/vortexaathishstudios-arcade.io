const POINTS_KEY = "brainpuzzle_points";

const streakKey = (gameId: string) => `brainpuzzle_streak_${gameId}`;
const lastPlayKey = (gameId: string) => `brainpuzzle_last_play_${gameId}`;

export const getStreak = (gameId?: string): number => {
  if (!gameId) {
    // Sum all game streaks for total display
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith("brainpuzzle_streak_"));
    return allKeys.reduce((sum, k) => sum + parseInt(localStorage.getItem(k) || "0", 10), 0);
  }
  return parseInt(localStorage.getItem(streakKey(gameId)) || "0", 10);
};

export const getPoints = (): number => {
  return parseInt(localStorage.getItem(POINTS_KEY) || "0", 10);
};

export const addPoints = (pts: number) => {
  const current = getPoints();
  localStorage.setItem(POINTS_KEY, String(current + pts));
};

export const updateStreak = (gameId: string) => {
  const key = streakKey(gameId);
  const lpKey = lastPlayKey(gameId);
  const lastPlay = localStorage.getItem(lpKey);
  const today = new Date().toDateString();

  if (lastPlay === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (lastPlay === yesterday.toDateString()) {
    const streak = parseInt(localStorage.getItem(key) || "0", 10) + 1;
    localStorage.setItem(key, String(streak));
  } else {
    localStorage.setItem(key, "1");
  }

  localStorage.setItem(lpKey, today);
};

export const getAllGameStreaks = (): Record<string, number> => {
  const gameIds = ["memory", "sliding", "tetris", "sudoku", "konoodle", "wordsearch", "snake"];
  const streaks: Record<string, number> = {};
  for (const id of gameIds) {
    streaks[id] = getStreak(id);
  }
  return streaks;
};
