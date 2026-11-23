import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
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
    <nav className="fixed top-0 left-0 right-0 h-20 bg-white shadow-[0_2px_15px_rgba(0,0,0,0.04)] z-50 flex items-center justify-between px-6 md:px-8 border-b border-gray-100 font-sans">
      {/* Left logo & location */}
      <div className="flex items-center space-x-6">
        <Link to="/" className="flex items-center space-x-2 group">
          <svg className="w-8 h-8 text-primary transition-transform group-hover:scale-105 duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-10h-9l1-8z" fill="currentColor"/>
          </svg>
          <span className="text-slate-800 group-hover:text-primary transition-colors text-2xl font-black tracking-tight font-sans">
            Zippli
          </span>
        </Link>
        
        {/* Address Selector */}
        <div className="relative hidden md:block">
          <button 
            onClick={() => setShowAddressDropdown(!showAddressDropdown)}
            className="flex items-center space-x-1.5 hover:text-primary transition-colors text-xs font-bold text-slate-700"
          >
            <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="max-w-[180px] truncate text-slate-800">
              {userLocation?.addressLabel || selectedAddress.split(',')[0]}
            </span>
            <span className="text-slate-400 text-[10px] truncate max-w-[120px] font-normal">
              ({(userLocation?.addressFullName || selectedAddress).split(',')[1] || ''})
            </span>
            <svg className="w-2.5 h-2.5 text-slate-500 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAddressDropdown && (
            <div className="absolute top-8 left-0 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2.5 z-50 animate-scale-up">
              <div className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-gray-50 mb-1">Select Delivery Location</div>
              
              <button
                type="button"
                onClick={handleUseLiveLocation}
                className="w-full text-left px-4 py-3 text-xs text-primary hover:bg-orange-50 flex items-center space-x-2 transition-all border-b border-gray-50 font-bold"
              >
                <svg className="w-4 h-4 shrink-0 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Use Live Geolocation</span>
              </button>

              {ADDRESSES.map((addr) => (
                <button
                  key={addr}
                  onClick={() => selectAddress(addr)}
                  className="w-full text-left px-4 py-3 text-xs hover:bg-gray-50 flex flex-col space-y-1 transition-colors border-b border-gray-50 last:border-b-0"
                >
                  <span className="font-bold text-slate-800">{addr.split(',')[0]}</span>
                  <span className="text-slate-400 truncate text-[11px] font-medium">{addr}</span>
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
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 pl-10 pr-4 py-2.5 rounded-2xl text-xs border border-transparent focus:border-slate-200 focus:outline-none transition-all shadow-inner font-medium placeholder-slate-450"
          />
          <svg className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-4 shrink-0 text-xs font-bold text-slate-700">
          
          {/* Partner Portal Link (if partner or admin) */}
          {currentUser && currentUser.role !== 'customer' && (
            <a href="/partner.html" className="hover:text-primary text-slate-800 transition-colors flex items-center space-x-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200">
              <svg className="w-4 h-4 text-slate-650" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11.5c0-.733.17-1.425.474-2.041m.028-3.328a3 3 0 00-3-3m.028 3.328A3 3 0 003 9c0 1.32.41 2.543 1.11 3.551M12 11c0-3.517 1.009-6.799 2.753-9.571m3.44 2.04l-.054.09A13.916 13.916 0 0015 11.5c0 .733-.17 1.425-.474 2.041m-.028 3.328a3 3 0 003-3m-.028 3.328A3 3 0 0021 9c0-1.32-.41-2.543-1.11-3.551" />
              </svg>
              <span className="hidden sm:inline">Partner Portal</span>
            </a>
          )}

          {/* Cart Icon */}
          <Link to="/cart" className="relative py-2 px-3 flex items-center space-x-1.5 hover:text-primary transition-colors text-slate-800 font-bold">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm"
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
                className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl hover:border-slate-350 hover:text-primary transition-all shadow-sm text-slate-800"
              >
                <svg className="w-4 h-4 text-slate-550" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="truncate max-w-[80px] hidden sm:inline">{currentUser.name.split(' ')[0]}</span>
                <svg className="w-2.5 h-2.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showProfileMenu && (
                <div className="absolute top-11 right-0 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-2.5 z-50 animate-scale-up text-slate-800">
                  <div className="px-4 py-1.5 border-b border-gray-50 text-[9px] text-slate-400 uppercase tracking-widest font-black mb-1">My Account</div>
                  <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center space-x-2">
                    <svg className="w-4 h-4 text-slate-450" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>My Profile</span>
                  </Link>
                  <button onClick={handleLogoutClick} className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-500 transition-colors border-t border-gray-100 mt-1 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-primary hover:bg-orange-655 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all font-black hover:scale-95 duration-200"
            >
              Sign In
            </Link>
          )}

        </div>
      </div>
    </nav>
  );
}
