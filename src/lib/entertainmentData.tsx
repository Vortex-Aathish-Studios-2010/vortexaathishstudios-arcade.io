import React from "react";

import chessIcon from "@/assets/icons/chess.png";
import archeryIcon from "@/assets/icons/archery.png";
import tennisIcon from "@/assets/icons/tennis.png";
import cricketIcon from "@/assets/icons/cricket.png";
import penaltyIcon from "@/assets/icons/penalty.png";
import obstacleIcon from "@/assets/icons/obstacle.png";
import hideseekIcon from "@/assets/icons/hideseek.png";
import basketballIcon from "@/assets/icons/basketball.png";
import boxingIcon from "@/assets/icons/boxing.png";
import racingIcon from "@/assets/icons/racing.png";

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
  <img src={src} alt={alt} className="w-10 h-10 object-contain" draggable={false} />
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
    tutorial: ["Choose to play against a bot or a friend locally.", "Click a piece to select it, then click a highlighted square to move.", "Capture enemy pieces by moving to their square.", "Put the opponent's king in checkmate to win!"],
  },
  {
    id: "archery",
    name: "Archery",
    description: "Aim for the bullseye",
    icon: <GameIcon src={archeryIcon} alt="Archery" />,
    color: "sport-accent",
    available: true,
    difficulty: "Medium",
    tutorial: ["A moving crosshair bounces across the target.", "Tap or click SHOOT when the crosshair is closest to the bullseye.", "Score points based on how close you hit to the center.", "You get 5 arrows per round — aim carefully!"],
  },
  {
    id: "penalty",
    name: "Penalty Kick",
    description: "Score past the goalkeeper",
    icon: <GameIcon src={penaltyIcon} alt="Penalty Kick" />,
    color: "sport-accent",
    available: true,
    difficulty: "Easy",
    tutorial: ["Click or tap a zone on the goal to aim your kick.", "The goalkeeper will dive to try to save it.", "Score as many goals as you can in 5 attempts!", "Aim for the corners for the best chance of scoring."],
  },
  {
    id: "basketball",
    name: "Basketball",
    description: "Shoot hoops and score points",
    icon: <GameIcon src={basketballIcon} alt="Basketball" />,
    color: "sport-primary",
    available: true,
    difficulty: "Medium",
    tutorial: ["Drag to set the angle and power of your shot.", "Release to throw the ball towards the hoop.", "Score as many baskets as you can in 30 seconds!", "The hoop moves — time your shots carefully."],
  },
  {
    id: "boxing",
    name: "Boxing",
    description: "Punch and dodge to victory",
    icon: <GameIcon src={boxingIcon} alt="Boxing" />,
    color: "sport-secondary",
    available: true,
    difficulty: "Medium",
    tutorial: ["Tap the punch buttons to attack your opponent.", "Watch for incoming punches and tap DODGE to avoid them.", "Land combos for bonus damage!", "Reduce the opponent's HP to zero to win."],
  },
  {
    id: "racing",
    name: "Racing",
    description: "Dodge obstacles and race to the finish",
    icon: <GameIcon src={racingIcon} alt="Racing" />,
    color: "sport-primary",
    available: true,
    difficulty: "Easy",
    tutorial: ["Use left/right controls or arrow keys to steer your car.", "Dodge oncoming obstacles and other cars.", "Collect coins for bonus points.", "Survive as long as possible — speed increases over time!"],
  },
  {
    id: "tennis",
    name: "Tennis",
    description: "Rally and smash to win",
    icon: <GameIcon src={tennisIcon} alt="Tennis" />,
    color: "sport-primary",
    available: true,
    difficulty: "Medium",
    tutorial: ["Move your paddle to hit the ball back.", "Try to outplay your opponent with angled shots.", "First to 5 points wins the match!", "The ball speeds up as rallies get longer."],
  },
  {
    id: "cricket",
    name: "Cricket",
    description: "Hit sixes and take wickets",
    icon: <GameIcon src={cricketIcon} alt="Cricket" />,
    color: "sport-secondary",
    available: true,
    difficulty: "Hard",
    tutorial: ["Coming soon!"],
  },
  {
    id: "obstacle",
    name: "Obstacle Race",
    description: "Jump, duck and dash to the finish",
    icon: <GameIcon src={obstacleIcon} alt="Obstacle Race" />,
    color: "sport-primary",
    available: true,
    difficulty: "Medium",
    tutorial: ["Coming soon!"],
  },
  {
    id: "hideseek",
    name: "Hide & Seek",
    description: "Find or hide before time runs out",
    icon: <GameIcon src={hideseekIcon} alt="Hide & Seek" />,
    color: "sport-secondary",
    available: true,
    difficulty: "Easy",
    tutorial: ["Coming soon!"],
  },
];
