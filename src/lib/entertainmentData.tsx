import React from "react";
import { Crown, Target, CircleDot, Medal, Goal, Zap, Eye } from "lucide-react";

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

export const entertainmentGames: EntertainmentGameInfo[] = [
  {
    id: "chess",
    name: "Chess",
    description: "The classic strategy board game",
    icon: <Crown size={40} color="hsl(var(--sport-primary))" fill="hsl(var(--sport-primary))" fillOpacity={0.6} strokeWidth={1.5} />,
    color: "sport-primary",
    available: true,
    difficulty: "Hard",
    tutorial: ["Choose to play against a hard bot or a friend locally.", "Click a piece to select it, then click a highlighted square to move.", "Capture enemy pieces by moving to their square.", "Put the opponent's king in checkmate to win!"],
  },
  {
    id: "archery",
    name: "Archery",
    description: "Aim for the bullseye",
    icon: <Target size={40} color="hsl(var(--sport-accent))" fill="hsl(var(--sport-accent))" fillOpacity={0.4} strokeWidth={1.5} />,
    color: "sport-accent",
    available: true,
    difficulty: "Medium",
    tutorial: ["Coming soon!"],
  },
  {
    id: "tennis",
    name: "Tennis",
    description: "Rally and smash to win",
    icon: <CircleDot size={40} color="hsl(var(--sport-primary))" fill="hsl(var(--sport-primary))" fillOpacity={0.4} strokeWidth={1.5} />,
    color: "sport-primary",
    available: true,
    difficulty: "Medium",
    tutorial: ["Coming soon!"],
  },
  {
    id: "cricket",
    name: "Cricket",
    description: "Hit sixes and take wickets",
    icon: <Medal size={40} color="hsl(var(--sport-secondary))" fill="hsl(var(--sport-secondary))" fillOpacity={0.4} strokeWidth={1.5} />,
    color: "sport-secondary",
    available: true,
    difficulty: "Hard",
    tutorial: ["Coming soon!"],
  },
  {
    id: "penalty",
    name: "Penalty Kick",
    description: "Score past the goalkeeper",
    icon: <Goal size={40} color="hsl(var(--sport-accent))" fill="hsl(var(--sport-accent))" fillOpacity={0.2} strokeWidth={1.5} />,
    color: "sport-accent",
    available: true,
    difficulty: "Easy",
    tutorial: ["Coming soon!"],
  },
  {
    id: "obstacle",
    name: "Obstacle Race",
    description: "Jump, duck and dash to the finish",
    icon: <Zap size={40} color="hsl(var(--sport-primary))" fill="hsl(var(--sport-primary))" fillOpacity={0.5} strokeWidth={1.5} />,
    color: "sport-primary",
    available: true,
    difficulty: "Medium",
    tutorial: ["Coming soon!"],
  },
  {
    id: "hideseek",
    name: "Hide & Seek",
    description: "Find or hide before time runs out",
    icon: <Eye size={40} color="hsl(var(--sport-secondary))" fill="hsl(var(--sport-secondary))" fillOpacity={0.3} strokeWidth={1.5} />,
    color: "sport-secondary",
    available: true,
    difficulty: "Easy",
    tutorial: ["Coming soon!"],
  },
];
