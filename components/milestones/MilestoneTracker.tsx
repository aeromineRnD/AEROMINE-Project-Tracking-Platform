import { CheckCircle2, Circle, Clock, Link2 } from "lucide-react";
import { format } from "date-fns";
import type { Milestone } from "@/types";

interface MilestoneWithStage extends Milestone {
  stage?: { id: string; nameEn: string } | null;
}

interface Props {
  milestones: MilestoneWithStage[];
  onToggle?: (milestoneId: string, completed: boolean) => void;
}

export function MilestoneTracker({ milestones, onToggle }: Props) {
  if (!milestones.length) {
    return <p className="text-sm text-slate-400 py-4">No milestones set.</p>;
  }

  return (
    <div className="space-y-3">
      {milestones.map((m) => (
        <div
          key={m.id}
          className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
            m.completed ? "border-green-200 bg-green-50" : "border-slate-200 bg-white"
          }`}
        >
          <button
            onClick={() => onToggle?.(m.id, !m.completed)}
            className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-green-500 transition-colors"
            disabled={!onToggle}
          >
            {m.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-medium ${m.completed ? "line-through text-slate-400" : "text-slate-900"}`}>
              {m.title}
            </p>
            {m.description && <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>}

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="h-3 w-3" />
                {m.completed && m.completedAt
                  ? `Completed ${format(new Date(m.completedAt), "MMM d, yyyy")}`
                  : `Due ${format(new Date(m.dueDate), "MMM d, yyyy")}`}
              </div>

              {/* Stage link badge */}
              {m.stage && (
                <div className="flex items-center gap-1 text-[11px] text-aeromine-600 bg-aeromine-50 rounded-full px-2 py-0.5 border border-aeromine-100">
                  <Link2 className="h-2.5 w-2.5" />
                  <span>{m.stage.nameEn}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
