"use client";

import { useEffect, useState } from "react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { useRoleStore } from "@/lib/store/roleStore";
import type { Project } from "@/types";

export default function ClientProjectsPage() {
  const { currentUser } = useRoleStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects", {
      headers: { "x-demo-user-id": currentUser.id, "x-demo-role": currentUser.role },
    })
      .then((r) => r.json())
      .then((d) => { setProjects(d); setLoading(false); });
  }, [currentUser]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
        <p className="text-sm text-slate-500">{projects.length} project{projects.length !== 1 ? "s" : ""} assigned to you</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-slate-400">No projects assigned to your account yet.</p>
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
