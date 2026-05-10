import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db", () => ({
  prisma: { project: { findUnique: vi.fn() } },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import {
  getSessionUser,
  requireAdmin,
  requireProjectAccess,
  requireProjectEdit,
} from "@/lib/apiAuth";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;
const mockProject = prisma.project as any;

const adminSession   = (id = "admin1") => ({ user: { id, role: "ADMIN",       name: "A", email: "a@a.com" } });
const clientSession  = (id = "c1")     => ({ user: { id, role: "CLIENT",      name: "C", email: "c@c.com" } });
const superSession   = ()              => ({ user: { id: "sa1", role: "SUPER_ADMIN", name: "S", email: "s@s.com" } });
const projectRecord  = { id: "proj1", adminId: "admin1", clients: [{ clientId: "c1" }] };

beforeEach(() => vi.clearAllMocks());

// ── getSessionUser ───────────────────────────────────────────────────────────

describe("getSessionUser", () => {
  it("returns null when there is no session", async () => {
    mockSession.mockResolvedValue(null);
    expect(await getSessionUser()).toBeNull();
  });

  it("returns { userId, role } from the session", async () => {
    mockSession.mockResolvedValue(adminSession("admin1"));
    expect(await getSessionUser()).toEqual({ userId: "admin1", role: "ADMIN" });
  });
});

// ── requireAdmin ─────────────────────────────────────────────────────────────

describe("requireAdmin", () => {
  it("401 when unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    const { error, user } = await requireAdmin();
    expect(error?.status).toBe(401);
    expect(user).toBeNull();
  });

  it("403 when role is CLIENT", async () => {
    mockSession.mockResolvedValue(clientSession());
    const { error } = await requireAdmin();
    expect(error?.status).toBe(403);
  });

  it("succeeds for ADMIN", async () => {
    mockSession.mockResolvedValue(adminSession());
    const { error, user } = await requireAdmin();
    expect(error).toBeNull();
    expect(user?.role).toBe("ADMIN");
  });

  it("succeeds for SUPER_ADMIN", async () => {
    mockSession.mockResolvedValue(superSession());
    const { error } = await requireAdmin();
    expect(error).toBeNull();
  });
});

// ── requireProjectAccess ─────────────────────────────────────────────────────

describe("requireProjectAccess", () => {
  it("401 when unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    mockProject.findUnique.mockResolvedValue(projectRecord);
    const { error } = await requireProjectAccess({} as any, "proj1");
    expect(error?.status).toBe(401);
  });

  it("404 when project does not exist", async () => {
    mockSession.mockResolvedValue(adminSession());
    mockProject.findUnique.mockResolvedValue(null);
    const { error } = await requireProjectAccess({} as any, "missing");
    expect(error?.status).toBe(404);
  });

  it("admin can access their own project", async () => {
    mockSession.mockResolvedValue(adminSession("admin1"));
    mockProject.findUnique.mockResolvedValue(projectRecord);
    const { error, project } = await requireProjectAccess({} as any, "proj1");
    expect(error).toBeNull();
    expect(project?.id).toBe("proj1");
  });

  it("403 — admin cannot access another admin's project (tenant isolation)", async () => {
    mockSession.mockResolvedValue(adminSession("admin2"));
    mockProject.findUnique.mockResolvedValue(projectRecord);
    const { error } = await requireProjectAccess({} as any, "proj1");
    expect(error?.status).toBe(403);
  });

  it("client can access a project they are assigned to", async () => {
    mockSession.mockResolvedValue(clientSession("c1"));
    mockProject.findUnique.mockResolvedValue(projectRecord);
    const { error } = await requireProjectAccess({} as any, "proj1");
    expect(error).toBeNull();
  });

  it("403 — client cannot access a project they are NOT assigned to", async () => {
    mockSession.mockResolvedValue(clientSession("c_other"));
    mockProject.findUnique.mockResolvedValue(projectRecord);
    const { error } = await requireProjectAccess({} as any, "proj1");
    expect(error?.status).toBe(403);
  });

  it("SUPER_ADMIN can access any project", async () => {
    mockSession.mockResolvedValue(superSession());
    mockProject.findUnique.mockResolvedValue(projectRecord);
    const { error } = await requireProjectAccess({} as any, "proj1");
    expect(error).toBeNull();
  });
});

// ── requireProjectEdit ───────────────────────────────────────────────────────

describe("requireProjectEdit", () => {
  const editRecord = { id: "proj1", adminId: "admin1" };

  it("401 when unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    mockProject.findUnique.mockResolvedValue(editRecord);
    const { error } = await requireProjectEdit({} as any, "proj1");
    expect(error?.status).toBe(401);
  });

  it("admin can edit their own project", async () => {
    mockSession.mockResolvedValue(adminSession("admin1"));
    mockProject.findUnique.mockResolvedValue(editRecord);
    const { error } = await requireProjectAccess({} as any, "proj1");
    expect(error).toBeNull();
  });

  it("403 — admin cannot edit another admin's project", async () => {
    mockSession.mockResolvedValue(adminSession("admin2"));
    mockProject.findUnique.mockResolvedValue(editRecord);
    const { error } = await requireProjectEdit({} as any, "proj1");
    expect(error?.status).toBe(403);
  });

  it("403 — client cannot edit any project", async () => {
    mockSession.mockResolvedValue(clientSession());
    mockProject.findUnique.mockResolvedValue(editRecord);
    const { error } = await requireProjectEdit({} as any, "proj1");
    expect(error?.status).toBe(403);
  });

  it("SUPER_ADMIN can edit any project", async () => {
    mockSession.mockResolvedValue(superSession());
    mockProject.findUnique.mockResolvedValue(editRecord);
    const { error } = await requireProjectEdit({} as any, "proj1");
    expect(error).toBeNull();
  });
});
