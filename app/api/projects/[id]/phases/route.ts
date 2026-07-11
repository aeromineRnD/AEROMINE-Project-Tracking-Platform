import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProjectAccess, requireProjectEdit } from "@/lib/apiAuth";
import { notifyProjectClients } from "@/lib/notify";
import { extractPanoeeUrl } from "@/lib/tour";

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
  const { name, order, capturedAt, overallProgress, category, modelPath, tourUrl, photoUrls, stageSnapshot } = body;

  const phase = await prisma.phase.create({
    data: {
      projectId: params.id,
      name,
      order,
      capturedAt: new Date(capturedAt),
      overallProgress: overallProgress ?? 0,
      category: category === "INTERIOR" ? "INTERIOR" : "EXTERIOR",
      modelPath: modelPath ?? null,
      tourUrl: extractPanoeeUrl(tourUrl),
      photoUrls: photoUrls?.length ? JSON.stringify(photoUrls) : null,
      stageSnapshot: JSON.stringify(stageSnapshot),
    },
  });

  const groupLabel = phase.category === "INTERIOR" ? "interior" : "exterior";
  const has3D    = !!modelPath;
  const notifTitle = has3D ? "New 3D model available" : "New photos available";
  const notifBody  = has3D
    ? `A new ${groupLabel} 3D model (${name}) has been added to your project. Log in to view it.`
    : `New ${groupLabel} photos (${name}) have been added to your project. Log in to view them.`;

  await notifyProjectClients(params.id, notifTitle, notifBody);

  return NextResponse.json(phase, { status: 201 });
}

// Bulk reorder — called after a phase is deleted to keep names consecutive.
// Body: [{ id, name, order }, ...]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  const items: { id: string; name: string; order: number }[] = await req.json();

  await prisma.$transaction(
    items.map(({ id, name, order }) =>
      prisma.phase.update({ where: { id }, data: { name, order } })
    )
  );

  return NextResponse.json({ ok: true });
}
