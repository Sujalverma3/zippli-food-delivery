import React from 'react';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Rating' },
  { value: 'delivery', label: 'Delivery Time' },
  { value: 'costLowHigh', label: 'Cost: Low to High' },
  { value: 'costHighLow', label: 'Cost: High to Low' },
];

export default function FilterBar({
  activeSort,
  setActiveSort,
  onlyNearby,
  setOnlyNearby,
  dietFilter,
  setDietFilter
}) {
  return (
    <div className="flex flex-wrap items-center justify-between border-b border-neutral-100 dark:border-neutral-800 py-3 mb-6 gap-3">
      {/* Left Quick Filters (Nearby, Veg, Non-Veg) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {/* Nearby Only Pill */}
        <button
          type="button"
          onClick={() => setOnlyNearby(!onlyNearby)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 shrink-0 ${
            onlyNearby
              ? 'bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white text-white dark:text-neutral-900 shadow-sm'
              : 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <svg className={`w-3.5 h-3.5 ${onlyNearby ? 'text-primary' : 'text-neutral-400 dark:text-neutral-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Nearby</span>
        </button>

        {/* Pure Veg Pill */}
        <button
          type="button"
          onClick={() => setDietFilter(dietFilter === 'veg' ? 'all' : 'veg')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 shrink-0 ${
            dietFilter === 'veg'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm'
              : 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          {/* Authentic FSSAI Green Veg Indicator */}
          <span className="w-3.5 h-3.5 rounded-sm border border-emerald-600 flex items-center justify-center p-0.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          </span>
          <span>Pure Veg</span>
        </button>

        {/* Non-Veg Pill */}
        <button
          type="button"
          onClick={() => setDietFilter(dietFilter === 'non-veg' ? 'all' : 'non-veg')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 shrink-0 ${
            dietFilter === 'non-veg'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-600 text-rose-700 dark:text-rose-400 font-bold shadow-sm'
              : 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          {/* Authentic FSSAI Red Non-Veg Indicator */}
          <span className="w-3.5 h-3.5 rounded-sm border border-rose-600 flex items-center justify-center p-0.5 shrink-0">
            <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-rose-600"></span>
          </span>
          <span>Non-Veg</span>
        </button>
      </div>

      {/* Right Sort Filters */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveSort(opt.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors duration-150 ${
              activeSort === opt.value
                ? 'bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white text-white dark:text-neutral-900 font-semibold shadow-sm'
                : 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
