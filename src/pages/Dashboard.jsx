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
      const [ordRes, restRes, userRes, couponRes, ticketRes, analRes] = await Promise.all([
        axios.get('/api/orders?limit=100'),
        axios.get('/api/restaurants'),
        axios.get('/api/admin/users'),
        axios.get('/api/coupons'),
        axios.get('/api/support/tickets'),
        axios.get('/api/admin/analytics')
      ]);

      setOrders(ordRes.data.orders || []);
      setRestaurants(restRes.data || []);
      setUsers(userRes.data || []);
      setCoupons(couponRes.data || []);
      setTickets(ticketRes.data || []);
      setAnalytics(analRes.data.metrics || null);
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
      <Link to="/" className="text-primary hover:text-orange-600 font-bold mb-6 inline-block transition-all">
        ← Back to Customer App
      </Link>
      <h1 className="text-2xl font-extrabold text-textPrimary mb-2">Platform Owner Dashboard</h1>
      <p className="text-textMuted mb-6">Manage orders, vendors, riders, and platform configurations.</p>

      {/* Control Tabs */}
      <div className="flex space-x-2 mb-8 overflow-x-auto no-scrollbar pb-2">
        {[
          { id: 'stats', label: '📊 Sales Stats' },
          { id: 'orders', label: '📦 Orders Ledger', count: orders.length },
          { id: 'restaurants', label: '🍽️ Restaurants', count: restaurants.length },
          { id: 'users', label: '👥 User Accounts', count: users.length },
          { id: 'support', label: '💬 Support Desk', count: tickets.filter(t => t.status === 'open').length },
          { id: 'campaigns', label: '🎟️ Coupons Desk' }
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
              { label: 'Gross Volume Sales', value: `₹${analytics.totalSales}`, desc: 'Total order volume', icon: '💰', color: 'text-indigo-500', bg: 'bg-indigo-50' },
              { label: 'Platform Commissions (20%)', value: `₹${analytics.totalCommissions}`, desc: 'Gross revenue split', icon: '🏢', color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { label: 'Delivery Disbursed (₹40)', value: `₹${analytics.totalDeliveryFees}`, desc: 'Rider fees paid', icon: '🚴', color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: 'Platform Net Margin', value: `₹${analytics.totalCommissions - analytics.totalDeliveryFees}`, desc: 'Profit generated', icon: '🏦', color: 'text-purple-500', bg: 'bg-purple-50' }
            ].map((card, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-6 shadow-card border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider block">{card.label}</span>
                  <span className="text-xl font-extrabold text-textPrimary block mt-1.5">{card.value}</span>
                  <span className="text-[9px] text-textMuted mt-1 block italic">{card.desc}</span>
                </div>
                <div className={`text-3xl p-3 ${card.bg} rounded-2xl ${card.color}`}>{card.icon}</div>
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
            <div className="text-center py-16">
              <span className="text-4xl">📭</span>
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
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 mr-4 bg-primary text-white flex items-center justify-center text-xl font-bold">
                  {r.image ? <img src={r.image} alt={r.name} className="w-full h-full object-cover" /> : '🏪'}
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="text-sm font-extrabold text-textPrimary truncate">{r.name}</h3>
                  <p className="text-[10px] text-textMuted truncate">{r.cuisine}</p>
                </div>
                <button
                  onClick={() => editingRestaurant === r.id ? setEditingRestaurant(null) : startEditRestaurant(r)}
                  className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all ${
                    editingRestaurant === r.id ? 'bg-gray-200 text-textMuted' : 'bg-primary bg-opacity-10 text-primary hover:bg-opacity-20'
                  }`}
                >
                  {editingRestaurant === r.id ? '✕ Close' : '✏️ Coordinates'}
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
                    <button onClick={saveRestaurant} disabled={saving} className="bg-primary hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl shadow-sm">
                      {saving ? 'Saving...' : '💾 Save Coordinates'}
                    </button>
                    <button onClick={() => setEditingRestaurant(null)} className="bg-white border text-textMuted px-4 py-2 rounded-xl">Cancel</button>
                  </div>
                </div>
              )}

              {editingRestaurant !== r.id && (
                <div className="p-4 text-textMuted">
                  <p>📍 Address: <span className="font-semibold text-textPrimary">{r.address}</span></p>
                  <p className="mt-1">Coordinates: <span className="font-semibold text-textPrimary">{r.lat}, {r.lng}</span></p>
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
                        className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                          u.status === 'suspended'
                            ? 'bg-green-50 hover:bg-green-100 text-green-600 border-green-100'
                            : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-100'
                        }`}
                      >
                        {u.status === 'suspended' ? '🟢 Reinstate Account' : '🛑 Suspend'}
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
                    className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={submittingReply}
                    className="bg-primary hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
                  >
                    {submittingReply ? '...' : '📨 Send Payout/Refund'}
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
              <button type="submit" className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl shadow-sm">
                🚀 Launch Coupon Code
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

    </div>
  );
}
