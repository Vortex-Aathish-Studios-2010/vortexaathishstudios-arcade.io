import React from "react";
import { Layers, LayoutGrid, Box, Hash, Dna, Type, Activity, Crosshair } from "lucide-react";


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
    icon: <GameIcon src="/covers/memory.webp" alt="Memory Match" />,
    color: "primary",
    available: true,
    difficulty: "Easy",
    tutorial: [
      "Tap a card to flip it over and reveal the symbol underneath.",
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
    icon: <GameIcon src="/covers/sliding.webp" alt="Sliding Puzzle" />,
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
    icon: <GameIcon src="/covers/tetris.webp" alt="Block Stack" />,
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
    icon: <GameIcon src="/covers/sudoku.webp" alt="Sudoku" />,
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
    icon: <GameIcon src="/covers/konoodle.webp" alt="Konoodle" />,
    color: "accent",
    available: true,
    difficulty: "Hard",
    tutorial: [
      "The locked pieces are your starting clues. Fill every remaining space.",
      "Choose a piece, then tap the board, or drag it into position.",
      "A pale outline shows a valid fit. Red means the piece cannot fit there.",
      "Use Rotate (R) and Flip (F) to change the shape's orientation.",
      "Move placed pieces, return them to the tray, or use Undo to try again.",
    ],
  },
  {
    id: "wordsearch",
    name: "Word Search",
    description: "Find hidden words in the grid",
    icon: <GameIcon src="/covers/wordsearch.webp" alt="Word Search" />,
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
    icon: <GameIcon src="/covers/snake.webp" alt="Snake" />,
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
    icon: <GameIcon src="/covers/tictactoe.webp" alt="Tic Tac Toe" />,
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
