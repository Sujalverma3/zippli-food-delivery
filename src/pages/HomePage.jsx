import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { getHaversineDistance, getNumericDistance } from '../utils/distance.js';
import CategoryChips from '../components/CategoryChips.jsx';
import FilterBar from '../components/FilterBar.jsx';

export default function HomePage() {
  const { userLocation } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSort, setActiveSort] = useState('relevance');
  const [onlyNearby, setOnlyNearby] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [searchParams] = useSearchParams();
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/restaurants');
        setRestaurants(res.data);
      } catch (err) {
        console.error('Error fetching restaurants:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredRestaurants = restaurants
    .filter((r) => {
      const matchSearch =
        searchVal.trim() === '' ||
        r.name.toLowerCase().includes(searchVal.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(searchVal.toLowerCase());
      const matchCategory =
        activeCategory === 'All' ||
        r.cuisine.toLowerCase().includes(activeCategory.toLowerCase());
      
      let matchNearby = true;
      if (onlyNearby) {
        const dist = getNumericDistance(userLocation?.lat, userLocation?.lng, r.lat, r.lng);
        matchNearby = dist !== null && dist <= 50;
      }

      return matchSearch && matchCategory && matchNearby;
    })
    .sort((a, b) => {
      if (activeSort === 'rating') return b.rating - a.rating;
      if (activeSort === 'delivery') return parseInt(a.deliveryTime) - parseInt(b.deliveryTime);
      if (activeSort === 'costLowHigh') return a.minOrder - b.minOrder;
      if (activeSort === 'costHighLow') return b.minOrder - a.minOrder;
      
      const distA = getNumericDistance(userLocation?.lat, userLocation?.lng, a.lat, a.lng);
      const distB = getNumericDistance(userLocation?.lat, userLocation?.lng, b.lat, b.lng);
      if (distA !== null && distB !== null) {
        return distA - distB;
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const offers = [
    { code: 'ZIPPLI50', title: '50% OFF UP TO ₹100', desc: 'On orders above ₹150' },
    { code: 'WELCOME20', title: 'FREE DELIVERY', desc: 'On all orders above ₹299' },
    { code: 'SUPER75', title: 'FLAT ₹100 OFF', desc: 'On orders above ₹399' },
  ];

  const cityLabel = userLocation?.addressLabel || 'your area';

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6 font-sans">
      {/* Mobile Search Bar (visible on phones and tablets) */}
      <div className="block lg:hidden mb-5">
        <div className="relative">
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search for restaurants, dishes..."
            className="w-full bg-white text-gray-800 pl-10 pr-4 py-3 rounded-2xl text-sm border border-gray-200 shadow-sm focus:border-primary focus:outline-none placeholder-gray-400 font-medium"
          />
          <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* 1. Swiggy "What's on your mind?" Cuisine Carousel */}
      <section className="mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight mb-4">
          What's on your mind?
        </h2>
        <CategoryChips activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
        <div className="border-b border-neutral-100 mt-6"></div>
      </section>

      {/* 2. Deals / Vouchers Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-lg md:text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <span>Deals for you</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {offers.map((offer) => (
            <motion.div
              key={offer.code}
              whileHover={{ y: -2 }}
              onClick={() => handleCopyCode(offer.code)}
              className="bg-white rounded-xl p-3.5 border border-neutral-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-primary flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-neutral-900">{offer.title}</h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">{offer.desc}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <span className="inline-block text-[11px] font-mono font-bold px-2 py-0.5 bg-neutral-100 group-hover:bg-primary group-hover:text-white rounded border border-neutral-200 transition-colors">
                  {copiedCode === offer.code ? 'Copied!' : offer.code}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="border-b border-neutral-100 mt-8"></div>
      </section>

      {/* 3. Main Restaurant Listing */}
      <section id="restaurant-section" className="scroll-mt-24">
        <div className="mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
            Restaurants delivering to {cityLabel}
          </h2>
        </div>

        {/* Filter Pills */}
        <FilterBar
          activeSort={activeSort}
          setActiveSort={setActiveSort}
          onlyNearby={onlyNearby}
          setOnlyNearby={setOnlyNearby}
        />

        {/* Restaurant Grid */}
        {filteredRestaurants.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-sm font-bold text-gray-800">No restaurants found</h3>
            <p className="text-gray-500 text-xs mt-1">
              {onlyNearby 
                ? "Try turning off 'Nearby Only' or change your location above." 
                : "Try choosing another category or clearing your search filter."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
            {filteredRestaurants.map((res, index) => {
              const distanceStr = getHaversineDistance(
                userLocation?.lat,
                userLocation?.lng,
                res.lat,
                res.lng
              );
              return (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.2) }}
                >
                  <Link
                    to={`/restaurant/${res.id}`}
                    className="group block transition-transform duration-150 ease-out hover:scale-[0.97]"
                  >
                    {/* Swiggy-style Photo Container */}
                    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl shadow-sm bg-gray-100">
                      <img
                        src={res.image}
                        alt={res.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-br ${res.gradient} flex items-center justify-center text-white font-bold text-lg p-4 text-center"><span>${res.name}</span></div>`;
                        }}
                      />
                      {/* Dark bottom scrim */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent flex items-end px-3 pb-2">
                        {/* Integrated Swiggy Discount Overlay */}
                        {res.discount && (
                          <span className="text-white font-black text-base md:text-lg uppercase tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-1">
                            {res.discount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Swiggy-style Typography Stack below image */}
                    <div className="pt-2.5 px-0.5">
                      {/* Name */}
                      <h3 className="text-base md:text-lg font-bold text-gray-900 group-hover:text-primary transition-colors truncate">
                        {res.name}
                      </h3>

                      {/* Rating • Delivery Time • Distance */}
                      <div className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-gray-800 mt-0.5">
                        <span className="inline-flex items-center justify-center w-4 h-4 md:w-4.5 md:h-4.5 rounded-full bg-emerald-600 text-white text-[10px] md:text-[11px] font-black shrink-0">
                          ★
                        </span>
                        <span>{res.rating}</span>
                        <span className="text-gray-400 font-normal">•</span>
                        <span>{res.deliveryTime}</span>
                        {distanceStr && (
                          <>
                            <span className="text-gray-400 font-normal">•</span>
                            <span className="text-gray-500 font-normal text-xs">{distanceStr}</span>
                          </>
                        )}
                      </div>

                      {/* Cuisines */}
                      <p className="text-xs md:text-sm text-gray-500 truncate mt-0.5 font-normal">
                        {res.cuisine}
                      </p>

                      {/* Area Address */}
                      {res.address && (
                        <p className="text-xs text-gray-400 truncate font-normal">
                          {res.address.split(',').slice(-2).join(',').trim() || res.address}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
