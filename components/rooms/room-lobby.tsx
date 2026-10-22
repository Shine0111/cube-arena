"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SharedScramble from "./shared-scramble";
import StartCompetitionButton from "@/components/rooms/start-competition-button";
import CompetitionTimer from "@/components/timer/competition-timer";
import EndRoomButton from "@/components/rooms/end-room-button";

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
  profile: {
    username: string | null;
    display_name: string | null;
  } | null;
};

export default function RoomLobby({ roomId }: { roomId: string }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [updatingReady, setUpdatingReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    // Load the current user ID
    async function loadCurrentUser() {
      const { data, error } = await supabase.auth.getUser();

      if (cancelled) return;

      if (error) {
        setError(error.message);
        return;
      }

      setCurrentUserId(data.user?.id ?? null);
    }

    void loadCurrentUser();

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
        if (!cancelled) {
          setError(memberError.message);
          setLoading(false);
        }
        return;
      }

      const userIds = (memberData ?? []).map((member) => member.user_id);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", userIds);

      if (cancelled) return;

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      const profilesById = new Map(
        (profileData ?? []).map((profile) => [profile.id, profile]),
      );

      setRoom(roomData as Room);

      setMembers(
        (memberData ?? []).map((member) => ({
          ...member,
          profile: profilesById.get(member.user_id) ?? null,
        })) as RoomMember[],
      );

      setLoading(false);
    }

    loadRoom();

    const membersChannel = supabase
      .channel(`room-members-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as {
              room_id: string;
              user_id: string;
              role: "host" | "player";
              is_ready: boolean;
            };

            setMembers((current) =>
              current.map((member) =>
                member.user_id === updated.user_id
                  ? {
                      ...member,
                      role: updated.role,
                      is_ready: updated.is_ready,
                    }
                  : member,
              ),
            );

            return;
          }

          void loadRoom();
        },
      )
      .subscribe();

    const roomChannel = supabase
      .channel(`room-status-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const updated = payload.new as Room;
          setRoom((current) =>
            current
              ? {
                  ...current,
                  status: updated.status,
                  current_scramble: updated.current_scramble,
                }
              : current,
          );
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(membersChannel);
      void supabase.removeChannel(roomChannel);
    };
  }, [roomId]);

  async function toggleReady() {
    if (!currentUserId || !room || updatingReady) return;

    const currentMember = members.find(
      (member) => member.user_id === currentUserId,
    );

    if (!currentMember) {
      setError("Your membership in this room could not be found.");
      return;
    }

    const previousReady = currentMember.is_ready;
    const nextReady = !previousReady;

    setUpdatingReady(true);
    setError("");

    // Update the UI immediately.
    setMembers((current) =>
      current.map((member) =>
        member.user_id === currentUserId
          ? { ...member, is_ready: nextReady }
          : member,
      ),
    );

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("room_members")
        .update({ is_ready: nextReady })
        .eq("room_id", room.id)
        .eq("user_id", currentUserId);

      if (updateError) {
        // Roll back if Supabase rejects the update.
        setMembers((current) =>
          current.map((member) =>
            member.user_id === currentUserId
              ? { ...member, is_ready: previousReady }
              : member,
          ),
        );

        setError(updateError.message);
      }
    } catch {
      setMembers((current) =>
        current.map((member) =>
          member.user_id === currentUserId
            ? { ...member, is_ready: previousReady }
            : member,
        ),
      );

      setError("Could not update your ready status. Please try again.");
    } finally {
      setUpdatingReady(false);
    }
  }

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

        {currentUserId &&
          members.some((member) => member.user_id === currentUserId) && (
            <button
              type="button"
              onClick={toggleReady}
              disabled={updatingReady}
              className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-zinc-950 disabled:opacity-50"
            >
              {updatingReady
                ? "Updating..."
                : members.find((member) => member.user_id === currentUserId)
                      ?.is_ready
                  ? "I'm Ready ✓"
                  : "Mark Me Ready"}
            </button>
          )}

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
                <span className="font-medium">
                  {member.profile?.display_name ||
                    (member.profile?.username
                      ? `@${member.profile.username}`
                      : `Player ${member.user_id.slice(0, 8)}`)}
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
      <SharedScramble
        roomId={room.id}
        isHost={
          members.find((member) => member.user_id === currentUserId)?.role ===
          "host"
        }
        initialScramble={room.current_scramble}
      />

      <StartCompetitionButton
        roomId={room.id}
        isHost={
          members.find((member) => member.user_id === currentUserId)?.role ===
          "host"
        }
        roomStatus={room.status}
        allReady={
          members.length > 0 && members.every((member) => member.is_ready)
        }
        hasScramble={Boolean(room.current_scramble?.trim())}
      />
      <EndRoomButton
        roomId={room.id}
        isHost={
          members.find((member) => member.user_id === currentUserId)?.role ===
          "host"
        }
        roomStatus={room.status}
      />
      <CompetitionTimer enabled={room.status === "in_progress"} />
    </section>
  );
}
