export interface EntertainmentGameInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
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
    icon: "♟️",
    color: "sport-primary",
    available: false,
    difficulty: "Hard",
    tutorial: ["Coming soon!"],
  },
  {
    id: "carroms",
    name: "Carroms",
    description: "Flick and pocket the coins",
    icon: "🎯",
    color: "sport-secondary",
    available: false,
    difficulty: "Medium",
    tutorial: ["Coming soon!"],
  },
  {
    id: "archery",
    name: "Archery",
    description: "Aim for the bullseye",
    icon: "🏹",
    color: "sport-accent",
    available: false,
    difficulty: "Medium",
    tutorial: ["Coming soon!"],
  },
  {
    id: "tennis",
    name: "Tennis",
    description: "Rally and smash to win",
    icon: "🎾",
    color: "sport-primary",
    available: false,
    difficulty: "Medium",
    tutorial: ["Coming soon!"],
  },
  {
    id: "cricket",
    name: "Cricket",
    description: "Hit sixes and take wickets",
    icon: "🏏",
    color: "sport-secondary",
    available: false,
    difficulty: "Hard",
    tutorial: ["Coming soon!"],
  },
  {
    id: "penalty",
    name: "Penalty Kick",
    description: "Score past the goalkeeper",
    icon: "⚽",
    color: "sport-accent",
    available: false,
    difficulty: "Easy",
    tutorial: ["Coming soon!"],
  },
  {
    id: "obstacle",
    name: "Obstacle Race",
    description: "Jump, duck and dash to the finish",
    icon: "🏃",
    color: "sport-primary",
    available: false,
    difficulty: "Medium",
    tutorial: ["Coming soon!"],
  },
  {
    id: "hideseek",
    name: "Hide & Seek",
    description: "Find or hide before time runs out",
    icon: "👀",
    color: "sport-secondary",
    available: false,
    difficulty: "Easy",
    tutorial: ["Coming soon!"],
  },
];
