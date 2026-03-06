const STREAK_KEY = "brainpuzzle_streak";
const POINTS_KEY = "brainpuzzle_points";
const LAST_PLAY_KEY = "brainpuzzle_last_play";

export const getStreak = (): number => {
  return parseInt(localStorage.getItem(STREAK_KEY) || "0", 10);
};

export const getPoints = (): number => {
  return parseInt(localStorage.getItem(POINTS_KEY) || "0", 10);
};

export const addPoints = (pts: number) => {
  const current = getPoints();
  localStorage.setItem(POINTS_KEY, String(current + pts));
};

export const updateStreak = () => {
  const lastPlay = localStorage.getItem(LAST_PLAY_KEY);
  const today = new Date().toDateString();
  
  if (lastPlay === today) return;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (lastPlay === yesterday.toDateString()) {
    const streak = getStreak() + 1;
    localStorage.setItem(STREAK_KEY, String(streak));
  } else if (lastPlay !== today) {
    localStorage.setItem(STREAK_KEY, "1");
  }
  
  localStorage.setItem(LAST_PLAY_KEY, today);
};
