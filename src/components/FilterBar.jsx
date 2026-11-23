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
    <div className="flex flex-wrap items-center justify-between border-b border-gray-200/80 py-3 mb-6 gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOnlyNearby(!onlyNearby)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
            onlyNearby
              ? 'bg-primary border-primary text-white shadow-sm'
              : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          <svg className={`w-3.5 h-3.5 ${onlyNearby ? 'text-white' : 'text-primary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
                ? 'bg-orange-500 border-orange-500 text-white font-semibold'
                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
