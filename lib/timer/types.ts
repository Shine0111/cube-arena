export type SolvePenalty = "none" | "+2" | "DNF";

export type SolveRecord = {
  id: string;
  timeMs: number;
  penalty: SolvePenalty;
  createdAt: string;
};
