import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import MapView from '../components/MapView.jsx';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('stats');
  
  // States
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pending verification states
  const [pendingPartners, setPendingPartners] = useState([]);
  const [approvingUser, setApprovingUser] = useState(null);
  const [approveForm, setApproveForm] = useState({
    name: '',
    cuisine: '',
    address: '',
    phone: '',
    lat: '28.6304',
    lng: '77.2177',
    image: '/images/pizza.png'
  });

  // Filters & selections
  const [activeOrderTab, setActiveOrderTab] = useState('all');
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Support desk selection
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Promo coupon creator
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('');
  const [newCouponMaxDisc, setNewCouponMaxDisc] = useState('');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState('');

  const initData = async () => {
    try {
      setLoading(true);
      const [ordRes, restRes, userRes, couponRes, ticketRes, analRes, pendingRes] = await Promise.all([
        axios.get('/api/orders?limit=100'),
        axios.get('/api/restaurants'),
        axios.get('/api/admin/users'),
        axios.get('/api/coupons'),
        axios.get('/api/support/tickets'),
        axios.get('/api/admin/analytics'),
        axios.get('/api/admin/pending-partners')
      ]);

      setOrders(ordRes.data.orders || []);
      setRestaurants(restRes.data || []);
      setUsers(userRes.data || []);
      setCoupons(couponRes.data || []);
      setTickets(ticketRes.data || []);
      setAnalytics(analRes.data.metrics || null);
      setPendingPartners(pendingRes.data || []);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order #${orderId} updated to ${newStatus}`);
      initData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await axios.put(`/api/admin/users/${userId}/status`, { status: nextStatus });
      toast.success(`User account is now ${nextStatus}`);
      initData();
    } catch (err) {
      toast.error('Failed to toggle account status');
    }
  };

  const startEditRestaurant = (restaurant) => {
    setEditingRestaurant(restaurant.id);
    setEditForm({
      name: restaurant.name || '',
      cuisine: restaurant.cuisine || '',
      address: restaurant.address || '',
      phone: restaurant.phone || '',
      openingHours: restaurant.openingHours || '',
      lat: restaurant.lat || '',
      lng: restaurant.lng || '',
      minOrder: restaurant.minOrder || '',
      deliveryTime: restaurant.deliveryTime || '',
      discount: restaurant.discount || '',
    });
  };

  const saveRestaurant = async () => {
    try {
      setSaving(true);
      const payload = {
        ...editForm,
        lat: parseFloat(editForm.lat) || 0,
        lng: parseFloat(editForm.lng) || 0,
        minOrder: parseInt(editForm.minOrder) || 0,
      };
      await axios.patch(`/api/restaurants/${editingRestaurant}`, payload);
      toast.success('Restaurant updated successfully!');
      setEditingRestaurant(null);
      initData();
    } catch (err) {
      toast.error('Failed to update restaurant');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCouponCode || !newCouponDiscount || !newCouponMaxDisc) {
      return toast.error('Fill in required coupon fields');
    }

    try {
      await axios.post('/api/coupons', {
        code: newCouponCode,
        discountPercent: newCouponDiscount,
        maxDiscount: newCouponMaxDisc,
        minOrderValue: newCouponMinOrder || 0
      });
      toast.success('New promo coupon code created!');
      setNewCouponCode('');
      setNewCouponDiscount('');
      setNewCouponMaxDisc('');
      setNewCouponMinOrder('');
      initData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create coupon');
    }
  };

  const handleAdminTicketReplySubmit = async (e) => {
    e.preventDefault();
    if (!adminReplyText) return;
    setSubmittingReply(true);
    try {
      const res = await axios.post(`/api/support/tickets/${selectedTicket._id}/reply`, {
        message: adminReplyText
      });
      setSelectedTicket(res.data);
      setAdminReplyText('');
      toast.success('Reply sent & ticket resolved.');
      initData();
    } catch (err) {
      toast.error('Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleVerifyPartner = async (partnerUser) => {
    if (partnerUser.role === 'delivery') {
      try {
        setSaving(true);
        await axios.post(`/api/admin/verify-partner/${partnerUser._id}`, {});
        toast.success(`Delivery Partner ${partnerUser.name} verified & activated!`);
        initData();
      } catch (err) {
        toast.error('Failed to verify delivery partner');
      } finally {
        setSaving(false);
      }
    } else if (partnerUser.role === 'restaurant') {
      const docs = partnerUser.documents || {};
      setApprovingUser(partnerUser);
      setApproveForm({
        name: docs.restName || partnerUser.name,
        cuisine: docs.restCuisine || 'Fast Food',
        address: docs.restAddress || 'Connaught Place, New Delhi',
        phone: partnerUser.phone || '',
        lat: '28.6304',
        lng: '77.2177',
        image: '/images/pizza.png'
      });
    }
  };

  const submitApproveRestaurant = async (e) => {
    e.preventDefault();
    if (!approveForm.name || !approveForm.cuisine || !approveForm.address) {
      return toast.error('Please fill in required fields');
    }
    try {
      setSaving(true);
      await axios.post(`/api/admin/verify-partner/${approvingUser._id}`, {
        name: approveForm.name,
        cuisine: approveForm.cuisine,
        address: approveForm.address,
        phone: approveForm.phone,
        lat: parseFloat(approveForm.lat) || 28.6304,
        lng: parseFloat(approveForm.lng) || 77.2177,
        image: approveForm.image
      });
      toast.success(`Restaurant storefront created and partner activated!`);
      setApprovingUser(null);
      initData();
    } catch (err) {
      toast.error('Failed to approve restaurant');
    } finally {
      setSaving(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeOrderTab === 'all') return true;
    if (activeOrderTab === 'active') return ['placed', 'confirmed', 'preparing', 'out_for_delivery'].includes(o.status);
    return o.status === activeOrderTab;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'placed': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'confirmed': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'preparing': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      case 'out_for_delivery': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'delivered': return 'bg-green-50 text-green-600 border-green-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 text-xs">
      <Link to="/" className="text-primary hover:text-orange-655 font-bold mb-6 flex items-center space-x-1.5 transition-all text-xs">
        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        <span>Back to Customer App</span>
      </Link>
      <h1 className="text-2xl font-extrabold text-textPrimary mb-2">Platform Owner Dashboard</h1>
      <p className="text-textMuted mb-6">Manage orders, vendors, riders, and platform configurations.</p>

      {/* Control Tabs */}
      <div className="flex space-x-2 mb-8 overflow-x-auto no-scrollbar pb-2">
        {[
          { id: 'stats', label: 'Sales Stats', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg> },
          { id: 'pending', label: 'Pending Requests', count: pendingPartners.length, icon: <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> },
          { id: 'orders', label: 'Orders Ledger', count: orders.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg> },
          { id: 'restaurants', label: 'Restaurants', count: restaurants.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg> },
          { id: 'users', label: 'User Accounts', count: users.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> },
          { id: 'support', label: 'Support Desk', count: tickets.filter(t => t.status === 'open').length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg> },
          { id: 'campaigns', label: 'Coupons Desk', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg> }
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => {
              setActiveSection(sec.id);
              setSelectedTicket(null);
            }}
            className={`px-5 py-3 rounded-2xl font-bold transition-all duration-200 flex items-center space-x-2 shrink-0 ${
              activeSection === sec.id
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-textMuted border border-gray-200 hover:border-primary hover:text-primary'
            }`}
          >
            {sec.icon}
            <span>{sec.label}</span>
            {sec.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeSection === sec.id ? 'bg-white bg-opacity-25 text-white' : 'bg-gray-150 text-textMuted'
              }`}>{sec.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ============ TAB: STATS & ANALYTICS ============ */}
      {activeSection === 'stats' && analytics && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Gross Volume Sales', value: `₹${analytics.totalSales}`, desc: 'Total order volume', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>, color: 'text-indigo-500', bg: 'bg-indigo-50' },
              { label: 'Platform Commissions (20%)', value: `₹${analytics.totalCommissions}`, desc: 'Gross revenue split', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { label: 'Delivery Disbursed (₹40)', value: `₹${analytics.totalDeliveryFees}`, desc: 'Rider fees paid', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="5.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="2"></circle><circle cx="18.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="2"></circle><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 6a1 1 0 100-2 1 1 0 000 2zm-3.5 4.5l-2.5-3-3 2.5m10.5 4l-4.5-4.5H10L7.5 15h3l1.5-3 2.5 3h3.5"></path></svg>, color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: 'Platform Net Margin', value: `₹${analytics.totalCommissions - analytics.totalDeliveryFees}`, desc: 'Profit generated', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg>, color: 'text-purple-500', bg: 'bg-purple-50' }
            ].map((card, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-6 shadow-card border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider block">{card.label}</span>
                  <span className="text-xl font-extrabold text-textPrimary block mt-1.5">{card.value}</span>
                  <span className="text-[9px] text-textMuted mt-1 block italic">{card.desc}</span>
                </div>
                <div className={`p-3 ${card.bg} rounded-2xl ${card.color} flex items-center justify-center`}>{card.icon}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100 flex flex-col justify-between">
              <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-3">System Directory Totals</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-50 border p-4 rounded-2xl">
                  <span className="text-2xl font-extrabold text-primary block">{analytics.totalUsers}</span>
                  <span className="text-[10px] text-textMuted font-bold uppercase block mt-1">Users Directory</span>
                </div>
                <div className="bg-gray-50 border p-4 rounded-2xl">
                  <span className="text-2xl font-extrabold text-primary block">{analytics.totalOrders}</span>
                  <span className="text-[10px] text-textMuted font-bold uppercase block mt-1">Orders Count</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100">
              <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Payout Settlements</h3>
              <p className="text-[10px] text-textMuted leading-relaxed">
                Settlements are distributed at 80% to restaurant partner vendor accounts, and Flat ₹40 per delivery job claimed by online partners.
              </p>
              <div className="mt-4 border-t pt-3 flex justify-between font-bold">
                <span>Completed Deliveries:</span>
                <span className="text-primary">{analytics.completedDeliveries} Trips</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB: ORDERS LEDGER ============ */}
      {activeSection === 'orders' && (
        <div className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden animate-fade-in">
          <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar bg-gray-50">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'active', label: 'Active Tasks' },
              { id: 'delivered', label: 'Delivered' },
              { id: 'cancelled', label: 'Cancelled' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveOrderTab(tab.id)}
                className={`px-6 py-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors duration-200 ${
                  activeOrderTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-textMuted hover:text-textPrimary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center justify-center">
              <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
              </svg>
              <h3 className="text-sm font-bold text-textPrimary mt-4">No Orders Found</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-textMuted uppercase text-[9px] font-extrabold tracking-wider border-b border-gray-100">
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Restaurant</th>
                    <th className="px-6 py-4">Rider Agent</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((o) => (
                    <tr key={o.orderId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-primary">
                        <a href={`/track/${o.orderId}`} className="hover:underline">#{o.orderId}</a>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-textPrimary block">{o.customerName}</span>
                        <span className="text-[10px] text-textMuted">{o.customerPhone}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-textPrimary">{o.restaurant}</td>
                      <td className="px-6 py-4 text-textMuted font-medium">{o.deliveryAgent || 'Finding agent...'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${getStatusBadgeClass(o.status)}`}>
                          {o.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-textPrimary">₹{o.totalAmount}</td>
                      <td className="px-6 py-4 text-right">
                        {o.status !== 'cancelled' && o.status !== 'delivered' ? (
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.orderId, e.target.value)}
                            className="bg-white border border-gray-200 text-textPrimary font-bold rounded-lg px-2 py-1 focus:border-primary focus:outline-none shadow-sm"
                          >
                            <option value="placed">Placed</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancel Order (Dispute)</option>
                          </select>
                        ) : (
                          <span className="text-[10px] text-textMuted italic font-bold">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============ TAB: RESTAURANT MANAGER ============ */}
      {activeSection === 'restaurants' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {restaurants.map((r) => (
            <div key={r.id} className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden flex flex-col justify-between">
              
              <div className="flex items-center p-4 border-b border-gray-100 bg-gray-50">
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 mr-4 bg-primary text-white flex items-center justify-center text-xl font-bold border">
                  {r.image ? (
                    <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="text-sm font-extrabold text-textPrimary truncate">{r.name}</h3>
                  <p className="text-[10px] text-textMuted truncate">{r.cuisine}</p>
                </div>
                <button
                  onClick={() => editingRestaurant === r.id ? setEditingRestaurant(null) : startEditRestaurant(r)}
                  className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all text-[10px] flex items-center space-x-1 ${
                    editingRestaurant === r.id ? 'bg-gray-200 text-textMuted' : 'bg-primary bg-opacity-10 text-primary hover:bg-opacity-20'
                  }`}
                >
                  {editingRestaurant === r.id ? (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      <span>Close</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      <span>Coordinates</span>
                    </>
                  )}
                </button>
              </div>

              {editingRestaurant === r.id && (
                <div className="p-5 space-y-4 bg-gray-50 border-b">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-textMuted block mb-1">Store Name</label>
                      <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-white border rounded px-3 py-1.5" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-textMuted block mb-1">Cuisines</label>
                      <input type="text" value={editForm.cuisine || ''} onChange={e => setEditForm({...editForm, cuisine: e.target.value})} className="w-full bg-white border rounded px-3 py-1.5" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-textMuted block mb-1">Street Address</label>
                      <input type="text" value={editForm.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full bg-white border rounded px-3 py-1.5" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-textMuted block mb-1">Latitude</label>
                      <input type="number" step="0.0001" value={editForm.lat || ''} onChange={e => setEditForm({...editForm, lat: e.target.value})} className="w-full bg-white border rounded px-3 py-1.5" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-textMuted block mb-1">Longitude</label>
                      <input type="number" step="0.0001" value={editForm.lng || ''} onChange={e => setEditForm({...editForm, lng: e.target.value})} className="w-full bg-white border rounded px-3 py-1.5" />
                    </div>
                  </div>

                  {editForm.lat && editForm.lng && (
                    <MapView lat={parseFloat(editForm.lat)} lng={parseFloat(editForm.lng)} height="160px" />
                  )}

                  <div className="flex space-x-2 pt-2">
                    <button onClick={saveRestaurant} disabled={saving} className="bg-primary hover:bg-orange-655 text-white font-bold px-4 py-2 rounded-xl shadow-sm flex items-center space-x-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                      </svg>
                      <span>{saving ? 'Saving...' : 'Save Coordinates'}</span>
                    </button>
                    <button onClick={() => setEditingRestaurant(null)} className="bg-white border border-gray-200 text-textMuted px-4 py-2 rounded-xl hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              )}

              {editingRestaurant !== r.id && (
                <div className="p-4 text-textMuted space-y-1.5">
                  <p className="flex items-center space-x-1.5">
                    <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Address: <span className="font-semibold text-textPrimary">{r.address}</span></span>
                  </p>
                  <p className="flex items-center space-x-1.5">
                    <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span>Coordinates: <span className="font-semibold text-textPrimary">{r.lat}, {r.lng}</span></span>
                  </p>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* ============ TAB: USER ACCOUNTS ============ */}
      {activeSection === 'users' && (
        <div className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden animate-fade-in">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-textMuted uppercase text-[9px] font-extrabold tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Security Role</th>
                <th className="px-6 py-4">System Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-textPrimary">{u.name}</td>
                  <td className="px-6 py-4 text-textMuted">{u.email}</td>
                  <td className="px-6 py-4 text-textMuted">{u.phone}</td>
                  <td className="px-6 py-4">
                    <span className="capitalize bg-gray-100 px-2 py-0.5 rounded font-bold border border-gray-200">{u.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold border ${
                      u.status !== 'suspended' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {u.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.role !== 'admin' ? (
                      <button
                        onClick={() => handleToggleUserStatus(u._id, u.status)}
                        className={`px-3 py-1.5 rounded-lg border font-bold transition-all flex items-center space-x-1 ml-auto ${
                          u.status === 'suspended'
                            ? 'bg-green-50 hover:bg-green-100 text-green-600 border-green-100'
                            : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-100'
                        }`}
                      >
                        {u.status === 'suspended' ? (
                          <>
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>Reinstate Account</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
                            </svg>
                            <span>Suspend</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[10px] text-textMuted italic font-bold">Unmodifiable</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============ TAB: SUPPORT DESK ============ */}
      {activeSection === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in items-start">
          {/* Tickets list */}
          <div className="lg:col-span-1 bg-white rounded-3xl p-5 shadow-card border border-gray-100 space-y-4">
            <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider border-b pb-2 mb-3">Incoming Support Tickets</h3>
            {tickets.length === 0 ? (
              <div className="text-center py-8 text-textMuted italic">No support queries found.</div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 no-scrollbar">
                {tickets.map(t => (
                  <div
                    key={t._id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      selectedTicket?._id === t._id 
                        ? 'border-primary bg-orange-50 bg-opacity-40' 
                        : 'border-gray-200 bg-white hover:border-primary'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-textPrimary block truncate max-w-[120px]">{t.userName}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border tracking-wider shrink-0 ${
                        t.status === 'open' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-green-600 border-green-100'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-textMuted truncate font-bold">{t.subject}</p>
                    <p className="text-[9px] text-textMuted truncate mt-0.5">{t.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticket Reply details chat */}
          <div className="lg:col-span-2">
            {selectedTicket ? (
              <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100 flex flex-col h-[50vh]">
                <div className="flex justify-between items-center border-b pb-3 mb-4 shrink-0">
                  <div>
                    <span className="text-[10px] text-textMuted block font-semibold">Submitted by {selectedTicket.userName}</span>
                    <h3 className="text-xs font-extrabold text-textPrimary uppercase mt-0.5">{selectedTicket.subject}</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[8px] font-extrabold uppercase border tracking-wider ${
                    selectedTicket.status === 'open' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-green-600 border-green-100'
                  }`}>
                    {selectedTicket.status}
                  </span>
                </div>

                {/* Messages Streams */}
                <div className="flex-grow overflow-y-auto pr-2 mb-4 space-y-3 no-scrollbar text-xs">
                  {/* Original */}
                  <div className="flex justify-start">
                    <div className="bg-gray-150 p-3 rounded-2xl max-w-[80%] rounded-tl-none border">
                      <p className="font-semibold text-[9px] text-textMuted">{selectedTicket.userName}</p>
                      <p className="mt-1 text-textPrimary">{selectedTicket.message}</p>
                    </div>
                  </div>

                  {/* Replies */}
                  {selectedTicket.replies.map((rep, idx) => (
                    <div key={idx} className={`flex ${rep.sender === 'Admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-2xl max-w-[80%] shadow-sm ${
                        rep.sender === 'Admin'
                          ? 'bg-primary text-white rounded-tr-none'
                          : 'bg-white border border-gray-200 text-textPrimary rounded-tl-none'
                      }`}>
                        <p className={`font-semibold text-[9px] ${
                          rep.sender === 'Admin' ? 'text-orange-100' : 'text-textMuted'
                        }`}>
                          {rep.sender === 'Admin' ? 'Zippli Agent (You)' : selectedTicket.userName}
                        </p>
                        <p className="mt-1">{rep.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply form */}
                <form onSubmit={handleAdminTicketReplySubmit} className="flex items-center space-x-2 shrink-0 border-t pt-3">
                  <input
                    type="text"
                    placeholder="Type support reply..."
                    value={adminReplyText}
                    onChange={e => setAdminReplyText(e.target.value)}
                    className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                  />
                  <button
                    type="submit"
                    disabled={submittingReply}
                    className="bg-primary hover:bg-orange-655 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                    </svg>
                    <span>{submittingReply ? '...' : 'Reply & Resolve'}</span>
                  </button>
                </form>

              </div>
            ) : (
              <div className="bg-white rounded-3xl p-10 text-center text-textMuted border shadow-card">
                Select a ticket from the left panel to review logs and append resolution replies.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ TAB: CAMPAIGNS & COUPONS ============ */}
      {activeSection === 'campaigns' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in items-start">
          {/* Create Coupon Form */}
          <div className="md:col-span-1 bg-white rounded-3xl p-5 shadow-card border border-gray-100 space-y-4">
            <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider border-b pb-2 mb-3">Add Promo Campaign</h3>
            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-textMuted block mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MONSOON30"
                  value={newCouponCode}
                  onChange={e => setNewCouponCode(e.target.value)}
                  className="w-full bg-gray-50 border rounded px-3 py-2 uppercase"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-textMuted block mb-1">Discount Percent (%)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 30"
                  value={newCouponDiscount}
                  onChange={e => setNewCouponDiscount(e.target.value)}
                  className="w-full bg-gray-50 border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-textMuted block mb-1">Max Discount Cap (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 100"
                  value={newCouponMaxDisc}
                  onChange={e => setNewCouponMaxDisc(e.target.value)}
                  className="w-full bg-gray-50 border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-textMuted block mb-1">Min Order Requirement (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={newCouponMinOrder}
                  onChange={e => setNewCouponMinOrder(e.target.value)}
                  className="w-full bg-gray-50 border rounded px-3 py-2"
                />
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-orange-655 text-white font-bold py-2.5 rounded-xl shadow-sm flex items-center justify-center space-x-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                </svg>
                <span>Launch Coupon Code</span>
              </button>
            </form>
          </div>

          {/* Coupons List */}
          <div className="md:col-span-2 bg-white rounded-3xl p-5 shadow-card border border-gray-100 space-y-4">
            <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider border-b pb-2 mb-3 font-sans">Active Campaigns</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coupons.map(c => (
                <div key={c.code} className="border border-gray-100 rounded-2xl p-4 bg-gray-50 flex justify-between items-center hover:border-primary transition-all">
                  <div>
                    <span className="font-extrabold text-primary text-xs tracking-wider block">{c.code}</span>
                    <span className="text-[10px] text-textPrimary font-bold block mt-1">{c.discountPercent}% OFF up to ₹{c.maxDiscount}</span>
                    <span className="text-[9px] text-textMuted block mt-0.5 font-medium">Min Order requirement: ₹{c.minOrderValue}</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-500 border border-emerald-100 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB: PENDING PARTNERS QUEUE ============ */}
      {activeSection === 'pending' && (
        <div className="space-y-6 animate-fade-in text-textPrimary">
          <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100">
            <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-4 border-b pb-2">
              Verification Request Queue
            </h3>
            
            {pendingPartners.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center">
                <svg className="w-12 h-12 text-emerald-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 className="text-sm font-bold text-textPrimary mt-4">All Clean! No Pending Requests</h3>
                <p className="text-textMuted text-[10px] mt-1">All restaurant and delivery registrations have been verified.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {pendingPartners.map((p) => {
                  const docs = p.documents || {};
                  return (
                    <div key={p._id} className="bg-gray-50 border rounded-2xl p-5 hover:border-primary transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-textPrimary">{p.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                            p.role === 'restaurant' ? 'bg-orange-50 text-orange-650 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                            {p.role === 'restaurant' ? 'Storefront Partner' : 'Delivery Rider'}
                          </span>
                        </div>
                        <div className="text-[10px] text-textMuted font-medium space-y-1 mt-1.5">
                          <p className="flex items-center space-x-1.5">
                            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>Email: <span className="text-textPrimary font-semibold">{p.email}</span></span>
                          </p>
                          <p className="flex items-center space-x-1.5">
                            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>Phone: <span className="text-textPrimary font-semibold">{p.phone}</span></span>
                          </p>
                        </div>
                        
                        {/* Documents Section */}
                        <div className="bg-white border rounded-xl p-3.5 mt-3 space-y-2">
                          <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wider">Submitted Credentials</span>
                          {p.role === 'restaurant' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                              <p className="text-textMuted flex items-center space-x-1.5">
                                <svg className="w-3.5 h-3.5 text-slate-450 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span>Store Name: <span className="text-textPrimary font-bold">{docs.restName || 'N/A'}</span></span>
                              </p>
                              <p className="text-textMuted flex items-center space-x-1.5">
                                <svg className="w-3.5 h-3.5 text-slate-450 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span>Cuisines: <span className="text-textPrimary font-bold">{docs.restCuisine || 'N/A'}</span></span>
                              </p>
                              <p className="text-textMuted flex items-center space-x-1.5">
                                <svg className="w-3.5 h-3.5 text-slate-450 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="truncate max-w-[200px] inline-block">Address: <span className="text-textPrimary font-bold">{docs.restAddress || 'N/A'}</span></span>
                              </p>
                              <p className="text-textMuted flex items-center space-x-1.5">
                                <svg className="w-3.5 h-3.5 text-slate-450 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>FSSAI No.: <span className="text-primary font-extrabold tracking-widest">{docs.fssai || 'N/A'}</span></span>
                              </p>
                              <p className="text-textMuted flex items-center space-x-1.5 col-span-1 sm:col-span-2">
                                <svg className="w-3.5 h-3.5 text-slate-450 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span>GSTIN No.: <span className="text-primary font-extrabold tracking-widest uppercase">{docs.gstin || 'N/A'}</span></span>
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                              <p className="text-textMuted flex items-center space-x-1.5">
                                <svg className="w-3.5 h-3.5 text-slate-450 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <circle cx="5.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="2"></circle><circle cx="18.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="2"></circle><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 6a1 1 0 100-2 1 1 0 000 2zm-3.5 4.5l-2.5-3-3 2.5m10.5 4l-4.5-4.5H10L7.5 15h3l1.5-3 2.5 3h3.5"></path>
                                </svg>
                                <span>Vehicle Type: <span className="text-textPrimary font-bold">{docs.vehicleType || 'Bike'}</span></span>
                              </p>
                              <p className="text-textMuted flex items-center space-x-1.5">
                                <svg className="w-3.5 h-3.5 text-slate-450 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-2 4a2 2 0 012 2m-8-3a3 3 0 00-3 3h12a3 3 0 00-3-3H7zM10 5a2 2 0 114 0 2 2 0 01-4 0zM4 8h16v12H4V8z" />
                                </svg>
                                <span>Driving License: <span className="text-primary font-extrabold tracking-widest uppercase">{docs.drivingLicense || 'N/A'}</span></span>
                              </p>
                              <p className="text-textMuted flex items-center space-x-1.5 col-span-1 sm:col-span-2">
                                <svg className="w-3.5 h-3.5 text-slate-450 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 014 0m-4 7a1 1 0 112 0 1 1 0 01-2 0z" />
                                </svg>
                                <span>Aadhaar No.: <span className="text-primary font-extrabold tracking-widest">{docs.aadhaarCard || 'N/A'}</span></span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-2 w-full md:w-auto self-stretch md:self-auto justify-end">
                        <button
                          onClick={() => handleVerifyPartner(p)}
                          className="bg-primary hover:bg-orange-655 text-white font-bold px-4 py-2.5 rounded-xl shadow-md text-[10px] flex items-center space-x-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <span>Verify & Approve Request</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Restaurant Finalize Modal */}
          {approvingUser && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 font-sans animate-fade-in text-textPrimary">
              <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-150 overflow-hidden text-xs text-textPrimary">
                <div className="bg-primary p-6 text-white flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-sm uppercase">Verify & Create Storefront</h3>
                    <p className="text-orange-100 text-[10px] mt-0.5 font-medium">Finalize coordinates and details for {approvingUser.name}</p>
                  </div>
                  <button type="button" onClick={() => setApprovingUser(null)} className="text-white hover:text-orange-100 font-bold transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>

                <form onSubmit={submitApproveRestaurant} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-textMuted block mb-1">Restaurant Name</label>
                      <input 
                        type="text" 
                        required
                        value={approveForm.name} 
                        onChange={e => setApproveForm({...approveForm, name: e.target.value})} 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-textMuted block mb-1">Cuisine Tags</label>
                      <input 
                        type="text" 
                        required
                        value={approveForm.cuisine} 
                        onChange={e => setApproveForm({...approveForm, cuisine: e.target.value})} 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-textMuted block mb-1">Store Phone No.</label>
                      <input 
                        type="text" 
                        value={approveForm.phone} 
                        onChange={e => setApproveForm({...approveForm, phone: e.target.value})} 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-textMuted block mb-1">Street Address</label>
                      <input 
                        type="text" 
                        required
                        value={approveForm.address} 
                        onChange={e => setApproveForm({...approveForm, address: e.target.value})} 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-textMuted block mb-1">Store Latitude</label>
                      <input 
                        type="number" 
                        step="0.0001" 
                        required
                        value={approveForm.lat} 
                        onChange={e => setApproveForm({...approveForm, lat: e.target.value})} 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-textMuted block mb-1">Store Longitude</label>
                      <input 
                        type="number" 
                        step="0.0001" 
                        required
                        value={approveForm.lng} 
                        onChange={e => setApproveForm({...approveForm, lng: e.target.value})} 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {approveForm.lat && approveForm.lng && (
                    <MapView lat={parseFloat(approveForm.lat)} lng={parseFloat(approveForm.lng)} height="120px" />
                  )}

                  <div className="flex space-x-2 pt-2 border-t mt-4">
                    <button type="submit" disabled={saving} className="bg-primary hover:bg-orange-655 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex-grow flex items-center justify-center space-x-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>{saving ? 'Creating Storefront...' : 'Confirm & Create Storefront'}</span>
                    </button>
                    <button type="button" onClick={() => setApprovingUser(null)} className="bg-gray-100 hover:bg-gray-200 text-textMuted px-4 py-2.5 rounded-xl">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
