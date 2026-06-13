import { create } from 'zustand';

interface SuiteState {
  isFocusMode: boolean;
  toggleFocusMode: () => void;
  setFocusMode: (value: boolean) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (value: boolean) => void;
  isRightPanelOpen: boolean;
  toggleRightPanel: () => void;
  setRightPanelOpen: (value: boolean) => void;
}

export const useSuiteStore = create<SuiteState>((set) => ({
  isFocusMode: false,
  toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),
  setFocusMode: (value) => set({ isFocusMode: value }),
  
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (value) => set({ isSidebarOpen: value }),
  
  isRightPanelOpen: false,
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
  setRightPanelOpen: (value) => set({ isRightPanelOpen: value }),
}));
