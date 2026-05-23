import { type NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSessionUser, unauthorized } from "@/lib/apiAuth";

const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "video/mp4", "video/quicktime", "video/webm",
];

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  // ── Client upload flow (production Vercel Blob) ──────────────────────────
  // The @vercel/blob/client upload() sends JSON bodies for token + completion.
  if (contentType.includes("application/json") && process.env.BLOB_READ_WRITE_TOKEN) {
    const body = (await req.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        const user = await getSessionUser();
        if (!user) throw new Error("Unauthorized");
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_SIZE,
        };
      },
      onUploadCompleted: async () => {
        // Nothing extra needed — URL is returned directly to the client.
      },
    });

    return NextResponse.json(jsonResponse);
  }

  // ── Server-side upload (dev fallback / FormData) ─────────────────────────
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const formData = await req.formData();
  const file     = formData.get("file") as File | null;
  const category = (formData.get("category") as string) ?? "misc";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 100 MB)" }, { status: 413 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "File type not allowed" }, { status: 415 });

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const ext      = path.extname(file.name) || "";
    const filename = `${category}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const blob     = await put(filename, file, { access: "public" });
    return NextResponse.json({ url: blob.url }, { status: 201 });
  }

  // Local dev — write to public/uploads/
  const buffer    = Buffer.from(await file.arrayBuffer());
  const ext       = path.extname(file.name) || "";
  const filename  = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", category);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  return NextResponse.json({ url: `/uploads/${category}/${filename}` }, { status: 201 });
}
