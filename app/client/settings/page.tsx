"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoleStore } from "@/lib/store/roleStore";

export default function ClientSettingsPage() {
  const { currentUser } = useRoleStore();
  const [lang, setLang] = useState<"en" | "el">("en");

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-aeromine-600 text-white text-lg font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{currentUser.name}</p>
              <p className="text-sm text-slate-500">{currentUser.email}</p>
              <span className="mt-0.5 inline-block rounded-full bg-aeromine-100 px-2 py-0.5 text-[10px] font-semibold text-aeromine-700 uppercase tracking-wide">
                Client
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 border-t pt-3">
            Profile editing and password change available in the production version.
          </p>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader><CardTitle>Language</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-3">Choose your preferred interface language.</p>
          <div className="flex gap-3">
            {(["en", "el"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                  lang === l
                    ? "border-aeromine-600 bg-aeromine-50 text-aeromine-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-aeromine-300"
                }`}
              >
                {l === "en" ? "🇬🇧 English" : "🇬🇷 Ελληνικά"}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Full Greek translation wired in the next iteration.
          </p>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Email me when a progress update is posted", key: "email" },
            { label: "Email me when a milestone is reached",       key: "milestone" },
          ].map(({ label, key }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-slate-700">{label}</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-aeromine-600" />
            </label>
          ))}
          <p className="text-xs text-slate-400 border-t pt-3">
            Real email notifications available in production.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
