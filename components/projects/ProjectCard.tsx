import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { calcOverallProgress, STATUS_LABELS, type Project } from "@/types";
import { format } from "date-fns";

interface Props {
  project: Project;
  href: string;
}

export function ProjectCard({ project, href }: Props) {
  const progress = calcOverallProgress(project.stages ?? []);
  const statusInfo = STATUS_LABELS[project.status];

  return (
    <Link href={href}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        <div className="relative h-44 w-full bg-slate-100">
          {project.coverImage ? (
            <Image
              src={project.coverImage}
              alt={project.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300 text-sm">No image</div>
          )}
          <Badge
            className="absolute top-2 right-2"
            variant={project.status === "IN_PROGRESS" ? "inprogress" : project.status === "COMPLETED" ? "completed" : "delayed"}
          >
            {statusInfo.en}
          </Badge>
        </div>
        <CardContent className="pt-4 pb-4">
          <h3 className="font-semibold text-slate-900 truncate">{project.name}</h3>
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{project.location}</span>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Progress</span>
              <span className="font-medium text-slate-700">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
            <Calendar className="h-3 w-3" />
            <span>Est. {format(new Date(project.estimatedEnd), "MMM d, yyyy")}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
