"use client";

import { create } from "zustand";

// UI-only toggle: admin can preview the client layout without changing their session.
interface RoleStore {
  viewMode: "admin" | "client";
  setViewMode: (mode: "admin" | "client") => void;
}

export const useRoleStore = create<RoleStore>()((set) => ({
  viewMode: "admin",
  setViewMode: (mode) => set({ viewMode: mode }),
}));
