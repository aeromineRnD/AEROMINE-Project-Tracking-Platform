"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UpdateFeed } from "@/components/updates/UpdateFeed";
import { useProjects } from "@/lib/hooks/useProjects";
import type { ProjectUpdate } from "@/types";

export default function ClientUpdatesPage() {
  const { projects, isLoading: loading } = useProjects();
  const updates = useMemo(() =>
    projects
      .flatMap((p) => (p as any).updates ?? [])
      .sort((a: ProjectUpdate, b: ProjectUpdate) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [projects]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Updates</h1>
        <p className="text-sm text-slate-500">Latest news from your construction team</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          {loading ? <p className="text-sm text-slate-400">Loading…</p> : <UpdateFeed updates={updates} />}
        </CardContent>
      </Card>
    </div>
  );
}
