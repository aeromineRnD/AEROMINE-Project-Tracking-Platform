import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, unauthorized } from "@/lib/apiAuth";

export async function GET(_req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    const updates = await prisma.update.findMany({
      where: {
        project: user.role === "SUPER_ADMIN" ? {} : { adminId: user.userId },
      },
      include: {
        author: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(updates);
  }

  // CLIENT: updates from projects they are assigned to
  const assignments = await prisma.projectClient.findMany({
    where: { clientId: user.userId },
    select: { projectId: true },
  });
  const projectIds = assignments.map((a) => a.projectId);

  if (projectIds.length === 0) return NextResponse.json([]);

  const updates = await prisma.update.findMany({
    where: { projectId: { in: projectIds } },
    include: {
      author: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(updates);
}
