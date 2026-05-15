"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, FolderOpen, Bell, Settings, Users, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoleStore } from "@/lib/store/roleStore";

const adminNav = [
  { label: "Home",     href: "/admin/dashboard",    icon: LayoutDashboard },
  { label: "Projects", href: "/admin/projects",     icon: FolderOpen },
  { label: "New",      href: "/admin/projects/new", icon: PlusCircle },
  { label: "Clients",  href: "/admin/clients",      icon: Users },
  { label: "Settings", href: "/admin/settings",     icon: Settings },
];

const clientNav = [
  { label: "Home",     href: "/client/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/client/projects",  icon: FolderOpen },
  { label: "Updates",  href: "/client/updates",   icon: Bell },
  { label: "Settings", href: "/client/settings",  icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { viewMode } = useRoleStore();

  const role     = session?.user?.role ?? "CLIENT";
  const isAdmin  = role === "ADMIN" || role === "SUPER_ADMIN";
  const navItems = isAdmin && viewMode === "admin" ? adminNav : clientNav;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border flex items-center justify-around px-2 h-16 safe-area-bottom">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[52px]",
              active ? "text-aeromine-400" : "text-slate-500"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
