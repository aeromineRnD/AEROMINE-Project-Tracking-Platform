import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProjectEdit } from "@/lib/apiAuth";
import { notifyProjectClients } from "@/lib/notify";

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

  if (materials !== undefined && Array.isArray(materials) && materials.length > 0) {
    await notifyProjectClients(
      params.id,
      "Materials updated",
      `New materials have been logged for stage: ${owned.nameEn}.`,
    );
  }

  return NextResponse.json(stage);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  const owned = await prisma.stage.findFirst({
    where: { id: params.stageId, projectId: params.id },
  });
  if (!owned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Block deletion if a milestone is linked to this stage
  const linkedMilestone = await prisma.milestone.findFirst({
    where: { stageId: params.stageId },
    select: { title: true },
  });
  if (linkedMilestone) {
    return NextResponse.json(
      { error: `Cannot delete: milestone "${linkedMilestone.title}" is linked to this stage. Remove the link first.` },
      { status: 409 }
    );
  }

  // Block deletion if the stage has materials saved
  const hasMaterials = owned.materials && owned.materials !== "[]";
  if (hasMaterials) {
    return NextResponse.json(
      { error: `Cannot delete: stage "${owned.nameEn}" has materials logged. Remove them first.` },
      { status: 409 }
    );
  }

  await prisma.stage.delete({ where: { id: params.stageId } });

  return NextResponse.json({ success: true });
}
