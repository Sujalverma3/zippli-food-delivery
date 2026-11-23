import React from 'react';
import { motion } from 'framer-motion';

const CATEGORIES = [
  {
    name: 'All',
    image: null,
    isAll: true,
    bgGradient: 'from-orange-100 via-amber-50 to-orange-50 dark:from-orange-950/40 dark:via-amber-950/30 dark:to-orange-950/20',
    borderColor: 'border-orange-200/70 dark:border-orange-900/50',
  },
  {
    name: 'Biryani',
    image: '/images/biryani.png',
    bgGradient: 'from-amber-100 via-orange-50 to-amber-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/20',
    borderColor: 'border-amber-200/70 dark:border-amber-900/50',
  },
  {
    name: 'Pizza',
    image: '/images/pizza.png',
    bgGradient: 'from-rose-100 via-orange-50 to-amber-50 dark:from-rose-950/40 dark:via-orange-950/30 dark:to-amber-950/20',
    borderColor: 'border-rose-200/70 dark:border-rose-900/50',
  },
  {
    name: 'Burgers',
    image: '/images/burger.png',
    bgGradient: 'from-yellow-100 via-amber-50 to-orange-50 dark:from-yellow-950/40 dark:via-amber-950/30 dark:to-orange-950/20',
    borderColor: 'border-yellow-200/70 dark:border-yellow-900/50',
  },
  {
    name: 'Chinese',
    image: '/images/chinese.png',
    bgGradient: 'from-rose-100 via-red-50 to-orange-50 dark:from-rose-950/40 dark:via-red-950/30 dark:to-orange-950/20',
    borderColor: 'border-rose-200/70 dark:border-rose-900/50',
  },
  {
    name: 'South Indian',
    image: '/images/south_indian.png',
    bgGradient: 'from-yellow-100 via-emerald-50 to-amber-50 dark:from-yellow-950/40 dark:via-emerald-950/30 dark:to-amber-950/20',
    borderColor: 'border-yellow-200/70 dark:border-yellow-900/50',
  },
  {
    name: 'Desserts',
    image: '/images/desserts.png',
    bgGradient: 'from-pink-100 via-rose-50 to-purple-50 dark:from-pink-950/40 dark:via-rose-950/30 dark:to-purple-950/20',
    borderColor: 'border-pink-200/70 dark:border-pink-900/50',
  },
  {
    name: 'Sushi',
    image: '/images/sushi.png',
    bgGradient: 'from-teal-100 via-cyan-50 to-emerald-50 dark:from-teal-950/40 dark:via-cyan-950/30 dark:to-emerald-950/20',
    borderColor: 'border-teal-200/70 dark:border-teal-900/50',
  },
  {
    name: 'Healthy',
    image: '/images/healthy.png',
    bgGradient: 'from-emerald-100 via-green-50 to-teal-50 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-teal-950/20',
    borderColor: 'border-emerald-200/70 dark:border-emerald-900/50',
  },
];

export default function CategoryChips({ activeCategory, setActiveCategory }) {
  return (
    <div className="flex items-center space-x-6 md:space-x-8 overflow-x-auto py-3 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.name;
        return (
          <motion.button
            key={cat.name}
            onClick={() => setActiveCategory(cat.name)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center shrink-0 group focus:outline-none"
          >
            {/* Circular Dish Avatar */}
            <div
              className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden p-1 flex items-center justify-center transition-all duration-200 bg-gradient-to-br ${cat.bgGradient} ${cat.borderColor} border ${
                isActive
                  ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-neutral-900 shadow-md shadow-orange-500/20 scale-105'
                  : 'hover:shadow-md hover:scale-105'
              }`}
            >
              {cat.isAll ? (
                <div className={`flex flex-col items-center justify-center ${isActive ? 'text-primary' : 'text-orange-600 dark:text-orange-400'}`}>
                  <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </div>
              ) : (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
                />
              )}
            </div>
            {/* Label */}
            <span
              className={`text-xs md:text-sm mt-2 font-medium transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-gray-700 dark:text-neutral-300 group-hover:text-gray-900 dark:group-hover:text-white'
              }`}
            >
              {cat.name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
