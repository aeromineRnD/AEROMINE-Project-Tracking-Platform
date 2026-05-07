import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProjectAccess, requireProjectEdit } from "@/lib/apiAuth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectAccess(req, params.id);
  if (error) return error;

  const milestones = await prisma.milestone.findMany({
    where: { projectId: params.id },
    orderBy: { dueDate: "asc" },
  });
  return NextResponse.json(milestones);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  const { title, description, dueDate } = await req.json();
  const milestone = await prisma.milestone.create({
    data: { projectId: params.id, title, description, dueDate: new Date(dueDate) },
  });
  return NextResponse.json(milestone, { status: 201 });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  const { milestoneId, completed } = await req.json();
  const milestone = await prisma.milestone.update({
    where: { id: milestoneId },
    data: { completed, completedAt: completed ? new Date() : null },
  });
  return NextResponse.json(milestone);
}
