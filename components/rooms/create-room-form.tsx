"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomCode(): string {
  const values = new Uint32Array(ROOM_CODE_LENGTH);
  crypto.getRandomValues(values);

  return Array.from(
    values,
    (value) => ROOM_CODE_CHARACTERS[value % ROOM_CODE_CHARACTERS.length],
  ).join("");
}

export default function CreateRoomForm() {
  const router = useRouter();
  const [name, setName] = useState("Speedcubing Room");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleCreateRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const roomName = name.trim();

    if (!roomName) {
      setMessage("Please enter a room name.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("Please sign in before creating a room.");
        return;
      }

      let room: { id: string; room_code: string } | null = null;

      for (let attempt = 0; attempt < 5; attempt++) {
        const roomCode = generateRoomCode();

        const { data, error } = await supabase
          .from("rooms")
          .insert({
            room_code: roomCode,
            name: roomName,
            created_by: user.id,
            status: "waiting",
            scramble_type: "333",
          })
          .select("id, room_code")
          .single();

        if (!error && data) {
          room = data;
          break;
        }

        if (error?.code !== "23505") {
          throw error ?? new Error("Failed to create room.");
        }
      }

      if (!room) {
        throw new Error(
          "Could not generate a unique room code. Please try again.",
        );
      }

      const { error: memberError } = await supabase
        .from("room_members")
        .insert({
          room_id: room.id,
          user_id: user.id,
          role: "host",
        });

      if (memberError) {
        // Roll back the room if host membership creation fails.
        await supabase.from("rooms").delete().eq("id", room.id);
        throw memberError;
      }

      router.push(`/rooms/${room.id}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to create room:", error);

      if (error !== null && typeof error === "object" && "message" in error) {
        const details = [
          String(error.message),
          "code" in error ? `Code: ${String(error.code)}` : "",
          "details" in error && error.details ? String(error.details) : "",
          "hint" in error && error.hint ? String(error.hint) : "",
        ].filter(Boolean);

        setMessage(details.join(" — "));
      } else {
        setMessage("Room creation failed. Check the browser console.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleCreateRoom}
      className="mx-auto w-full max-w-lg space-y-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-white"
    >
      <div>
        <label
          htmlFor="room-name"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Room name
        </label>
        <input
          id="room-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          required
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-emerald-400"
          placeholder="Speedcubing Room"
        />
      </div>

      {message && (
        <p role="alert" className="text-sm text-red-400">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-400 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Creating room..." : "Create room"}
      </button>
    </form>
  );
}
