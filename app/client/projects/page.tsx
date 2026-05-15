"use client";

import { ProjectCard } from "@/components/projects/ProjectCard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/lib/hooks/useProjects";
import { useT } from "@/lib/i18n/LanguageContext";

export default function ClientProjectsPage() {
  const { projects, isLoading: loading } = useProjects();
  const t = useT();

  const subtitle = projects.length === 1
    ? t("projectsAssignedSingular")
    : t("projectsAssignedPlural", { n: projects.length });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("myProjects")}</h1>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="pt-5 space-y-3">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent></Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <p className="text-sm text-slate-400">{t("noProjectsAssignedToAccount")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} href={`/client/projects/${p.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
