import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditProject, canViewProject } from "@/lib/permissions";
import type { Role } from "@/types";

export async function getSessionUser(): Promise<{ userId: string; role: Role } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return { userId: session.user.id, role: session.user.role as Role };
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/** Assert the caller is an admin (ADMIN or SUPER_ADMIN). */
export async function requireAdmin(_req?: NextRequest) {
  const user = await getSessionUser();
  if (!user) return { error: unauthorized(), user: null };
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")
    return { error: forbidden(), user: null };
  return { error: null, user };
}

/** Assert the caller can VIEW a specific project. */
export async function requireProjectAccess(_req: NextRequest, projectId: string) {
  const user = await getSessionUser();
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
export async function requireProjectEdit(_req: NextRequest, projectId: string) {
  const user = await getSessionUser();
  if (!user) return { error: unauthorized(), user: null, project: null };

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }), user: null, project: null };

  if (!canEditProject(user.role, user.userId, project.adminId))
    return { error: forbidden(), user: null, project: null };

  return { error: null, user, project };
}
