import { describe, it, expect } from "vitest";
import { isAdmin, isClient, isSuperAdmin, canViewProject, canEditProject } from "@/lib/permissions";

describe("Role helpers", () => {
  it("isAdmin returns true for ADMIN and SUPER_ADMIN", () => {
    expect(isAdmin("ADMIN")).toBe(true);
    expect(isAdmin("SUPER_ADMIN")).toBe(true);
    expect(isAdmin("CLIENT")).toBe(false);
  });

  it("isClient returns true only for CLIENT", () => {
    expect(isClient("CLIENT")).toBe(true);
    expect(isClient("ADMIN")).toBe(false);
    expect(isClient("SUPER_ADMIN")).toBe(false);
  });

  it("isSuperAdmin returns true only for SUPER_ADMIN", () => {
    expect(isSuperAdmin("SUPER_ADMIN")).toBe(true);
    expect(isSuperAdmin("ADMIN")).toBe(false);
  });
});

describe("canViewProject", () => {
  const project = { adminId: "admin1", clients: [{ clientId: "client1" }] };

  it("SUPER_ADMIN can view any project", () => {
    expect(canViewProject("SUPER_ADMIN", "anyone", project)).toBe(true);
  });

  it("ADMIN can view their own project", () => {
    expect(canViewProject("ADMIN", "admin1", project)).toBe(true);
  });

  it("ADMIN cannot view another admin's project", () => {
    expect(canViewProject("ADMIN", "admin2", project)).toBe(false);
  });

  it("CLIENT can view project they are assigned to", () => {
    expect(canViewProject("CLIENT", "client1", project)).toBe(true);
  });

  it("CLIENT cannot view project they are not assigned to", () => {
    expect(canViewProject("CLIENT", "client2", project)).toBe(false);
  });

  it("CLIENT with no assignments cannot view project", () => {
    const noClients = { adminId: "admin1", clients: [] };
    expect(canViewProject("CLIENT", "client1", noClients)).toBe(false);
  });
});

describe("canEditProject", () => {
  it("ADMIN can edit their own project", () => {
    expect(canEditProject("ADMIN", "admin1", "admin1")).toBe(true);
  });

  it("ADMIN cannot edit another admin's project", () => {
    expect(canEditProject("ADMIN", "admin2", "admin1")).toBe(false);
  });

  it("SUPER_ADMIN can edit any project", () => {
    expect(canEditProject("SUPER_ADMIN", "anyone", "admin1")).toBe(true);
  });

  it("CLIENT cannot edit any project", () => {
    expect(canEditProject("CLIENT", "admin1", "admin1")).toBe(false);
  });
});
