/**
 * Tests for resource ownership checks introduced in the security audit:
 * - Stage updates must verify the stageId belongs to the target project
 * - Milestone toggle must verify the milestoneId belongs to the target project
 * - Milestone creation must verify the stageId belongs to the target project
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db", () => ({
  prisma: {
    project:   { findUnique: vi.fn(), update: vi.fn() },
    stage:     { findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    milestone: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { PUT as updateStages } from "@/app/api/projects/[id]/stages/route";
import { PUT as updateMilestone, POST as createMilestone } from "@/app/api/projects/[id]/milestones/route";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;
const db          = prisma as any;
const params      = { id: "proj1" };

const adminSession = () => ({ user: { id: "admin1", role: "ADMIN", name: "A", email: "a@test.com" } });
const ownProject   = { id: "proj1", adminId: "admin1" };

function stageReq(body: object) {
  return new NextRequest("http://localhost/api/projects/proj1/stages", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function msReq(method: string, body: object) {
  return new NextRequest("http://localhost/api/projects/proj1/milestones", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

// ── Stage ownership ───────────────────────────────────────────────────────────

describe("PUT /api/projects/[id]/stages — single update ownership", () => {
  it("403 when stageId belongs to a different project", async () => {
    mockSession.mockResolvedValue(adminSession());
    db.project.findUnique.mockResolvedValue(ownProject);
    db.stage.findFirst.mockResolvedValue(null); // not in this project

    const res = await updateStages(stageReq({ stageId: "stage_other", progress: 50 }), { params });
    expect(res.status).toBe(403);
  });

  it("200 when stageId belongs to the correct project", async () => {
    mockSession.mockResolvedValue(adminSession());
    db.project.findUnique.mockResolvedValue(ownProject);
    const ownStage = { id: "stage1", projectId: "proj1", progress: 50 };
    db.stage.findFirst.mockResolvedValue(ownStage);
    db.stage.update.mockResolvedValue(ownStage);
    db.stage.findMany.mockResolvedValue([ownStage]);
    db.project.update.mockResolvedValue({});
    db.milestone.updateMany.mockResolvedValue({});

    const res = await updateStages(stageReq({ stageId: "stage1", progress: 50 }), { params });
    expect(res.status).toBe(200);
  });
});

describe("PUT /api/projects/[id]/stages — bulk update ownership", () => {
  it("403 when any stageId belongs to a different project", async () => {
    mockSession.mockResolvedValue(adminSession());
    db.project.findUnique.mockResolvedValue(ownProject);
    // Only 1 of 2 stages returned — length mismatch triggers 403
    db.stage.findMany.mockResolvedValue([{ id: "stage1" }]);

    const res = await updateStages(
      stageReq({ stages: [{ id: "stage1", progress: 50 }, { id: "stage_other", progress: 80 }] }),
      { params }
    );
    expect(res.status).toBe(403);
  });
});

// ── Milestone ownership ───────────────────────────────────────────────────────

describe("PUT /api/projects/[id]/milestones — ownership check", () => {
  it("403 when milestoneId belongs to a different project", async () => {
    mockSession.mockResolvedValue(adminSession());
    db.project.findUnique.mockResolvedValue(ownProject);
    db.milestone.findFirst.mockResolvedValue(null); // not in this project

    const res = await updateMilestone(msReq("PUT", { milestoneId: "ms_other", completed: true }), { params });
    expect(res.status).toBe(403);
  });

  it("200 when milestoneId belongs to the correct project", async () => {
    mockSession.mockResolvedValue(adminSession());
    db.project.findUnique.mockResolvedValue(ownProject);
    const ownMs = { id: "ms1", projectId: "proj1", completed: false };
    db.milestone.findFirst.mockResolvedValue(ownMs);
    db.milestone.update.mockResolvedValue({ ...ownMs, completed: true });

    const res = await updateMilestone(msReq("PUT", { milestoneId: "ms1", completed: true }), { params });
    expect(res.status).toBe(200);
  });
});

// ── Milestone stageId ownership ───────────────────────────────────────────────

describe("POST /api/projects/[id]/milestones — stageId ownership check", () => {
  it("403 when stageId belongs to a different project", async () => {
    mockSession.mockResolvedValue(adminSession());
    db.project.findUnique.mockResolvedValue(ownProject);
    db.stage.findFirst.mockResolvedValue(null); // stage not in this project

    const res = await createMilestone(
      msReq("POST", { title: "T", dueDate: "2025-01-01", stageId: "stage_other" }),
      { params }
    );
    expect(res.status).toBe(403);
  });

  it("201 when no stageId provided (optional field)", async () => {
    mockSession.mockResolvedValue(adminSession());
    db.project.findUnique.mockResolvedValue(ownProject);
    db.milestone.create.mockResolvedValue({ id: "ms_new", projectId: "proj1", title: "T" });

    const res = await createMilestone(
      msReq("POST", { title: "T", dueDate: "2025-01-01" }),
      { params }
    );
    expect(res.status).toBe(201);
  });

  it("403 when client tries to create a milestone", async () => {
    mockSession.mockResolvedValue({ user: { id: "c1", role: "CLIENT", name: "C", email: "c@test.com" } });
    db.project.findUnique.mockResolvedValue(ownProject);

    const res = await createMilestone(
      msReq("POST", { title: "T", dueDate: "2025-01-01" }),
      { params }
    );
    expect(res.status).toBe(403);
  });
});
