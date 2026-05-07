"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, LogOut, Settings, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { RoleSwitcher } from "./RoleSwitcher";
import { useRoleStore } from "@/lib/store/roleStore";

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function listener(e: MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    }
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

const INITIAL_NOTIFICATIONS = [
  { id: 1, text: "Foundation milestone achieved on Glyfada Villa", time: "2h ago", unread: true },
  { id: 2, text: "New update posted: Structural frame 90% complete", time: "1d ago", unread: true },
  { id: 3, text: "Plumbing rough-in started — Glyfada Villa", time: "3d ago", unread: false },
];

export function Header() {
  const { currentUser, setRole } = useRoleStore();
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen,  setUserOpen]  = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);

  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(userRef,  () => setUserOpen(false));

  const isAdmin      = currentUser.role === "ADMIN";
  const settingsHref = isAdmin ? "/admin/settings" : "/client/settings";
  const unreadCount  = notifications.filter((n) => n.unread).length;

  function markRead(id: number) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, unread: false } : n));
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  function handleLogout() {
    setUserOpen(false);
    setRole("admin");
    router.push("/admin/dashboard");
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6 z-30 relative">
      <div />

      <div className="flex items-center gap-3">
        <RoleSwitcher />

        {/* ── Notifications ─────────────────────────────────────── */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen((o) => !o); setUserOpen(false); }}
            className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-slate-500" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-aeromine-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-10 w-80 rounded-xl border bg-white shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-aeromine-600 hover:text-aeromine-800 hover:underline transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${
                      n.unread ? "bg-aeromine-50/50" : ""
                    }`}
                  >
                    <div
                      className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 transition-colors ${
                        n.unread ? "bg-aeromine-500" : "bg-slate-200"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs leading-snug ${n.unread ? "text-slate-800 font-medium" : "text-slate-500"}`}>
                        {n.text}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{n.time}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="px-4 py-2.5 border-t text-center">
                <p className="text-xs text-slate-400">Real notifications available in production</p>
              </div>
            </div>
          )}
        </div>

        {/* ── User avatar / dropdown ────────────────────────────── */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => { setUserOpen((o) => !o); setNotifOpen(false); }}
            className="flex items-center gap-2 rounded-full pr-1 hover:bg-slate-100 transition-colors pl-0.5 py-0.5"
            aria-label="User menu"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-aeromine-600 text-white text-sm font-semibold">
              {currentUser.name.charAt(0)}
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-10 w-56 rounded-xl border bg-white shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50">
                <p className="text-sm font-semibold text-slate-900 truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                <span className="mt-1 inline-block rounded-full bg-aeromine-100 px-2 py-0.5 text-[10px] font-semibold text-aeromine-700 uppercase tracking-wide">
                  {isAdmin ? "Admin" : "Client"}
                </span>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setUserOpen(false); router.push(settingsHref); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
