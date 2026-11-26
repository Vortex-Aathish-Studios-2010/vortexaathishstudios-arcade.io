import { useState } from "react";
import { getPlayerName, setPlayerName } from "@/lib/streaks";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

export function UsernameGate({
  onComplete,
}: {
  onComplete: (username: string) => void;
}) {
  const [name, setName] = useState(getPlayerName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="profile-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (busy) return;
        if (trimmed.length < 2 || trimmed.length > 20) {
          setError("Use 2 to 20 characters.");
          return;
        }
        if (
          trimmed !== getPlayerName() &&
          isSupabaseConfigured &&
          navigator.onLine
        ) {
          setBusy(true);
          const controller = new AbortController();
          const timer = window.setTimeout(() => controller.abort(), 2500);
          try {
            const { data } = await supabase
              .from("leaderboard")
              .select("id")
              .eq("player_name", trimmed)
              .abortSignal(controller.signal)
              .maybeSingle();
            if (data) {
              setError("That name is taken. Choose another.");
              return;
            }
          } catch {
            /* Local play can continue offline. */
          } finally {
            window.clearTimeout(timer);
            setBusy(false);
          }
        }
        setPlayerName(trimmed);
        onComplete(trimmed);
      }}
    >
      <label>
        Player name
        <input
          value={name}
          maxLength={20}
          autoComplete="nickname"
          placeholder="Your username"
          required
          onChange={(e) => {
            setError("");
            setName(e.target.value);
          }}
        />
      </label>
      <p>This name appears in rooms and on the leaderboard.</p>
      {error && <p role="alert">{error}</p>}
      <button disabled={busy} className="solid-button">
        {busy ? "Checking…" : "Save player name"}
      </button>
    </form>
  );
}
