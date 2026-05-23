"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PlusCircle, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { useProjects } from "@/lib/hooks/useProjects";
import { useT } from "@/lib/i18n/LanguageContext";
import type { ProjectStatus } from "@/types";

export default function AdminProjectsPage() {
  const { projects, isLoading: loading } = useProjects();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "ALL">("ALL");
  const [clientFilter, setClientFilter] = useState("ALL");
  const t = useT();

  // Build unique client list from loaded projects
  const allClients = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) =>
      (p as any).clients?.forEach((pc: any) => {
        if (pc.client) map.set(pc.client.id, pc.client.name);
      })
    );
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [projects]);

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchClient = clientFilter === "ALL" ||
      (p as any).clients?.some((pc: any) => pc.client?.id === clientFilter);
    return matchSearch && matchStatus && matchClient;
  });

  const statusLabels: Record<string, string> = {
    ALL:         t("all"),
    IN_PROGRESS: t("statusInProgress"),
    COMPLETED:   t("statusCompleted"),
    DELAYED:     t("statusDelayed"),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("allProjects")}</h1>
          <p className="text-sm text-slate-500">{t("projectsTotal", { n: projects.length })}</p>
        </div>
        <Link href="/admin/projects/new">
          <Button><PlusCircle className="h-4 w-4" /> {t("newProject")}</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500"
            placeholder={t("searchProjects")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Client filter */}
        <div className="relative">
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-aeromine-500"
          >
            <option value="ALL">All Clients</option>
            {allClients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {(["ALL", "IN_PROGRESS", "COMPLETED", "DELAYED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-colors ${
              statusFilter === s
                ? "bg-aeromine-600 text-slate-900 border-aeromine-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-aeromine-400"
            }`}
          >
            {statusLabels[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}><CardContent className="pt-5 space-y-3">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400">{t("noProjectsMatchFilters")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} href={`/admin/projects/${p.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
