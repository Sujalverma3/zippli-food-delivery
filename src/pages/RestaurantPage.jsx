import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getHaversineDistance } from '../utils/distance.js';
import { toast } from 'react-hot-toast';
import MapView from '../components/MapView.jsx';

export default function RestaurantPage() {
  const { id } = useParams();
  const { userLocation } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('menu');
  const { cart, addItem, updateQty, cartTotal } = useCart();

  // Customization Modal State
  const [customizingItem, setCustomizingItem] = useState(null);
  const [selectedSize, setSelectedSize] = useState('Medium'); // Regular, Medium, Large
  const [selectedSpice, setSelectedSpice] = useState('Medium'); // Mild, Medium, Hot
  const [extraCheese, setExtraCheese] = useState(false);
  const [extraToppings, setExtraToppings] = useState(false);
  const [isJainOption, setIsJainOption] = useState(false);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/restaurants/${id}`);
        setRestaurant(res.data);
      } catch (err) {
        console.error('Error fetching restaurant:', err);
        toast.error('Restaurant not found');
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-20 max-w-md mx-auto flex flex-col items-center">
        <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold text-textPrimary">Restaurant not found</h2>
        <Link to="/" className="text-primary mt-4 inline-block font-semibold hover:underline">← Go Back Home</Link>
      </div>
    );
  }

  const menu = restaurant.menu || {};
  const deliveryFee = cartTotal > 0 ? (cartTotal >= 299 ? 0 : 30) : 0;
  const gst = cartTotal * 0.05;
  const grandTotal = cartTotal + deliveryFee + gst;
  const localCartItems = cart.filter((item) => item.restaurantId === id);

  // Sum quantity of all variants of this item in the cart
  const getBaseQty = (itemId) => {
    return cart
      .filter((i) => i.id === itemId || i.baseId === itemId)
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const handleAddItemClick = (item, isMain) => {
    const isDifferentRestaurant = cart.length > 0 && cart[0].restaurantId !== id;
    if (isDifferentRestaurant) {
      if (!window.confirm('Adding items from a different restaurant will clear your current cart. Continue?')) {
        return;
      }
    }

    if (isMain) {
      // Open customization modal
      setCustomizingItem(item);
      setSelectedSize('Medium');
      setSelectedSpice('Medium');
      setExtraCheese(false);
      setExtraToppings(false);
      setIsJainOption(false);
    } else {
      // Add directly
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        restaurantId: id,
        restaurantName: restaurant.name
      });
      toast.success(`${item.name} added to cart`);
    }
  };

  const submitCustomization = () => {
    if (!customizingItem) return;

    let extraCost = 0;
    const details = [];

    // Size pricing
    if (selectedSize === 'Regular') {
      extraCost -= 20;
      details.push('Regular');
    } else if (selectedSize === 'Large') {
      extraCost += 40;
      details.push('Large');
    } else {
      details.push('Medium');
    }

    // Spice
    details.push(`${selectedSpice} Spice`);

    // Extras
    if (extraCheese) {
      extraCost += 30;
      details.push('Extra Cheese');
    }
    if (extraToppings) {
      extraCost += 20;
      details.push('Extra Toppings');
    }
    if (isJainOption) {
      details.push('Jain (No Onion/Garlic)');
    }

    const finalPrice = Math.max(10, customizingItem.price + extraCost);
    const customId = `${customizingItem.id}-${selectedSize}-${selectedSpice}-${extraCheese ? 'cheese' : 'no'}-${extraToppings ? 'toppings' : 'no'}-${isJainOption ? 'jain' : 'std'}`;
    const customName = `${customizingItem.name} (${details.join(', ')})`;

    addItem({
      id: customId,
      baseId: customizingItem.id,
      name: customName,
      price: finalPrice,
      restaurantId: id,
      restaurantName: restaurant.name,
      customizations: details.join(', ')
    });

    toast.success(`${customizingItem.name} (Customized) added!`);
    setCustomizingItem(null);
  };

  const avgRating = restaurant.reviews && restaurant.reviews.length > 0
    ? (restaurant.reviews.reduce((sum, r) => sum + r.rating, 0) / restaurant.reviews.length).toFixed(1)
    : restaurant.rating;

  const distanceStr = restaurant
    ? getHaversineDistance(userLocation?.lat, userLocation?.lng, restaurant.lat, restaurant.lng)
    : null;

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} className={`w-3.5 h-3.5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-350 fill-gray-200'}`} viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'starters':
        return (
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'mains':
        return (
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m12.72-12.72l-1.41 1.41" />
          </svg>
        );
      case 'desserts':
        return (
          <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0h4m-4 0H8m12 3v10a2 2 0 01-2 2H6a2 2 0 01-2-2V11h16z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
    }
  };

  const tabs = [
    { 
      id: 'menu', 
      label: 'Menu', 
      count: Object.values(menu).flat().length,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
    },
    { 
      id: 'reviews', 
      label: 'Reviews', 
      count: restaurant.reviews?.length || 0,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
    },
    { 
      id: 'location', 
      label: 'Location',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-textMuted mb-4">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <span className="text-textPrimary font-medium">{restaurant.name}</span>
      </div>

      {/* Swiggy-style Restaurant Header Card */}
      <div className="bg-white dark:bg-[#16171e] rounded-3xl p-6 md:p-8 border border-gray-150 dark:border-neutral-800 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 bg-orange-50 dark:bg-orange-950/40 text-primary rounded border border-orange-200 dark:border-orange-900">
                {restaurant.discount || 'Special Offers Available'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-neutral-100 tracking-tight">
              {restaurant.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1 font-medium">{restaurant.cuisine}</p>
            <p className="text-xs text-gray-400 dark:text-neutral-500 mt-0.5">
              {restaurant.address || 'Local Kitchen, Connaught Place'}
              {distanceStr && <span> • {distanceStr}</span>}
            </p>
          </div>

          {/* Rating Box */}
          <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto p-3.5 bg-gray-50 dark:bg-neutral-850 rounded-2xl border border-gray-200/80 dark:border-neutral-800 shrink-0">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-extrabold text-base">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">★</span>
              <span>{avgRating}</span>
            </div>
            <span className="text-[11px] text-gray-400 dark:text-neutral-500 font-semibold mt-0.5">
              {restaurant.reviews?.length ? `${restaurant.reviews.length * 40}+ ratings` : '500+ ratings'}
            </span>
          </div>
        </div>

        {/* Delivery & Ordering Info Strip */}
        <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-semibold text-gray-700 dark:text-neutral-300">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{restaurant.deliveryTime} Delivery Time</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>₹{restaurant.minOrder} Min. Order</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-700">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Free delivery on orders above ₹299</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3.5 text-sm font-bold border-b-2 whitespace-nowrap transition-all duration-200 flex items-center space-x-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-textMuted hover:text-textPrimary'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-primary text-white' : 'bg-gray-100 text-textMuted'
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'menu' && (
            <div className="space-y-6">
              {Object.keys(menu).length === 0 || Object.values(menu).flat().length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 shadow-sm flex flex-col items-center">
                  <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <h3 className="text-sm font-bold text-textPrimary">No Menu Items Available</h3>
                  <p className="text-textMuted text-xs mt-1 font-medium">This restaurant hasn't uploaded any dishes to their menu yet.</p>
                </div>
              ) : (
                Object.entries(menu).map(([category, items]) => {
                  if (!items || items.length === 0) return null;
                  const isCustomizable = category === 'mains';
                  
                  return (
                    <div key={category} className="bg-white dark:bg-[#16171e] rounded-2xl p-6 shadow-card border border-gray-100 dark:border-neutral-800">
                      <h2 className="text-lg font-extrabold text-textPrimary dark:text-neutral-100 capitalize border-b border-gray-100 dark:border-neutral-800 pb-3 mb-4 flex items-center justify-between">
                        <span className="flex items-center space-x-2.5">
                          {getCategoryIcon(category)}
                          <span>{category}</span>
                        </span>
                        <span className="text-xs bg-gray-100 dark:bg-neutral-800 text-textMuted dark:text-neutral-400 px-2.5 py-1 rounded-full font-medium">{items.length} Items</span>
                      </h2>
                      <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                        {items.map((item) => {
                          const qty = getBaseQty(item.id);
                          return (
                            <div key={item.id} className="py-6 first:pt-0 last:pb-0 flex justify-between items-start gap-4">
                              <div className="flex-grow pr-2">
                                {/* Swiggy Veg indicator */}
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="w-3.5 h-3.5 rounded-sm border border-emerald-600 flex items-center justify-center p-0.5 shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                  </span>
                                  {isCustomizable && (
                                    <span className="text-[10px] text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                      Customisable
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-neutral-100">
                                  {item.name}
                                </h3>
                                <p className="text-sm font-bold text-gray-800 dark:text-neutral-200 mt-1">₹{item.price}</p>
                                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1.5 leading-relaxed line-clamp-2">{item.description}</p>
                              </div>

                              {/* Swiggy Image & Floating ADD button */}
                              <div className="flex-shrink-0 flex flex-col items-center">
                                <div className="w-32 h-24 sm:w-36 sm:h-26 rounded-2xl overflow-hidden shadow-sm relative bg-gray-100 dark:bg-neutral-800 border border-gray-150 dark:border-neutral-800">
                                  <img
                                    src={item.image || (category === 'starters' ? '/images/healthy.png' : category === 'desserts' ? '/images/desserts.png' : restaurant.image)}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.parentElement.innerHTML = `<div class="text-primary flex items-center justify-center w-full h-full bg-orange-50"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>`;
                                    }}
                                  />
                                </div>
                                
                                <button 
                                  onClick={() => handleAddItemClick(item, isCustomizable)} 
                                  className="relative -mt-4 bg-white dark:bg-neutral-850 hover:bg-gray-50 dark:hover:bg-neutral-800 text-emerald-600 dark:text-emerald-400 border border-gray-200/90 dark:border-neutral-700 shadow-md px-6 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all transform active:scale-95 flex items-center space-x-1.5"
                                >
                                  <span>ADD</span>
                                  {qty > 0 && <span className="bg-emerald-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{qty}</span>}
                                </button>
                                {isCustomizable && (
                                  <span className="text-[10px] text-gray-400 dark:text-neutral-500 font-medium mt-1">Customisable</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-4xl font-extrabold text-textPrimary">{avgRating}</div>
                    <div className="flex mt-1">{renderStars(Math.round(avgRating))}</div>
                    <p className="text-[10px] text-textMuted mt-1 font-medium">{restaurant.reviews?.length || 0} reviews</p>
                  </div>
                  <div className="flex-grow space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = restaurant.reviews?.filter(r => r.rating === star).length || 0;
                      const pct = restaurant.reviews?.length > 0 ? (count / restaurant.reviews.length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center space-x-2 text-xs">
                          <span className="w-3 text-textMuted font-medium">{star}</span>
                          <span className="text-yellow-400 text-[10px]">★</span>
                          <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="w-4 text-textMuted text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {restaurant.reviews && restaurant.reviews.map((review, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-textPrimary">{review.name}</h4>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <span className="text-[10px] text-textMuted">
                            {new Date(review.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-textMuted leading-relaxed">{review.text}</p>
                </div>
              ))}

              {(!restaurant.reviews || restaurant.reviews.length === 0) && (
                <div className="text-center py-12 bg-white rounded-2xl shadow-card border border-gray-100 flex flex-col items-center">
                  <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <h3 className="text-base font-bold text-textPrimary">No Reviews Yet</h3>
                  <p className="text-xs text-textMuted mt-1">Be the first to review this restaurant!</p>
                </div>
              )}
            </div>
          )}

          {/* Location Tab */}
          {activeTab === 'location' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
                <h3 className="text-lg font-extrabold text-textPrimary mb-4 flex items-center space-x-2.5">
                  <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Restaurant Location</span>
                </h3>
                <MapView lat={restaurant.lat} lng={restaurant.lng} height="350px" />
                <div className="mt-6 space-y-4">
                  <div className="flex items-start space-x-3.5 p-3.5 bg-gray-50 rounded-xl">
                    <svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <div>
                      <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider block">Address</span>
                      <span className="text-sm font-semibold text-textPrimary">{restaurant.address || 'Address not available'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-3.5 p-3.5 bg-gray-50 rounded-xl">
                      <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider block">Phone</span>
                        <span className="text-sm font-semibold text-textPrimary">{restaurant.phone || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3.5 p-3.5 bg-gray-50 rounded-xl">
                      <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider block">Hours</span>
                        <span className="text-sm font-semibold text-textPrimary">{restaurant.openingHours || 'All Day'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Cart Summary */}
        <div className="lg:col-span-1 lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
            <h2 className="text-lg font-extrabold text-textPrimary border-b border-gray-100 pb-3 mb-4 flex items-center space-x-2.5">
              <svg className="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Cart Summary</span>
            </h2>

            {localCartItems.length === 0 ? (
              <div className="text-center py-8 flex flex-col items-center">
                <svg className="w-10 h-10 text-slate-300 animate-bounce mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="text-sm font-bold text-textPrimary mt-3">Your Cart is Empty</h3>
                <p className="text-xs text-textMuted mt-1 font-medium">Add items from the menu to start order</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-60 overflow-y-auto pr-1 space-y-3 divide-y divide-gray-50">
                  {localCartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center pt-3 first:pt-0 text-xs animate-fade-in">
                      <div className="flex-grow pr-2">
                        <span className="font-semibold text-textPrimary block leading-snug">{item.name}</span>
                        {item.customizations && (
                          <span className="text-[9px] text-primary italic block mt-0.5">Customized: {item.customizations}</span>
                        )}
                        <span className="text-[10px] text-textMuted block mt-0.5">₹{item.price} × {item.quantity}</span>
                      </div>
                      <div className="flex items-center space-x-2.5 shrink-0">
                        <div className="flex items-center bg-gray-100 text-textPrimary rounded px-2 py-0.5 border border-gray-200">
                          <button onClick={() => updateQty(item.id, item.quantity - 1)} className="font-bold text-[10px]">−</button>
                          <span className="px-2 font-bold text-[10px]">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, item.quantity + 1)} className="font-bold text-[10px]">+</button>
                        </div>
                        <span className="font-bold text-textPrimary text-right min-w-[50px]">₹{item.price * item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2 text-xs text-textMuted">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-textPrimary">₹{cartTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-medium text-textPrimary">
                      {deliveryFee === 0 ? <span className="text-success font-bold">FREE</span> : `₹${deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (5%)</span>
                    <span className="font-medium text-textPrimary">₹{gst.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between text-sm font-extrabold text-textPrimary">
                    <span>Total Amount</span>
                    <span className="text-primary text-base">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Link
                  to="/cart"
                  className="w-full bg-primary hover:bg-orange-600 text-white text-center flex items-center justify-center space-x-1.5 py-3 rounded-xl text-sm font-bold shadow-md transition-all transform active:scale-95 duration-200"
                >
                  <span>Proceed to Checkout</span>
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item Customization Modal */}
      {customizingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#16171e] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 dark:border-neutral-800 transform transition-all duration-300 scale-100 animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-primary p-6 text-white relative">
              <h3 className="text-lg font-extrabold">Customize your Dish</h3>
              <p className="text-xs text-orange-100 font-medium mt-1">{customizingItem.name}</p>
              <button 
                onClick={() => setCustomizingItem(null)}
                className="absolute top-6 right-6 text-white hover:text-orange-200 text-sm font-bold bg-white bg-opacity-10 w-7 h-7 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Customization Options */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar text-xs">
              
              {/* Size Options */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-textPrimary dark:text-neutral-100 uppercase tracking-wider text-[10px] text-textMuted dark:text-neutral-400">Select Portion Size</h4>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { name: 'Regular', desc: '-₹20', active: selectedSize === 'Regular' },
                    { name: 'Medium', desc: '+₹0', active: selectedSize === 'Medium' },
                    { name: 'Large', desc: '+₹40', active: selectedSize === 'Large' },
                  ].map(sz => (
                    <button
                      key={sz.name}
                      type="button"
                      onClick={() => setSelectedSize(sz.name)}
                      className={`border rounded-xl p-3 font-bold text-center transition-all ${
                        sz.active 
                          ? 'border-primary bg-orange-50 dark:bg-orange-950/40 text-primary' 
                          : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 hover:border-primary text-textMuted dark:text-neutral-300 hover:text-primary dark:hover:text-white'
                      }`}
                    >
                      <div className="text-xs">{sz.name}</div>
                      <div className="text-[9px] font-semibold opacity-70 mt-0.5">{sz.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Spice Level */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-textPrimary dark:text-neutral-100 uppercase tracking-wider text-[10px] text-textMuted dark:text-neutral-400 font-sans">Select Spice Level</h4>
                <div className="grid grid-cols-3 gap-2.5">
                  {['Mild', 'Medium', 'Hot'].map(spice => (
                    <button
                      key={spice}
                      type="button"
                      onClick={() => setSelectedSpice(spice)}
                      className={`border rounded-xl p-3 font-bold text-center transition-all flex flex-col items-center justify-center ${
                        selectedSpice === spice 
                          ? 'border-primary bg-orange-50 dark:bg-orange-950/40 text-primary' 
                          : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 hover:border-primary text-textMuted dark:text-neutral-300 hover:text-primary dark:hover:text-white'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full mb-1 ${
                        spice === 'Mild' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : spice === 'Medium' ? 'bg-amber-500 shadow-sm shadow-amber-500/50' : 'bg-rose-500 shadow-sm shadow-rose-500/50'
                      }`} />
                      <div className="mt-1 font-semibold">{spice}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary Preferences: Jain Mode */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-textPrimary dark:text-neutral-100 uppercase tracking-wider text-[10px] text-textMuted dark:text-neutral-400 font-sans">Dietary Option</h4>
                <label className="flex items-center justify-between p-3 border border-amber-200/90 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors">
                  <div className="flex items-center space-x-2.5">
                    <input 
                      type="checkbox" 
                      checked={isJainOption}
                      onChange={() => setIsJainOption(!isJainOption)}
                      className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-gray-900 dark:text-neutral-100 flex items-center gap-1.5">
                        <span>🌾</span>
                        <span>Jain Preparation</span>
                      </span>
                      <p className="text-[10px] text-amber-800 dark:text-amber-400 mt-0.5">Cooked without onion, garlic, or root vegetables</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Free</span>
                </label>
              </div>

              {/* Extra Add-ons */}
              <div className="space-y-3">
                <h4 className="font-bold text-textPrimary dark:text-neutral-100 uppercase tracking-wider text-[10px] text-textMuted dark:text-neutral-400 font-sans">Extra Add-ons</h4>
                <div className="space-y-2">
                  
                  {/* Cheese */}
                  <label className="flex items-center justify-between p-3 border border-gray-150 dark:border-neutral-700 bg-white dark:bg-neutral-850 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                    <div className="flex items-center space-x-2.5">
                      <input 
                        type="checkbox" 
                        checked={extraCheese}
                        onChange={() => setExtraCheese(!extraCheese)}
                        className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                      />
                      <span className="font-bold text-textPrimary dark:text-neutral-100">Extra Cheese</span>
                    </div>
                    <span className="font-extrabold text-primary">+₹30</span>
                  </label>

                  {/* Toppings */}
                  <label className="flex items-center justify-between p-3 border border-gray-150 dark:border-neutral-700 bg-white dark:bg-neutral-850 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                    <div className="flex items-center space-x-2.5">
                      <input 
                        type="checkbox" 
                        checked={extraToppings}
                        onChange={() => setExtraToppings(!extraToppings)}
                        className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                      />
                      <span className="font-bold text-textPrimary dark:text-neutral-100">Fresh Veggie Toppings</span>
                    </div>
                    <span className="font-extrabold text-primary">+₹20</span>
                  </label>

                </div>
              </div>

            </div>

            {/* Modal Footer (Add button with Dynamic Price) */}
            <div className="bg-gray-50 dark:bg-neutral-850 p-6 border-t border-gray-150 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-textMuted block uppercase">Estimated Price</span>
                <span className="text-xl font-extrabold text-primary">
                  ₹{Math.max(10, customizingItem.price + (selectedSize === 'Regular' ? -20 : selectedSize === 'Large' ? 40 : 0) + (extraCheese ? 30 : 0) + (extraToppings ? 20 : 0))}
                </span>
              </div>
              <button
                onClick={submitCustomization}
                className="bg-primary hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all transform active:scale-95 flex items-center justify-center space-x-1.5 text-xs"
              >
                <span>Add Customization</span>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      )}
      {/* Floating Bottom Cart Bar for Mobile View */}
      {localCartItems.length > 0 && (
        <div className="fixed bottom-16 inset-x-0 p-3 z-40 lg:hidden">
          <Link
            to="/cart"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-5 py-3 flex items-center justify-between shadow-xl font-bold transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-800/60 px-2 py-0.5 rounded-md font-bold">
                {localCartItems.reduce((acc, i) => acc + i.quantity, 0)} {localCartItems.reduce((acc, i) => acc + i.quantity, 0) === 1 ? 'item' : 'items'}
              </span>
              <span className="text-sm font-extrabold">₹{cartTotal}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
              <span>View Cart</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
