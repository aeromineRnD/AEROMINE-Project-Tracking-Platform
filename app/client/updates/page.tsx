"use client";

import { Card, CardContent } from "@/components/ui/card";
import { UpdateFeed } from "@/components/updates/UpdateFeed";
import { useUpdates } from "@/lib/hooks/useProjects";
import { useT } from "@/lib/i18n/LanguageContext";

export default function ClientUpdatesPage() {
  const { updates, isLoading } = useUpdates();
  const t = useT();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("updates")}</h1>
        <p className="text-sm text-slate-500">{t("latestNewsConstruction")}</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-sm text-slate-400">{t("loading")}</p>
          ) : (
            <UpdateFeed updates={updates} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
