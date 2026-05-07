import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canEditProject, canViewProject } from "@/lib/permissions";
import type { Role } from "@/types";

/**
 * Reads the demo role header set by the client-side role store.
 * In production this will be replaced by real session auth.
 */
export function getDemoUser(req: NextRequest): { userId: string; role: Role } | null {
  const userId = req.headers.get("x-demo-user-id");
  const role   = req.headers.get("x-demo-role") as Role | null;
  if (!userId || !role) return null;
  return { userId, role };
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/** Assert the caller is an admin (ADMIN or SUPER_ADMIN). */
export function requireAdmin(req: NextRequest) {
  const user = getDemoUser(req);
  if (!user) return { error: unauthorized(), user: null };
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")
    return { error: forbidden(), user: null };
  return { error: null, user };
}

/** Assert the caller can VIEW a specific project. */
export async function requireProjectAccess(req: NextRequest, projectId: string) {
  const user = getDemoUser(req);
  if (!user) return { error: unauthorized(), user: null, project: null };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { clients: { select: { clientId: true } } },
  });
  if (!project) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }), user: null, project: null };

  if (!canViewProject(user.role, user.userId, project))
    return { error: forbidden(), user: null, project: null };

  return { error: null, user, project };
}

/** Assert the caller can EDIT a specific project. */
export async function requireProjectEdit(req: NextRequest, projectId: string) {
  const user = getDemoUser(req);
  if (!user) return { error: unauthorized(), user: null, project: null };

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }), user: null, project: null };

  if (!canEditProject(user.role, user.userId, project.adminId))
    return { error: forbidden(), user: null, project: null };

  return { error: null, user, project };
}
