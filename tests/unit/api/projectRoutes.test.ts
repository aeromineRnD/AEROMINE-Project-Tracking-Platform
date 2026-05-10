import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db", () => ({
  prisma: {
    project: {
      findMany:  vi.fn(),
      findUnique: vi.fn(),
      create:    vi.fn(),
      update:    vi.fn(),
      delete:    vi.fn(),
    },
    stage:         { createMany: vi.fn() },
    projectClient: { findMany: vi.fn() },
    $transaction:  vi.fn(),
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { GET as listProjects, POST as createProject } from "@/app/api/projects/route";
import { GET as getProject, PUT as updateProject, DELETE as deleteProject } from "@/app/api/projects/[id]/route";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;
const db = prisma as any;

const adminSession  = (id = "admin1") => ({ user: { id, role: "ADMIN",       name: "A", email: "a@test.com" } });
const clientSession = (id = "c1")     => ({ user: { id, role: "CLIENT",      name: "C", email: "c@test.com" } });
const params        = { id: "proj1" };

function req(method = "GET", body?: object) {
  return new NextRequest("http://localhost/api/projects", {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => vi.clearAllMocks());

// ── GET /api/projects ────────────────────────────────────────────────────────

describe("GET /api/projects", () => {
  it("401 when unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    const res = await listProjects(req());
    expect(res.status).toBe(401);
  });

  it("admin receives only their own projects", async () => {
    mockSession.mockResolvedValue(adminSession("admin1"));
    const ownProject = { id: "proj1", adminId: "admin1", stages: [], clients: [], _count: { updates: 0 } };
    db.project.findMany.mockResolvedValue([ownProject]);

    const res  = await listProjects(req());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    // Verify the Prisma query was scoped to adminId
    expect(db.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { adminId: "admin1" } })
    );
  });

  it("client receives only their assigned projects (via ProjectClient join)", async () => {
    mockSession.mockResolvedValue(clientSession("c1"));
    const assignment = {
      project: { id: "proj1", adminId: "admin1", stages: [], admin: null, _count: { updates: 0 } },
    };
    db.projectClient.findMany.mockResolvedValue([assignment]);

    const res  = await listProjects(req());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(db.projectClient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clientId: "c1" } })
    );
  });
});

// ── POST /api/projects ───────────────────────────────────────────────────────

describe("POST /api/projects", () => {
  it("401 when unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    const res = await createProject(req("POST", { name: "X", location: "Y", startDate: "2024-01-01", estimatedEnd: "2025-01-01" }));
    expect(res.status).toBe(401);
  });

  it("403 when client tries to create a project", async () => {
    mockSession.mockResolvedValue(clientSession());
    const res = await createProject(req("POST", { name: "X" }));
    expect(res.status).toBe(403);
  });

  it("admin can create project — adminId taken from session, not request body", async () => {
    mockSession.mockResolvedValue(adminSession("admin1"));
    const createdProject = { id: "new1", adminId: "admin1" };
    db.$transaction.mockImplementation(async (fn: any) => {
      db.project.create.mockResolvedValue(createdProject);
      db.stage.createMany.mockResolvedValue({});
      return fn(db);
    });

    const body = { name: "Villa", location: "Athens", startDate: "2024-01-01", estimatedEnd: "2025-01-01" };
    const res  = await createProject(req("POST", body));
    expect(res.status).toBe(201);
  });
});

// ── GET /api/projects/[id] ───────────────────────────────────────────────────

describe("GET /api/projects/[id]", () => {
  const fullProject = {
    id: "proj1", adminId: "admin1",
    clients: [{ clientId: "c1" }],
    stages: [], phases: [], updates: [], milestones: [],
  };

  it("401 when unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    db.project.findUnique.mockResolvedValue(fullProject);
    const res = await getProject(req(), { params });
    expect(res.status).toBe(401);
  });

  it("admin can view their own project", async () => {
    mockSession.mockResolvedValue(adminSession("admin1"));
    db.project.findUnique.mockResolvedValue(fullProject);
    const res = await getProject(req(), { params });
    expect(res.status).toBe(200);
  });

  it("403 — admin cannot view another admin's project (tenant isolation)", async () => {
    mockSession.mockResolvedValue(adminSession("admin2"));
    db.project.findUnique.mockResolvedValue(fullProject);
    const res = await getProject(req(), { params });
    expect(res.status).toBe(403);
  });

  it("client can view their assigned project", async () => {
    mockSession.mockResolvedValue(clientSession("c1"));
    db.project.findUnique.mockResolvedValue(fullProject);
    const res = await getProject(req(), { params });
    expect(res.status).toBe(200);
  });

  it("403 — client cannot view a project they are not assigned to", async () => {
    mockSession.mockResolvedValue(clientSession("c_other"));
    db.project.findUnique.mockResolvedValue(fullProject);
    const res = await getProject(req(), { params });
    expect(res.status).toBe(403);
  });
});

// ── PUT /api/projects/[id] ───────────────────────────────────────────────────

describe("PUT /api/projects/[id]", () => {
  const ownProject = { id: "proj1", adminId: "admin1", clients: [{ clientId: "c1" }] };

  it("401 when unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    db.project.findUnique.mockResolvedValue(ownProject);
    const res = await updateProject(req("PUT", { name: "New" }), { params });
    expect(res.status).toBe(401);
  });

  it("403 — client cannot update a project", async () => {
    mockSession.mockResolvedValue(clientSession());
    db.project.findUnique.mockResolvedValue(ownProject);
    const res = await updateProject(req("PUT", { name: "New" }), { params });
    expect(res.status).toBe(403);
  });

  it("403 — admin cannot update another admin's project", async () => {
    mockSession.mockResolvedValue(adminSession("admin2"));
    db.project.findUnique.mockResolvedValue(ownProject);
    const res = await updateProject(req("PUT", { name: "New" }), { params });
    expect(res.status).toBe(403);
  });

  it("admin can update their own project", async () => {
    mockSession.mockResolvedValue(adminSession("admin1"));
    db.project.findUnique.mockResolvedValue(ownProject);
    db.project.update.mockResolvedValue({ ...ownProject, name: "New" });
    const res = await updateProject(req("PUT", { name: "New" }), { params });
    expect(res.status).toBe(200);
  });
});

// ── DELETE /api/projects/[id] ────────────────────────────────────────────────

describe("DELETE /api/projects/[id]", () => {
  const ownProject = { id: "proj1", adminId: "admin1", clients: [] };

  it("401 when unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    db.project.findUnique.mockResolvedValue(ownProject);
    const res = await deleteProject(req("DELETE"), { params });
    expect(res.status).toBe(401);
  });

  it("403 — client cannot delete a project", async () => {
    mockSession.mockResolvedValue(clientSession());
    db.project.findUnique.mockResolvedValue(ownProject);
    const res = await deleteProject(req("DELETE"), { params });
    expect(res.status).toBe(403);
  });

  it("admin can delete their own project", async () => {
    mockSession.mockResolvedValue(adminSession("admin1"));
    db.project.findUnique.mockResolvedValue(ownProject);
    db.project.delete.mockResolvedValue({});
    const res = await deleteProject(req("DELETE"), { params });
    expect(res.status).toBe(200);
  });
});
