import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const ADDRESSES = [
  '12, Connaught Place, New Delhi',
  '45A, Indiranagar Double Road, Bengaluru',
  '7B, Hitech City Main Rd, Madhapur, Hyderabad',
  'Shop 12, Marine Drive, Churchgate, Mumbai',
];

export default function Navbar() {
  const { cartCount } = useCart();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(ADDRESSES[0]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchVal(val);
    if (val.trim()) {
      setSearchParams({ search: val });
    } else {
      searchParams.delete('search');
      setSearchParams(searchParams);
    }
    if (window.location.pathname !== '/') {
      navigate(`/?search=${encodeURIComponent(val)}`);
    }
  };

  const selectAddress = (addr) => {
    setSelectedAddress(addr);
    setShowAddressDropdown(false);
  };

  const handleLogoutClick = () => {
    logout();
    setShowProfileMenu(false);
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-white shadow-card z-50 flex items-center justify-between px-4 md:px-8 border-b border-gray-100 font-sans">
      {/* Left logo & location */}
      <div className="flex items-center space-x-6">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-primary text-3xl font-extrabold tracking-tight">Zippli</span>
          <span className="text-primary text-2xl animate-pulse">⚡</span>
        </Link>
        
        {/* Address Selector */}
        <div className="relative hidden md:block">
          <button 
            onClick={() => setShowAddressDropdown(!showAddressDropdown)}
            className="flex items-center space-x-1 hover:text-primary transition-colors text-xs font-semibold text-textPrimary"
          >
            <span className="text-primary text-base">📍</span>
            <span className="max-w-[180px] truncate">{selectedAddress.split(',')[0]}</span>
            <span className="text-gray-400 text-[10px] truncate max-w-[120px] font-normal">({selectedAddress.split(',')[1]})</span>
            <span className="text-gray-500 text-[8px] ml-0.5">▼</span>
          </button>

          {showAddressDropdown && (
            <div className="absolute top-8 left-0 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50 animate-scale-up">
              <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Delivery Location</div>
              {ADDRESSES.map((addr) => (
                <button
                  key={addr}
                  onClick={() => selectAddress(addr)}
                  className="w-full text-left px-4 py-3 text-xs hover:bg-gray-50 flex flex-col space-y-1 transition-colors border-b border-gray-50 last:border-b-0"
                >
                  <span className="font-semibold text-textPrimary">{addr.split(',')[0]}</span>
                  <span className="text-textMuted truncate">{addr}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search Bar & Navigation */}
      <div className="flex items-center space-x-4 md:space-x-8 flex-grow max-w-2xl justify-end">
        {/* Search Input */}
        <div className="relative flex-grow max-w-[180px] sm:max-w-xs md:max-w-sm">
          <input
            type="text"
            value={searchVal}
            onChange={handleSearchChange}
            placeholder="Search for cuisines, dishes..."
            className="w-full bg-gray-50 text-textPrimary pl-10 pr-4 py-2 rounded-xl text-xs border border-transparent focus:border-primary focus:bg-white focus:outline-none transition-all shadow-inner"
          />
          <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-4 shrink-0 text-xs font-bold text-textPrimary">
          
          {/* Role-Specific Dashboard Shortcut Links */}
          {currentUser && currentUser.role === 'admin' && (
            <Link to="/dashboard" className="hover:text-primary transition-colors flex items-center space-x-1">
              <span>📊</span><span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {currentUser && currentUser.role === 'restaurant' && (
            <Link to="/vendor/dashboard" className="hover:text-primary transition-colors flex items-center space-x-1">
              <span>🍳</span><span className="hidden sm:inline">Vendor Panel</span>
            </Link>
          )}

          {currentUser && currentUser.role === 'delivery' && (
            <Link to="/delivery/dashboard" className="hover:text-primary transition-colors flex items-center space-x-1">
              <span>🛵</span><span className="hidden sm:inline">Rider Portal</span>
            </Link>
          )}

          {/* Cart Icon */}
          <Link to="/cart" className="relative p-2 flex items-center space-x-1 hover:text-primary transition-colors">
            <span className="text-lg">🛒</span>
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Auth Dropdown */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-1 bg-gray-50 border px-3 py-1.5 rounded-xl hover:border-primary hover:text-primary transition-all shadow-sm"
              >
                <span>👤</span>
                <span className="truncate max-w-[80px] hidden sm:inline">{currentUser.name.split(' ')[0]}</span>
                <span className="text-[8px] text-gray-500">▼</span>
              </button>

              {showProfileMenu && (
                <div className="absolute top-10 right-0 w-44 bg-white rounded-2xl shadow-lg border border-gray-150 py-2 z-50 animate-scale-up font-bold text-textPrimary">
                  <div className="px-4 py-2 border-b text-[10px] text-textMuted uppercase tracking-wider">My Account</div>
                  <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="block px-4 py-2.5 hover:bg-gray-50 transition-colors">
                    📝 My Profile
                  </Link>
                  <button onClick={handleLogoutClick} className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-500 transition-colors border-t border-gray-100">
                    🚪 Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-primary hover:bg-orange-600 text-white px-5 py-2 rounded-xl shadow-md transition-all font-extrabold hover:scale-95"
            >
              Sign In 🔑
            </Link>
          )}

        </div>
      </div>
    </nav>
  );
}
