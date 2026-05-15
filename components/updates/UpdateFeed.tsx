import { Flag, Image as ImageIcon, FileText, Video, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import type { ProjectUpdate } from "@/types";

const ICONS = {
  TEXT:      FileText,
  PHOTO:     ImageIcon,
  VIDEO:     Video,
  DOCUMENT:  FileText,
  MILESTONE: Flag,
};

const ICON_COLORS = {
  TEXT:      "bg-slate-100 text-slate-600",
  PHOTO:     "bg-blue-100 text-blue-600",
  VIDEO:     "bg-purple-100 text-purple-600",
  DOCUMENT:  "bg-orange-100 text-orange-600",
  MILESTONE: "bg-green-100 text-green-600",
};

interface Props {
  updates: ProjectUpdate[];
}

export function UpdateFeed({ updates }: Props) {
  if (!updates.length) {
    return <p className="text-sm text-slate-400 py-4">No updates yet.</p>;
  }

  return (
    <div className="space-y-4">
      {updates.map((u) => {
        const Icon = ICONS[u.type] ?? TrendingUp;
        const iconClass = ICON_COLORS[u.type] ?? "bg-slate-100 text-slate-600";
        const mediaUrls: string[] = u.mediaUrls ? JSON.parse(u.mediaUrls) : [];

        return (
          <div key={u.id} className="flex gap-3">
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${iconClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{u.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{u.content}</p>
              {mediaUrls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {mediaUrls.map((url, i) => (
                    <img key={i} src={url} alt="" className="h-20 w-28 rounded object-cover border" />
                  ))}
                </div>
              )}
              <p className="mt-1 text-[11px] text-slate-400">
                {u.author?.name}
                {u.project && <span className="text-slate-300"> · {u.project.name}</span>}
                {" · "}{format(new Date(u.createdAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
