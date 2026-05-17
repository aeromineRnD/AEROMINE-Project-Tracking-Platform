import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProjectEdit } from "@/lib/apiAuth";

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  const { contactEnabled } = await req.json();
  if (typeof contactEnabled !== "boolean") {
    return NextResponse.json({ error: "contactEnabled must be a boolean" }, { status: 400 });
  }

  const project = await prisma.project.update({
    where: { id: params.id },
    data: { contactEnabled },
    select: { id: true, contactEnabled: true },
  });

  return NextResponse.json(project);
}
