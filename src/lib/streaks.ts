const POINTS_KEY = "brainpuzzle_points";

const streakKey = (gameId: string) => `brainpuzzle_streak_${gameId}`;
const lastPlayKey = (gameId: string) => `brainpuzzle_last_play_${gameId}`;
const winsKey = (gameId: string) => `brainpuzzle_wins_${gameId}`;
const lossesKey = (gameId: string) => `brainpuzzle_losses_${gameId}`;
const tutorialKey = (gameId: string) => `brainpuzzle_tutorial_shown_${gameId}`;
const levelKey = (gameId: string) => `brainpuzzle_level_${gameId}`;

export const getStreak = (gameId?: string): number => {
  if (!gameId) {
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
  const gameIds = ["memory", "sliding", "tetris", "sudoku", "konoodle", "wordsearch", "snake", "tictactoe"];
  const streaks: Record<string, number> = {};
  for (const id of gameIds) {
    streaks[id] = getStreak(id);
  }
  return streaks;
};

// Win/Loss tracking
export const getWins = (gameId: string): number =>
  parseInt(localStorage.getItem(winsKey(gameId)) || "0", 10);

export const getLosses = (gameId: string): number =>
  parseInt(localStorage.getItem(lossesKey(gameId)) || "0", 10);

export const addWin = (gameId: string) => {
  localStorage.setItem(winsKey(gameId), String(getWins(gameId) + 1));
};

export const addLoss = (gameId: string) => {
  localStorage.setItem(lossesKey(gameId), String(getLosses(gameId) + 1));
};

export const getTotalWins = (): number => {
  const gameIds = ["memory", "sliding", "tetris", "sudoku", "konoodle", "wordsearch", "snake"];
  return gameIds.reduce((sum, id) => sum + getWins(id), 0);
};

export const getTotalLosses = (): number => {
  const gameIds = ["memory", "sliding", "tetris", "sudoku", "konoodle", "wordsearch", "snake"];
  return gameIds.reduce((sum, id) => sum + getLosses(id), 0);
};

// Tutorial tracking
export const isTutorialShown = (gameId: string): boolean =>
  localStorage.getItem(tutorialKey(gameId)) === "true";

export const markTutorialShown = (gameId: string) =>
  localStorage.setItem(tutorialKey(gameId), "true");

// Level tracking
export const getGameLevel = (gameId: string): number =>
  parseInt(localStorage.getItem(levelKey(gameId)) || "1", 10);

export const setGameLevel = (gameId: string, level: number) =>
  localStorage.setItem(levelKey(gameId), String(level));

export const incrementLevel = (gameId: string): number => {
  const next = getGameLevel(gameId) + 1;
  setGameLevel(gameId, next);
  return next;
};

// Player ID for multiplayer
const PLAYER_ID_KEY = "brainpuzzle_player_id";
const PLAYER_NAME_KEY = "brainpuzzle_player_name";

export const getPlayerId = (): string | null => localStorage.getItem(PLAYER_ID_KEY);
export const setPlayerId = (id: string) => localStorage.setItem(PLAYER_ID_KEY, id);
export const getPlayerName = (): string => localStorage.getItem(PLAYER_NAME_KEY) || "";
export const setPlayerName = (name: string) => localStorage.setItem(PLAYER_NAME_KEY, name);
