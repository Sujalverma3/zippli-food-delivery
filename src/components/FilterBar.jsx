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
    <div className="flex flex-wrap items-center justify-between border-b border-gray-200 py-3 mb-6 gap-4">
      <div className="flex items-center space-x-3">
        <div className="text-sm font-semibold text-textPrimary">Sort & Filter</div>
        <button
          type="button"
          onClick={() => setOnlyNearby(!onlyNearby)}
          className={`px-3.5 py-2 rounded-xl text-xs font-black border whitespace-nowrap transition-all duration-200 flex items-center space-x-1.5 ${
            onlyNearby
              ? 'bg-primary border-primary text-white shadow-md shadow-orange-500/10'
              : 'bg-white border-gray-200 hover:bg-gray-50 text-slate-500'
          }`}
        >
          <svg className={`w-3.5 h-3.5 ${onlyNearby ? 'text-white' : 'text-primary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Nearby Only</span>
        </button>
      </div>
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveSort(opt.value)}
            className={`px-4 py-2 rounded-lg text-xs font-medium border whitespace-nowrap transition-colors duration-200 ${
              activeSort === opt.value
                ? 'bg-orange-50 border-primary text-primary font-bold'
                : 'bg-white border-gray-200 hover:bg-gray-50 text-textMuted'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
