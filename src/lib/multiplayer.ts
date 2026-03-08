import { supabase } from "@/integrations/supabase/client";
import { getPlayerId, setPlayerId, getPlayerName, setPlayerName } from "./streaks";

const generateCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export const ensurePlayer = async (name: string): Promise<string> => {
  let id = getPlayerId();
  if (id) {
    // Check if still exists
    const { data } = await supabase.from("players").select("id").eq("id", id).single();
    if (data) {
      if (name !== getPlayerName()) {
        await supabase.from("players").update({ display_name: name }).eq("id", id);
        setPlayerName(name);
      }
      return id;
    }
  }
  const { data, error } = await supabase.from("players").insert({ display_name: name }).select("id").single();
  if (error || !data) throw new Error("Failed to create player");
  setPlayerId(data.id);
  setPlayerName(name);
  return data.id;
};

export const createRoom = async (playerId: string, gameId: string): Promise<{ id: string; code: string }> => {
  const code = generateCode();
  const { data, error } = await supabase
    .from("game_rooms")
    .insert({ code, game_id: gameId, host_id: playerId, status: "waiting" })
    .select("id, code")
    .single();
  if (error || !data) throw new Error("Failed to create room");
  await supabase.from("room_players").insert({ room_id: data.id, player_id: playerId });
  return data;
};

export const joinRoom = async (playerId: string, code: string): Promise<{ id: string; game_id: string } | null> => {
  const { data: room } = await supabase
    .from("game_rooms")
    .select("id, game_id, status")
    .eq("code", code.toUpperCase())
    .single();
  if (!room || room.status !== "waiting") return null;
  await supabase.from("room_players").insert({ room_id: room.id, player_id: playerId });
  return { id: room.id, game_id: room.game_id };
};

export const startGame = async (roomId: string) => {
  await supabase.from("game_rooms").update({ status: "playing" }).eq("id", roomId);
};

export const reportScore = async (roomId: string, playerId: string, score: number) => {
  await supabase
    .from("room_players")
    .update({ score, finished: true, finished_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("player_id", playerId);

  // Check if all players finished
  const { data: players } = await supabase
    .from("room_players")
    .select("*")
    .eq("room_id", roomId);

  if (players && players.every((p: any) => p.finished)) {
    // Determine winner (highest score)
    const winner = players.reduce((best: any, p: any) => (!best || p.score > best.score ? p : best), null);
    if (winner) {
      await supabase.from("room_players").update({ is_winner: true }).eq("id", winner.id);
    }
    await supabase.from("game_rooms").update({ status: "finished" }).eq("id", roomId);
  }
};

export const subscribeToRoom = (
  roomId: string,
  onUpdate: (players: any[], status: string) => void
) => {
  const channel = supabase.channel(`room-${roomId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` }, async () => {
      const { data: players } = await supabase.from("room_players").select("*, players(display_name)").eq("room_id", roomId);
      const { data: room } = await supabase.from("game_rooms").select("status").eq("id", roomId).single();
      onUpdate(players || [], room?.status || "waiting");
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "game_rooms", filter: `id=eq.${roomId}` }, async () => {
      const { data: players } = await supabase.from("room_players").select("*, players(display_name)").eq("room_id", roomId);
      const { data: room } = await supabase.from("game_rooms").select("status").eq("id", roomId).single();
      onUpdate(players || [], room?.status || "waiting");
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
};
