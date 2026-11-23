import React from 'react';
import { motion } from 'framer-motion';

const CATEGORIES = [
  {
    name: 'All',
    image: null,
    isAll: true,
  },
  {
    name: 'Biryani',
    image: '/images/biryani.png',
  },
  {
    name: 'Pizza',
    image: '/images/pizza.png',
  },
  {
    name: 'Burgers',
    image: '/images/burger.png',
  },
  {
    name: 'Chinese',
    image: '/images/chinese.png',
  },
  {
    name: 'South Indian',
    image: '/images/south_indian.png',
  },
  {
    name: 'Desserts',
    image: '/images/desserts.png',
  },
  {
    name: 'Sushi',
    image: '/images/sushi.png',
  },
  {
    name: 'Healthy',
    image: '/images/healthy.png',
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
              className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? 'ring-2 ring-primary ring-offset-2 shadow-md bg-orange-50'
                  : 'bg-gray-100 hover:shadow-sm border border-gray-100'
              }`}
            >
              {cat.isAll ? (
                <div className={`flex flex-col items-center justify-center ${isActive ? 'text-primary' : 'text-gray-600'}`}>
                  <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </div>
              ) : (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              )}
            </div>
            {/* Label */}
            <span
              className={`text-xs md:text-sm mt-2 font-medium transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-gray-700 group-hover:text-gray-900'
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
