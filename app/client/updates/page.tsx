"use client";

import { Card, CardContent } from "@/components/ui/card";
import { UpdateFeed } from "@/components/updates/UpdateFeed";
import { useUpdates } from "@/lib/hooks/useProjects";

export default function ClientUpdatesPage() {
  const { updates, isLoading } = useUpdates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Updates</h1>
        <p className="text-sm text-slate-500">Latest news from your construction team</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : (
            <UpdateFeed updates={updates} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
