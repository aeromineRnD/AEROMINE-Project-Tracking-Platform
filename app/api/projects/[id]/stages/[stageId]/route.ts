import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProjectEdit } from "@/lib/apiAuth";

type Ctx = { params: { id: string; stageId: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  const owned = await prisma.stage.findFirst({
    where: { id: params.stageId, projectId: params.id },
  });
  if (!owned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { nameEn, nameEl, order, materials } = await req.json();

  const stage = await prisma.stage.update({
    where: { id: params.stageId },
    data: {
      ...(nameEn     !== undefined && { nameEn }),
      ...(nameEl     !== undefined && { nameEl }),
      ...(order      !== undefined && { order }),
      ...(materials  !== undefined && {
        materials: Array.isArray(materials) && materials.length > 0
          ? JSON.stringify(materials)
          : null,
      }),
    },
  });

  return NextResponse.json(stage);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  const owned = await prisma.stage.findFirst({
    where: { id: params.stageId, projectId: params.id },
  });
  if (!owned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.stage.delete({ where: { id: params.stageId } });

  return NextResponse.json({ success: true });
}
