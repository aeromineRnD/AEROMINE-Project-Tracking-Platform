import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProjectAccess, requireProjectEdit } from "@/lib/apiAuth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectAccess(req, params.id);
  if (error) return error;

  const stages = await prisma.stage.findMany({
    where: { projectId: params.id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(stages);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  const body = await req.json();
  const { nameEn, nameEl, order, progress, modelPath } = body;

  const stage = await prisma.stage.create({
    data: { projectId: params.id, nameEn, nameEl, order, progress: progress ?? 0, modelPath: modelPath ?? null },
  });
  return NextResponse.json(stage, { status: 201 });
}

/** After every stage progress update, auto-set project status:
 *  - All stages 100%  → COMPLETED
 *  - Any stage < 100% → IN_PROGRESS  (even if project was COMPLETED)
 */
async function syncProjectStatus(projectId: string) {
  const stages = await prisma.stage.findMany({ where: { projectId } });
  if (!stages.length) return;

  const allDone = stages.every((s) => s.progress === 100);
  await prisma.project.update({
    where: { id: projectId },
    data: { status: allDone ? "COMPLETED" : "IN_PROGRESS" },
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  const body = await req.json();

  // Bulk update: { stages: [{ id, progress }] }
  if (body.stages) {
    await Promise.all(
      body.stages.map((s: { id: string; progress: number }) =>
        prisma.stage.update({ where: { id: s.id }, data: { progress: s.progress } })
      )
    );
    await syncProjectStatus(params.id);
    return NextResponse.json({ success: true });
  }

  // Single update: { stageId, progress, modelPath? }
  const updated = await prisma.stage.update({
    where: { id: body.stageId },
    data: {
      ...(body.progress !== undefined && { progress: body.progress }),
      ...(body.modelPath !== undefined && { modelPath: body.modelPath }),
    },
  });

  await syncProjectStatus(params.id);
  return NextResponse.json(updated);
}
