import React from 'react';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Rating' },
  { value: 'delivery', label: 'Delivery Time' },
  { value: 'costLowHigh', label: 'Cost: Low to High' },
  { value: 'costHighLow', label: 'Cost: High to Low' },
];

export default function FilterBar({ activeSort, setActiveSort, onlyNearby, setOnlyNearby }) {
  return (
    <div className="flex flex-wrap items-center justify-between border-b border-neutral-100 dark:border-neutral-800 py-3 mb-6 gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOnlyNearby(!onlyNearby)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
            onlyNearby
              ? 'bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white text-white dark:text-neutral-900 shadow-sm'
              : 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <svg className={`w-3.5 h-3.5 ${onlyNearby ? 'text-primary' : 'text-neutral-400 dark:text-neutral-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Nearby Only</span>
        </button>
      </div>
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
