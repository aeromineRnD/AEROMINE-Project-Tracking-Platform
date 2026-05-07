import type { Role } from "@/types";

export function isAdmin(role: Role): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isSuperAdmin(role: Role): boolean {
  return role === "SUPER_ADMIN";
}

export function isClient(role: Role): boolean {
  return role === "CLIENT";
}

/**
 * Checks if a user can view a project.
 * Admins see all projects they own; clients only see assigned projects.
 */
export function canViewProject(
  userRole: Role,
  userId: string,
  project: { adminId: string; clients?: { clientId: string }[] }
): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  if (userRole === "ADMIN") return project.adminId === userId;
  return project.clients?.some((c) => c.clientId === userId) ?? false;
}

/**
 * Checks if a user can edit a project (post updates, change stage progress).
 */
export function canEditProject(
  userRole: Role,
  userId: string,
  projectAdminId: string
): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  if (userRole === "ADMIN") return projectAdminId === userId;
  return false;
}
