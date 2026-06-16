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
      <div className="max-w-md mx-auto text-center py-20 px-4 flex flex-col items-center justify-center">
        <svg className="w-16 h-16 text-red-500 mb-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <h2 className="text-2xl font-extrabold text-textPrimary">Access Denied</h2>
        <p className="text-textMuted text-sm mt-2">
          This portal is reserved for Zippli Restaurant Partners (Vendors). Please log into a vendor account to view this page.
        </p>
        <Link to="/login" className="mt-6 bg-primary hover:bg-orange-655 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md inline-flex items-center space-x-1.5 transform active:scale-95 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
          </svg>
          <span>Log In as Vendor</span>
        </Link>
      </div>
    );
  }

  const activeOrdersList = orders.filter(o => ['placed', 'confirmed', 'preparing', 'out_for_delivery'].includes(o.status));
  const completedOrdersList = orders.filter(o => o.status === 'delivered');

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <Link to="/" className="text-primary hover:text-orange-655 font-bold mb-6 flex items-center space-x-1.5 transition-all text-xs">
        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        <span>Back to Customer App</span>
      </Link>
      {/* Restaurant Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-card border border-gray-100 flex flex-col sm:flex-row items-center justify-between mb-8">
        <div className="flex items-center space-x-5 mb-4 sm:mb-0">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm shrink-0 bg-primary flex items-center justify-center border">
            {restaurantData?.image ? (
              <img src={restaurantData.image} alt="Restaurant Logo" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            )}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-textPrimary">{restaurantData?.name || 'Restaurant Panel'}</h1>
            <p className="text-xs text-textMuted mt-0.5">{restaurantData?.address}</p>
            <span className="inline-flex items-center mt-2 bg-green-50 border border-green-150 text-success text-[9px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1.5"></span>
              Status: Open & Accepting Orders
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex space-x-2 mb-8 overflow-x-auto no-scrollbar pb-2">
        {[
          { id: 'orders', label: 'Active Orders', count: activeOrdersList.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg> },
          { id: 'menu', label: 'Menu Manager', count: restaurantData ? Object.values(restaurantData.menu || {}).flat().length : 0, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg> },
          { id: 'earnings', label: 'Earnings & Stats', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> },
          { id: 'reviews', label: 'Customer Reviews', count: restaurantData?.reviews?.length || 0, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.977-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg> }
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
            {tab.icon}
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
          <h2 className="text-lg font-extrabold text-textPrimary mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            <span>Incoming & Preparing Orders</span>
          </h2>

          {loadingOrders ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
          ) : activeOrdersList.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-card flex flex-col items-center justify-center">
              <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
              </svg>
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
                      <p className="text-[10px] text-primary italic bg-orange-50 px-2.5 py-1 rounded inline-flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                        <span>Instructions: "{o.deliveryInstructions}"</span>
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
                          className="flex-grow bg-primary hover:bg-orange-655 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          <span>Accept Order</span>
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
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-1"
                      >
                        <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        <span>Start Preparing Food</span>
                      </button>
                    )}
                    {o.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(o.orderId, 'out_for_delivery')}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="5.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="2"></circle><circle cx="18.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="2"></circle><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 6a1 1 0 100-2 1 1 0 000 2zm-3.5 4.5l-2.5-3-3 2.5m10.5 4l-4.5-4.5H10L7.5 15h3l1.5-3 2.5 3h3.5"></path></svg>
                        <span>Food Ready! Alert Rider</span>
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
            <h2 className="text-lg font-extrabold text-textPrimary flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
              <span>Modify Storefront Menu</span>
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
                className="bg-primary hover:bg-orange-655 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                <span>Add Food Item</span>
              </button>
            )}
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <form onSubmit={handleSaveMenuItem} className="bg-gray-50 border border-gray-150 rounded-3xl p-6 space-y-4 max-w-lg">
              <h3 className="text-xs font-extrabold text-textPrimary uppercase border-b border-gray-200 pb-2 flex items-center">
                <svg className="w-4 h-4 mr-1 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                <span>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</span>
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
                    className="w-full bg-white border border-gray-200 text-xs text-textPrimary px-4 py-2.5 rounded-xl focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
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
                    className="w-full bg-white border border-gray-200 text-xs text-textPrimary px-4 py-2.5 rounded-xl focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-xs text-textPrimary px-4 py-2.5 rounded-xl focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                  >
                    <option value="starters">Starters</option>
                    <option value="mains">Main Course</option>
                    <option value="desserts">Dessert</option>
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
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      <span>Upload Photo</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Or enter URL: /images/pizza.png"
                      value={newItemImage}
                      onChange={(e) => setNewItemImage(e.target.value)}
                      className="flex-grow bg-white border border-gray-200 text-xs text-textPrimary px-4 py-2.5 rounded-xl focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                    />
                  </div>
                  {newItemImage && (
                    <div className="mt-3 relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 flex items-center justify-center">
                      <img src={newItemImage} alt="Menu Item Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewItemImage('')}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-655 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shadow"
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
                    className="w-full bg-white border border-gray-200 text-xs text-textPrimary px-4 py-2.5 rounded-xl focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200 resize-none"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="bg-primary hover:bg-orange-655 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-sm transition-all flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                  <span>Save Item</span>
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
                              className={`px-3 py-1.5 rounded-lg border font-bold transition-all flex items-center space-x-1 ${
                                item.inStock !== false 
                                  ? 'bg-red-50 hover:bg-red-100 text-red-655 border-red-100'
                                  : 'bg-green-50 hover:bg-green-100 text-green-600 border-green-100'
                              }`}
                            >
                              {item.inStock !== false ? (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                                  <span>Disable</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                  <span>Enable</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleEditItemClick(item, cat)}
                              className="bg-white border border-gray-200 hover:border-primary text-textMuted hover:text-primary px-3 py-1.5 rounded-lg font-bold shadow-sm transition-all flex items-center space-x-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteItemClick(item.id)}
                              className="bg-white border border-red-100 hover:bg-red-50 text-red-500 px-3 py-1.5 rounded-lg font-bold shadow-sm transition-all flex items-center space-x-1"
                            >
                              <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-16v1a1 1 0 001 1h3m-9 0H6M9 7h6"></path></svg>
                              <span>Delete</span>
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
          <h2 className="text-lg font-extrabold text-textPrimary flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Earnings & Performance Analytics</span>
          </h2>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Total Revenue Generated', value: `₹${stats.totalRevenue}`, desc: 'Gross order volume', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Platform Commission (20%)', value: `-₹${stats.platformCommission}`, desc: 'Zippli split charge', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>, color: 'text-red-500', bg: 'bg-red-50' },
              { label: 'Net Payout Disbursed', value: `₹${stats.netPayout}`, desc: 'Transferred to your bank', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg>, color: 'text-emerald-500', bg: 'bg-emerald-50' }
            ].map((card, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl shadow-card border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider block">{card.label}</span>
                  <span className="text-xl font-extrabold text-textPrimary block mt-1">{card.value}</span>
                  <span className="text-[9px] text-textMuted mt-1 block italic">{card.desc}</span>
                </div>
                <div className={`p-3 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center`}>{card.icon}</div>
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
          <h2 className="text-lg font-extrabold text-textPrimary flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.977-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
            </svg>
            <span>Reviews & Feedback Management</span>
          </h2>

          {loadingRestaurant ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
          ) : !restaurantData?.reviews || restaurantData.reviews.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-card flex flex-col items-center justify-center">
              <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 className="text-sm font-bold text-textPrimary">No Reviews Received</h3>
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
                  <div className="flex space-x-0.5 text-yellow-400 text-xs">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i}>
                        {i < rev.rating ? (
                          <svg className="w-4 h-4 text-yellow-400 inline" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-200 inline" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" opacity="0.25"></path></svg>
                        )}
                      </span>
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
