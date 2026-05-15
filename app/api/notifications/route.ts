import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, unauthorized } from "@/lib/apiAuth";

// GET — fetch notifications for the current user (latest 30)
export async function GET(_req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.userId },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  return NextResponse.json({ notifications, unreadCount });
}

// PATCH — mark notifications as read (all, or specific IDs)
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const ids: string[] | undefined = body.ids;

  if (ids && ids.length > 0) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId: user.userId },
      data: { read: true },
    });
  } else {
    await prisma.notification.updateMany({
      where: { userId: user.userId, read: false },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
}
