import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDemoUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const user = getDemoUser(req);
  if (!user) return unauthorized();

  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    const projects = await prisma.project.findMany({
      where: user.role === "SUPER_ADMIN" ? {} : { adminId: user.userId },
      include: {
        stages: { orderBy: { order: "asc" } },
        clients: { include: { client: true } },
        _count: { select: { updates: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projects);
  }

  // CLIENT: only their assigned projects
  const assignments = await prisma.projectClient.findMany({
    where: { clientId: user.userId },
    include: {
      project: {
        include: {
          stages: { orderBy: { order: "asc" } },
          admin: { select: { id: true, name: true, email: true } },
          _count: { select: { updates: true } },
        },
      },
    },
  });
  return NextResponse.json(assignments.map((a) => a.project));
}

export async function POST(req: NextRequest) {
  const user = getDemoUser(req);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") return forbidden();

  const body = await req.json();
  const { name, location, startDate, estimatedEnd, status, coverImage, description } = body;

  const project = await prisma.project.create({
    data: {
      name,
      location,
      startDate: new Date(startDate),
      estimatedEnd: new Date(estimatedEnd),
      status: status ?? "IN_PROGRESS",
      coverImage: coverImage ?? null,
      description: description ?? null,
      adminId: user.userId,
    },
  });
  return NextResponse.json(project, { status: 201 });
}
