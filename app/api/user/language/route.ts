import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, unauthorized } from "@/lib/apiAuth";

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { language } = await req.json();
  if (language !== "en" && language !== "el")
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });

  await prisma.user.update({
    where: { id: user.userId },
    data: { language },
  });

  return NextResponse.json({ success: true });
}
