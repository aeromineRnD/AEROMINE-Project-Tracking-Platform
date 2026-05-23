"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT, useLanguage } from "@/lib/i18n/LanguageContext";

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const t = useT();
  const { locale, setLocale } = useLanguage();

  const name  = session?.user?.name  ?? "";
  const email = session?.user?.email ?? "";

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{t("settings")}</h1>

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle>{t("account")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-aeromine-600 text-slate-900 text-lg font-bold">
              {name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{name}</p>
              <p className="text-sm text-slate-500">{email}</p>
              <span className="mt-0.5 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 uppercase tracking-wide">
                {t("admin")}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 border-t pt-3">{t("profileEditingNote")}</p>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader><CardTitle>{t("branding")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border-2 border-dashed border-slate-200 p-6 text-center text-slate-400 cursor-pointer hover:border-aeromine-300 transition-colors">
            <p className="text-sm">{t("clickUploadLogo")}</p>
            <p className="text-xs mt-1">{t("logoFormats")}</p>
          </div>
          <p className="text-xs text-slate-400">{t("logoNote")}</p>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader><CardTitle>{t("language")}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-3">{t("choosePreferredLanguage")}</p>
          <div className="flex gap-3">
            {(["en", "el"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                  locale === l
                    ? "border-aeromine-600 bg-aeromine-50 text-aeromine-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-aeromine-300"
                }`}
              >
                {l === "en" ? t("english") : t("greek")}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
