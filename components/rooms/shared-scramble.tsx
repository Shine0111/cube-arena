"use client";

import { createClient } from "@/lib/supabase/client";
import { generateScramble } from "@/lib/scramble";
import { useEffect, useState } from "react";

type SharedScrambleProps = {
  roomId: string;
  isHost: boolean;
  initialScramble: string | null;
};

export default function SharedScramble({
  roomId,
  isHost,
  initialScramble,
}: SharedScrambleProps) {
  const [scramble, setScramble] = useState(initialScramble);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`room-scramble-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const updated = payload.new as {
            current_scramble: string | null;
          };

          setScramble(updated.current_scramble);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  async function handleGenerate() {
    if (!isHost || generating) return;

    setGenerating(true);
    setError("");

    try {
      const nextScramble = await generateScramble("333");
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("rooms")
        .update({ current_scramble: nextScramble })
        .eq("id", roomId);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setScramble(nextScramble);
    } catch {
      setError("Could not generate the scramble. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Shared scramble</h2>
          <p className="mt-1 text-sm text-zinc-400">
            3×3×3 · Same scramble for everyone
          </p>
        </div>

        {isHost && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-zinc-950 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate scramble"}
          </button>
        )}
      </div>

      <p className="mt-6 break-words font-mono text-lg leading-8 text-white">
        {scramble ?? "The host hasn't generated a scramble yet."}
      </p>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}
