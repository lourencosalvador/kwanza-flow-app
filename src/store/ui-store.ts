"use client";

import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  commandOpen: boolean;
  salaryWizardOpen: boolean;
  setSidebar: (open: boolean) => void;
  toggleSidebar: () => void;
  setCommand: (open: boolean) => void;
  setSalaryWizard: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  commandOpen: false,
  salaryWizardOpen: false,
  setSidebar: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setCommand: (open) => set({ commandOpen: open }),
  setSalaryWizard: (open) => set({ salaryWizardOpen: open }),
}));
