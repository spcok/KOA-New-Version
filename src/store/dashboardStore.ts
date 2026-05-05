import { create } from 'zustand';

interface DashboardState {
  viewingDate: Date;
  sortOrder: 'asc' | 'desc';
  categoryFilter: string | null;
  setViewingDate: (date: Date) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setCategoryFilter: (category: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  viewingDate: new Date(),
  sortOrder: 'asc',
  categoryFilter: null,
  setViewingDate: (date) => set({ viewingDate: date }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
}));
