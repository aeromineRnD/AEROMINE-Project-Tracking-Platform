"use client";

import { Flag, Image as ImageIcon, FileText, Video, TrendingUp, Download, Presentation } from "lucide-react";
import { format } from "date-fns";
import type { ProjectUpdate } from "@/types";
import { useT } from "@/lib/i18n/LanguageContext";

const TYPE_ICONS = {
  TEXT:      FileText,
  PHOTO:     ImageIcon,
  VIDEO:     Video,
  DOCUMENT:  FileText,
  MILESTONE: Flag,
};

const TYPE_COLORS = {
  TEXT:      "bg-slate-100 text-slate-600",
  PHOTO:     "bg-blue-100 text-blue-600",
  VIDEO:     "bg-purple-100 text-purple-600",
  DOCUMENT:  "bg-orange-100 text-orange-600",
  MILESTONE: "bg-green-100 text-green-600",
};

function fileIcon(url: string) {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (["jpg","jpeg","png","webp","gif"].includes(ext)) return null;
  if (ext === "pdf")                                    return { icon: FileText,     color: "text-red-500",    label: "PDF" };
  if (["ppt","pptx"].includes(ext))                    return { icon: Presentation,  color: "text-orange-500", label: "PPT" };
  if (["doc","docx"].includes(ext))                    return { icon: FileText,      color: "text-blue-500",   label: "DOC" };
  if (["mp4","mov","webm"].includes(ext))              return { icon: Video,          color: "text-purple-500", label: "Video" };
  return { icon: Download, color: "text-slate-500", label: "File" };
}

function fileName(url: string) {
  return decodeURIComponent(url.split("?")[0].split("/").pop() ?? url);
}

interface Props {
  updates: ProjectUpdate[];
}

export function UpdateFeed({ updates }: Props) {
  const t = useT();

  if (!updates.length) {
    return <p className="text-sm text-slate-400 py-4">{t("noUpdatesYet")}</p>;
  }

  return (
    <div className="space-y-4">
      {updates.map((u) => {
        const Icon      = TYPE_ICONS[u.type] ?? TrendingUp;
        const iconClass = TYPE_COLORS[u.type] ?? "bg-slate-100 text-slate-600";
        const mediaUrls: string[] = u.mediaUrls ? JSON.parse(u.mediaUrls) : [];

        const images   = mediaUrls.filter((url) => fileIcon(url) === null);
        const nonImages = mediaUrls.filter((url) => fileIcon(url) !== null);

        return (
          <div key={u.id} className="flex gap-3">
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${iconClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{u.title}</p>
              <p className="text-xs text-slate-500 mt-0.5 whitespace-pre-line">{u.content}</p>

              {/* Image thumbnails */}
              {images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {images.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt="" className="h-20 w-28 rounded object-cover border hover:opacity-90 transition-opacity" />
                    </a>
                  ))}
                </div>
              )}

              {/* Non-image files */}
              {nonImages.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {nonImages.map((url, i) => {
                    const info = fileIcon(url)!;
                    const FileIcon = info.icon;
                    return (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition-colors max-w-[200px]"
                      >
                        <FileIcon className={`h-3.5 w-3.5 flex-shrink-0 ${info.color}`} />
                        <span className="truncate">{fileName(url)}</span>
                        <Download className="h-3 w-3 flex-shrink-0 text-slate-400" />
                      </a>
                    );
                  })}
                </div>
              )}

              <p className="mt-1 text-[11px] text-slate-400">
                {u.author?.name}
                {u.project && <span className="text-slate-300"> · {u.project.name}</span>}
                {" · "}{format(new Date(u.createdAt), "dd/MM/yyyy")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
