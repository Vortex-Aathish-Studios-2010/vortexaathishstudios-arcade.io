const POINTS_KEY = "brainpuzzle_points";
const ENT_POINTS_KEY = "entertainment_points";

const streakKey = (gameId: string) => `brainpuzzle_streak_${gameId}`;
const lastPlayKey = (gameId: string) => `brainpuzzle_last_play_${gameId}`;
const winsKey = (gameId: string) => `brainpuzzle_wins_${gameId}`;
const lossesKey = (gameId: string) => `brainpuzzle_losses_${gameId}`;
const tutorialKey = (gameId: string) => `brainpuzzle_tutorial_shown_${gameId}`;
const levelKey = (gameId: string) => `brainpuzzle_level_${gameId}`;

function currentStreak(key: string, dateKey: string, now = new Date()) {
  const last = localStorage.getItem(dateKey);
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  return last === now.toDateString() || last === yesterday.toDateString()
    ? Math.max(0, Number(localStorage.getItem(key)) || 0) : 0;
}
export const getDailyStreak = () => currentStreak("arcade.daily.streak", "arcade.daily.last");
export const getStreak = (gameId?: string): number => gameId
  ? currentStreak(streakKey(gameId), lastPlayKey(gameId)) : getDailyStreak();
function recordDay(key: string, dateKey: string) {
  const today = new Date().toDateString();
  if (localStorage.getItem(dateKey) === today) return;
  localStorage.setItem(key, String(currentStreak(key, dateKey) + 1));
  localStorage.setItem(dateKey, today);
}

export const getPoints = (): number => {
  return parseInt(localStorage.getItem(POINTS_KEY) || "0", 10);
};

export const addPoints = (pts: number) => {
  const current = getPoints();
  localStorage.setItem(POINTS_KEY, String(current + pts));
  window.dispatchEvent(new Event("arcade-score"));
};

// Entertainment Arcade points
export const getEntertainmentPoints = (): number => {
  return parseInt(localStorage.getItem(ENT_POINTS_KEY) || "0", 10);
};

export const addEntertainmentPoints = (pts: number) => {
  const current = getEntertainmentPoints();
  localStorage.setItem(ENT_POINTS_KEY, String(current + pts));
  window.dispatchEvent(new Event("arcade-score"));
};

export const updateStreak = (gameId: string) => {
  recordDay(streakKey(gameId), lastPlayKey(gameId));
  recordDay("arcade.daily.streak", "arcade.daily.last");
  window.dispatchEvent(new Event("arcade-profile"));
};

export const getAllGameStreaks = (): Record<string, number> => {
  const gameIds = ["memory", "sliding", "tetris", "sudoku", "konoodle", "wordsearch", "snake", "tictactoe", "chess", "tap-rush", "color-switch", "stack-tower", "one-shot", "avoid-walls", "three-cups", "gravity-flip"];
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
  updateStreak(gameId);
  localStorage.setItem(winsKey(gameId), String(getWins(gameId) + 1));
  window.dispatchEvent(new Event("arcade-score"));
};

export const addLoss = (gameId: string) => {
  updateStreak(gameId);
  localStorage.setItem(lossesKey(gameId), String(getLosses(gameId) + 1));
  window.dispatchEvent(new Event("arcade-score"));
};

export const getTotalWins = (): number => {
  const gameIds = ["memory", "sliding", "tetris", "sudoku", "konoodle", "wordsearch", "snake", "tictactoe", "chess", "tap-rush", "color-switch", "stack-tower", "one-shot", "avoid-walls", "three-cups", "gravity-flip"];
  return gameIds.reduce((sum, id) => sum + getWins(id), 0);
};

export const getTotalLosses = (): number => {
  const gameIds = ["memory", "sliding", "tetris", "sudoku", "konoodle", "wordsearch", "snake", "tictactoe", "chess", "tap-rush", "color-switch", "stack-tower", "one-shot", "avoid-walls", "three-cups", "gravity-flip"];
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
export const setPlayerName = (name: string) => {
  localStorage.setItem(PLAYER_NAME_KEY, name);
  window.dispatchEvent(new Event("arcade-profile"));
  window.dispatchEvent(new Event("arcade-score"));
};

export const getPlayerAvatar = () => localStorage.getItem("arcade.avatar") || "orbit";
export const setPlayerAvatar = (avatar: string) => {
  localStorage.setItem("arcade.avatar", avatar);
  window.dispatchEvent(new Event("arcade-score"));
  window.dispatchEvent(new Event("arcade-profile"));
};
