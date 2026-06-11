import React from 'react';

const CATEGORIES = [
  { name: 'All', icon: '🍽️' },
  { name: 'Pizza', icon: '🍕' },
  { name: 'Burgers', icon: '🍔' },
  { name: 'Biryani', icon: '🍛' },
  { name: 'Sushi', icon: '🍣' },
  { name: 'Desserts', icon: '🍰' },
  { name: 'Healthy', icon: '🥗' },
  { name: 'Chinese', icon: '🍜' },
  { name: 'South Indian', icon: '🥘' },
];

export default function CategoryChips({ activeCategory, setActiveCategory }) {
  return (
    <div className="flex items-center space-x-3 overflow-x-auto py-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.name}
          onClick={() => setActiveCategory(cat.name)}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm border transition-all duration-300 transform active:scale-95 ${
            activeCategory === cat.name
              ? 'bg-primary border-primary text-white scale-105 shadow-md'
              : 'bg-white border-gray-100 hover:border-primary text-textPrimary'
          }`}
        >
          <span>{cat.icon}</span>
          <span>{cat.name}</span>
        </button>
      ))}
    </div>
  );
}
