import { prisma } from "@/lib/db";

/**
 * Create in-app notifications for all clients assigned to a project.
 * Called from API routes whenever the admin takes a meaningful action.
 */
export async function notifyProjectClients(
  projectId: string,
  title: string,
  message: string,
) {
  const assignments = await prisma.projectClient.findMany({
    where: { projectId },
    select: { clientId: true },
  });

  if (!assignments.length) return;

  await prisma.notification.createMany({
    data: assignments.map((a) => ({
      userId: a.clientId,
      projectId,
      title,
      message,
    })),
  });
}

/**
 * Notify the project admin directly (e.g. client requests 3D walkthrough).
 */
export async function notifyProjectAdmin(
  projectId: string,
  title: string,
  message: string,
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { adminId: true },
  });
  if (!project) return;

  await prisma.notification.create({
    data: { userId: project.adminId, projectId, title, message },
  });
}
