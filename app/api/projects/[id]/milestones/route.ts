import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProjectAccess, requireProjectEdit } from "@/lib/apiAuth";
import { notifyProjectClients } from "@/lib/notify";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectAccess(req, params.id);
  if (error) return error;

  const milestones = await prisma.milestone.findMany({
    where: { projectId: params.id },
    include: { stage: { select: { id: true, nameEn: true } } },
    orderBy: { dueDate: "asc" },
  });
  return NextResponse.json(milestones);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  const { title, description, dueDate, stageId } = await req.json();

  if (stageId) {
    const stage = await prisma.stage.findFirst({ where: { id: stageId, projectId: params.id } });
    if (!stage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const milestone = await prisma.milestone.create({
    data: {
      projectId: params.id,
      title,
      description,
      dueDate: new Date(dueDate),
      stageId: stageId ?? null,
    },
    include: { stage: { select: { id: true, nameEn: true } } },
  });

  await notifyProjectClients(params.id, `New milestone: ${title}`, description || `Due ${new Date(dueDate).toLocaleDateString()}`);

  return NextResponse.json(milestone, { status: 201 });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  const { milestoneId, completed } = await req.json();

  const existing = await prisma.milestone.findFirst({ where: { id: milestoneId, projectId: params.id } });
  if (!existing) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const milestone = await prisma.milestone.update({
    where: { id: milestoneId },
    data: { completed, completedAt: completed ? new Date() : null },
  });

  if (completed) {
    await notifyProjectClients(params.id, `Milestone completed: ${existing.title}`, "A project milestone has been reached.");
  }

  return NextResponse.json(milestone);
}
