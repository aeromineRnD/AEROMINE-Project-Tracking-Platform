import { type NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSessionUser, unauthorized } from "@/lib/apiAuth";

const MAX_SIZE    = 50 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const formData = await req.formData();
  const file     = formData.get("file") as File | null;
  const category = (formData.get("category") as string) ?? "misc";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 50 MB)" }, { status: 413 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "File type not allowed" }, { status: 415 });

  // Use Vercel Blob in production, local filesystem in development
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const ext      = path.extname(file.name) || "";
    const filename = `${category}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const blob     = await put(filename, file, { access: "public" });
    return NextResponse.json({ url: blob.url }, { status: 201 });
  }

  // Local dev fallback — write to public/uploads/
  const buffer   = Buffer.from(await file.arrayBuffer());
  const ext      = path.extname(file.name) || "";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", category);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  return NextResponse.json({ url: `/uploads/${category}/${filename}` }, { status: 201 });
}