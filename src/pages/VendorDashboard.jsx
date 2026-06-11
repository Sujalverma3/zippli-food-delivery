import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function VendorDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [restaurantData, setRestaurantData] = useState(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);

  // Menu editor states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('mains');
  const [newItemImage, setNewItemImage] = useState('');

  // Earnings stats
  const [stats, setStats] = useState({ totalRevenue: 0, platformCommission: 0, netPayout: 0, orderCount: 0 });

  const restaurantId = currentUser?.restaurantId || 'r1';

  const fetchRestaurantDetails = async () => {
    try {
      setLoadingRestaurant(true);
      const res = await axios.get(`/api/restaurants/${restaurantId}`);
      setRestaurantData(res.data);
    } catch (err) {
      console.error('Error fetching restaurant details:', err);
      toast.error('Failed to load restaurant profile');
    } finally {
      setLoadingRestaurant(false);
    }
  };

  const fetchVendorOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await axios.get(`/api/orders?restaurantId=${restaurantId}`);
      const list = res.data.orders || [];
      setOrders(list);
      
      // Calculate earnings (only completed orders count for revenue)
      let rev = 0;
      let count = 0;
      list.forEach(o => {
        if (o.status === 'delivered') {
          rev += o.totalAmount;
          count++;
        }
      });
      const comm = rev * 0.20; // 20% platform commission
      setStats({
        totalRevenue: Math.round(rev),
        platformCommission: Math.round(comm),
        netPayout: Math.round(rev - comm),
        orderCount: count
      });
    } catch (err) {
      console.error('Error fetching vendor orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchRestaurantDetails();
      fetchVendorOrders();
    }
  }, [currentUser, restaurantId]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order status updated to: ${newStatus}`);
      fetchVendorOrders();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size too large. Please upload an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewItemImage(reader.result);
      toast.success('Image uploaded successfully!');
    };
    reader.onerror = () => {
      toast.error('Failed to read image.');
    };
    reader.readAsDataURL(file);
  };

  // Menu management handlers
  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice) return toast.error('Name and price are required');
    
    try {
      const payload = {
        name: newItemName,
        description: newItemDesc,
        price: parseFloat(newItemPrice),
        category: newItemCategory,
        image: newItemImage
      };

      if (editingItem) {
        // Edit item
        await axios.put(`/api/restaurants/${restaurantId}/menu/${editingItem.id}`, payload);
        toast.success('Menu item updated!');
      } else {
        // Add new item
        await axios.post(`/api/restaurants/${restaurantId}/menu`, payload);
        toast.success('Menu item added successfully!');
      }

      setShowAddForm(false);
      setEditingItem(null);
      setNewItemName('');
      setNewItemDesc('');
      setNewItemPrice('');
      setNewItemImage('');
      fetchRestaurantDetails();
    } catch (err) {
      toast.error('Failed to save menu item');
    }
  };

  const handleEditItemClick = (item, cat) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemDesc(item.description);
    setNewItemPrice(item.price);
    setNewItemCategory(cat);
    setNewItemImage(item.image || '');
    setShowAddForm(true);
  };

  const handleDeleteItemClick = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`/api/restaurants/${restaurantId}/menu/${itemId}`);
      toast.success('Item deleted');
      fetchRestaurantDetails();
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  const toggleAvailability = async (item, cat) => {
    try {
      await axios.put(`/api/restaurants/${restaurantId}/menu/${item.id}`, {
        name: item.name,
        description: item.description,
        price: item.price,
        category: cat,
        inStock: !item.inStock
      });
      toast.success(`${item.name} availability updated`);
      fetchRestaurantDetails();
    } catch (err) {
      toast.error('Failed to toggle availability');
    }
  };

  if (!currentUser || (currentUser.role !== 'restaurant' && currentUser.role !== 'admin')) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <span className="text-7xl block mb-4">⛔</span>
        <h2 className="text-2xl font-extrabold text-textPrimary">Access Denied</h2>
        <p className="text-textMuted text-sm mt-2">
          This portal is reserved for Zippli Restaurant Partners (Vendors). Please log into a vendor account to view this page.
        </p>
        <Link to="/login" className="mt-6 bg-primary hover:bg-orange-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md inline-block transform active:scale-95 transition-all">
          🔑 Log In as Vendor
        </Link>
      </div>
    );
  }

  const activeOrdersList = orders.filter(o => ['placed', 'confirmed', 'preparing', 'out_for_delivery'].includes(o.status));
  const completedOrdersList = orders.filter(o => o.status === 'delivered');

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <Link to="/" className="text-primary hover:text-orange-600 font-bold mb-6 inline-block transition-all">
        ← Back to Customer App
      </Link>
      {/* Restaurant Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-card border border-gray-100 flex flex-col sm:flex-row items-center justify-between mb-8">
        <div className="flex items-center space-x-5 mb-4 sm:mb-0">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm shrink-0 bg-primary">
            {restaurantData?.image ? (
              <img src={restaurantData.image} alt="Restaurant Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-3xl">🍽️</div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-textPrimary">{restaurantData?.name || 'Restaurant Panel'}</h1>
            <p className="text-xs text-textMuted mt-0.5">{restaurantData?.address}</p>
            <span className="inline-block mt-2 bg-green-50 border border-green-150 text-success text-[9px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full">
              🟢 Status: Open & Accepting Orders
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex space-x-2 mb-8 overflow-x-auto no-scrollbar pb-2">
        {[
          { id: 'orders', label: '📦 Active Orders', count: activeOrdersList.length },
          { id: 'menu', label: '🍴 Menu Manager', count: restaurantData ? Object.values(restaurantData.menu || {}).flat().length : 0 },
          { id: 'earnings', label: '💰 Earnings & Stats' },
          { id: 'reviews', label: '⭐ Customer Reviews', count: restaurantData?.reviews?.length || 0 }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center space-x-2 shrink-0 ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-textMuted border border-gray-200 hover:border-primary hover:text-primary'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-white bg-opacity-25 text-white' : 'bg-gray-100 text-textMuted'
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ============ TAB: ACTIVE ORDERS ============ */}
      {activeTab === 'orders' && (
        <div>
          <h2 className="text-lg font-extrabold text-textPrimary mb-6 flex items-center space-x-2">
            <span>📦</span><span>Incoming & Preparing Orders</span>
          </h2>

          {loadingOrders ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
          ) : activeOrdersList.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-card">
              <span className="text-4xl block mb-3">📭</span>
              <h3 className="text-sm font-bold text-textPrimary">No Active Orders</h3>
              <p className="text-xs text-textMuted mt-1">Sit tight! New orders placed by customers will appear here in real-time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeOrdersList.map((o) => (
                <div key={o.orderId} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-card hover:shadow-md transition-shadow space-y-4">
                  {/* Card Header */}
                  <div className="flex justify-between items-start border-b border-gray-150 pb-3">
                    <div>
                      <span className="text-xs font-extrabold text-primary block">#{o.orderId}</span>
                      <span className="text-[10px] text-textMuted mt-0.5 block">{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${
                      o.status === 'placed' ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' :
                      o.status === 'confirmed' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                      o.status === 'preparing' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                      'bg-orange-50 text-orange-600 border-orange-100'
                    }`}>
                      {o.status}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-textPrimary">Customer: {o.customerName} ({o.customerPhone})</p>
                    <p className="text-textMuted truncate">Deliver to: {o.customerAddress}</p>
                    {o.deliveryInstructions && (
                      <p className="text-[10px] text-primary italic bg-orange-50 px-2 py-0.5 rounded inline-block">
                        💬 Instructions: "{o.deliveryInstructions}"
                      </p>
                    )}
                  </div>

                  {/* Items list */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                    <h4 className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-2">Order Items</h4>
                    {o.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-textPrimary">{item.name} × {item.quantity}</span>
                        <span className="font-extrabold text-textPrimary">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between items-center font-bold text-xs">
                      <span>Total Amount:</span>
                      <span className="text-primary text-sm">₹{o.totalAmount}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    {o.status === 'placed' && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(o.orderId, 'confirmed')}
                          className="flex-grow bg-primary hover:bg-orange-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
                        >
                          Accept Order ✓
                        </button>
                        <button
                          onClick={() => updateOrderStatus(o.orderId, 'cancelled')}
                          className="border border-red-200 hover:border-red-500 hover:bg-red-50 text-red-500 py-2.5 px-4 rounded-xl text-xs font-bold transition-all"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {o.status === 'confirmed' && (
                      <button
                        onClick={() => updateOrderStatus(o.orderId, 'preparing')}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
                      >
                        ⚡ Start Preparing Food
                      </button>
                    )}
                    {o.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(o.orderId, 'out_for_delivery')}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
                      >
                        🛵 Food Ready! Alert Rider
                      </button>
                    )}
                    {o.status === 'out_for_delivery' && (
                      <div className="w-full text-center text-[10px] text-textMuted py-2 bg-gray-100 rounded-lg font-semibold italic">
                        Rider out for delivery. Check status in logs.
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ TAB: MENU MANAGER ============ */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-lg font-extrabold text-textPrimary flex items-center space-x-2">
              <span>🍽️</span><span>Modify Storefront Menu</span>
            </h2>
            {!showAddForm && (
              <button
                onClick={() => {
                  setEditingItem(null);
                  setNewItemName('');
                  setNewItemDesc('');
                  setNewItemPrice('');
                  setNewItemCategory('mains');
                  setNewItemImage('');
                  setShowAddForm(true);
                }}
                className="bg-primary hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                ➕ Add Food Item
              </button>
            )}
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <form onSubmit={handleSaveMenuItem} className="bg-gray-50 border border-gray-150 rounded-3xl p-6 space-y-4 max-w-lg">
              <h3 className="text-xs font-extrabold text-textPrimary uppercase border-b border-gray-200 pb-2">
                {editingItem ? '✏️ Edit Menu Item' : '✨ Add New Menu Item'}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1">Item Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Butter Paneer Masala"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-xs text-textPrimary px-4 py-2.5 rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="Price in INR"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-xs text-textPrimary px-4 py-2.5 rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-xs text-textPrimary px-4 py-2.5 rounded-xl focus:outline-none focus:border-primary"
                  >
                    <option value="starters">Starters 🥗</option>
                    <option value="mains">Main Course 🍛</option>
                    <option value="desserts">Dessert 🍰</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1">Item Image (Upload Photo or Provide URL)</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      id="menu-item-image-file"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="menu-item-image-file"
                      className="bg-white border border-gray-200 hover:border-primary hover:text-primary px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                    >
                      📸 Upload Photo
                    </label>
                    <input
                      type="text"
                      placeholder="Or enter URL: /images/pizza.png"
                      value={newItemImage}
                      onChange={(e) => setNewItemImage(e.target.value)}
                      className="flex-grow bg-white border border-gray-200 text-xs text-textPrimary px-4 py-2.5 rounded-xl focus:outline-none focus:border-primary"
                    />
                  </div>
                  {newItemImage && (
                    <div className="mt-3 relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 flex items-center justify-center">
                      <img src={newItemImage} alt="Menu Item Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewItemImage('')}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-650 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shadow"
                        title="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1">Description</label>
                  <textarea
                    rows="3"
                    placeholder="Short description of ingredients/taste..."
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-xs text-textPrimary px-4 py-2.5 rounded-xl focus:outline-none focus:border-primary resize-none"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="bg-primary hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-sm transition-all"
                >
                  💾 Save Item
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-white border border-gray-200 text-textMuted hover:text-textPrimary py-2.5 px-6 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Menu Catalog */}
          {loadingRestaurant ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(restaurantData?.menu || {}).map(([cat, items]) => {
                if (!items) return null;
                return (
                  <div key={cat} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-card">
                    <h3 className="text-sm font-extrabold text-textPrimary uppercase border-b border-gray-150 pb-2 mb-4 flex justify-between">
                      <span className="capitalize">{cat}</span>
                      <span className="text-[10px] text-textMuted bg-gray-150 px-2 py-0.5 rounded-full font-bold">{items.length} items</span>
                    </h3>
                    <div className="divide-y divide-gray-100">
                      {items.map((item) => (
                        <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <h4 className="text-xs font-bold text-textPrimary flex items-center space-x-2">
                              <span>{item.name}</span>
                              <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border ${
                                item.inStock !== false ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                              }`}>
                                {item.inStock !== false ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </h4>
                            <p className="text-[10px] text-textMuted mt-0.5 leading-snug">{item.description}</p>
                            <span className="text-xs font-bold text-primary block mt-1">₹{item.price}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 shrink-0 text-xs">
                            <button
                              onClick={() => toggleAvailability(item, cat)}
                              className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                                item.inStock !== false 
                                  ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-100'
                                  : 'bg-green-50 hover:bg-green-100 text-green-600 border-green-100'
                              }`}
                            >
                              {item.inStock !== false ? '🚫 Disable' : '⚡ Enable'}
                            </button>
                            <button
                              onClick={() => handleEditItemClick(item, cat)}
                              className="bg-white border border-gray-200 hover:border-primary text-textMuted hover:text-primary px-3 py-1.5 rounded-lg font-bold shadow-sm transition-all"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItemClick(item.id)}
                              className="bg-white border border-red-100 hover:bg-red-50 text-red-500 px-3 py-1.5 rounded-lg font-bold shadow-sm transition-all"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============ TAB: EARNINGS & STATS ============ */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          <h2 className="text-lg font-extrabold text-textPrimary flex items-center space-x-2">
            <span>💰</span><span>Earnings & Performance Analytics</span>
          </h2>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Total Revenue Generated', value: `₹${stats.totalRevenue}`, desc: 'Gross order volume', color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Platform Commission (20%)', value: `-₹${stats.platformCommission}`, desc: 'Zippli split charge', color: 'text-red-500', bg: 'bg-red-50' },
              { label: 'Net Payout Disbursed', value: `₹${stats.netPayout}`, desc: 'Transferred to your bank', color: 'text-emerald-500', bg: 'bg-emerald-50' }
            ].map((card, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl shadow-card border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider block">{card.label}</span>
                  <span className="text-2xl font-extrabold text-textPrimary block mt-1">{card.value}</span>
                  <span className="text-[9px] text-textMuted mt-1 block italic">{card.desc}</span>
                </div>
                <div className={`text-2xl p-3 rounded-2xl ${card.bg} ${card.color}`}>{idx === 0 ? '💰' : idx === 1 ? '💸' : '🏦'}</div>
              </div>
            ))}
          </div>

          {/* Completed Orders list */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-card">
            <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-4">Payout Transaction Ledger</h3>
            
            {completedOrdersList.length === 0 ? (
              <div className="text-center py-12 text-textMuted text-xs italic">
                No orders successfully delivered yet to record payouts.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-textMuted uppercase text-[9px] font-extrabold tracking-wider border-b border-gray-100">
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Subtotal</th>
                      <th className="px-4 py-3">Commission (20%)</th>
                      <th className="px-4 py-3">Net Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {completedOrdersList.map(o => (
                      <tr key={o.orderId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-primary">#{o.orderId}</td>
                        <td className="px-4 py-3 text-textMuted">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3 font-semibold">{o.customerName}</td>
                        <td className="px-4 py-3 font-bold text-textPrimary">₹{o.totalAmount}</td>
                        <td className="px-4 py-3 text-red-500 font-medium">-₹{Math.round(o.totalAmount * 0.20)}</td>
                        <td className="px-4 py-3 text-emerald-500 font-extrabold">₹{Math.round(o.totalAmount * 0.80)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ TAB: REVIEWS ============ */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <h2 className="text-lg font-extrabold text-textPrimary flex items-center space-x-2">
            <span>⭐</span><span>Reviews & Feedback Management</span>
          </h2>

          {loadingRestaurant ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
          ) : !restaurantData?.reviews || restaurantData.reviews.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-card">
              <span className="text-4xl block mb-3">📝</span>
              <h3 className="text-sm font-bold text-textPrimary">No Reviews Recieved</h3>
              <p className="text-xs text-textMuted mt-1">Feedback reviews submitted by customers will list here to help you audit quality.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {restaurantData.reviews.map((rev, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-card space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                    <span className="font-bold text-textPrimary text-xs">{rev.name}</span>
                    <span className="text-[10px] text-textMuted">{new Date(rev.date).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="text-yellow-400 text-xs">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i}>{i < rev.rating ? '★' : '☆'}</span>
                    ))}
                  </div>
                  <p className="text-xs text-textMuted leading-relaxed italic">"{rev.text}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
