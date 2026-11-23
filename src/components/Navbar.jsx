import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { toast } from 'react-hot-toast';

const ADDRESSES = [
  '12, Connaught Place, New Delhi',
  '45A, Indiranagar Double Road, Bengaluru',
  '7B, Hitech City Main Rd, Madhapur, Hyderabad',
  'Shop 12, Marine Drive, Churchgate, Mumbai',
];

export default function Navbar() {
  const { cartCount } = useCart();
  const { currentUser, logout, userLocation, setUserLocation } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(userLocation?.addressFullName || ADDRESSES[0]);
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

    let coords = { lat: 28.6304, lng: 77.2177 };
    if (addr.includes('New Delhi')) coords = { lat: 28.6304, lng: 77.2177 };
    else if (addr.includes('Bengaluru')) coords = { lat: 12.9640, lng: 77.6380 };
    else if (addr.includes('Hyderabad')) coords = { lat: 17.4504, lng: 78.3808 };
    else if (addr.includes('Mumbai')) coords = { lat: 18.9307, lng: 72.8230 };

    setUserLocation({
      lat: coords.lat,
      lng: coords.lng,
      addressLabel: addr.split(',')[0],
      addressFullName: addr
    });
  };

  const handleUseLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    const loadingToast = toast.loading('Accessing your browser location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        toast.dismiss(loadingToast);
        const { latitude, longitude } = position.coords;

        setUserLocation({
          lat: latitude,
          lng: longitude,
          addressLabel: 'Live Location',
          addressFullName: 'User, Live Location'
        });
        setSelectedAddress('User, Live Location');
        setShowAddressDropdown(false);
        toast.success('Live location updated successfully!');
      },
      (error) => {
        toast.dismiss(loadingToast);
        toast.error('Location permission denied or unavailable.');
        console.error(error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleLogoutClick = () => {
    logout();
    setShowProfileMenu(false);
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-white dark:bg-[#111217] shadow-[0_2px_12px_rgba(0,0,0,0.04)] z-50 flex items-center justify-between px-4 sm:px-6 md:px-10 border-b border-gray-150 dark:border-neutral-800 font-sans transition-colors duration-200">
      {/* Left: Swiggy-style Logo & Location Selector */}
      <div className="flex items-center space-x-5 md:space-x-8">
        <Link to="/" className="flex items-center space-x-2 group shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-sm shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-10h-9l1-8z" fill="currentColor"/>
            </svg>
          </div>
          <span className="text-gray-900 dark:text-white group-hover:text-primary transition-colors text-2xl font-black tracking-tight font-sans">
            zippli
          </span>
        </Link>
        
        {/* Swiggy Address Selector (Mobile & Desktop) */}
        <div className="relative">
          <button 
            onClick={() => setShowAddressDropdown(!showAddressDropdown)}
            className="flex items-center space-x-1.5 hover:text-primary transition-colors text-xs text-gray-700 dark:text-neutral-300 py-1"
          >
            <span className="font-bold text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white hover:border-primary dark:hover:border-primary pb-0.5 max-w-[100px] sm:max-w-[160px] truncate">
              {userLocation?.addressLabel || selectedAddress.split(',')[0]}
            </span>
            <span className="text-gray-500 dark:text-neutral-400 truncate max-w-[120px] font-normal hidden sm:inline">
              {(userLocation?.addressFullName || selectedAddress).split(',').slice(1).join(',').trim()}
            </span>
            <svg className="w-3.5 h-3.5 text-primary shrink-0 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAddressDropdown && (
            <div className="absolute top-10 left-0 w-80 bg-white dark:bg-[#1a1b22] rounded-2xl shadow-xl border border-gray-150 dark:border-neutral-800 py-2.5 z-50 animate-scale-up">
              <div className="px-4 py-2 text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider border-b border-gray-100 dark:border-neutral-800">
                Choose Delivery Location
              </div>
              
              <button
                type="button"
                onClick={handleUseLiveLocation}
                className="w-full text-left px-4 py-3 text-xs text-primary hover:bg-orange-50/70 dark:hover:bg-orange-950/30 flex items-center space-x-2 transition-all border-b border-gray-100 dark:border-neutral-800 font-semibold"
              >
                <svg className="w-4 h-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Use Current Location</span>
              </button>

              {ADDRESSES.map((addr) => (
                <button
                  key={addr}
                  onClick={() => selectAddress(addr)}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 dark:hover:bg-neutral-800/60 flex flex-col transition-colors border-b border-gray-100 dark:border-neutral-800/50 last:border-b-0"
                >
                  <span className="font-semibold text-gray-800 dark:text-neutral-200">{addr.split(',')[0]}</span>
                  <span className="text-gray-500 dark:text-neutral-400 truncate text-[11px]">{addr}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Navigation, Search, Auth & Theme Toggle */}
      <div className="flex items-center space-x-3 sm:space-x-5 md:space-x-6 shrink-0 text-sm font-semibold text-gray-700 dark:text-neutral-300">
        {/* Search Input in Navbar */}
        <div className="relative hidden lg:block w-64">
          <input
            type="text"
            value={searchVal}
            onChange={handleSearchChange}
            placeholder="Search restaurants, dishes..."
            className="w-full bg-gray-100/90 dark:bg-neutral-800/80 hover:bg-gray-100 dark:hover:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-800 text-gray-800 dark:text-neutral-100 pl-9 pr-3 py-2 rounded-xl text-xs border border-transparent focus:border-gray-300 dark:focus:border-neutral-700 focus:outline-none transition-all placeholder-gray-400 dark:placeholder-neutral-500 font-medium"
          />
          <svg className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Offers Nav Item */}
        <Link to="/" className="flex items-center space-x-2 hover:text-primary transition-colors text-gray-700 dark:text-neutral-300">
          <svg className="w-5 h-5 text-gray-500 dark:text-neutral-400 hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span className="hidden sm:inline">Offers</span>
          <span className="text-[10px] font-bold text-primary bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-900 uppercase">
            New
          </span>
        </Link>

        {/* Partner Portal Link */}
        {currentUser && currentUser.role !== 'customer' ? (
          <a
            href="/partner.html"
            className="hover:text-primary text-gray-700 dark:text-neutral-200 transition-colors flex items-center space-x-1.5 py-1.5 px-3 bg-gray-100 dark:bg-neutral-800 rounded-lg text-xs"
          >
            <span>Partner Hub</span>
          </a>
        ) : (
          <a
            href="/partner.html"
            className="hover:text-primary text-gray-500 dark:text-neutral-400 transition-colors hidden md:flex items-center space-x-1 text-xs font-medium"
          >
            <span>Partner Portal</span>
          </a>
        )}

        {/* Cart Icon */}
        <Link to="/cart" className="relative flex items-center space-x-1.5 hover:text-primary transition-colors text-gray-700 dark:text-neutral-300">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="hidden sm:inline">Cart</span>
          {cartCount > 0 && (
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm"
            >
              {cartCount}
            </motion.span>
          )}
        </Link>

        {/* User Auth Dropdown */}
        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-1.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-3 py-1.5 rounded-xl hover:text-primary transition-all text-xs font-semibold text-gray-800 dark:text-neutral-200"
            >
              <svg className="w-4 h-4 text-gray-500 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="truncate max-w-[80px] hidden sm:inline">{currentUser.name.split(' ')[0]}</span>
              <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showProfileMenu && (
              <div className="absolute top-10 right-0 w-44 bg-white dark:bg-[#1a1b22] rounded-xl shadow-xl border border-gray-150 dark:border-neutral-800 py-2 z-50 text-xs font-medium text-gray-800 dark:text-neutral-200">
                <div className="px-3.5 py-1.5 border-b border-gray-100 dark:border-neutral-800 text-[10px] text-gray-400 dark:text-neutral-500 uppercase font-bold tracking-wider">
                  My Account
                </div>
                <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors flex items-center space-x-2">
                  <span>Profile & Orders</span>
                </Link>
                <button onClick={handleLogoutClick} className="w-full text-left px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 transition-colors border-t border-gray-100 dark:border-neutral-800 mt-1 flex items-center space-x-2">
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center space-x-1.5 text-gray-700 dark:text-neutral-300 hover:text-primary transition-colors font-semibold"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="hidden sm:inline">Sign In</span>
          </Link>
        )}

        {/* Theme Toggle Button (Top Right Corner Icon) */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-primary dark:hover:text-primary transition-all duration-200 focus:outline-none shrink-0"
        >
          {isDark ? (
            /* Sun Icon */
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            /* Moon Icon */
            <svg className="w-5 h-5 text-neutral-600 hover:text-neutral-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
