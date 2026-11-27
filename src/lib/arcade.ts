import { Capacitor } from "@capacitor/core";
import { getPoints, getEntertainmentPoints, getPlayerName, getPlayerAvatar } from "./streaks";

const base = (
  import.meta.env.VITE_ARCADE_API_URL ||
  ((Capacitor.isNativePlatform() || location.hostname.endsWith(".github.io"))
    ? "https://vortex-arcade-minigames.ajuponnu2009.chatgpt.site"
    : "")
).replace(/\/$/, "");
const tokenKey = "vortex.arcade.identity";
export type Room = {
  code: string;
  game: string;
  mode?: "board"|"chess"|"challenge";
  starts?:number; ends?:number; serverNow?:number;
  hostScore?:number;guestScore?:number;hostDone?:boolean;guestDone?:boolean;hostReady?:boolean;guestReady?:boolean;
  host: string;
  guest: string | null;
  board: string;
  result: string;
  me: string;
  hostAvatar?: string;
  guestAvatar?: string;
};
export type Rank = { name: string; score: number; avatar?: string };
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
export type SyncState = "name" | "offline" | "pending" | "syncing" | "saved" | "error";
let syncState: SyncState = "pending";
export const getSyncState = (): SyncState => !getPlayerName() ? "name" : !navigator.onLine ? "offline" : syncState;
function reportSync(state: SyncState) { syncState = state; window.dispatchEvent(new Event("arcade-sync")); }
export async function syncProfile() {
  if (!getPlayerName()) { reportSync("name"); return; }
  if (!navigator.onLine) { reportSync("offline"); throw new ArcadeError("Your points are saved on this device. Reconnect to sync.", 0); }
  reportSync("syncing");
  const score = playerPoints();
  try {
    await api("profile", { name: getPlayerName(), score, avatar: getPlayerAvatar() });
    localStorage.setItem("arcade.synced-points", String(score));
    reportSync("saved");
  } catch (error) { reportSync("error"); throw error; }
}
export function watchScores() {
  let timer: number;
  let disposed = false, busy = false, dirty = false;
  async function send() {
    window.clearTimeout(timer);
    if (busy) { dirty = true; return; }
    busy = true; dirty = false;
    try { await syncProfile(); }
    catch { if (!disposed) timer = window.setTimeout(send, 5000); }
    finally { busy = false; if (!disposed && dirty) timer = window.setTimeout(send, 350); }
  }
  const changed = () => { reportSync("pending"); window.clearTimeout(timer); timer = window.setTimeout(send, 350); };
  const visible = () => { if (!document.hidden) void send(); };
  void send();
  window.addEventListener("arcade-score", changed);
  window.addEventListener("online", send);
  window.addEventListener("storage", changed);
  document.addEventListener("visibilitychange", visible);
  return () => { disposed = true; window.clearTimeout(timer); window.removeEventListener("arcade-score", changed); window.removeEventListener("online", send); window.removeEventListener("storage", changed); document.removeEventListener("visibilitychange", visible); };
}
