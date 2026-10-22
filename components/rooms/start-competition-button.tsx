"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type StartCompetitionButtonProps = {
  roomId: string;
  isHost: boolean;
  roomStatus: "waiting" | "in_progress" | "completed";
  allReady: boolean;
  hasScramble: boolean;
};

export default function StartCompetitionButton({
  roomId,
  isHost,
  roomStatus,
  allReady,
  hasScramble,
}: StartCompetitionButtonProps) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  async function handleStart() {
    if (!isHost || starting || roomStatus !== "waiting") return;

    setStarting(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: startError } = await supabase.rpc("start_room", {
        p_room_id: roomId,
      });

      if (startError) {
        setError(startError.message);
      }
    } catch {
      setError("Could not start the competition. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  if (!isHost || roomStatus !== "waiting") {
    return null;
  }

  const disabled = starting || !allReady || !hasScramble;

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={handleStart}
        disabled={disabled}
        className="rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {starting ? "Starting..." : "Start competition"}
      </button>

      {!hasScramble && (
        <p className="text-sm text-zinc-400">
          Generate a scramble before starting.
        </p>
      )}

      {hasScramble && !allReady && (
        <p className="text-sm text-zinc-400">
          All players must be ready before the competition can start.
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}
