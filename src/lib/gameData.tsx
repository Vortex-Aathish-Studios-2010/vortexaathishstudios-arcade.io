import React from "react";

import memoryIcon from "@/assets/icons/memory.png";
import slidingIcon from "@/assets/icons/sliding.png";
import tetrisIcon from "@/assets/icons/tetris.png";
import sudokuIcon from "@/assets/icons/sudoku.png";
import konoodleIcon from "@/assets/icons/konoodle.png";
import wordsearchIcon from "@/assets/icons/wordsearch.png";
import snakeIcon from "@/assets/icons/snake.png";
import tictactoeIcon from "@/assets/icons/tictactoe.png";

export interface GameInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: "primary" | "secondary" | "accent";
  available: boolean;
  difficulty: "Easy" | "Medium" | "Hard";
  tutorial: string[];
}

const GameIcon = ({ src, alt }: { src: string; alt: string }) => (
  <img src={src} alt={alt} className="w-full h-full object-contain drop-shadow-lg" draggable={false} />
);

export const games: GameInfo[] = [
  {
    id: "memory",
    name: "Memory Match",
    description: "Flip cards and find matching pairs",
    icon: <GameIcon src={memoryIcon} alt="Memory Match" />,
    color: "primary",
    available: true,
    difficulty: "Easy",
    tutorial: [
      "Tap a card to flip it over and reveal the emoji underneath.",
      "Tap a second card to try to find a matching pair.",
      "If both cards match, they stay face up. If not, they flip back.",
      "Try to match all pairs in as few moves as possible!",
      "Fewer moves = more points earned.",
    ],
  },
  {
    id: "sliding",
    name: "Sliding Puzzle",
    description: "Arrange numbered tiles in order",
    icon: <GameIcon src={slidingIcon} alt="Sliding Puzzle" />,
    color: "accent",
    available: true,
    difficulty: "Hard",
    tutorial: [
      "Click or drag a tile adjacent to the empty space to slide it.",
      "You can also click and drag tiles with your mouse.",
      "Arrange all numbers from 1-15 in order, left to right, top to bottom.",
      "The empty space should end up in the bottom-right corner.",
      "Fewer moves = more points!",
    ],
  },
  {
    id: "tetris",
    name: "Block Stack",
    description: "Stack falling blocks to clear lines",
    icon: <GameIcon src={tetrisIcon} alt="Block Stack" />,
    color: "primary",
    available: true,
    difficulty: "Medium",
    tutorial: [
      "Blocks fall from the top of the board.",
      "Use ← → arrow keys or tap left/right to move blocks.",
      "Press ↑ or tap the rotate button to rotate a block.",
      "Press ↓ to speed up the fall, or Space/tap drop to hard drop.",
      "Complete a full horizontal line to clear it and score points!",
    ],
  },
  {
    id: "sudoku",
    name: "Sudoku",
    description: "Fill the grid with numbers 1-9",
    icon: <GameIcon src={sudokuIcon} alt="Sudoku" />,
    color: "secondary",
    available: true,
    difficulty: "Hard",
    tutorial: [
      "Fill every empty cell with a number from 1 to 9.",
      "Each row must contain all numbers 1-9 without repeats.",
      "Each column must contain all numbers 1-9 without repeats.",
      "Each 3×3 box must contain all numbers 1-9 without repeats.",
      "Tap a cell, then tap a number to place it. Complete the puzzle to win!",
    ],
  },
  {
    id: "konoodle",
    name: "Konoodle",
    description: "Fit puzzle pieces into the board",
    icon: <GameIcon src={konoodleIcon} alt="Konoodle" />,
    color: "accent",
    available: true,
    difficulty: "Hard",
    tutorial: [
      "Step 1: Place a piece on the board, then hit SHUFFLE to randomly reposition it.",
      "Step 2: Fill the remaining spaces with the other pieces.",
      "Drag pieces from the tray onto the board, or click to select and place.",
      "Use the ROTATE button to change a piece's orientation before placing.",
      "Stuck? Hit SHOW SOLUTION to watch the puzzle solve itself!",
    ],
  },
  {
    id: "wordsearch",
    name: "Word Search",
    description: "Find hidden words in the grid",
    icon: <GameIcon src={wordsearchIcon} alt="Word Search" />,
    color: "primary",
    available: true,
    difficulty: "Easy",
    tutorial: [
      "Words are hidden in the letter grid horizontally, vertically, and diagonally.",
      "Click and drag across letters to highlight a word.",
      "Check the word list to see which words you still need to find.",
      "Found words will be crossed off the list.",
      "Find all words to complete the puzzle!",
    ],
  },
  {
    id: "snake",
    name: "Snake",
    description: "Grow the snake by eating food",
    icon: <GameIcon src={snakeIcon} alt="Snake" />,
    color: "secondary",
    available: true,
    difficulty: "Medium",
    tutorial: [
      "Use arrow keys or swipe to control the snake's direction.",
      "Eat the food (red dot) to grow longer and score points.",
      "Don't crash into the walls or your own tail!",
      "The snake gets faster as it grows longer.",
      "Survive as long as possible for the highest score!",
    ],
  },
  {
    id: "tictactoe",
    name: "Tic Tac Toe",
    description: "Get three in a row to win",
    icon: <GameIcon src={tictactoeIcon} alt="Tic Tac Toe" />,
    color: "secondary",
    available: true,
    difficulty: "Easy",
    tutorial: [
      "Choose to play against a bot or a friend online.",
      "Take turns placing your mark (X or O) on the 3×3 grid.",
      "Get three of your marks in a row — horizontally, vertically, or diagonally — to win!",
      "If all 9 squares are filled with no winner, it's a draw.",
      "Against a bot, choose Easy, Medium, or Hard difficulty.",
    ],
  },
];
