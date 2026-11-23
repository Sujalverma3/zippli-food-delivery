import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
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

  const handleOrderNowClick = () => {
    const grid = document.getElementById('restaurant-section');
    if (grid) {
      grid.scrollIntoView({ behavior: 'smooth' });
    }
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
      
      // Relevance: sort by proximity (closest first)
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 font-sans">
      {/* Hero Banner with Image */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative rounded-3xl overflow-hidden shadow-card mb-8 min-h-[320px] md:min-h-[360px]"
      >
        <img
          src="/images/hero_banner.png"
          alt="Delicious food spread"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/70 to-transparent"></div>
        <div className="relative z-10 p-8 md:p-12 flex flex-col justify-center min-h-[320px] md:min-h-[360px]">
          <div className="inline-flex items-center space-x-2 bg-white bg-opacity-15 backdrop-blur-sm border border-white border-opacity-20 rounded-full px-4 py-1.5 text-white text-xs font-semibold mb-4 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
            <span>Delivering in 20-30 mins</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 max-w-2xl leading-[1.1] text-white">
            Craving good food? <span className="text-primary">We'll bring it over.</span>
          </h1>
          <p className="text-base md:text-lg text-slate-200 mb-6 max-w-xl font-light leading-relaxed">
            Order from top local restaurants and get it hot at your door in 20 to 30 minutes.
          </p>
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleOrderNowClick}
              className="bg-primary hover:bg-orange-600 text-white transition-all px-8 py-3.5 rounded-2xl text-xs font-bold w-fit shadow-lg hover:shadow-orange-500/20 duration-200"
            >
              Explore Restaurants
            </motion.button>
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href="/partner.html"
              className="bg-white bg-opacity-15 backdrop-blur-sm hover:bg-opacity-25 text-white transition-all px-6 py-3.5 rounded-2xl text-xs font-bold w-fit border border-white border-opacity-20 flex items-center space-x-1.5"
            >
              <span>Partner Portal</span>
            </motion.a>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-8 mt-8">
            {[
              { value: '500+', label: 'Restaurants' },
              { value: '10K+', label: 'Happy Users' },
              { value: '30 min', label: 'Avg. Delivery' },
            ].map((stat, i) => (
              <div key={i} className="text-white">
                <span className="text-lg md:text-xl font-black block leading-none">{stat.value}</span>
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Offers Section */}
      <div className="mb-8">
        <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center space-x-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm-2 4h4M3 8h18v13H3V8z" />
          </svg>
          <span>Special Offers</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: '50% OFF', desc: 'On your first order', code: 'ZIPPLI50', bg: 'from-orange-400 to-red-500' },
            { title: 'FREE Delivery', desc: 'On orders above ₹299', code: 'WELCOME20', bg: 'from-green-400 to-emerald-600' },
            { title: '₹100 Cashback', desc: 'Pay via UPI wallets', code: 'SUPER75', bg: 'from-purple-400 to-pink-500' },
          ].map((offer, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`bg-gradient-to-r ${offer.bg} rounded-2xl p-5 text-white shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden group`}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xl font-black block">{offer.title}</span>
                  <p className="text-xs text-white text-opacity-90 mt-1 font-medium">{offer.desc}</p>
                  <div className="mt-3.5 inline-block bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-black border border-white border-opacity-20 uppercase tracking-widest">
                    Code: {offer.code}
                  </div>
                </div>
                <svg className="w-8 h-8 text-white text-opacity-30 group-hover:scale-110 transition-transform duration-350" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Zippli Express Delivery Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl p-6 md:p-8 shadow-card border border-slate-100 flex flex-col md:flex-row items-center justify-between mb-8 gap-6 overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-5 rounded-full translate-x-8 -translate-y-8"></div>
        <div className="flex items-center space-x-5 md:space-x-6 z-10">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 shrink-0 p-3 flex items-center justify-center">
            <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span className="inline-block bg-primary bg-opacity-10 text-primary text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg mb-2 border border-orange-100">
              ⚡ Zippli Express
            </span>
            <h2 className="text-lg font-black text-slate-800 leading-tight">
              Piping hot delivery, right on time
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-lg font-medium">
              Orders are packed in insulated thermal bags so food arrives kitchen-fresh and steaming hot at your door.
            </p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-150 px-5 py-3.5 rounded-2xl shrink-0 text-center shadow-inner z-10 w-full md:w-auto">
          <svg className="w-6 h-6 text-primary mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="block text-[10px] font-black text-primary uppercase mt-1.5 tracking-wider">Fast Dispatch</span>
          <span className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">Hot & Fresh</span>
        </div>
      </motion.div>

      {/* Categories scroll section */}
      <div className="mb-6">
        <h2 className="text-lg font-black text-slate-800 mb-3">In the Mood for?</h2>
        <CategoryChips activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
      </div>

      {/* Sorting & Filter section */}
      <div id="restaurant-section" className="scroll-mt-24">
        <FilterBar activeSort={activeSort} setActiveSort={setActiveSort} onlyNearby={onlyNearby} setOnlyNearby={setOnlyNearby} />
      </div>

      {/* Restaurant Grid */}
      {filteredRestaurants.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <svg className="w-12 h-12 text-slate-350 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-sm font-bold mt-4 text-slate-800">No Restaurants Found</h3>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            {onlyNearby 
              ? "Try turning off the 'Nearby Only' filter or switching your delivery address." 
              : "Try adjusting your category or search filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.25) }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Link
                  to={`/restaurant/${res.id}`}
                  className="group bg-white rounded-3xl overflow-hidden shadow-card border border-slate-100/80 transition-shadow duration-300 hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] flex flex-col h-full"
                >
                {/* Cover Image */}
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={res.image}
                    alt={res.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-br ${res.gradient} flex items-center justify-center text-white font-black text-xl p-4 text-center"><div class="absolute inset-0 bg-black bg-opacity-20"></div><span class="relative z-10 drop-shadow-md">${res.name}</span></div>`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent"></div>

                  {/* Discount Badge */}
                  {res.discount && (
                    <div className="absolute bottom-3 left-3 bg-primary text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg shadow-sm uppercase tracking-widest border border-orange-100/20">
                      {res.discount}
                    </div>
                  )}

                  {/* Delivery time badge */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm flex items-center space-x-1 border border-slate-100/50">
                    <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{res.deliveryTime}</span>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 group-hover:text-primary transition-colors duration-200">
                      {res.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1 font-medium">{res.cuisine}</p>

                    {/* Tags */}
                    {res.tags && res.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {res.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[9px] font-black text-primary bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100/50 uppercase tracking-wider">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4.5 pt-4 border-t border-slate-50 text-[10px] font-bold text-slate-400">
                    <div className="flex items-center bg-green-50 text-success px-2 py-1 rounded-md border border-green-100">
                      <svg className="w-3 h-3 text-success fill-current mr-0.5" viewBox="0 0 24 24">
                        <path d="M12 .587l3.668 7.431 8.2 1.191-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.209l8.2-1.191L12 .587z"/>
                      </svg>
                      <span className="text-[11px] font-black leading-none">{res.rating}</span>
                    </div>
                    {distanceStr && (
                      <>
                        <div>•</div>
                        <div className="flex items-center space-x-1.5 uppercase tracking-wider">
                          <svg className="w-3.5 h-3.5 text-slate-450 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{distanceStr}</span>
                        </div>
                      </>
                    )}
                    <div>•</div>
                    <div className="flex items-center space-x-1.5 uppercase tracking-wider">
                      <svg className="w-3.5 h-3.5 text-slate-450 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{res.deliveryTime}</span>
                    </div>
                    <div>•</div>
                    <div className="uppercase tracking-wider">Min. ₹{res.minOrder}</div>
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
