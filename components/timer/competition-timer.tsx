"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getAdjustedTimeMs,
  getInspectionPenalty,
  type SolveRecord,
} from "@/lib/timer/types";
import { getAllSolves, saveSolve } from "@/lib/timer/solve-storage";
import { createClient } from "@/lib/supabase/client";
import { getAo5, getBestSingle, getSolveCount } from "@/lib/timer/statistics";

type TimerStatus =
  | "idle"
  | "inspecting"
  | "holding"
  | "ready"
  | "running"
  | "stopped"
  | "dnf";

const READY_DELAY_MS = 300;
const INSPECTION_LIMIT_MS = 15_000;
const INSPECTION_DNF_MS = 17_000;

type CompetitionTimerProps = {
  enabled?: boolean;
};

export default function CompetitionTimer({
  enabled = true,
}: CompetitionTimerProps) {
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [inspectionElapsedMs, setInspectionElapsedMs] = useState(0);
  const [solves, setSolves] = useState<SolveRecord[]>([]);

  const statusRef = useRef<TimerStatus>("idle");
  const spaceHeldRef = useRef(false);

  const startTimeRef = useRef<number | null>(null);
  const inspectionStartRef = useRef<number | null>(null);
  const activeInspectionMsRef = useRef(0);

  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inspectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const userIdRef = useRef<string | null>(null);
  const authLoadedRef = useRef(false);
  const enabledRef = useRef(enabled);

  const [userId, setUserId] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    userIdRef.current = userId;
    authLoadedRef.current = authLoaded;
  }, [userId, authLoaded]);

  const supabase = useMemo(() => createClient(), []);

  // Load the signed-in user from Supabase when the component mounts.
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;

        if (!cancelled) {
          setUserId(user?.id ?? null);
        }
      } catch (error) {
        console.error("Failed to load signed-in user:", error);

        if (!cancelled) {
          setUserId(null);
        }
      } finally {
        if (!cancelled) {
          setAuthLoaded(true);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Load the solve history from IndexedDB when the component mounts.
  useEffect(() => {
    if (!authLoaded || !userId) {
      setSolves([]);
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      try {
        const savedSolves = await getAllSolves(userId!);

        if (!cancelled) {
          setSolves(savedSolves);
        }
      } catch (error) {
        console.error("Failed to load solve history:", error);
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [authLoaded, userId]);

  // Update the solve timer while a solve is running.
  useEffect(() => {
    if (status !== "running") return;

    const interval = setInterval(() => {
      if (startTimeRef.current !== null) {
        setElapsedMs(performance.now() - startTimeRef.current);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [status]);

  // Update the inspection display using the actual elapsed time.
  useEffect(() => {
    if (status !== "inspecting" && status !== "holding" && status !== "ready") {
      return;
    }

    const interval = setInterval(() => {
      if (inspectionStartRef.current !== null) {
        setInspectionElapsedMs(performance.now() - inspectionStartRef.current);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Handle inspection, preparation, starting, and stopping.
  useEffect(() => {
    const currentUserId = () => userIdRef.current;

    function clearHoldTimeout() {
      if (holdTimeoutRef.current !== null) {
        clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = null;
      }
    }

    function clearInspectionTimeout() {
      if (inspectionTimeoutRef.current !== null) {
        clearTimeout(inspectionTimeoutRef.current);
        inspectionTimeoutRef.current = null;
      }
    }

    function recordInspectionDnf(inspectionMs: number) {
      clearHoldTimeout();
      clearInspectionTimeout();

      const ownerId = currentUserId();

      if (ownerId) {
        const newSolve: SolveRecord = {
          id: crypto.randomUUID(),
          userId: ownerId,
          timeMs: 0,
          inspectionMs,
          penalty: "DNF",
          createdAt: new Date().toISOString(),
        };

        setSolves((previous) => [newSolve, ...previous]);

        void saveSolve(newSolve).catch((error) => {
          console.error("Failed to save solve:", error);
        });
      }

      setInspectionElapsedMs(inspectionMs);
      setElapsedMs(0);

      inspectionStartRef.current = null;
      startTimeRef.current = null;
      activeInspectionMsRef.current = inspectionMs;

      statusRef.current = "dnf";
      setStatus("dnf");
    }

    function startInspection() {
      setElapsedMs(0);
      setInspectionElapsedMs(0);
      activeInspectionMsRef.current = 0;

      const inspectionStart = performance.now();
      inspectionStartRef.current = inspectionStart;

      statusRef.current = "inspecting";
      setStatus("inspecting");

      inspectionTimeoutRef.current = setTimeout(() => {
        recordInspectionDnf(INSPECTION_DNF_MS);
      }, INSPECTION_DNF_MS);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space") return;

      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName))
      ) {
        return;
      }

      if (!authLoadedRef.current || !userIdRef.current) {
        return;
      }

      if (!enabledRef.current) return;
      event.preventDefault();
      if (event.repeat) return;
      spaceHeldRef.current = true;

      const currentStatus = statusRef.current;

      // First press starts inspection. After a completed solve,
      // the next press begins a fresh inspection.
      if (
        currentStatus === "idle" ||
        currentStatus === "stopped" ||
        currentStatus === "dnf"
      ) {
        startInspection();
        return;
      }

      // Press Space during inspection and hold for 300 ms
      // to prepare to start the solve.
      if (currentStatus === "inspecting") {
        statusRef.current = "holding";
        setStatus("holding");

        holdTimeoutRef.current = setTimeout(() => {
          if (spaceHeldRef.current && statusRef.current === "holding") {
            statusRef.current = "ready";
            setStatus("ready");
          }
        }, READY_DELAY_MS);

        return;
      }

      // Press Space during a solve to stop and record it.
      if (currentStatus === "running") {
        const endTime = performance.now();
        const startTime = startTimeRef.current;

        const ownerId = currentUserId();

        if (startTime !== null && ownerId) {
          const finalTimeMs = endTime - startTime;
          const inspectionMs = activeInspectionMsRef.current;

          const newSolve: SolveRecord = {
            id: crypto.randomUUID(),
            userId: ownerId,
            timeMs: finalTimeMs,
            inspectionMs,
            penalty: getInspectionPenalty(inspectionMs),
            createdAt: new Date().toISOString(),
          };

          setElapsedMs(finalTimeMs);
          setSolves((previous) => [newSolve, ...previous]);

          void saveSolve(newSolve).catch((error) => {
            console.error("Failed to save solve:", error);
          });
        }

        startTimeRef.current = null;
        statusRef.current = "stopped";
        setStatus("stopped");
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.code !== "Space") return;

      spaceHeldRef.current = false;

      const currentStatus = statusRef.current;

      if (currentStatus === "holding" || currentStatus === "ready") {
        clearHoldTimeout();

        if (currentStatus === "holding") {
          // Not held long enough: remain in inspection.
          statusRef.current = "inspecting";
          setStatus("inspecting");
          return;
        }

        const inspectionStart = inspectionStartRef.current;

        if (inspectionStart === null) return;

        const inspectionMs = performance.now() - inspectionStart;

        // Protect the 17-second boundary even if the timeout
        // and key release happen almost simultaneously.
        if (inspectionMs >= INSPECTION_DNF_MS) {
          recordInspectionDnf(inspectionMs);
          return;
        }

        clearInspectionTimeout();

        setInspectionElapsedMs(inspectionMs);
        activeInspectionMsRef.current = inspectionMs;
        inspectionStartRef.current = null;

        startTimeRef.current = performance.now();
        setElapsedMs(0);

        statusRef.current = "running";
        setStatus("running");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);

      clearHoldTimeout();
      clearInspectionTimeout();
    };
  }, []);

  const seconds = (elapsedMs / 1000).toFixed(2);
  const inspectionSeconds = inspectionElapsedMs / 1000;
  const remainingSeconds =
    Math.max(0, INSPECTION_DNF_MS - inspectionElapsedMs) / 1000;

  const statusLabel: Record<TimerStatus, string> = {
    idle: "PRESS SPACE TO INSPECT",
    inspecting: "INSPECT THE CUBE",
    holding: "KEEP HOLDING...",
    ready: "READY — RELEASE TO START",
    running: "SOLVING",
    stopped: "SOLVE COMPLETE",
    dnf: "DNF — INSPECTION TIME EXCEEDED",
  };

  const isInspecting =
    status === "inspecting" || status === "holding" || status === "ready";

  const solveCount = getSolveCount(solves);
  const bestSingle = getBestSingle(solves);
  const ao5 = getAo5(solves);

  function formatResult(timeMs: number | null | "DNF") {
    if (timeMs === null) return "—";
    if (timeMs === "DNF") return "DNF";

    return (timeMs / 1000).toFixed(2);
  }

  return (
    <section className="mx-auto w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center text-white">
      <p className="text-sm font-semibold tracking-[0.2em] text-zinc-400">
        CUBE ARENA · COMPETITION TIMER
      </p>
      <p
        className={`mt-8 font-mono text-6xl font-bold tabular-nums sm:text-8xl ${
          status === "ready"
            ? "text-emerald-400"
            : status === "dnf"
              ? "text-red-400"
              : ""
        }`}
        aria-live="off"
      >
        {status === "dnf"
          ? "DNF"
          : status === "running" || status === "stopped"
            ? seconds
            : "0.00"}
      </p>
      <p className="mt-6 text-sm font-medium tracking-widest text-zinc-400">
        {statusLabel[status]}
      </p>
      {isInspecting && (
        <div className="mt-5 space-y-2">
          <p
            className={`font-mono text-2xl tabular-nums ${
              inspectionElapsedMs >= INSPECTION_LIMIT_MS
                ? "text-red-400"
                : inspectionElapsedMs >= 13_000
                  ? "text-amber-400"
                  : "text-zinc-200"
            }`}
          >
            {inspectionSeconds.toFixed(2)}s inspected
          </p>

          <p className="text-xs text-zinc-500">
            {remainingSeconds.toFixed(2)}s until inspection DNF
          </p>

          {inspectionElapsedMs >= INSPECTION_LIMIT_MS && (
            <p className="text-sm font-semibold text-amber-400">+2 PENALTY</p>
          )}
        </div>
      )}
      <p className="mt-4 text-xs text-zinc-500">
        Press Space to inspect. Hold Space for 300 ms, then release to start.
        Press Space again to stop.
      </p>
      {/* Statistics  */}
      <div className="mt-10 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
          <p className="text-xs text-zinc-500">SOLVES</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {solveCount}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
          <p className="text-xs text-zinc-500">BEST SINGLE</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {bestSingle === null ? "—" : formatResult(bestSingle)}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
          <p className="text-xs text-zinc-500">AO5</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {formatResult(ao5)}
          </p>
        </div>
      </div>
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
            {solves.map((solve, index) => {
              const adjustedTime = getAdjustedTimeMs(solve);

              return (
                <li
                  key={solve.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <span className="text-sm text-zinc-400">
                    {solves.length - index}.
                  </span>

                  <div className="flex-1">
                    <p className="font-mono text-lg tabular-nums">
                      {adjustedTime === null
                        ? "DNF"
                        : (adjustedTime / 1000).toFixed(2)}
                    </p>

                    <p className="text-xs text-zinc-500">
                      Inspection: {(solve.inspectionMs / 1000).toFixed(2)}s
                    </p>
                  </div>

                  <span
                    className={`text-xs font-semibold ${
                      solve.penalty === "DNF"
                        ? "text-red-400"
                        : solve.penalty === "+2"
                          ? "text-amber-400"
                          : "text-emerald-400"
                    }`}
                  >
                    {solve.penalty === "none" ? "OK" : solve.penalty}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
