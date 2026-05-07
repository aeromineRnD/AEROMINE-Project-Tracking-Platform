import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProjectAccess, requireProjectEdit } from "@/lib/apiAuth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectAccess(req, params.id);
  if (error) return error;

  const updates = await prisma.update.findMany({
    where: { projectId: params.id },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(updates);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = await requireProjectEdit(req, params.id);
  if (error || !user) return error!;

  const body = await req.json();
  const { title, content, type, mediaUrls } = body;

  const update = await prisma.update.create({
    data: {
      projectId: params.id,
      authorId: user.userId,
      title,
      content,
      type: type ?? "TEXT",
      mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : null,
    },
    include: { author: { select: { id: true, name: true } } },
  });
  return NextResponse.json(update, { status: 201 });
}
