export interface GameInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: "primary" | "secondary" | "accent";
  available: boolean;
  difficulty: "Easy" | "Medium" | "Hard";
}

export const games: GameInfo[] = [
  { id: "memory", name: "Memory Match", description: "Flip cards and find matching pairs", icon: "🧠", color: "primary", available: true, difficulty: "Easy" },
  { id: "2048", name: "2048", description: "Slide and merge tiles to reach 2048", icon: "🔢", color: "secondary", available: true, difficulty: "Medium" },
  { id: "sliding", name: "Sliding Puzzle", description: "Arrange numbered tiles in order", icon: "🧩", color: "accent", available: true, difficulty: "Hard" },
  { id: "tetris", name: "Block Stack", description: "Stack falling blocks to clear lines", icon: "🟦", color: "primary", available: false, difficulty: "Medium" },
  { id: "sudoku", name: "Sudoku", description: "Fill the grid with numbers 1-9", icon: "📐", color: "secondary", available: false, difficulty: "Hard" },
  { id: "konoodle", name: "Konoodle", description: "Fit puzzle pieces into the board", icon: "🔮", color: "accent", available: false, difficulty: "Hard" },
  { id: "wordsearch", name: "Word Search", description: "Find hidden words in the grid", icon: "🔤", color: "primary", available: false, difficulty: "Easy" },
  { id: "snake", name: "Snake", description: "Grow the snake by eating food", icon: "🐍", color: "secondary", available: false, difficulty: "Medium" },
];
