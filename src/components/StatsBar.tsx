import { Star } from "lucide-react";
import { getPoints } from "@/lib/streaks";
import { useEffect, useState } from "react";

export const StatsBar = () => {
  const [points, setPoints] = useState(0);

  useEffect(() => {
    setPoints(getPoints());
    const interval = setInterval(() => setPoints(getPoints()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2">
      <Star className="h-5 w-5 text-primary" />
      <div>
        <p className="text-xs text-muted-foreground">Points</p>
        <p className="font-display font-bold text-foreground">{points}</p>
      </div>
    </div>
  );
};
