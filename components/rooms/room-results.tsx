"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type RoomSolve = {
  id: string;
  user_id: string;
  scramble: string;
  time_ms: number;
  penalty: "none" | "+2" | "DNF";
  created_at: string;
};

type PlayerProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
};

type RoomResult = RoomSolve & {
  player: PlayerProfile | null;
};

export default function RoomResults({ roomId }: { roomId: string }) {
  const [results, setResults] = useState<RoomResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function loadResults() {
      setError("");

      const { data: solveData, error: solveError } = await supabase
        .from("room_solves")
        .select("id, user_id, scramble, time_ms, penalty, created_at")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (solveError) {
        setError(solveError.message);
        setLoading(false);
        return;
      }

      const userIds = (solveData ?? [])
        .map((solve) => solve.user_id)
        .filter((userId, index, ids) => ids.indexOf(userId) === index);

      let profiles: PlayerProfile[] = [];

      if (userIds.length > 0) {
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

        profiles = profileData ?? [];
      }

      const profilesById = new Map(
        profiles.map((profile) => [profile.id, profile]),
      );

      setResults(
        (solveData ?? []).map((solve) => ({
          ...solve,
          player: profilesById.get(solve.user_id) ?? null,
        })),
      );

      setLoading(false);
    }

    void loadResults();

    const channel = supabase
      .channel(`room-results-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_solves",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          void loadResults();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  function formatTime(timeMs: number, penalty: RoomSolve["penalty"]) {
    if (penalty === "DNF") return "DNF";

    const adjustedTime = timeMs + (penalty === "+2" ? 2000 : 0);

    return `${(adjustedTime / 1000).toFixed(2)}s`;
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-lg font-semibold">Live Results</h2>

      {loading && (
        <p className="mt-3 text-sm text-zinc-400">Loading results...</p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {!loading && !error && results.length === 0 && (
        <p className="mt-3 text-sm text-zinc-400">
          No competition solves yet. Complete a solve to see results here.
        </p>
      )}

      {results.length > 0 && (
        <ol className="mt-4 divide-y divide-zinc-800">
          {results.map((result, index) => (
            <li
              key={result.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div>
                <p className="font-medium">
                  {result.player?.display_name ||
                    (result.player?.username
                      ? `@${result.player.username}`
                      : `Player ${result.user_id.slice(0, 8)}`)}
                </p>

                <p className="text-xs text-zinc-500">
                  Solve {index + 1} ·{" "}
                  {new Date(result.created_at).toLocaleTimeString()}
                </p>
              </div>

              <div className="text-right">
                <p className="font-mono text-lg tabular-nums">
                  {formatTime(result.time_ms, result.penalty)}
                </p>

                {result.penalty !== "none" && (
                  <p className="text-xs text-amber-400">{result.penalty}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
