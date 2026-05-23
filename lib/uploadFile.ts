/**
 * Upload a file to storage.
 *
 * Production (Vercel): uses @vercel/blob client upload — the file goes directly
 * from the browser to Vercel Blob, bypassing the 4.5 MB serverless body limit.
 *
 * Local dev (no BLOB_READ_WRITE_TOKEN): falls back to a FormData POST to
 * /api/uploads, which writes to public/uploads/ on disk.
 */

import { upload } from "@vercel/blob/client";

export async function uploadFile(file: File, category: string): Promise<string> {
  const ext      = file.name.includes(".") ? file.name.split(".").pop()! : "bin";
  const filename = `${category}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    const blob = await upload(filename, file, {
      access: "public",
      handleUploadUrl: "/api/uploads",
    });
    return blob.url;
  } catch {
    // Dev fallback — no BLOB_READ_WRITE_TOKEN, server writes to disk
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Upload failed (${res.status}): ${body}`);
    }
    const { url } = await res.json();
    return url;
  }
}
