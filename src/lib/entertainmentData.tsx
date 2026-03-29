import React from "react";
import chessIcon from "@/assets/icons/chess.png";
import boxingIcon from "@/assets/icons/boxing.png";
import memoryIcon from "@/assets/icons/memory.png";
import tetrisIcon from "@/assets/icons/tetris.png";
import archeryIcon from "@/assets/icons/archery.png";
import racingIcon from "@/assets/icons/racing.png";
import hideseekIcon from "@/assets/icons/hideseek.png";

export interface EntertainmentGameInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: "sport-primary" | "sport-secondary" | "sport-accent";
  available: boolean;
  difficulty: "Easy" | "Medium" | "Hard";
  tutorial: string[];
}

const GameIcon = ({ src, alt }: { src: string; alt: string }) => (
  <img src={src} alt={alt} className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-110" draggable={false} />
);

export const entertainmentGames: EntertainmentGameInfo[] = [
  {
    id: "chess",
    name: "Chess",
    description: "The classic strategy board game",
    icon: <GameIcon src={chessIcon} alt="Chess" />,
    color: "sport-primary",
    available: true,
    difficulty: "Hard",
    tutorial: ["Choose to play against a bot or a friend locally.", "Pick your color — white or black.", "Click a piece to select it, then click a highlighted square to move.", "Put the opponent's king in checkmate to win!"],
  },
  {
    id: "tap-rush",
    name: "Tap Rush",
    description: "Tap as fast as possible in 10s",
    icon: <GameIcon src={boxingIcon} alt="Tap Rush" />,
    color: "sport-accent",
    available: true,
    difficulty: "Easy",
    tutorial: ["Tap the big button as fast as you can.", "You have 10 seconds to score.", "Beat your best score!"],
  },
  {
    id: "color-switch",
    name: "Color Switch Tap",
    description: "Tap when the color matches the rule",
    icon: <GameIcon src={memoryIcon} alt="Color Switch" />,
    color: "sport-secondary",
    available: true,
    difficulty: "Medium",
    tutorial: ["Watch the rule at the top.", "Tap if the central color matches the rule.", "Don't tap if it doesn't match!", "Speed increases over time."],
  },
  {
    id: "stack-tower",
    name: "Stack Tower",
    description: "Drop blocks to build a tower",
    icon: <GameIcon src={tetrisIcon} alt="Stack Tower" />,
    color: "sport-primary",
    available: true,
    difficulty: "Medium",
    tutorial: ["Tap to drop the moving block.", "Align it perfectly to keep the tower wide.", "Misaligned parts are cut off.", "Game ends when you miss completely."],
  },
  {
    id: "one-shot",
    name: "One Shot Aim",
    description: "Shoot the moving target",
    icon: <GameIcon src={archeryIcon} alt="One Shot Aim" />,
    color: "sport-accent",
    available: true,
    difficulty: "Medium",
    tutorial: ["Wait for the target to align.", "Tap to shoot the ball upwards.", "Hit the target to score and increase speed.", "Miss and the game is over."],
  },
  {
    id: "avoid-walls",
    name: "Avoid the Walls",
    description: "Dodge falling obstacles",
    icon: <GameIcon src={racingIcon} alt="Avoid the Walls" />,
    color: "sport-secondary",
    available: true,
    difficulty: "Medium",
    tutorial: ["Hold the left/right buttons to move.", "Navigate through the gaps in the falling walls.", "Survive as long as possible.", "Walls fall faster over time."],
  },
  {
    id: "three-cups",
    name: "Shell Game",
    description: "Follow the cup with the ball",
    icon: <GameIcon src={hideseekIcon} alt="Three Cups" />,
    color: "sport-primary",
    available: true,
    difficulty: "Hard",
    tutorial: ["Watch which cup hides the ball.", "Follow it as the cups shuffle around.", "Tap the correct cup to guess.", "Speed increases with every correct guess."],
  },
  {
    id: "gravity-flip",
    name: "Gravity Flip Runner",
    description: "Flip gravity to dodge obstacles and survive!",
    icon: <GameIcon src={racingIcon} alt="Gravity Flip Runner" />,
    color: "sport-primary",
    available: true,
    difficulty: "Medium",
    tutorial: ["Hit Space or Tap the screen to flip gravity.", "Stay on the floor or ceiling to dodge objects.", "Crashing ends your run instantly.", "Speed increases the further you go!"],
  }
];
