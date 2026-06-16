import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function PartnerNavbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogoutClick = () => {
    logout();
    setShowProfileMenu(false);
    navigate('/login');
  };

  const getPortalLabel = () => {
    if (!currentUser) return 'Partner Portal';
    if (currentUser.role === 'restaurant') return 'Storefront Dashboard';
    if (currentUser.role === 'delivery') return 'Rider Dashboard';
    return 'Admin Dashboard';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-slate-900 text-white shadow-xl z-50 flex items-center justify-between px-6 md:px-8 border-b border-slate-800 font-sans">
      {/* Left branding */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <span className="text-primary text-2xl font-black tracking-tight font-sans">Zippli</span>
          <span className="text-slate-300 bg-slate-800 border border-slate-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
            Partner Portal
          </span>
        </div>
      </div>

      {/* Center status message */}
      <div className="hidden md:block">
        <span className="text-xs font-bold text-slate-400">
          {currentUser ? (
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Logged in as: <strong className="text-slate-200">{currentUser.name}</strong></span>
            </span>
          ) : (
            'Please sign in to access your dashboard.'
          )}
        </span>
      </div>

      {/* Right profile options */}
      <div className="flex items-center space-x-4 text-xs font-bold">
        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl hover:border-primary transition-all text-slate-200"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{getPortalLabel()}</span>
              <svg className="w-2.5 h-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showProfileMenu && (
              <div className="absolute top-11 right-0 w-48 bg-slate-800 rounded-2xl shadow-2xl border border-slate-750 py-2.5 z-50 animate-scale-up text-slate-200">
                <div className="px-4 py-1.5 border-b border-slate-750 text-[9px] text-slate-400 uppercase tracking-widest font-black mb-1">
                  Actions
                </div>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    window.location.href = '/';
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-750 text-slate-350 font-bold transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4 text-slate-450" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Customer Store</span>
                </button>
                <button
                  onClick={handleLogoutClick}
                  className="w-full text-left px-4 py-2.5 hover:bg-red-950/40 text-red-400 font-bold transition-colors border-t border-slate-750 mt-1 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => {
              window.location.href = '/';
            }}
            className="text-slate-300 hover:text-white transition-colors flex items-center space-x-1.5 border border-slate-700 bg-slate-800 py-2 px-4 rounded-xl"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>Customer Store</span>
          </button>
        )}
      </div>
    </nav>
  );
}
