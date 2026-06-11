import React from 'react';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Rating' },
  { value: 'delivery', label: 'Delivery Time' },
  { value: 'costLowHigh', label: 'Cost: Low to High' },
  { value: 'costHighLow', label: 'Cost: High to Low' },
];

export default function FilterBar({ activeSort, setActiveSort }) {
  return (
    <div className="flex flex-wrap items-center justify-between border-b border-gray-200 py-3 mb-6 gap-4">
      <div className="text-sm font-semibold text-textPrimary">Sort & Filter</div>
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
