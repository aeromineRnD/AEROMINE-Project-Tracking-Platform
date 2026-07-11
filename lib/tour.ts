const PANOEE_HOST_SUFFIX = ".panoee.net";

// Accepts a full <iframe> snippet, a Panoee URL, or a bare tour id.
// Returns the canonical Panoee embed src, or null when the input is not Panoee.
export function extractPanoeeUrl(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const srcMatch = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
  const candidate = (srcMatch ? srcMatch[1] : trimmed).trim();

  // Bare tour id (e.g. 6a48d1bc6a704985043448fe)
  if (/^[a-z0-9]{8,}$/i.test(candidate)) {
    return `https://tour.panoee.net/iframe/${candidate}`;
  }

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    if (host === "panoee.net" || host.endsWith(PANOEE_HOST_SUFFIX)) {
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
}
