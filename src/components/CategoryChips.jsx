import React from 'react';
import { motion } from 'framer-motion';

const CATEGORIES = [
  {
    name: 'All',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    )
  },
  {
    name: 'Pizza',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18M12 3a9 9 0 100 18 9 9 0 000-18z" />
      </svg>
    )
  },
  {
    name: 'Burgers',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M3 8a3 3 0 016 0h6a3 3 0 016 0m-18 8a3 3 0 006 0h6a3 3 0 006 0" />
      </svg>
    )
  },
  {
    name: 'Biryani',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4M8 12h8m-9 4h10M4 8h16v8H4V8z" />
      </svg>
    )
  },
  {
    name: 'Sushi',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-6V4M12 20v-2" />
      </svg>
    )
  },
  {
    name: 'Desserts',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0h4m-4 0H8m12 3v10a2 2 0 01-2 2H6a2 2 0 01-2-2V11h16z" />
      </svg>
    )
  },
  {
    name: 'Healthy',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707" />
      </svg>
    )
  },
  {
    name: 'Chinese',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 12h16M4 16h16M3 20h18" />
      </svg>
    )
  },
  {
    name: 'South Indian',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-6-6h12M4 8h16a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a2 2 0 012-2z" />
      </svg>
    )
  }
];

export default function CategoryChips({ activeCategory, setActiveCategory }) {
  return (
    <div className="flex items-center space-x-3 overflow-x-auto py-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
      {CATEGORIES.map((cat) => (
        <motion.button
          key={cat.name}
          onClick={() => setActiveCategory(cat.name)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap shadow-sm border transition-colors duration-150 ${
            activeCategory === cat.name
              ? 'bg-gray-900 border-gray-900 text-white shadow-sm'
              : 'bg-white border-gray-200/90 hover:border-gray-300 text-gray-700'
          }`}
        >
          <span className={activeCategory === cat.name ? 'text-white' : 'text-primary'}>{cat.icon}</span>
          <span>{cat.name}</span>
        </motion.button>
      ))}
    </div>
  );
}
