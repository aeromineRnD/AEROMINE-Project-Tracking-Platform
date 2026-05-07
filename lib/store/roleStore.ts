"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, User } from "@/types";

// Demo users for the role-switcher prototype
export const DEMO_USERS: Record<string, User> = {
  admin: {
    id: "user_admin_alpha",
    email: "stavros@alphaconstruct.gr",
    name: "Stavros Papadopoulos",
    role: "ADMIN",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  client: {
    id: "user_client_nikos",
    email: "nikos.papadimitriou@gmail.com",
    name: "Nikos Papadimitriou",
    role: "CLIENT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

interface RoleStore {
  currentUser: User;
  setRole: (role: "admin" | "client") => void;
  toggleRole: () => void;
}

export const useRoleStore = create<RoleStore>()(
  persist(
    (set, get) => ({
      currentUser: DEMO_USERS.admin,
      setRole: (role) => set({ currentUser: DEMO_USERS[role] }),
      toggleRole: () => {
        const current = get().currentUser.role;
        set({ currentUser: current === "ADMIN" ? DEMO_USERS.client : DEMO_USERS.admin });
      },
    }),
    { name: "aeromine-role" }
  )
);
