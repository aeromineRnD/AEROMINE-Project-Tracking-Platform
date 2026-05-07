import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDemoUser, unauthorized, forbidden } from "@/lib/apiAuth";

const PRESET_STAGES = [
  { nameEn: "Foundation",           nameEl: "Θεμελίωση",            order: 1  },
  { nameEn: "Structural Frame",     nameEl: "Φέρων Οργανισμός",     order: 2  },
  { nameEn: "Roofing",              nameEl: "Στέγη",                 order: 3  },
  { nameEn: "Masonry / Walls",      nameEl: "Τοιχοποιία",           order: 4  },
  { nameEn: "Plumbing Rough-in",    nameEl: "Υδραυλικές Εργασίες",  order: 5  },
  { nameEn: "Electrical Rough-in",  nameEl: "Ηλεκτρολογικές",       order: 6  },
  { nameEn: "Insulation",           nameEl: "Μόνωση",                order: 7  },
  { nameEn: "Plastering",           nameEl: "Σοβάδες",               order: 8  },
  { nameEn: "Tiling / Flooring",    nameEl: "Πλακάκια / Δάπεδα",    order: 9  },
  { nameEn: "Fixtures & Fittings",  nameEl: "Εξοπλισμός",           order: 10 },
  { nameEn: "Painting / Finishing", nameEl: "Βαφή / Φινίρισμα",     order: 11 },
  { nameEn: "External Works",       nameEl: "Περιβάλλων Χώρος",     order: 12 },
  { nameEn: "Final Inspection",     nameEl: "Τελική Επιθεώρηση",    order: 13 },
];

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

  // Create project + all 13 preset stages in one transaction
  const project = await prisma.$transaction(async (tx) => {
    const p = await tx.project.create({
      data: {
        name,
        location,
        startDate:    new Date(startDate),
        estimatedEnd: new Date(estimatedEnd),
        status:       status ?? "IN_PROGRESS",
        coverImage:   coverImage ?? null,
        description:  description ?? null,
        adminId:      user.userId,
      },
    });

    await tx.stage.createMany({
      data: PRESET_STAGES.map((s) => ({
        projectId: p.id,
        nameEn:    s.nameEn,
        nameEl:    s.nameEl,
        order:     s.order,
        progress:  0,
      })),
    });

    return p;
  });

  return NextResponse.json(project, { status: 201 });
}
