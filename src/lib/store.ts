import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export type HeaderStyle = 'default' | 'google' | 'right' | 'left' | 'hamburger' | 'macos' | 'floating' | 'centered';

interface UIState {
  headerStyle: HeaderStyle;
  setHeaderStyle: (style: HeaderStyle) => void;
  showLogo: boolean;
  setShowLogo: (show: boolean) => void;
  pinnedApps: string[];
  setPinnedApps: (apps: string[]) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      headerStyle: 'default',
      setHeaderStyle: (style) => set({ headerStyle: style }),
      showLogo: true,
      setShowLogo: (show) => set({ showLogo: show }),
      pinnedApps: ['Xak AI', 'Chat', 'Games'], // Default pinned apps
      setPinnedApps: (apps) => set({ pinnedApps: apps }),
    }),
    {
      name: 'xakteir-ui-storage',
    }
  )
);
