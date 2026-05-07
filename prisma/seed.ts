import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

async function createStages(projectId: string, progressValues: number[]) {
  const data = PRESET_STAGES.map((stage, i) => ({
    projectId,
    nameEn: stage.nameEn,
    nameEl: stage.nameEl,
    order: stage.order,
    progress: progressValues[i] ?? 0,
  }));
  await prisma.stage.createMany({ data });
}

async function main() {
  console.log("🌱 Seeding database...");

  // Wipe in dependency order
  await prisma.milestone.deleteMany();
  await prisma.update.deleteMany();
  await prisma.projectClient.deleteMany();
  await prisma.phase.deleteMany();
  await prisma.stage.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ──────────────────────────────────────────────────────────────────

  const adminAlpha = await prisma.user.create({
    data: {
      id: "user_admin_alpha",
      email: "stavros@alphaconstruct.gr",
      name: "Stavros Papadopoulos",
      role: "ADMIN",
    },
  });

  const adminBeta = await prisma.user.create({
    data: {
      id: "user_admin_beta",
      email: "maria@betabuild.gr",
      name: "Maria Georgiou",
      role: "ADMIN",
    },
  });

  const clientNikos = await prisma.user.create({
    data: {
      id: "user_client_nikos",
      email: "nikos.papadimitriou@gmail.com",
      name: "Nikos Papadimitriou",
      role: "CLIENT",
    },
  });

  const clientEleni = await prisma.user.create({
    data: {
      id: "user_client_eleni",
      email: "eleni.papadimitriou@gmail.com",
      name: "Eleni Papadimitriou",
      role: "CLIENT",
    },
  });

  const clientGeorge = await prisma.user.create({
    data: {
      id: "user_client_george",
      email: "george.katsaros@outlook.com",
      name: "George Katsaros",
      role: "CLIENT",
    },
  });

  console.log("✅ Users created");

  // ── Project 1: Glyfada Villa — well advanced ──────────────────────────────

  const project1 = await prisma.project.create({
    data: {
      id: "proj_glyfada_villa",
      name: "Glyfada Villa",
      location: "Glyfada, Athens, Greece",
      startDate: new Date("2024-03-01"),
      estimatedEnd: new Date("2025-10-30"),
      status: "IN_PROGRESS",
      description: "Luxury 4-bedroom villa with pool and rooftop terrace.",
      adminId: adminAlpha.id,
      coverImage: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
    },
  });

  await createStages(project1.id, [100, 90, 75, 60, 40, 35, 10, 0, 0, 0, 0, 0, 0]);

  await prisma.projectClient.createMany({
    data: [
      { projectId: project1.id, clientId: clientNikos.id },
      { projectId: project1.id, clientId: clientEleni.id },
    ],
  });

  await prisma.update.createMany({
    data: [
      {
        projectId: project1.id,
        authorId: adminAlpha.id,
        title: "Foundation complete",
        content: "Concrete slab poured and fully cured. Passed all inspections with zero defects. Ready to begin structural frame.",
        type: "MILESTONE",
        createdAt: new Date("2024-05-10"),
      },
      {
        projectId: project1.id,
        authorId: adminAlpha.id,
        title: "Structural frame 90% complete",
        content: "All ground and first floor columns erected. Second floor beams being placed this week. On schedule.",
        type: "PHOTO",
        mediaUrls: JSON.stringify(["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80"]),
        createdAt: new Date("2024-08-22"),
      },
      {
        projectId: project1.id,
        authorId: adminAlpha.id,
        title: "Roofing structural work underway",
        content: "Steel beams for the roof structure installed. Waterproofing membrane to follow next week.",
        type: "TEXT",
        createdAt: new Date("2024-11-05"),
      },
      {
        projectId: project1.id,
        authorId: adminAlpha.id,
        title: "Masonry walls 60% complete",
        content: "Exterior walls on ground floor finished. First floor brickwork ongoing. Interior partition walls starting.",
        type: "PHOTO",
        mediaUrls: JSON.stringify(["https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=80"]),
        createdAt: new Date("2025-01-18"),
      },
      {
        projectId: project1.id,
        authorId: adminAlpha.id,
        title: "Plumbing rough-in started",
        content: "Main supply lines and drainage roughed in on ground floor. Bathroom stacks installed.",
        type: "TEXT",
        createdAt: new Date("2025-03-02"),
      },
    ],
  });

  await prisma.milestone.createMany({
    data: [
      { projectId: project1.id, title: "Foundation complete",        dueDate: new Date("2024-05-15"), completed: true,  completedAt: new Date("2024-05-10") },
      { projectId: project1.id, title: "Structural frame complete",   dueDate: new Date("2024-09-01"), completed: true,  completedAt: new Date("2024-08-28") },
      { projectId: project1.id, title: "Roof watertight",             dueDate: new Date("2024-12-01"), completed: false },
      { projectId: project1.id, title: "Shell complete",              dueDate: new Date("2025-04-01"), completed: false },
      { projectId: project1.id, title: "Final handover",              dueDate: new Date("2025-10-30"), completed: false },
    ],
  });

  // Phases for Glyfada Villa — Example_2 models
  await prisma.phase.createMany({
    data: [
      {
        projectId: project1.id,
        name: "Phase 1",
        order: 1,
        capturedAt: new Date("2024-06-15"),
        overallProgress: 20,
        modelPath: "/models/Example_2_phase_1/scene.gltf",
        stageSnapshot: JSON.stringify([
          { nameEn: "Foundation",           nameEl: "Θεμελίωση",           progress: 100 },
          { nameEn: "Structural Frame",     nameEl: "Φέρων Οργανισμός",    progress: 25  },
          { nameEn: "Roofing",              nameEl: "Στέγη",                progress: 0   },
          { nameEn: "Masonry / Walls",      nameEl: "Τοιχοποιία",          progress: 0   },
          { nameEn: "Plumbing Rough-in",    nameEl: "Υδραυλικές Εργασίες", progress: 0   },
          { nameEn: "Electrical Rough-in",  nameEl: "Ηλεκτρολογικές",      progress: 0   },
          { nameEn: "Insulation",           nameEl: "Μόνωση",               progress: 0   },
          { nameEn: "Plastering",           nameEl: "Σοβάδες",              progress: 0   },
          { nameEn: "Tiling / Flooring",    nameEl: "Πλακάκια / Δάπεδα",   progress: 0   },
          { nameEn: "Fixtures & Fittings",  nameEl: "Εξοπλισμός",          progress: 0   },
          { nameEn: "Painting / Finishing", nameEl: "Βαφή / Φινίρισμα",    progress: 0   },
          { nameEn: "External Works",       nameEl: "Περιβάλλων Χώρος",    progress: 0   },
          { nameEn: "Final Inspection",     nameEl: "Τελική Επιθεώρηση",   progress: 0   },
        ]),
      },
      {
        projectId: project1.id,
        name: "Phase 2",
        order: 2,
        capturedAt: new Date("2025-02-10"),
        overallProgress: 80,
        modelPath: "/models/Example_2_phase_2/scene.gltf",
        stageSnapshot: JSON.stringify([
          { nameEn: "Foundation",           nameEl: "Θεμελίωση",           progress: 100 },
          { nameEn: "Structural Frame",     nameEl: "Φέρων Οργανισμός",    progress: 100 },
          { nameEn: "Roofing",              nameEl: "Στέγη",                progress: 100 },
          { nameEn: "Masonry / Walls",      nameEl: "Τοιχοποιία",          progress: 90  },
          { nameEn: "Plumbing Rough-in",    nameEl: "Υδραυλικές Εργασίες", progress: 70  },
          { nameEn: "Electrical Rough-in",  nameEl: "Ηλεκτρολογικές",      progress: 60  },
          { nameEn: "Insulation",           nameEl: "Μόνωση",               progress: 20  },
          { nameEn: "Plastering",           nameEl: "Σοβάδες",              progress: 0   },
          { nameEn: "Tiling / Flooring",    nameEl: "Πλακάκια / Δάπεδα",   progress: 0   },
          { nameEn: "Fixtures & Fittings",  nameEl: "Εξοπλισμός",          progress: 0   },
          { nameEn: "Painting / Finishing", nameEl: "Βαφή / Φινίρισμα",    progress: 0   },
          { nameEn: "External Works",       nameEl: "Περιβάλλων Χώρος",    progress: 0   },
          { nameEn: "Final Inspection",     nameEl: "Τελική Επιθεώρηση",   progress: 0   },
        ]),
      },
    ],
  });

  console.log("✅ Project 1 — Glyfada Villa");

  // ── Project 2: Kifisia Residence — early stage ────────────────────────────

  const project2 = await prisma.project.create({
    data: {
      id: "proj_kifisia",
      name: "Kifisia Residence",
      location: "Kifisia, Athens, Greece",
      startDate: new Date("2024-09-15"),
      estimatedEnd: new Date("2026-06-30"),
      status: "IN_PROGRESS",
      description: "Modern 3-storey apartment building, 6 units.",
      adminId: adminAlpha.id,
      coverImage: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
    },
  });

  await createStages(project2.id, [100, 45, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  await prisma.projectClient.create({
    data: { projectId: project2.id, clientId: clientGeorge.id },
  });

  await prisma.update.createMany({
    data: [
      {
        projectId: project2.id,
        authorId: adminAlpha.id,
        title: "Site preparation complete",
        content: "Ground cleared, topsoil removed, survey pegs set. Ready for excavation.",
        type: "PHOTO",
        mediaUrls: JSON.stringify(["https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80"]),
        createdAt: new Date("2024-09-20"),
      },
      {
        projectId: project2.id,
        authorId: adminAlpha.id,
        title: "Foundation poured",
        content: "Raft foundation 100% complete. Curing for 28 days.",
        type: "MILESTONE",
        createdAt: new Date("2024-12-10"),
      },
      {
        projectId: project2.id,
        authorId: adminAlpha.id,
        title: "Structural frame in progress — 45%",
        content: "Ground floor columns complete. First floor slab formwork in place.",
        type: "PHOTO",
        mediaUrls: JSON.stringify(["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80"]),
        createdAt: new Date("2025-03-08"),
      },
    ],
  });

  await prisma.milestone.createMany({
    data: [
      { projectId: project2.id, title: "Foundation complete",       dueDate: new Date("2024-12-15"), completed: true,  completedAt: new Date("2024-12-10") },
      { projectId: project2.id, title: "Structural frame complete", dueDate: new Date("2025-07-01"), completed: false },
      { projectId: project2.id, title: "Shell complete",            dueDate: new Date("2026-01-15"), completed: false },
      { projectId: project2.id, title: "Final handover",            dueDate: new Date("2026-06-30"), completed: false },
    ],
  });

  // Phases for Kifisia Residence — Example_1 models
  await prisma.phase.createMany({
    data: [
      {
        projectId: project2.id,
        name: "Phase 1",
        order: 1,
        capturedAt: new Date("2024-11-20"),
        overallProgress: 20,
        modelPath: "/models/Example_1_phase_1/scene.gltf",
        stageSnapshot: JSON.stringify([
          { nameEn: "Foundation",           nameEl: "Θεμελίωση",           progress: 100 },
          { nameEn: "Structural Frame",     nameEl: "Φέρων Οργανισμός",    progress: 20  },
          { nameEn: "Roofing",              nameEl: "Στέγη",                progress: 0   },
          { nameEn: "Masonry / Walls",      nameEl: "Τοιχοποιία",          progress: 0   },
          { nameEn: "Plumbing Rough-in",    nameEl: "Υδραυλικές Εργασίες", progress: 0   },
          { nameEn: "Electrical Rough-in",  nameEl: "Ηλεκτρολογικές",      progress: 0   },
          { nameEn: "Insulation",           nameEl: "Μόνωση",               progress: 0   },
          { nameEn: "Plastering",           nameEl: "Σοβάδες",              progress: 0   },
          { nameEn: "Tiling / Flooring",    nameEl: "Πλακάκια / Δάπεδα",   progress: 0   },
          { nameEn: "Fixtures & Fittings",  nameEl: "Εξοπλισμός",          progress: 0   },
          { nameEn: "Painting / Finishing", nameEl: "Βαφή / Φινίρισμα",    progress: 0   },
          { nameEn: "External Works",       nameEl: "Περιβάλλων Χώρος",    progress: 0   },
          { nameEn: "Final Inspection",     nameEl: "Τελική Επιθεώρηση",   progress: 0   },
        ]),
      },
      {
        projectId: project2.id,
        name: "Phase 2",
        order: 2,
        capturedAt: new Date("2025-03-08"),
        overallProgress: 80,
        modelPath: "/models/Example_1_phase_2/scene.gltf",
        stageSnapshot: JSON.stringify([
          { nameEn: "Foundation",           nameEl: "Θεμελίωση",           progress: 100 },
          { nameEn: "Structural Frame",     nameEl: "Φέρων Οργανισμός",    progress: 100 },
          { nameEn: "Roofing",              nameEl: "Στέγη",                progress: 80  },
          { nameEn: "Masonry / Walls",      nameEl: "Τοιχοποιία",          progress: 60  },
          { nameEn: "Plumbing Rough-in",    nameEl: "Υδραυλικές Εργασίες", progress: 40  },
          { nameEn: "Electrical Rough-in",  nameEl: "Ηλεκτρολογικές",      progress: 35  },
          { nameEn: "Insulation",           nameEl: "Μόνωση",               progress: 0   },
          { nameEn: "Plastering",           nameEl: "Σοβάδες",              progress: 0   },
          { nameEn: "Tiling / Flooring",    nameEl: "Πλακάκια / Δάπεδα",   progress: 0   },
          { nameEn: "Fixtures & Fittings",  nameEl: "Εξοπλισμός",          progress: 0   },
          { nameEn: "Painting / Finishing", nameEl: "Βαφή / Φινίρισμα",    progress: 0   },
          { nameEn: "External Works",       nameEl: "Περιβάλλων Χώρος",    progress: 0   },
          { nameEn: "Final Inspection",     nameEl: "Τελική Επιθεώρηση",   progress: 0   },
        ]),
      },
    ],
  });

  console.log("✅ Project 2 — Kifisia Residence");

  // ── Project 3: Vouliagmeni Penthouse — delayed ────────────────────────────

  const project3 = await prisma.project.create({
    data: {
      id: "proj_vouliagmeni",
      name: "Vouliagmeni Penthouse",
      location: "Vouliagmeni, Athens, Greece",
      startDate: new Date("2023-11-01"),
      estimatedEnd: new Date("2025-06-30"),
      status: "DELAYED",
      description: "Sea-view penthouse renovation and extension, full interior refurbishment.",
      adminId: adminBeta.id,
      coverImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    },
  });

  await createStages(project3.id, [100, 100, 100, 100, 80, 70, 65, 50, 20, 0, 0, 0, 0]);

  await prisma.projectClient.create({
    data: { projectId: project3.id, clientId: clientNikos.id },
  });

  await prisma.update.createMany({
    data: [
      {
        projectId: project3.id,
        authorId: adminBeta.id,
        title: "Demolition and structural reinforcement complete",
        content: "Old partition walls removed, structural beams strengthened.",
        type: "MILESTONE",
        createdAt: new Date("2024-02-14"),
      },
      {
        projectId: project3.id,
        authorId: adminBeta.id,
        title: "Delay notification — material supply issue",
        content: "Italian marble tiles delayed by supplier. New ETA is 8 weeks. Timeline adjusted.",
        type: "TEXT",
        createdAt: new Date("2024-06-01"),
      },
      {
        projectId: project3.id,
        authorId: adminBeta.id,
        title: "Plumbing 80% complete",
        content: "All supply and drainage runs complete. Underfloor heating pipes laid and tested.",
        type: "PHOTO",
        mediaUrls: JSON.stringify(["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"]),
        createdAt: new Date("2024-10-20"),
      },
      {
        projectId: project3.id,
        authorId: adminBeta.id,
        title: "Electrical rough-in 70% complete",
        content: "Distribution board installed. All conduit runs done. First fix wiring underway.",
        type: "TEXT",
        createdAt: new Date("2025-01-09"),
      },
      {
        projectId: project3.id,
        authorId: adminBeta.id,
        title: "Tiling started — 20%",
        content: "Master bathroom tiling complete. Kitchen floor substrate being levelled. Marble tiles arrived.",
        type: "PHOTO",
        mediaUrls: JSON.stringify(["https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80"]),
        createdAt: new Date("2025-03-15"),
      },
    ],
  });

  await prisma.milestone.createMany({
    data: [
      { projectId: project3.id, title: "Structural work complete",    dueDate: new Date("2024-02-20"), completed: true,  completedAt: new Date("2024-02-14") },
      { projectId: project3.id, title: "MEP rough-in complete",       dueDate: new Date("2024-08-01"), completed: false },
      { projectId: project3.id, title: "All tiling and flooring done", dueDate: new Date("2025-04-30"), completed: false },
      { projectId: project3.id, title: "Final handover",              dueDate: new Date("2025-09-30"), completed: false },
    ],
  });

  console.log("✅ Project 3 — Vouliagmeni Penthouse");

  console.log("\n🎉 Seed complete!");
  console.log("─────────────────────────────────────────");
  console.log("Demo accounts (no passwords — role-switch button used in demo):");
  console.log("  Admin 1  : stavros@alphaconstruct.gr   (Glyfada Villa, Kifisia Residence)");
  console.log("  Admin 2  : maria@betabuild.gr          (Vouliagmeni Penthouse)");
  console.log("  Client 1 : nikos.papadimitriou@gmail.com  (Glyfada Villa + Vouliagmeni)");
  console.log("  Client 2 : eleni.papadimitriou@gmail.com  (Glyfada Villa — same project as Nikos)");
  console.log("  Client 3 : george.katsaros@outlook.com    (Kifisia Residence)");
  console.log("─────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
