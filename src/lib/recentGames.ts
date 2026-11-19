import { useEffect } from "react";

const recentKey = "arcade.recentGames";

export function getRecentGames(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(recentKey) || "[]");
    return Array.isArray(saved)
      ? saved.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function useRecentGame(id?: string) {
  useEffect(() => {
    if (!id) return;
    const recent = [
      id,
      ...getRecentGames().filter((other) => other !== id),
    ].slice(0, 3);
    try {
      localStorage.setItem(recentKey, JSON.stringify(recent));
    } catch {
      /* Play without history if storage is unavailable. */
    }
  }, [id]);
}
