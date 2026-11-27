import { createContext, useContext, useEffect } from "react";
export type MatchSession = {
  progress: (score: number) => void;
  random: () => number;
};
export const MatchContext = createContext<MatchSession | null>(null);
export function seededRandom(seed: string) {
  let n = 2166136261;
  for (const c of seed) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return () => {
    n += 0x6d2b79f5;
    let t = n;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function useGameRandom() {
  return useContext(MatchContext)?.random || Math.random;
}
export function useMatchProgress(score: number) {
  const session = useContext(MatchContext);
  useEffect(() => {
    session?.progress(Math.max(0, Math.floor(score)));
  }, [session, score]);
  return Boolean(session);
}
