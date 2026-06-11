import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext.jsx';
import { toast } from 'react-hot-toast';
import MapView from '../components/MapView.jsx';

export default function RestaurantPage() {
  const { id } = useParams();
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
      <div className="text-center py-20 max-w-md mx-auto">
        <span className="text-6xl block mb-4">😔</span>
        <h2 className="text-2xl font-bold text-textPrimary">Restaurant not found</h2>
        <Link to="/" className="text-primary mt-4 inline-block font-semibold hover:underline">← Go Back Home</Link>
      </div>
    );
  }

  const { menu } = restaurant;
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

    const finalPrice = Math.max(10, customizingItem.price + extraCost);
    const customId = `${customizingItem.id}-${selectedSize}-${selectedSpice}-${extraCheese ? 'cheese' : 'no'}-${extraToppings ? 'toppings' : 'no'}`;
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

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-sm ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
    ));
  };

  const tabs = [
    { id: 'menu', label: '🍽️ Menu', count: Object.values(menu).flat().length },
    { id: 'reviews', label: '⭐ Reviews', count: restaurant.reviews?.length || 0 },
    { id: 'location', label: '📍 Location' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-textMuted mb-4">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <span className="text-textPrimary font-medium">{restaurant.name}</span>
      </div>

      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden mb-8 shadow-lg">
        <div className="relative h-64 md:h-80">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover animate-fade-in"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.className += ` bg-gradient-to-br ${restaurant.gradient || 'from-orange-400 to-red-500'}`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              {restaurant.discount && (
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest bg-primary px-3 py-1 rounded-full mb-3 shadow-lg">
                  {restaurant.discount}
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-extrabold drop-shadow-lg">{restaurant.name}</h1>
              <p className="text-orange-200 text-sm mt-1.5 font-medium">{restaurant.cuisine}</p>

              {restaurant.tags && restaurant.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {restaurant.tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-bold bg-white bg-opacity-20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white border-opacity-20">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold bg-white bg-opacity-15 backdrop-blur-md p-4 rounded-2xl border border-white border-opacity-10 shrink-0">
              <div className="flex items-center text-yellow-300 gap-1">
                <span>⭐</span>
                <span className="font-bold text-base">{avgRating}</span>
              </div>
              <div className="w-px h-6 bg-white bg-opacity-30"></div>
              <div className="text-center">
                <span className="block font-bold">{restaurant.deliveryTime}</span>
                <span className="text-[10px] text-gray-300">Delivery</span>
              </div>
              <div className="w-px h-6 bg-white bg-opacity-30"></div>
              <div className="text-center">
                <span className="block font-bold">₹{restaurant.minOrder}</span>
                <span className="text-[10px] text-gray-300">Min Order</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: '⭐', label: 'Rating', value: `${avgRating} / 5`, color: 'text-yellow-500', bg: 'bg-yellow-50' },
          { icon: '⏱️', label: 'Delivery Time', value: restaurant.deliveryTime, color: 'text-blue-500', bg: 'bg-blue-50' },
          { icon: '📞', label: 'Phone', value: restaurant.phone || 'N/A', color: 'text-green-500', bg: 'bg-green-50' },
          { icon: '🕐', label: 'Hours', value: restaurant.openingHours || 'All Day', color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-card border border-gray-100 flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center text-lg shrink-0`}>{card.icon}</div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider block">{card.label}</span>
              <span className="text-xs font-bold text-textPrimary truncate block">{card.value}</span>
            </div>
          </div>
        ))}
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
              {Object.entries(menu).map(([category, items]) => {
                if (!items || items.length === 0) return null;
                const categoryEmoji = category === 'starters' ? '🥗' : category === 'mains' ? '🍛' : '🍰';
                const isCustomizable = category === 'mains';
                
                return (
                  <div key={category} className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
                    <h2 className="text-lg font-extrabold text-textPrimary capitalize border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <span>{categoryEmoji}</span>
                        <span>{category}</span>
                      </span>
                      <span className="text-xs bg-gray-100 text-textMuted px-2.5 py-1 rounded-full font-medium">{items.length} Items</span>
                    </h2>
                    <div className="divide-y divide-gray-100">
                      {items.map((item) => {
                        const qty = getBaseQty(item.id);
                        return (
                          <div key={item.id} className="py-5 first:pt-0 last:pb-0 flex justify-between items-start gap-4">
                            <div className="flex-grow">
                              <h3 className="text-base font-bold text-textPrimary flex items-center space-x-2">
                                <span>{item.name}</span>
                                {isCustomizable && (
                                  <span className="text-[9px] bg-orange-50 text-primary border border-orange-100 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide">
                                    Customizable
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm font-extrabold text-primary mt-1">₹{item.price}</p>
                              <p className="text-xs text-textMuted mt-1.5 leading-relaxed pr-4">{item.description}</p>
                            </div>
                            <div className="flex-shrink-0 flex flex-col items-center space-y-2">
                              <div className="w-24 h-20 rounded-xl overflow-hidden shadow-inner relative flex-shrink-0 bg-gray-150 border border-gray-100 flex items-center justify-center">
                                <img
                                  src={item.image || (category === 'starters' ? '/images/healthy.png' : category === 'desserts' ? '/images/desserts.png' : restaurant.image)}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = `<span class="text-2xl">${categoryEmoji}</span>`;
                                    e.target.parentElement.className += ` bg-gradient-to-br ${restaurant.gradient} bg-opacity-20`;
                                  }}
                                />
                              </div>
                              
                              <button 
                                onClick={() => handleAddItemClick(item, isCustomizable)} 
                                className="bg-white hover:bg-orange-50 text-primary border border-gray-200 hover:border-primary px-5 py-1.5 rounded-lg text-xs font-extrabold shadow-sm transition-all transform active:scale-95 flex items-center space-x-1"
                              >
                                <span>+ ADD</span>
                                {qty > 0 && <span className="bg-primary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{qty}</span>}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
                <div className="text-center py-12 bg-white rounded-2xl shadow-card border border-gray-100">
                  <span className="text-4xl block mb-3">📝</span>
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
                <h3 className="text-lg font-extrabold text-textPrimary mb-4 flex items-center space-x-2">
                  <span>📍</span><span>Restaurant Location</span>
                </h3>
                <MapView lat={restaurant.lat} lng={restaurant.lng} height="350px" />
                <div className="mt-6 space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-primary text-lg mt-0.5">🏠</span>
                    <div>
                      <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider block">Address</span>
                      <span className="text-sm font-semibold text-textPrimary">{restaurant.address || 'Address not available'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      <span className="text-primary text-lg">📞</span>
                      <div>
                        <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider block">Phone</span>
                        <span className="text-sm font-semibold text-textPrimary">{restaurant.phone || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      <span className="text-primary text-lg">🕐</span>
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
            <h2 className="text-lg font-extrabold text-textPrimary border-b border-gray-100 pb-3 mb-4 flex items-center space-x-2">
              <span>🛒</span><span>Cart Summary</span>
            </h2>

            {localCartItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl animate-bounce">🛒</div>
                <h3 className="text-sm font-bold text-textPrimary mt-3">Your Cart is Empty</h3>
                <p className="text-xs text-textMuted mt-1">Add items from the menu to start order</p>
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
                  className="w-full bg-primary hover:bg-orange-600 text-white text-center block py-3 rounded-xl text-sm font-bold shadow-md transition-all transform active:scale-95 duration-200"
                >
                  Proceed to Checkout 🚀
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item Customization Modal */}
      {customizingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 transform transition-all duration-300 scale-100 animate-scale-up">
            
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
                <h4 className="font-bold text-textPrimary uppercase tracking-wider text-[10px] text-textMuted">Select Portion Size</h4>
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
                          ? 'border-primary bg-orange-50 text-primary' 
                          : 'border-gray-200 hover:border-primary text-textMuted hover:text-primary'
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
                <h4 className="font-bold text-textPrimary uppercase tracking-wider text-[10px] text-textMuted">Select Spice Level</h4>
                <div className="grid grid-cols-3 gap-2.5">
                  {['Mild', 'Medium', 'Hot'].map(spice => (
                    <button
                      key={spice}
                      type="button"
                      onClick={() => setSelectedSpice(spice)}
                      className={`border rounded-xl p-3 font-bold text-center transition-all ${
                        selectedSpice === spice 
                          ? 'border-primary bg-orange-50 text-primary' 
                          : 'border-gray-200 hover:border-primary text-textMuted hover:text-primary'
                      }`}
                    >
                      <span>{spice === 'Mild' ? '🟢' : spice === 'Medium' ? '🟡' : '🔴'}</span>
                      <div className="mt-1 font-semibold">{spice}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Extra Add-ons */}
              <div className="space-y-3">
                <h4 className="font-bold text-textPrimary uppercase tracking-wider text-[10px] text-textMuted font-sans">Extra Add-ons</h4>
                <div className="space-y-2">
                  
                  {/* Cheese */}
                  <label className="flex items-center justify-between p-3 border border-gray-150 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-2.5">
                      <input 
                        type="checkbox" 
                        checked={extraCheese}
                        onChange={() => setExtraCheese(!extraCheese)}
                        className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                      />
                      <span className="font-bold text-textPrimary">Extra Cheese 🧀</span>
                    </div>
                    <span className="font-extrabold text-primary">+₹30</span>
                  </label>

                  {/* Toppings */}
                  <label className="flex items-center justify-between p-3 border border-gray-150 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-2.5">
                      <input 
                        type="checkbox" 
                        checked={extraToppings}
                        onChange={() => setExtraToppings(!extraToppings)}
                        className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                      />
                      <span className="font-bold text-textPrimary">Fresh Veggie Toppings 🥦</span>
                    </div>
                    <span className="font-extrabold text-primary">+₹20</span>
                  </label>

                </div>
              </div>

            </div>

            {/* Modal Footer (Add button with Dynamic Price) */}
            <div className="bg-gray-50 p-6 border-t border-gray-150 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-textMuted block uppercase">Estimated Price</span>
                <span className="text-xl font-extrabold text-primary">
                  ₹{Math.max(10, customizingItem.price + (selectedSize === 'Regular' ? -20 : selectedSize === 'Large' ? 40 : 0) + (extraCheese ? 30 : 0) + (extraToppings ? 20 : 0))}
                </span>
              </div>
              <button
                onClick={submitCustomization}
                className="bg-primary hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all transform active:scale-95 flex items-center space-x-2 text-xs"
              >
                <span>🚀 Add Customization</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
