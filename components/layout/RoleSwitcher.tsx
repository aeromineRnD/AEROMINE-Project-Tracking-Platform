"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Shield, User } from "lucide-react";
import { useRoleStore } from "@/lib/store/roleStore";

export function RoleSwitcher() {
  const { data: session } = useSession();
  const { viewMode, setViewMode } = useRoleStore();
  const router   = useRouter();
  const pathname = usePathname();

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) return null;

  const isAdminView = viewMode === "admin";

  function switchTo(mode: "admin" | "client") {
    setViewMode(mode);
    if (mode === "client" && !pathname.startsWith("/client")) {
      router.push("/client/dashboard");
    } else if (mode === "admin" && !pathname.startsWith("/admin")) {
      router.push("/admin/dashboard");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => switchTo("admin")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          isAdminView
            ? "bg-aeromine-600 text-white"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <Shield className="h-3.5 w-3.5" />
        Admin
      </button>
      <button
        onClick={() => switchTo("client")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          !isAdminView
            ? "bg-aeromine-600 text-white"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <User className="h-3.5 w-3.5" />
        Client
      </button>
      <span className="ml-1 rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-600">
        Preview
      </span>
    </div>
  );
}
