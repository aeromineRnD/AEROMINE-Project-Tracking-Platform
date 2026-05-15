import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProjectAccess, requireProjectEdit } from "@/lib/apiAuth";
import { notifyProjectClients } from "@/lib/notify";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectAccess(req, params.id);
  if (error) return error;

  const phases = await prisma.phase.findMany({
    where: { projectId: params.id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(phases);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  const body = await req.json();
  const { name, order, capturedAt, overallProgress, modelPath, stageSnapshot } = body;

  const phase = await prisma.phase.create({
    data: {
      projectId: params.id,
      name,
      order,
      capturedAt: new Date(capturedAt),
      overallProgress: overallProgress ?? 0,
      modelPath: modelPath ?? null,
      stageSnapshot: JSON.stringify(stageSnapshot),
    },
  });

  await notifyProjectClients(
    params.id,
    "New 3D model available",
    `A new drone capture (${name}) has been added to your project. Log in to view it.`
  );

  return NextResponse.json(phase, { status: 201 });
}
