import { Capacitor } from "@capacitor/core";
import { getPoints, getEntertainmentPoints, getPlayerName } from "./streaks";

const base = (
  import.meta.env.VITE_ARCADE_API_URL ||
  (Capacitor.isNativePlatform()
    ? "https://vortex-arcade-minigames.ajuponnu2009.chatgpt.site"
    : "")
).replace(/\/$/, "");
const tokenKey = "vortex.arcade.identity";
export type Room = {
  code: string;
  game: "trio" | "four";
  host: string;
  guest: string | null;
  board: string;
  result: string;
  me: string;
};
export type Rank = { name: string; score: number };
export class ArcadeError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
function identity() {
  let token = localStorage.getItem(tokenKey);
  if (!token) {
    token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (x) =>
      x.toString(16).padStart(2, "0"),
    ).join("");
    localStorage.setItem(tokenKey, token);
  }
  return token;
}

export async function api<T>(path: string, body?: object): Promise<T> {
  if (!navigator.onLine)
    throw new ArcadeError("Connect to the internet to play with friends.", 0);
  const response = await fetch(base + "/api/arcade/" + path, {
    method: body ? "POST" : "GET",
    headers: {
      authorization: "Bearer " + identity(),
      ...(body && { "content-type": "application/json" }),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data)
    throw new ArcadeError(
      data?.error || "Cannot reach the arcade server.",
      response.status,
    );
  return data as T;
}

export const playerPoints = () => getPoints() + getEntertainmentPoints();
export const syncProfile = () =>
  api("profile", { name: getPlayerName(), score: playerPoints() });

export function watchScores() {
  let timer: number;
  let disposed = false;
  const send = () => {
    window.clearTimeout(timer);
    if (navigator.onLine && getPlayerName()) {
      syncProfile().catch(() => {
        if (!disposed) timer = window.setTimeout(send, 30000);
      });
    }
  };
  const changed = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(send, 350);
  };
  send();
  window.addEventListener("arcade-score", changed);
  window.addEventListener("online", send);
  return () => {
    disposed = true;
    window.clearTimeout(timer);
    window.removeEventListener("arcade-score", changed);
    window.removeEventListener("online", send);
  };
}
