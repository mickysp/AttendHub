
"use client";

import { create } from "zustand";
import type { AdministratorRole } from "@/types/administrators";

type AuthStore = {
  username: string;
  password: string;
  remember: boolean;
  role: AdministratorRole | "";

  setUsername: (username: string) => void;
  setPassword: (password: string) => void;
  setRemember: (remember: boolean) => void;
  setRole: (role: AdministratorRole) => void;

  clearPassword: () => void;
  loadRememberUser: () => void;
  saveRememberUser: () => void;
  clearRememberUser: () => void;
};

const validRoles: AdministratorRole[] = [
  "Admin",
  "Teacher",
  "Teaching Assistant",
];

export const useAuthStore = create<AuthStore>()((set, get) => ({
  username: "",
  password: "",
  remember: false,
  role: "",

  setUsername: (username: string) => set({ username }),
  setPassword: (password: string) => set({ password }),
  setRemember: (remember: boolean) => set({ remember }),
  setRole: (role: AdministratorRole) => set({ role }),

  clearPassword: () => set({ password: "" }),

  loadRememberUser: () => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem("rememberUser");

      if (!saved) return;

      const data = JSON.parse(saved);

      const role = validRoles.includes(data.role)
        ? data.role
        : "";

      set({
        username: data.username ?? "",
        role,
        remember: true,
      });
    } catch {
      localStorage.removeItem("rememberUser");
    }
  },

  saveRememberUser: () => {
    if (typeof window === "undefined") return;

    const { username, role } = get();

    localStorage.setItem(
      "rememberUser",
      JSON.stringify({
        username,
        role,
      }),
    );
  },

  clearRememberUser: () => {
    if (typeof window === "undefined") return;

    localStorage.removeItem("rememberUser");

    set({
      remember: false,
      role: "",
    });
  },
}));
