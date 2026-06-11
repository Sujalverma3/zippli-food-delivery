import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { currentUser, addAddress, deleteAddress, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  
  // Addresses form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [tag, setTag] = useState('Home');
  const [street, setStreet] = useState('');
  const [details, setDetails] = useState('');
  const [lat, setLat] = useState('28.6304');
  const [lng, setLng] = useState('77.2177');
  const [submittingAddress, setSubmittingAddress] = useState(false);

  // Orders
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Support
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await axios.get('/api/orders?limit=100');
      // Filter orders by phone or name for this user (since orders don't have strict user schema association yet)
      const userOrders = (res.data.orders || []).filter(o => 
        o.customerPhone === currentUser?.phone || 
        o.customerName === currentUser?.name
      );
      setOrders(userOrders);
    } catch (err) {
      console.error('Error fetching profile orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await axios.get('/api/support/tickets');
      setTickets(res.data);
    } catch (err) {
      console.error('Error fetching support tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchOrders();
      fetchTickets();
    }
  }, [currentUser]);

  const handleAddAddressSubmit = async (e) => {
    e.preventDefault();
    if (!street) return toast.error('Address cannot be empty');
    setSubmittingAddress(true);
    try {
      await addAddress({
        tag,
        street,
        details,
        lat: parseFloat(lat) || 28.6304,
        lng: parseFloat(lng) || 77.2177
      });
      setShowAddressForm(false);
      setStreet('');
      setDetails('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAddress(false);
    }
  };

  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return toast.error('Fill in all fields');
    setSubmittingTicket(true);
    try {
      await axios.post('/api/support/tickets', {
        subject: ticketSubject,
        message: ticketMessage
      });
      toast.success('Support ticket created successfully!');
      setTicketSubject('');
      setTicketMessage('');
      fetchTickets();
    } catch (err) {
      toast.error('Failed to create ticket');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText) return;
    setSubmittingReply(true);
    try {
      const res = await axios.post(`/api/support/tickets/${selectedTicket._id}/reply`, {
        message: replyText
      });
      setSelectedTicket(res.data);
      setReplyText('');
      fetchTickets();
    } catch (err) {
      toast.error('Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
  };

  // Helper to generate a random coordinate near New Delhi for address simulation
  const handleGPSAuto = () => {
    // Generate coordinate offset
    const randomOffsetLat = (Math.random() - 0.5) * 0.1;
    const randomOffsetLng = (Math.random() - 0.5) * 0.1;
    const mockLat = (28.6304 + randomOffsetLat).toFixed(4);
    const mockLng = (77.2177 + randomOffsetLng).toFixed(4);
    setLat(mockLat);
    setLng(mockLng);
    toast.success(`GPS coordinates generated: ${mockLat}, ${mockLng}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <Link to="/" className="text-primary hover:text-orange-600 font-bold mb-6 inline-block transition-all text-xs">
        ← Back to Customer App
      </Link>
      {/* Upper Profile Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-card border border-gray-100 flex flex-col md:flex-row items-center justify-between mb-8">
        <div className="flex items-center space-x-5 mb-4 md:mb-0">
          <div className="w-16 h-16 rounded-full bg-primary bg-opacity-10 text-primary flex items-center justify-center text-3xl font-extrabold shadow-sm">
            {currentUser?.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-textPrimary">{currentUser?.name}</h1>
            <p className="text-xs text-textMuted mt-0.5">{currentUser?.email} | {currentUser?.phone}</p>
            <span className="inline-block mt-2 bg-primary bg-opacity-10 text-primary text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border border-orange-100">
              👤 Role: {currentUser?.role}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="border border-red-200 text-red-500 hover:bg-red-50 px-6 py-2.5 rounded-xl text-xs font-bold transition-all"
        >
          🚪 Log Out
        </button>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'orders', label: '📦 Order History', icon: '🍔' },
            { id: 'addresses', label: '📍 Saved Addresses', icon: '🏠' },
            { id: 'support', label: '💬 Support Tickets', icon: '❓' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedTicket(null);
              }}
              className={`w-full text-left px-5 py-3.5 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center space-x-3 border ${
                activeTab === tab.id
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-textMuted border-gray-200 hover:border-primary hover:text-primary'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Panel */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-6 md:p-8 shadow-card border border-gray-100 min-h-[50vh]">
          {/* ============ TAB: ORDER HISTORY ============ */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-lg font-extrabold text-textPrimary mb-6 flex items-center space-x-2">
                <span>📦</span><span>Your Orders</span>
              </h2>

              {loadingOrders ? (
                <div className="flex justify-center items-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16">
                  <span className="text-4xl">🍔</span>
                  <h3 className="text-base font-bold text-textPrimary mt-4">No Orders Found</h3>
                  <p className="text-xs text-textMuted mt-1">Place your first order to see it listed here.</p>
                  <Link to="/" className="inline-block mt-5 bg-primary text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md hover:bg-orange-600 transition-all">
                    Browse Restaurants
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((o) => (
                    <div key={o.orderId} className="border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition-all bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div className="mb-4 md:mb-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-extrabold text-primary">#{o.orderId}</span>
                          <span className="text-[10px] text-textMuted">•</span>
                          <span className="text-xs font-bold text-textPrimary">{o.restaurant}</span>
                        </div>
                        <p className="text-[11px] text-textMuted mt-1 max-w-md">
                          {o.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                        </p>
                        <div className="flex items-center space-x-4 mt-3 text-[10px]">
                          <span className="font-bold text-textPrimary">₹{o.totalAmount}</span>
                          <span className="text-textMuted">|</span>
                          <span className="capitalize text-textMuted">Paid via: {o.paymentMethod.toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end w-full md:w-auto">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border mb-3 ${
                          o.status === 'delivered' ? 'bg-green-50 text-green-600 border-green-100' :
                          o.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-orange-50 text-orange-600 border-orange-100 animate-pulse'
                        }`}>
                          {o.status.replace('_', ' ')}
                        </span>
                        {o.status !== 'cancelled' && (
                          <Link
                            to={`/track/${o.orderId}`}
                            className="bg-white border border-gray-200 text-textPrimary hover:border-primary hover:text-primary px-4 py-2 rounded-xl text-[10px] font-bold shadow-sm transition-all text-center w-full md:w-auto"
                          >
                            {o.status === 'delivered' ? '⭐ Rate & View Details' : '⚡ Live Track Order'}
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============ TAB: SAVED ADDRESSES ============ */}
          {activeTab === 'addresses' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-extrabold text-textPrimary flex items-center space-x-2">
                  <span>📍</span><span>Address Book</span>
                </h2>
                {!showAddressForm && (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="bg-primary hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    ➕ Add Address
                  </button>
                )}
              </div>

              {/* Add Address Form */}
              {showAddressForm && (
                <form onSubmit={handleAddAddressSubmit} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-6 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <h3 className="text-xs font-extrabold text-textPrimary uppercase">New Address Details</h3>
                    <button type="button" onClick={() => setShowAddressForm(false)} className="text-textMuted hover:text-red-500 font-bold text-xs">✕ Close</button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1">Address Label</label>
                      <select
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                        className="w-full bg-white border border-gray-200 text-xs text-textPrimary px-3 py-2 rounded-lg focus:outline-none"
                      >
                        <option value="Home">Home 🏠</option>
                        <option value="Work">Work 💼</option>
                        <option value="Other">Other 📍</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1">Locality/Apartment Details</label>
                      <input
                        type="text"
                        placeholder="e.g. Flat 4B, Sector 2"
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        className="w-full bg-white border border-gray-200 text-xs text-textPrimary px-3 py-2 rounded-lg focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1">Street Address</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 12, Connaught Place, New Delhi"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="w-full bg-white border border-gray-200 text-xs text-textPrimary px-3 py-2 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex space-x-3 text-[10px] text-textMuted">
                      <span>Lat: {lat}</span>
                      <span>Lng: {lng}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={handleGPSAuto}
                        className="bg-white border border-gray-200 text-[10px] hover:border-primary hover:text-primary font-bold px-3 py-1.5 rounded-lg shadow-sm"
                      >
                        📡 Auto Simulate GPS
                      </button>
                      <button
                        type="submit"
                        disabled={submittingAddress}
                        className="bg-primary hover:bg-orange-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg shadow-sm"
                      >
                        {submittingAddress ? 'Saving...' : '💾 Save Address'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Addresses List */}
              {(!currentUser?.addresses || currentUser.addresses.length === 0) ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-3xl">📍</span>
                  <h3 className="text-xs font-bold text-textPrimary mt-3">No Saved Addresses</h3>
                  <p className="text-[10px] text-textMuted mt-1">Add your delivery coordinates for faster checkouts.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentUser.addresses.map((addr) => (
                    <div key={addr._id} className="border border-gray-100 rounded-2xl p-4 bg-gray-50 flex items-start justify-between">
                      <div className="space-y-1 pr-4">
                        <span className="inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white border text-primary tracking-wider">
                          {addr.tag === 'Home' ? '🏠 Home' : addr.tag === 'Work' ? '💼 Work' : '📍 Other'}
                        </span>
                        <h4 className="text-xs font-bold text-textPrimary mt-1.5">{addr.street}</h4>
                        {addr.details && <p className="text-[10px] text-textMuted">{addr.details}</p>}
                        <p className="text-[9px] text-textMuted italic">GPS: {addr.lat.toFixed(4)}, {addr.lng.toFixed(4)}</p>
                      </div>
                      <button
                        onClick={() => deleteAddress(addr._id)}
                        className="text-textMuted hover:text-red-500 text-xs font-medium p-1 rounded-lg hover:bg-white"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============ TAB: SUPPORT TICKETS ============ */}
          {activeTab === 'support' && (
            <div>
              <h2 className="text-lg font-extrabold text-textPrimary mb-6 flex items-center space-x-2">
                <span>💬</span><span>Support Center</span>
              </h2>

              {!selectedTicket ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Create Ticket Form */}
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-extrabold text-textPrimary uppercase border-b border-gray-200 pb-2">File a Support Request</h3>
                    <form onSubmit={handleCreateTicketSubmit} className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1">Subject</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Order #ZPL-12345 refund request"
                          value={ticketSubject}
                          onChange={(e) => setTicketSubject(e.target.value)}
                          className="w-full bg-white border border-gray-200 text-xs text-textPrimary px-3 py-2 rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1">Message Description</label>
                        <textarea
                          required
                          rows="4"
                          placeholder="Tell us what went wrong..."
                          value={ticketMessage}
                          onChange={(e) => setTicketMessage(e.target.value)}
                          className="w-full bg-white border border-gray-200 text-xs text-textPrimary px-3 py-2 rounded-lg focus:outline-none resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingTicket}
                        className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-2 rounded-xl text-xs shadow-sm transition-all"
                      >
                        {submittingTicket ? 'Submitting...' : '📨 Send Support Ticket'}
                      </button>
                    </form>
                  </div>

                  {/* Tickets List */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold text-textPrimary uppercase border-b border-gray-200 pb-2">Recent Queries</h3>
                    {loadingTickets ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-primary"></div>
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className="text-center py-12 text-textMuted text-xs">
                        No support tickets opened yet.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar">
                        {tickets.map(t => (
                          <div
                            key={t._id}
                            onClick={() => handleSelectTicket(t)}
                            className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-primary transition-all flex justify-between items-center"
                          >
                            <div className="min-w-0 pr-4">
                              <h4 className="text-xs font-bold text-textPrimary truncate">{t.subject}</h4>
                              <p className="text-[10px] text-textMuted truncate mt-0.5">{t.message}</p>
                              <span className="text-[9px] text-textMuted mt-1 block">Replies: {t.replies.length}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border tracking-wider shrink-0 ${
                              t.status === 'open' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-green-600 border-green-100'
                            }`}>
                              {t.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Ticket Detail / Conversation Chat */
                <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50 flex flex-col h-[50vh]">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4 shrink-0">
                    <div>
                      <button onClick={() => setSelectedTicket(null)} className="text-textMuted hover:text-primary font-bold text-xs flex items-center space-x-1 mb-1">
                        <span>← Back to list</span>
                      </button>
                      <h3 className="text-xs font-extrabold text-textPrimary uppercase">{selectedTicket.subject}</h3>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[8px] font-extrabold uppercase border tracking-wider ${
                      selectedTicket.status === 'open' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-green-600 border-green-100'
                    }`}>
                      {selectedTicket.status}
                    </span>
                  </div>

                  {/* Messages Stream */}
                  <div className="flex-grow overflow-y-auto pr-2 mb-4 space-y-3 no-scrollbar text-xs">
                    {/* User's Original Message */}
                    <div className="flex justify-end">
                      <div className="bg-primary text-white p-3 rounded-2xl max-w-[80%] rounded-tr-none shadow-sm">
                        <p className="font-semibold text-[9px] text-orange-100">You</p>
                        <p className="mt-1">{selectedTicket.message}</p>
                      </div>
                    </div>

                    {/* Replies */}
                    {selectedTicket.replies.map((r, idx) => (
                      <div key={idx} className={`flex ${r.sender === 'Customer' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-2xl max-w-[80%] shadow-sm ${
                          r.sender === 'Customer'
                            ? 'bg-primary text-white rounded-tr-none'
                            : 'bg-white border border-gray-200 text-textPrimary rounded-tl-none'
                        }`}>
                          <p className={`font-semibold text-[9px] ${
                            r.sender === 'Customer' ? 'text-orange-100' : 'text-textMuted'
                          }`}>
                            {r.sender === 'Customer' ? 'You' : 'Agent Support'}
                          </p>
                          <p className="mt-1">{r.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply Entry box */}
                  <form onSubmit={handleReplySubmit} className="flex items-center space-x-2 shrink-0 border-t border-gray-200 pt-3">
                    <input
                      type="text"
                      placeholder="Type your reply here..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-grow bg-white border border-gray-200 text-xs text-textPrimary px-4 py-2.5 rounded-xl focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={submittingReply}
                      className="bg-primary hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all"
                    >
                      {submittingReply ? 'Sending...' : '↩ Reply'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
