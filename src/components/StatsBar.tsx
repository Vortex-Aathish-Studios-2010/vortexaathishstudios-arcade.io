import { Flame, Star, Trophy } from "lucide-react";
import { getStreak, getPoints } from "@/lib/streaks";
import { useEffect, useState } from "react";

export const StatsBar = () => {
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    setStreak(getStreak());
    setPoints(getPoints());

    const interval = setInterval(() => {
      setStreak(getStreak());
      setPoints(getPoints());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-6 items-center">
      <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2">
        <Flame className="h-5 w-5 text-accent" />
        <div>
          <p className="text-xs text-muted-foreground">Streak</p>
          <p className="font-display font-bold text-foreground">{streak}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2">
        <Star className="h-5 w-5 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">Points</p>
          <p className="font-display font-bold text-foreground">{points}</p>
        </div>
      </div>
    </div>
  );
};
