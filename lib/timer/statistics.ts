import type { SolveRecord } from "./types";
import { getAdjustedTimeMs } from "./types";

export function getSolveCount(solves: SolveRecord[]): number {
  return solves.length;
}

export function getBestSingle(solves: SolveRecord[]): number | null {
  const validTimes = solves
    .map(getAdjustedTimeMs)
    .filter((time): time is number => time !== null);

  if (validTimes.length === 0) {
    return null;
  }

  return Math.min(...validTimes);
}

export function getAo5(solves: SolveRecord[]): number | "DNF" | null {
  if (solves.length < 5) {
    return null;
  }

  const latestFive = solves.slice(0, 5);

  const sortedTimes = latestFive.map(getAdjustedTimeMs).sort((a, b) => {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return a - b;
  });

  // Remove the best result and the worst result.
  const middleThree = sortedTimes.slice(1, 4);

  // A DNF remaining among the middle three makes the Ao5 DNF.
  if (middleThree.some((time) => time === null)) {
    return "DNF";
  }

  const total = middleThree.reduce<number>((sum, time) => sum + (time ?? 0), 0);

  return total / 3;
}
