import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/apiAuth";

export async function GET(_req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    select: { id: true, name: true, email: true, createdAt: true,
      clientProjects: { include: { project: { select: { id: true, name: true } } } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { name, email } = await req.json();
  const client = await prisma.user.create({
    data: { name, email, role: "CLIENT" },
  });
  return NextResponse.json(client, { status: 201 });
}
