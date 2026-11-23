import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function MobileNav() {
  const location = useLocation();
  const { cartCount } = useCart();
  const { currentUser } = useAuth();
  const pathname = location.pathname;

  const navItems = [
    {
      label: 'Home',
      to: '/',
      icon: (active) => (
        <svg className={`w-5 h-5 ${active ? 'text-primary' : 'text-gray-500'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      label: 'Search',
      to: '/?focus=search',
      icon: (active) => (
        <svg className={`w-5 h-5 ${active ? 'text-primary' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      label: 'Cart',
      to: '/cart',
      hasBadge: true,
      icon: (active) => (
        <svg className={`w-5 h-5 ${active ? 'text-primary' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      label: currentUser ? 'Profile' : 'Sign In',
      to: currentUser ? '/profile' : '/login',
      icon: (active) => (
        <svg className={`w-5 h-5 ${active ? 'text-primary' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 h-16 bg-white border-t border-gray-200/90 z-50 md:hidden flex items-center justify-around px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] safe-area-pb">
      {navItems.map((item) => {
        const isActive = pathname === item.to || (item.to.includes('search') && location.search.includes('search'));
        return (
          <Link
            key={item.label}
            to={item.to}
            className={`flex flex-col items-center justify-center py-1 px-3 relative transition-colors ${
              isActive ? 'text-primary font-bold' : 'text-gray-500 font-medium'
            }`}
          >
            <div className="relative">
              {item.icon(isActive)}
              {item.hasBadge && cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-primary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight leading-none">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
