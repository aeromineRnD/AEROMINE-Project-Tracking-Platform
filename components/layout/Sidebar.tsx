"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, FolderOpen, Bell, Settings,
  Users, PlusCircle, Building2, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoleStore } from "@/lib/store/roleStore";

const adminNav = [
  { label: "Dashboard",     href: "/admin/dashboard",   icon: LayoutDashboard },
  { label: "All Projects",  href: "/admin/projects",    icon: FolderOpen },
  { label: "Create Project",href: "/admin/projects/new",icon: PlusCircle },
  { label: "Clients",       href: "/admin/clients",     icon: Users },
  { label: "Updates",       href: "/admin/updates",     icon: Bell },
  { label: "Settings",      href: "/admin/settings",    icon: Settings },
];

const clientNav = [
  { label: "Dashboard",  href: "/client/dashboard", icon: LayoutDashboard },
  { label: "My Projects",href: "/client/projects",  icon: FolderOpen },
  { label: "Updates",    href: "/client/updates",   icon: Bell },
  { label: "Settings",   href: "/client/settings",  icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { currentUser, setRole } = useRoleStore();
  const isAdmin  = currentUser.role === "ADMIN";
  const navItems = isAdmin ? adminNav : clientNav;

  function handleLogout() {
    setRole("admin");
    router.push("/admin/dashboard");
  }

  return (
    <aside className="flex h-full w-[200px] flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
        <Building2 className="h-6 w-6 text-aeromine-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-white leading-tight">Aeromine</p>
          <p className="text-[10px] text-aeromine-400 uppercase tracking-widest font-medium">SiteView</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-aeromine-600 text-white"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-aeromine-600 text-white text-sm font-semibold flex-shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{currentUser.name}</p>
            <p className="truncate text-[10px] text-slate-400">
              {isAdmin ? "Admin" : "Client"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="flex-shrink-0 text-slate-500 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
