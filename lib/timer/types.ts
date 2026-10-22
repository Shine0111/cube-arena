export type SolvePenalty = "none" | "+2" | "DNF";

export type SolveRecord = {
  id: string;
  timeMs: number;
  inspectionMs: number;
  penalty: SolvePenalty;
  createdAt: string;
};

export function getAdjustedTimeMs(solve: SolveRecord): number | null {
  if (solve.penalty === "DNF") {
    return null;
  }

  if (solve.penalty === "+2") {
    return solve.timeMs + 2000;
  }

  return solve.timeMs;
}

export function getInspectionPenalty(inspectionMs: number): SolvePenalty {
  if (inspectionMs >= 17_000) {
    return "DNF";
  }

  if (inspectionMs >= 15_000) {
    return "+2";
  }

  return "none";
}
