"use client";

import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpdateFeed } from "@/components/updates/UpdateFeed";
import { useUpdates } from "@/lib/hooks/useProjects";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ClientRequest {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  project?: { id: string; name: string } | null;
}

export default function AdminUpdatesPage() {
  const { updates, isLoading } = useUpdates();

  const { data: notifData } = useSWR<{ notifications: ClientRequest[] }>(
    "/api/notifications",
    fetcher,
    { refreshInterval: 30000 }
  );

  const clientRequests = (notifData?.notifications ?? []).filter((n) =>
    n.title.toLowerCase().includes("request")
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Updates</h1>
        <p className="text-sm text-slate-500">Activity across all projects</p>
      </div>

      {clientRequests.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-aeromine-500" />
              Client Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {clientRequests.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-lg p-3 ${n.read ? "bg-slate-50" : "bg-aeromine-50"}`}
              >
                <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${n.read ? "bg-slate-300" : "bg-aeromine-500"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {n.project?.name && <span className="text-slate-300">{n.project.name} · </span>}
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Posted Updates</CardTitle>
        </CardHeader>
        <CardContent>
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
