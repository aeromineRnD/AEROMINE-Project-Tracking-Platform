import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProjectAccess, requireProjectEdit } from "@/lib/apiAuth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectAccess(req, params.id);
  if (error) return error;

  const full = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      stages: { orderBy: { order: "asc" } },
      phases: { orderBy: { order: "asc" } },
      admin: { select: { id: true, name: true, email: true } },
      clients: { include: { client: { select: { id: true, name: true, email: true } } } },
      updates: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
      milestones: { orderBy: { dueDate: "asc" } },
    },
  });
  return NextResponse.json(full);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  const body = await req.json();
  const { name, location, startDate, estimatedEnd, status, coverImage, description } = body;

  const updated = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(name && { name }),
      ...(location && { location }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(estimatedEnd && { estimatedEnd: new Date(estimatedEnd) }),
      ...(status && { status }),
      ...(coverImage !== undefined && { coverImage }),
      ...(description !== undefined && { description }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
