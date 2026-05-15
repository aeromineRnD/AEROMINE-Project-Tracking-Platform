import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProjectAccess, requireProjectEdit } from "@/lib/apiAuth";
import { notifyProjectClients } from "@/lib/notify";

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

/** After every stage progress update:
 *  - Stage hits 100%  → auto-complete milestones linked to that specific stage
 *  - All stages 100%  → project COMPLETED + all remaining milestones done
 *  - Any stage < 100% → project IN_PROGRESS
 */
async function syncProjectStatus(projectId: string, updatedStageId?: string) {
  const stages = await prisma.stage.findMany({ where: { projectId } });
  if (!stages.length) return;

  const now = new Date();

  // If a specific stage just hit 100%, complete its linked milestones
  if (updatedStageId) {
    const stage = stages.find((s) => s.id === updatedStageId);
    if (stage?.progress === 100) {
      await prisma.milestone.updateMany({
        where: { stageId: updatedStageId, completed: false },
        data: { completed: true, completedAt: now },
      });
    }
  }

  const allDone = stages.every((s) => s.progress === 100);

  await prisma.project.update({
    where: { id: projectId },
    data: { status: allDone ? "COMPLETED" : "IN_PROGRESS" },
  });

  // When whole project completes, mark any remaining milestones as done
  if (allDone) {
    await prisma.milestone.updateMany({
      where: { projectId, completed: false },
      data: { completed: true, completedAt: now },
    });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  const body = await req.json();

  // Bulk reorder: { reorder: [{ id, order }] }
  if (body.reorder) {
    const ids: string[] = body.reorder.map((s: { id: string }) => s.id);
    const owned = await prisma.stage.findMany({
      where: { id: { in: ids }, projectId: params.id },
      select: { id: true },
    });
    if (owned.length !== ids.length)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await Promise.all(
      body.reorder.map((s: { id: string; order: number }) =>
        prisma.stage.update({ where: { id: s.id }, data: { order: s.order } })
      )
    );
    return NextResponse.json({ success: true });
  }

  // Bulk update: { stages: [{ id, progress }] }
  if (body.stages) {
    const stageIds: string[] = body.stages.map((s: { id: string }) => s.id);
    // Verify all stage IDs belong to this project
    const owned = await prisma.stage.findMany({
      where: { id: { in: stageIds }, projectId: params.id },
      select: { id: true },
    });
    if (owned.length !== stageIds.length)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await Promise.all(
      body.stages.map((s: { id: string; progress: number }) =>
        prisma.stage.update({ where: { id: s.id }, data: { progress: s.progress } })
      )
    );
    await syncProjectStatus(params.id);
    return NextResponse.json({ success: true });
  }

  // Single update: { stageId, progress, modelPath? }
  const stageOwned = await prisma.stage.findFirst({
    where: { id: body.stageId, projectId: params.id },
  });
  if (!stageOwned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prisma.stage.update({
    where: { id: body.stageId },
    data: {
      ...(body.progress !== undefined && { progress: body.progress }),
      ...(body.modelPath !== undefined && { modelPath: body.modelPath }),
    },
  });

  await syncProjectStatus(params.id, body.stageId);

  if (body.progress !== undefined) {
    await notifyProjectClients(
      params.id,
      "Stage progress updated",
      `${stageOwned.nameEn} is now at ${body.progress}%.`,
    );
  }

  return NextResponse.json(updated);
}
