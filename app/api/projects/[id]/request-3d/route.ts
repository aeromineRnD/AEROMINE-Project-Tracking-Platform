import { type NextRequest, NextResponse } from "next/server";
import { requireProjectAccess, getSessionUser } from "@/lib/apiAuth";
import { notifyProjectAdmin } from "@/lib/notify";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Clients can access this — requireProjectAccess allows both admin and client
  const { error } = await requireProjectAccess(req, params.id);
  if (error) return error;

  const user = (await getSessionUser())!;

  await notifyProjectAdmin(
    params.id,
    "3D Walkthrough Requested",
    `Client has requested a 3D walkthrough of the construction site.`,
  );

  return NextResponse.json({ success: true });
}
