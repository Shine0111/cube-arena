"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Room = {
  id: string;
  room_code: string;
  name: string;
  status: "waiting" | "in_progress" | "completed";
  scramble_type: string;
  current_scramble: string | null;
};

type RoomMember = {
  user_id: string;
  role: "host" | "player";
  is_ready: boolean;
};

export default function RoomLobby({ roomId }: { roomId: string }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function loadRoom() {
      setLoading(true);
      setError("");

      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("id, room_code, name, status, scramble_type, current_scramble")
        .eq("id", roomId)
        .single();

      if (roomError) {
        if (!cancelled) {
          setError(roomError.message);
          setLoading(false);
        }
        return;
      }

      const { data: memberData, error: memberError } = await supabase
        .from("room_members")
        .select("user_id, role, is_ready")
        .eq("room_id", roomId)
        .order("joined_at", { ascending: true });

      if (cancelled) return;

      if (memberError) {
        setError(memberError.message);
      } else {
        setRoom(roomData as Room);
        setMembers((memberData ?? []) as RoomMember[]);
      }

      setLoading(false);
    }

    loadRoom();

    const channel = supabase
      .channel(`room-members-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          void loadRoom();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  if (loading) {
    return <p className="text-zinc-400">Loading room...</p>;
  }

  if (error || !room) {
    return (
      <p className="rounded-lg border border-red-900 p-4 text-red-300">
        {error || "Room not found."}
      </p>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-sm text-emerald-400">Room invite code</p>
        <p className="mt-2 font-mono text-3xl font-bold tracking-widest">
          {room.room_code}
        </p>

        <h2 className="mt-5 text-xl font-semibold">{room.name}</h2>

        <p className="mt-2 text-sm text-zinc-400">
          Status: {room.status.replace("_", " ")}
        </p>

        <p className="mt-1 text-sm text-zinc-400">
          Event: {room.scramble_type}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold">Players ({members.length})</h2>

        {members.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-400">
            No players have joined yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {members.map((member) => (
              <li
                key={member.user_id}
                className="flex items-center justify-between rounded-lg bg-zinc-800/60 px-4 py-3"
              >
                <span className="font-mono text-sm">
                  {member.user_id.slice(0, 8)}...
                </span>

                <span className="text-sm text-zinc-400">
                  {member.role === "host" ? "Host" : "Player"}
                  {member.is_ready ? " · Ready" : " · Not ready"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
