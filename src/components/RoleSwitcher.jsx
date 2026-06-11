import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function RoleSwitcher() {
  const { login, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleQuickSwitch = async (email, path) => {
    try {
      setSwitching(true);
      logout();
      const user = await login(email, 'password123');
      navigate(path);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to quick switch role:', err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans text-xs">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary hover:bg-orange-600 text-white font-bold p-3.5 rounded-full shadow-lg transition-transform transform active:scale-95 flex items-center justify-center space-x-1.5"
      >
        <span className="text-lg">⚡</span>
        <span className="hidden sm:inline font-bold">Demo Switcher</span>
      </button>

      {/* Popover Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-64 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 overflow-hidden p-5 space-y-4 animate-scale-up">
          <div className="border-b border-slate-700 pb-2 flex justify-between items-center">
            <h4 className="font-extrabold text-[10px] text-primary tracking-widest uppercase">Quick Role Switcher</h4>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          
          <p className="text-[10px] text-slate-300 leading-snug">
            Instantly switch personas to test the order placing, cooking, delivering, and auditing cycle!
          </p>

          <div className="space-y-2">
            {[
              { label: '🧑‍💻 Customer App', email: 'customer@zippli.com', path: '/' },
              { label: '🍽️ Restaurant Vendor', email: 'vendor@zippli.com', path: '/vendor/dashboard' },
              { label: '🛵 Delivery Rider', email: 'delivery@zippli.com', path: '/delivery/dashboard' },
              { label: '⚙️ Platform Admin', email: 'admin@zippli.com', path: '/dashboard' }
            ].map(roleItem => (
              <button
                key={roleItem.email}
                disabled={switching}
                onClick={() => handleQuickSwitch(roleItem.email, roleItem.path)}
                className={`w-full text-left px-4 py-2.5 rounded-xl font-bold transition-all border ${
                  currentUser?.email === roleItem.email
                    ? 'bg-primary border-primary text-white'
                    : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-200'
                }`}
              >
                {roleItem.label}
              </button>
            ))}
          </div>

          <div className="text-[9px] text-slate-400 italic text-center">
            Logged in: <span className="font-bold text-slate-200">{currentUser ? currentUser.name : 'Guest'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
