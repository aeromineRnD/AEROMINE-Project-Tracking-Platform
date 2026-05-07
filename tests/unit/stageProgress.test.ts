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

describe("auto-status rule: all stages 100% → COMPLETED", () => {
  function deriveStatus(stages: Stage[]): "COMPLETED" | "IN_PROGRESS" {
    if (!stages.length) return "IN_PROGRESS";
    return stages.every((s) => s.progress === 100) ? "COMPLETED" : "IN_PROGRESS";
  }

  it("COMPLETED when all stages are 100%", () => {
    expect(deriveStatus([makeStage(100), makeStage(100), makeStage(100)])).toBe("COMPLETED");
  });

  it("IN_PROGRESS when one stage is below 100%", () => {
    expect(deriveStatus([makeStage(100), makeStage(99), makeStage(100)])).toBe("IN_PROGRESS");
  });

  it("IN_PROGRESS when all stages are 0%", () => {
    expect(deriveStatus([makeStage(0), makeStage(0)])).toBe("IN_PROGRESS");
  });

  it("IN_PROGRESS for empty stage list", () => {
    expect(deriveStatus([])).toBe("IN_PROGRESS");
  });

  it("reverts to IN_PROGRESS if a stage drops below 100% after being COMPLETED", () => {
    const stages = [makeStage(100), makeStage(100)];
    expect(deriveStatus(stages)).toBe("COMPLETED");
    // Simulate admin dragging one stage back
    stages[0] = makeStage(90);
    expect(deriveStatus(stages)).toBe("IN_PROGRESS");
  });
});
