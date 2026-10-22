"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinRoomForm() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/login?next=/rooms/join");
        return;
      }

      const { data: roomId, error: joinError } = await supabase.rpc(
        "join_room",
        { p_room_code: roomCode.trim().toUpperCase() },
      );

      if (joinError) {
        setError(joinError.message);
        return;
      }

      if (!roomId) {
        setError("The room could not be found.");
        return;
      }

      router.push(`/rooms/${roomId}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleJoin}
      className="max-w-md space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6"
    >
      <div>
        <label
          htmlFor="roomCode"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Room invite code
        </label>

        <input
          id="roomCode"
          name="roomCode"
          value={roomCode}
          onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
          placeholder="E.G. HU6LDJ"
          minLength={6}
          maxLength={10}
          required
          autoComplete="off"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 font-mono uppercase tracking-widest text-white outline-none focus:border-emerald-500"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Joining room..." : "Join room"}
      </button>
    </form>
  );
}
