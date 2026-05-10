"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UpdateFeed } from "@/components/updates/UpdateFeed";
import type { Project, ProjectUpdate } from "@/types";

export default function AdminUpdatesPage() {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((projects: Project[]) => {
        const allUpdates = projects
          .flatMap((p) => (p as any).updates ?? [])
          .sort((a: ProjectUpdate, b: ProjectUpdate) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        setUpdates(allUpdates);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Updates</h1>
        <p className="text-sm text-slate-500">Activity across all projects</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : (
            <UpdateFeed updates={updates} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
