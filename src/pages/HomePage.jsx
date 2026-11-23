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
    { code: 'ZIPPLI50', title: '50% OFF UP TO ₹100', desc: 'On orders above ₹150', tag: 'FIRST ORDER' },
    { code: 'WELCOME20', title: 'FREE DELIVERY', desc: 'On all orders above ₹299', tag: 'ZERO FEE' },
    { code: 'SUPER75', title: 'FLAT ₹100 OFF', desc: 'On orders above ₹399', tag: 'FESTIVE DEAL' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 font-sans">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 shadow-sm"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)]"></div>
        <div className="relative z-10 px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row md:items-center justify-between gap-6 text-white">
          <div className="max-w-xl">
            <span className="inline-block text-xs font-semibold tracking-wide uppercase px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-md mb-2">
              Fast & Fresh Delivery
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Food delivery from your favorite local spots
            </h1>
            <p className="text-sm md:text-base text-white/90 mt-2 font-normal">
              Order from top rated kitchens, track your delivery live, and enjoy hot food in 25-35 minutes.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#restaurant-section"
              className="bg-white text-gray-900 font-semibold px-5 py-2.5 rounded-xl text-sm shadow hover:bg-gray-50 transition-colors"
            >
              Browse Restaurants
            </a>
            <a
              href="/partner.html"
              className="bg-white/15 hover:bg-white/25 text-white font-medium px-4 py-2.5 rounded-xl text-sm border border-white/20 transition-colors"
            >
              Partner Portal
            </a>
          </div>
        </div>
      </motion.div>

      {/* Deals & Coupons Rail */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>Deals & Coupons</span>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Save big</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {offers.map((offer) => (
            <motion.div
              key={offer.code}
              whileHover={{ y: -2 }}
              onClick={() => handleCopyCode(offer.code)}
              className="bg-white rounded-xl p-4 border border-gray-200/90 shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-primary bg-orange-50 px-2 py-0.5 rounded">
                  {offer.tag}
                </span>
                <h3 className="text-sm font-bold text-gray-900 mt-1">{offer.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{offer.desc}</p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <span className="inline-block text-xs font-mono font-bold px-2.5 py-1 bg-gray-100 group-hover:bg-orange-100 group-hover:text-primary rounded border border-gray-200 transition-colors">
                  {copiedCode === offer.code ? 'Copied!' : offer.code}
                </span>
                <span className="block text-[10px] text-gray-400 mt-1">Tap to copy</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cuisines Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">What's on your mind?</h2>
        <CategoryChips activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
      </div>

      {/* Filter Bar */}
      <div id="restaurant-section" className="scroll-mt-24">
        <FilterBar
          activeSort={activeSort}
          setActiveSort={setActiveSort}
          onlyNearby={onlyNearby}
          setOnlyNearby={setOnlyNearby}
        />
      </div>

      {/* Restaurant Section Heading */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          {filteredRestaurants.length} Restaurants delivering to you
        </h2>
      </div>

      {/* Restaurant Grid */}
      {filteredRestaurants.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-sm font-bold text-gray-800">No restaurants found</h3>
          <p className="text-gray-500 text-xs mt-1">
            {onlyNearby 
              ? "Try unchecking 'Nearby Only' or change your delivery location above." 
              : "Try choosing another category or clearing your search filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.2) }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Link
                  to={`/restaurant/${res.id}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-150 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full"
                >
                  {/* Photo Container */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <img
                      src={res.image}
                      alt={res.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-br ${res.gradient} flex items-center justify-center text-white font-bold text-lg p-4 text-center"><span>${res.name}</span></div>`;
                      }}
                    />
                    {/* Bottom gradient overlay for discount */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>

                    {/* Integrated Discount Ribbon */}
                    {res.discount && (
                      <div className="absolute bottom-2.5 left-3 text-white font-extrabold text-sm md:text-base tracking-tight drop-shadow">
                        {res.discount}
                      </div>
                    )}

                    {/* Delivery Time Badge */}
                    <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-sm text-gray-800 text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                      {res.deliveryTime}
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-3.5 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors truncate">
                        {res.name}
                      </h3>

                      {/* Ratings & Time Row */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                        <span className="inline-flex items-center gap-0.5 bg-emerald-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
                          <span>★</span>
                          <span>{res.rating}</span>
                        </span>
                        <span className="text-gray-300 font-bold">•</span>
                        <span className="font-semibold text-gray-700">{res.deliveryTime}</span>
                        {distanceStr && (
                          <>
                            <span className="text-gray-300 font-bold">•</span>
                            <span className="text-gray-500">{distanceStr}</span>
                          </>
                        )}
                      </div>

                      {/* Cuisines */}
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {res.cuisine}
                      </p>

                      {/* Address area */}
                      {res.address && (
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                          {res.address.split(',').slice(-2).join(',').trim() || res.address}
                        </p>
                      )}
                    </div>

                    {/* Min order tag */}
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                      <span>Min. order ₹{res.minOrder}</span>
                      <span className="text-primary font-semibold group-hover:underline">View Menu →</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
