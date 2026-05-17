import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProjectAccess } from "@/lib/apiAuth";
import { notifyProjectAdmin, notifyProjectClients } from "@/lib/notify";

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { error } = await requireProjectAccess(req, params.id);
  if (error) return error;

  const messages = await prisma.projectMessage.findMany({
    where: { projectId: params.id },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { name: true, role: true } } },
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { error, user, project } = await requireProjectAccess(req, params.id);
  if (error) return error;

  const { content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const message = await prisma.projectMessage.create({
    data: { projectId: params.id, authorId: user!.userId, content: content.trim() },
    include: { author: { select: { name: true, role: true } } },
  });

  if (user!.role === "CLIENT") {
    await notifyProjectAdmin(
      params.id,
      "New message",
      `${message.author.name} sent a message on ${project!.name}.`,
    );
  } else {
    await notifyProjectClients(
      params.id,
      "New reply",
      `The project team replied to your message on ${project!.name}.`,
    );
  }

  return NextResponse.json(message, { status: 201 });
}
