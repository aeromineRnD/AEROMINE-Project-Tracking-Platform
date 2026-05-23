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
  const { name, order, capturedAt, overallProgress, modelPath, photoUrls, stageSnapshot } = body;

  const phase = await prisma.phase.create({
    data: {
      projectId: params.id,
      name,
      order,
      capturedAt: new Date(capturedAt),
      overallProgress: overallProgress ?? 0,
      modelPath: modelPath ?? null,
      photoUrls: photoUrls?.length ? JSON.stringify(photoUrls) : null,
      stageSnapshot: JSON.stringify(stageSnapshot),
    },
  });

  const has3D    = !!modelPath;
  const notifTitle = has3D ? "New 3D model available" : "New photos available";
  const notifBody  = has3D
    ? `A new 3D model (${name}) has been added to your project. Log in to view it.`
    : `New photos (${name}) have been added to your project. Log in to view them.`;

  await notifyProjectClients(params.id, notifTitle, notifBody);

  return NextResponse.json(phase, { status: 201 });
}
