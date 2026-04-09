import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import api from '../../lib/axios';
import { useCacheStore, CityDropdownItem } from '../../store/cache.store';

interface CitySelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function CitySelect({ value, onChange, error, disabled }: CitySelectProps) {
  const { cities, setCities, addCity } = useCacheStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useQuery({
    queryKey: ['cities_dropdown'],
    queryFn: async () => {
      if (cities.length > 0) return cities;
      const res = await api.get('/cities');
      const data = res.data.data.map((c: any) => ({
        id: c.id,
        name: c.name,
        code: c.code || c.name.toUpperCase().replace(/\s+/g, '_'),
        state: c.state || 'Unknown',
      }));
      setCities(data);
      return data;
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch(''); // Reset search text when closing
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreate = async () => {
    if (!search.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const res = await api.post('/cities/auto-create', { name: search.trim() });
      const newCity: CityDropdownItem = res.data.data;
      addCity(newCity);
      onChange(newCity.name);
      setIsOpen(false);
      setSearch('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = cities.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const exactMatch = cities.some(c => c.name.toLowerCase() === search.toLowerCase().trim());

  return (
    <div className="space-y-1.5 relative w-full" ref={containerRef}>
      <label className="block text-sm font-semibold text-slate-700">City / Location *</label>
      <div 
        className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl border-2 transition-all cursor-text outline-none text-sm font-semibold ${
          disabled 
            ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-500' 
            : isOpen 
              ? 'border-indigo-400 ring-4 ring-indigo-50 bg-white text-slate-900' 
              : error 
                ? 'border-red-400 bg-red-50 text-red-900' 
                : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
        }`}
        onClick={() => {
            if (!disabled) {
                setIsOpen(true);
            }
        }}
      >
        <input
            type="text"
            className="w-full bg-transparent outline-none truncate"
            placeholder={isOpen ? "Search or add city..." : value || "Select city"}
            value={isOpen ? search : value}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            disabled={disabled}
        />
        <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto outline-none animate-slide-up">
          {filtered.length > 0 ? (
            <div className="p-1.5">
              {filtered.map((city) => (
                <div
                  key={city.id}
                  onClick={() => {
                    onChange(city.name);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${value === city.name ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 font-semibold hover:bg-slate-50'}`}
                >
                  {city.name}
                  {value === city.name && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
              ))}
            </div>
          ) : (
             <div className="p-4 text-sm text-slate-500 font-medium text-center">No existing cities match.</div>
          )}

          {search.trim() && !exactMatch && (
            <div className="p-1.5 border-t border-slate-100 bg-slate-50 sticky bottom-0 rounded-b-xl">
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {isCreating ? 'Adding...' : `Add "${search.trim()}"`}
              </button>
            </div>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-500 font-medium mt-1">{error}</p>}
    </div>
  );
}
