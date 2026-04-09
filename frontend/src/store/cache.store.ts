import { create } from 'zustand';

export interface CityDropdownItem {
  id: string;
  name: string;
  code: string;
  state: string;
}

interface CacheState {
  cities: CityDropdownItem[];
  setCities: (cities: CityDropdownItem[]) => void;
  addCity: (city: CityDropdownItem) => void;
}

export const useCacheStore = create<CacheState>((set) => ({
  cities: [],
  setCities: (cities) => set({ cities }),
  addCity: (city) => set((state) => {
    // Prevent duplicates
    if (state.cities.some((c) => c.code === city.code || c.name.toLowerCase() === city.name.toLowerCase())) return state;
    return { cities: [...state.cities, city].sort((a, b) => a.name.localeCompare(b.name)) };
  }),
}));
