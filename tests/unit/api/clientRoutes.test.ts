/**
 * Tests for GET /api/clients tenant scoping:
 * Admin A must only see clients assigned to their own projects,
 * not clients from Admin B's projects.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findMany: vi.fn(), create: vi.fn() },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { GET as listClients, POST as createClient } from "@/app/api/clients/route";

const mockSession = getServerSession as ReturnType<typeof vi.fn>;
const db          = prisma as any;

const adminSession  = (id = "admin1") => ({ user: { id, role: "ADMIN",  name: "A", email: "a@test.com" } });
const clientSession = (id = "c1")     => ({ user: { id, role: "CLIENT", name: "C", email: "c@test.com" } });

function req(method = "GET", body?: object) {
  return new NextRequest("http://localhost/api/clients", {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => vi.clearAllMocks());

// ── GET /api/clients ─────────────────────────────────────────────────────────

describe("GET /api/clients", () => {
  it("401 when unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    const res = await listClients(req());
    expect(res.status).toBe(401);
  });

  it("403 when a client tries to list clients", async () => {
    mockSession.mockResolvedValue(clientSession());
    const res = await listClients(req());
    expect(res.status).toBe(403);
  });

  it("admin query is scoped to their own project clients only", async () => {
    mockSession.mockResolvedValue(adminSession("admin1"));
    const scopedClient = { id: "c1", name: "Nikos", email: "n@n.com", createdAt: "", clientProjects: [] };
    db.user.findMany.mockResolvedValue([scopedClient]);

    const res  = await listClients(req());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    // Verify Prisma was called with the admin's project scope
    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: "CLIENT",
          clientProjects: { some: { project: { adminId: "admin1" } } },
        }),
      })
    );
  });

  it("admin cannot see clients from another admin's projects", async () => {
    mockSession.mockResolvedValue(adminSession("admin2"));
    db.user.findMany.mockResolvedValue([]); // admin2 has no clients

    const res  = await listClients(req());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(0);
    // Scope must be admin2's projects, not admin1's
    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          clientProjects: { some: { project: { adminId: "admin2" } } },
        }),
      })
    );
  });
});

// ── POST /api/clients ────────────────────────────────────────────────────────

describe("POST /api/clients", () => {
  it("401 when unauthenticated", async () => {
    mockSession.mockResolvedValue(null);
    const res = await createClient(req("POST", { name: "Test", email: "t@t.com" }));
    expect(res.status).toBe(401);
  });

  it("403 when client role tries to create a client", async () => {
    mockSession.mockResolvedValue(clientSession());
    const res = await createClient(req("POST", { name: "Test", email: "t@t.com" }));
    expect(res.status).toBe(403);
  });

  it("admin can create a new client", async () => {
    mockSession.mockResolvedValue(adminSession());
    db.user.create.mockResolvedValue({ id: "new_c", name: "Test", email: "t@t.com", role: "CLIENT" });
    const res = await createClient(req("POST", { name: "Test", email: "t@t.com" }));
    expect(res.status).toBe(201);
  });
});
