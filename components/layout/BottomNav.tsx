"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, FolderOpen, Bell, Settings, Users, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoleStore } from "@/lib/store/roleStore";
import { useT } from "@/lib/i18n/LanguageContext";

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { viewMode } = useRoleStore();
  const t = useT();

  const role     = session?.user?.role ?? "CLIENT";
  const isAdmin  = role === "ADMIN" || role === "SUPER_ADMIN";

  const adminNav = [
    { label: t("home"),     href: "/admin/dashboard",    icon: LayoutDashboard },
    { label: t("projects"), href: "/admin/projects",     icon: FolderOpen },
    { label: t("new"),      href: "/admin/projects/new", icon: PlusCircle },
    { label: t("clients"),  href: "/admin/clients",      icon: Users },
    { label: t("settings"), href: "/admin/settings",     icon: Settings },
  ];

  const clientNav = [
    { label: t("home"),     href: "/client/dashboard", icon: LayoutDashboard },
    { label: t("projects"), href: "/client/projects",  icon: FolderOpen },
    { label: t("updates"),  href: "/client/updates",   icon: Bell },
    { label: t("settings"), href: "/client/settings",  icon: Settings },
  ];

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
