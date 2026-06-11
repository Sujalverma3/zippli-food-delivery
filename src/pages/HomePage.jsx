import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import CategoryChips from '../components/CategoryChips.jsx';
import FilterBar from '../components/FilterBar.jsx';

export default function HomePage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSort, setActiveSort] = useState('relevance');
  const [searchParams] = useSearchParams();
  const searchVal = searchParams.get('search') || '';

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
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (activeSort === 'rating') return b.rating - a.rating;
      if (activeSort === 'delivery') return parseInt(a.deliveryTime) - parseInt(b.deliveryTime);
      if (activeSort === 'costLowHigh') return a.minOrder - b.minOrder;
      if (activeSort === 'costHighLow') return b.minOrder - a.minOrder;
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
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
      {/* Hero Banner with Image */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg mb-8 min-h-[320px] md:min-h-[360px]">
        <img
          src="/images/hero_banner.png"
          alt="Delicious food spread"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent"></div>
        <div className="relative z-10 p-8 md:p-12 flex flex-col justify-center min-h-[320px] md:min-h-[360px]">
          <div className="inline-flex items-center space-x-2 bg-white bg-opacity-15 backdrop-blur-sm border border-white border-opacity-20 rounded-full px-4 py-1.5 text-white text-xs font-medium mb-4 w-fit">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span>Delivering in 20-30 mins</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 max-w-2xl leading-[1.1] text-white drop-shadow-lg">
            Hungry? We've Got <span className="text-primary">You Covered.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-6 max-w-xl font-light leading-relaxed">
            Get the best food from top restaurants delivered to your doorstep in minutes.
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleOrderNowClick}
              className="bg-primary hover:bg-orange-600 text-white transition-colors px-8 py-3.5 rounded-xl text-sm font-bold w-fit shadow-lg transform active:scale-95 duration-200"
            >
              Order Now ⚡
            </button>
            <Link
              to="/dashboard"
              className="bg-white bg-opacity-15 backdrop-blur-sm hover:bg-opacity-25 text-white transition-all px-6 py-3.5 rounded-xl text-sm font-bold w-fit border border-white border-opacity-20"
            >
              Admin Panel 📊
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-6 mt-8">
            {[
              { value: '500+', label: 'Restaurants' },
              { value: '10K+', label: 'Happy Users' },
              { value: '30 min', label: 'Avg. Delivery' },
            ].map((stat, i) => (
              <div key={i} className="text-white">
                <span className="text-lg md:text-xl font-extrabold block">{stat.value}</span>
                <span className="text-[10px] text-gray-300 font-medium">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Offers Section */}
      <div className="mb-8">
        <h2 className="text-xl font-extrabold text-textPrimary mb-4 flex items-center space-x-2">
          <span>🎉</span>
          <span>Today's Offers</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: '50% OFF', desc: 'On your first order', code: 'ZIPPLI50', bg: 'from-orange-400 to-red-500', icon: '🎁' },
            { title: 'FREE Delivery', desc: 'On orders above ₹299', code: 'FREEDEL', bg: 'from-green-400 to-emerald-600', icon: '🚀' },
            { title: '₹100 Cashback', desc: 'Pay via UPI wallets', code: 'UPI100', bg: 'from-purple-400 to-pink-500', icon: '💰' },
          ].map((offer, idx) => (
            <div key={idx} className={`bg-gradient-to-r ${offer.bg} rounded-2xl p-5 text-white shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xl font-extrabold block">{offer.title}</span>
                  <p className="text-sm text-white text-opacity-90 mt-1">{offer.desc}</p>
                  <div className="mt-3 inline-block bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold border border-white border-opacity-20">
                    Code: {offer.code}
                  </div>
                </div>
                <span className="text-3xl">{offer.icon}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zippli Express Delivery Premium Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-card border border-gray-100 flex flex-col md:flex-row items-center justify-between mb-8 gap-6 overflow-hidden relative animate-fade-in">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-5 rounded-full translate-x-8 -translate-y-8"></div>
        <div className="flex items-center space-x-5 md:space-x-6 z-10">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-orange-100 shadow-md bg-orange-50 shrink-0 p-2">
            <img src="/images/foody_logo.png" alt="Zippli Food Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="inline-block bg-primary bg-opacity-10 text-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 border border-orange-150">
              🚀 Zippli Express
            </span>
            <h2 className="text-lg md:text-xl font-extrabold text-textPrimary leading-tight">
              Fresh Hot Meals Delivered Right to Your Table
            </h2>
            <p className="text-xs text-textMuted mt-1 max-w-lg">
              Our signature cloche stamp guarantees that your orders are packed using advanced thermal hygiene seals, keeping food piping hot from the kitchen to your doorstep.
            </p>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-100 px-5 py-3 rounded-2xl shrink-0 text-center shadow-sm z-10 w-full md:w-auto">
          <span className="text-xl">🛎️</span>
          <span className="block text-xs font-extrabold text-primary uppercase mt-1">Super Fast</span>
          <span className="text-[10px] text-textMuted mt-0.5">Hot & Fresh</span>
        </div>
      </div>

      {/* Categories scroll section */}
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-textPrimary mb-3">In the Mood for?</h2>
        <CategoryChips activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
      </div>

      {/* Sorting & Filter section */}
      <div id="restaurant-section" className="scroll-mt-24">
        <FilterBar activeSort={activeSort} setActiveSort={setActiveSort} />
      </div>

      {/* Restaurant Grid */}
      {filteredRestaurants.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-5xl">🥺</span>
          <h3 className="text-lg font-bold mt-4 text-textPrimary">No Restaurants Found</h3>
          <p className="text-textMuted text-sm mt-1">Try adjusting your category or search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRestaurants.map((res) => (
            <Link
              key={res.id}
              to={`/restaurant/${res.id}`}
              className="group bg-white rounded-2xl overflow-hidden shadow-card border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] flex flex-col"
            >
              {/* Cover Image */}
              <div className="h-48 relative overflow-hidden">
                <img
                  src={res.image}
                  alt={res.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-br ${res.gradient} flex items-center justify-center text-white font-extrabold text-xl p-4 text-center"><div class="absolute inset-0 bg-black bg-opacity-20"></div><span class="relative z-10 drop-shadow-md">${res.name}</span></div>`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

                {/* Discount Badge */}
                {res.discount && (
                  <div className="absolute bottom-3 left-3 bg-primary text-white text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-md uppercase tracking-wider">
                    {res.discount}
                  </div>
                )}

                {/* Delivery time badge */}
                <div className="absolute top-3 right-3 bg-white text-textPrimary text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm flex items-center space-x-1">
                  <span>⏱️</span>
                  <span>{res.deliveryTime}</span>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-textPrimary group-hover:text-primary transition-colors duration-200">
                    {res.name}
                  </h3>
                  <p className="text-xs text-textMuted mt-1 line-clamp-1">{res.cuisine}</p>

                  {/* Tags */}
                  {res.tags && res.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {res.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[9px] font-bold text-primary bg-orange-50 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 text-xs font-semibold text-textMuted">
                  <div className="flex items-center bg-green-50 text-success px-2 py-1 rounded">
                    <span>⭐</span>
                    <span className="ml-1 text-[11px] font-extrabold">{res.rating}</span>
                  </div>
                  <div>•</div>
                  <div>⏱️ {res.deliveryTime}</div>
                  <div>•</div>
                  <div>Min. ₹{res.minOrder}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
