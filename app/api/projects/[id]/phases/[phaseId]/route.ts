import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProjectEdit } from "@/lib/apiAuth";

type Ctx = { params: { id: string; phaseId: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  const { name, capturedAt, modelPath, photoUrls } = await req.json();

  const phase = await prisma.phase.update({
    where: { id: params.phaseId },
    data: {
      ...(name       !== undefined && { name }),
      ...(capturedAt !== undefined && { capturedAt: new Date(capturedAt) }),
      ...(modelPath  !== undefined && { modelPath: modelPath || null }),
      ...(photoUrls  !== undefined && {
        photoUrls: Array.isArray(photoUrls) && photoUrls.length > 0
          ? JSON.stringify(photoUrls)
          : null,
      }),
    },
  });

  return NextResponse.json(phase);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  await prisma.phase.delete({ where: { id: params.phaseId } });

  return NextResponse.json({ success: true });
}
