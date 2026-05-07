import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProjectEdit } from "@/lib/apiAuth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  const clients = await prisma.projectClient.findMany({
    where: { projectId: params.id },
    include: { client: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  const { clientId } = await req.json();
  const assignment = await prisma.projectClient.create({
    data: { projectId: params.id, clientId },
    include: { client: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(assignment, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireProjectEdit(req, params.id);
  if (error) return error;

  const { clientId } = await req.json();
  await prisma.projectClient.delete({
    where: { projectId_clientId: { projectId: params.id, clientId } },
  });
  return NextResponse.json({ success: true });
}
