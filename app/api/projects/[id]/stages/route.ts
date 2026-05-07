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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  const body = await req.json();
  // body: { stageId, progress } OR { stages: [{ id, progress }] } for bulk
  if (body.stages) {
    await Promise.all(
      body.stages.map((s: { id: string; progress: number }) =>
        prisma.stage.update({ where: { id: s.id }, data: { progress: s.progress } })
      )
    );
    return NextResponse.json({ success: true });
  }

  const updated = await prisma.stage.update({
    where: { id: body.stageId },
    data: {
      ...(body.progress !== undefined && { progress: body.progress }),
      ...(body.modelPath !== undefined && { modelPath: body.modelPath }),
    },
  });
  return NextResponse.json(updated);
}
