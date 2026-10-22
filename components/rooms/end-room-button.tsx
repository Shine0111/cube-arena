"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type EndRoomButtonProps = {
  roomId: string;
  isHost: boolean;
  roomStatus: "waiting" | "in_progress" | "completed";
};

export default function EndRoomButton({
  roomId,
  isHost,
  roomStatus,
}: EndRoomButtonProps) {
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState("");

  async function handleEndRoom() {
    if (!isHost || ending || roomStatus === "completed") return;

    const confirmed = window.confirm(
      "End this room for everyone? This action cannot be undone.",
    );

    if (!confirmed) return;

    setEnding(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: endError } = await supabase.rpc("end_room", {
        p_room_id: roomId,
      });

      if (endError) {
        setError(endError.message);
      }
    } catch {
      setError("Could not end the room. Please try again.");
    } finally {
      setEnding(false);
    }
  }

  if (!isHost || roomStatus === "completed") {
    return null;
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleEndRoom}
        disabled={ending}
        className="rounded-lg border border-red-800 px-4 py-2 font-semibold text-red-300 transition hover:bg-red-950 disabled:opacity-50"
      >
        {ending ? "Ending room..." : "End room"}
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
