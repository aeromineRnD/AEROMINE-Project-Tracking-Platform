"use client";

import { useRoleStore } from "@/lib/store/roleStore";
import { Button } from "@/components/ui/button";
import { Shield, User } from "lucide-react";

export function RoleSwitcher() {
  const { currentUser, toggleRole } = useRoleStore();
  const isAdmin = currentUser.role === "ADMIN";

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => useRoleStore.getState().setRole("admin")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          isAdmin
            ? "bg-aeromine-600 text-white"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <Shield className="h-3.5 w-3.5" />
        Admin
      </button>
      <button
        onClick={() => useRoleStore.getState().setRole("client")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          !isAdmin
            ? "bg-aeromine-600 text-white"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <User className="h-3.5 w-3.5" />
        Client
      </button>
      <span className="ml-1 rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-300">
        Preview Mode
      </span>
    </div>
  );
}
