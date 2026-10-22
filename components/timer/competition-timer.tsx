"use client";

import { useEffect, useRef, useState } from "react";

type TimerStatus = "idle" | "holding" | "ready" | "running" | "stopped";

const READY_DELAY_MS = 300;

export default function CompetitionTimer() {
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      if (status === "running") {
        if (startTimeRef.current !== null) {
          setElapsedMs(performance.now() - startTimeRef.current);
        }

        startTimeRef.current = null;
        setStatus("stopped");
        return;
      }

      if (status === "idle" || status === "stopped") {
        setStatus("holding");

        holdTimeoutRef.current = setTimeout(() => {
          setStatus("ready");
        }, READY_DELAY_MS);
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.code !== "Space") return;

      if (holdTimeoutRef.current !== null) {
        clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = null;
      }

      if (status === "ready") {
        startTimeRef.current = performance.now();
        setElapsedMs(0);
        setStatus("running");
      } else if (status === "holding") {
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
  }, [status]);

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
    </section>
  );
}
