import { create } from 'zustand';
import { CollectionCase } from '../types';

interface CaseFilterState {
  search: string;
  portfolio: string;
  bucket: string;
  status: string;
  priority: string;
  pincode: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;

  customCases: CollectionCase[];
  addCustomCases: (cases: CollectionCase[]) => void;

  selectedCaseId: string | null;
  selectedCasesForRoute: string[];

  setSearch: (search: string) => void;
  setPortfolio: (portfolio: string) => void;
  setBucket: (bucket: string) => void;
  setStatus: (status: string) => void;
  setPriority: (priority: string) => void;
  setPincode: (pincode: string) => void;
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  setPage: (page: number) => void;
  setSelectedCaseId: (id: string | null) => void;

  toggleCaseForRoute: (id: string) => void;
  clearRouteSelection: () => void;
  resetFilters: () => void;
}

export const useCaseStore = create<CaseFilterState>((set) => ({
  search: '',
  portfolio: 'All',
  bucket: 'All',
  status: 'All',
  priority: 'All',
  pincode: '',
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  page: 1,
  limit: 50,

  customCases: [],
  addCustomCases: (newCases) =>
    set((state) => ({
      customCases: [...newCases, ...state.customCases]
    })),

  selectedCaseId: null,
  selectedCasesForRoute: [],

  setSearch: (search) => set({ search, page: 1 }),
  setPortfolio: (portfolio) => set({ portfolio, page: 1 }),
  setBucket: (bucket) => set({ bucket, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),
  setPriority: (priority) => set({ priority, page: 1 }),
  setPincode: (pincode) => set({ pincode, page: 1 }),
  setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
  setPage: (page) => set({ page }),
  setSelectedCaseId: (id) => set({ selectedCaseId: id }),

  toggleCaseForRoute: (id) =>
    set((state) => ({
      selectedCasesForRoute: state.selectedCasesForRoute.includes(id)
        ? state.selectedCasesForRoute.filter((cId) => cId !== id)
        : [...state.selectedCasesForRoute, id]
    })),
  clearRouteSelection: () => set({ selectedCasesForRoute: [] }),
  resetFilters: () =>
    set({
      search: '',
      portfolio: 'All',
      bucket: 'All',
      status: 'All',
      priority: 'All',
      pincode: '',
      page: 1
    })
}));

