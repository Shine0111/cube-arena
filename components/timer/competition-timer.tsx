"use client";

import { useEffect, useRef, useState } from "react";
import type { SolvePenalty, SolveRecord } from "@/lib/timer/types";

type TimerStatus = "idle" | "holding" | "ready" | "running" | "stopped";

const READY_DELAY_MS = 300;

export default function CompetitionTimer() {
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [solves, setSolves] = useState<SolveRecord[]>([]);

  const startTimeRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spaceHeldRef = useRef(false);
  const statusRef = useRef<TimerStatus>("idle");

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (status !== "running") return;

    const interval = setInterval(() => {
      if (startTimeRef.current !== null) {
        setElapsedMs(performance.now() - startTimeRef.current);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space" || event.repeat) return;

      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName))
      ) {
        return;
      }

      event.preventDefault();
      spaceHeldRef.current = true;

      const currentStatus = statusRef.current;

      if (currentStatus === "running") {
        const endTime = performance.now();
        const startTime = startTimeRef.current;

        if (startTime !== null) {
          const finalTimeMs = endTime - startTime;

          setElapsedMs(finalTimeMs);

          const newSolve: SolveRecord = {
            id: crypto.randomUUID(),
            timeMs: finalTimeMs,
            penalty: "none",
            createdAt: new Date().toISOString(),
          };

          setSolves((previousSolves) => [newSolve, ...previousSolves]);
        }

        startTimeRef.current = null;
        statusRef.current = "stopped";
        setStatus("stopped");
        return;
      }

      if (currentStatus === "idle" || currentStatus === "stopped") {
        statusRef.current = "holding";
        setStatus("holding");

        holdTimeoutRef.current = setTimeout(() => {
          if (spaceHeldRef.current) {
            statusRef.current = "ready";
            setStatus("ready");
          }
        }, READY_DELAY_MS);
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.code !== "Space") return;

      spaceHeldRef.current = false;

      if (holdTimeoutRef.current !== null) {
        clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = null;
      }

      if (statusRef.current === "ready") {
        startTimeRef.current = performance.now();
        setElapsedMs(0);
        statusRef.current = "running";
        setStatus("running");
      } else if (statusRef.current === "holding") {
        statusRef.current = "idle";
        setStatus("idle");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);

      if (holdTimeoutRef.current !== null) {
        clearTimeout(holdTimeoutRef.current);
      }
    };
  }, []);

  const seconds = (elapsedMs / 1000).toFixed(2);

  const statusLabel: Record<TimerStatus, string> = {
    idle: "HOLD SPACE TO PREPARE",
    holding: "KEEP HOLDING...",
    ready: "READY",
    running: "SOLVING",
    stopped: "SOLVE COMPLETE",
  };

  return (
    <section className="mx-auto w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center text-white">
      <p className="text-sm font-semibold tracking-[0.2em] text-zinc-400">
        CUBE ARENA · COMPETITION TIMER
      </p>

      <p
        className={`mt-8 font-mono text-6xl font-bold tabular-nums sm:text-8xl ${
          status === "ready" ? "text-emerald-400" : ""
        }`}
        aria-live="off"
      >
        {status === "running" || status === "stopped" ? seconds : "0.00"}
      </p>

      <p className="mt-6 text-sm font-medium tracking-widest text-zinc-400">
        {statusLabel[status]}
      </p>

      <p className="mt-4 text-xs text-zinc-500">
        Hold Space to prepare. Release to start. Press Space to stop.
      </p>

      <div className="mt-10 text-left">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="text-sm font-semibold tracking-widest text-zinc-300">
            SOLVE HISTORY
          </h2>
          <span className="text-xs text-zinc-500">{solves.length} solves</span>
        </div>

        {solves.length === 0 ? (
          <p className="py-6 text-sm text-zinc-500">
            Your completed solves will appear here.
          </p>
        ) : (
          <ol className="divide-y divide-zinc-800">
            {solves.map((solve, index) => (
              <li
                key={solve.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <span className="text-sm text-zinc-400">
                  {solves.length - index}.
                </span>

                <span className="flex-1 font-mono text-lg tabular-nums">
                  {(solve.timeMs / 1000).toFixed(2)}
                </span>

                <span className="text-xs text-zinc-500">
                  {solve.penalty === "none" ? "OK" : solve.penalty}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
