import { describe, it, expect } from "vitest";
import { calcOverallProgress } from "@/types";
import type { Stage } from "@/types";

function makeStage(progress: number): Stage {
  return { id: "s", projectId: "p", nameEn: "Test", nameEl: "Test", order: 1, progress, createdAt: "", updatedAt: "" };
}

describe("calcOverallProgress", () => {
  it("returns 0 for empty stages array", () => {
    expect(calcOverallProgress([])).toBe(0);
  });

  it("returns 100 when all stages are complete", () => {
    const stages = [makeStage(100), makeStage(100), makeStage(100)];
    expect(calcOverallProgress(stages)).toBe(100);
  });

  it("returns 0 when no stages have started", () => {
    const stages = [makeStage(0), makeStage(0)];
    expect(calcOverallProgress(stages)).toBe(0);
  });

  it("returns correct average for mixed progress", () => {
    const stages = [makeStage(100), makeStage(50), makeStage(0)];
    expect(calcOverallProgress(stages)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    const stages = [makeStage(100), makeStage(0)];
    expect(calcOverallProgress(stages)).toBe(50);
  });

  it("works with a single stage", () => {
    expect(calcOverallProgress([makeStage(73)])).toBe(73);
  });
});
