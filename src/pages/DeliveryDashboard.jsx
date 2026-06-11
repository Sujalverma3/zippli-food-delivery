import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';
import { toast } from 'react-hot-toast';

import { Link } from 'react-router-dom';

export default function DeliveryDashboard() {
  const { currentUser } = useAuth();
  
  // Rider status
  const [isOnline, setIsOnline] = useState(true);
  
  // Orders lists
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [pastDeliveries, setPastDeliveries] = useState([]);
  
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [deliveryStep, setDeliveryStep] = useState(0); // 0 = Accepted, 1 = Arrived at Store, 2 = Picked Up, 3 = Delivered
  
  // Navigation map
  const mapRef = useRef(null);
  const mapContainerId = 'rider-nav-map';

  const fetchRiderOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await axios.get('/api/orders?limit=100');
      const allOrders = res.data.orders || [];

      // 1. Available orders (ready or preparing, but no rider assigned yet)
      const claimable = allOrders.filter(o => 
        ['confirmed', 'preparing', 'out_for_delivery'].includes(o.status) && 
        (!o.deliveryAgent || o.deliveryAgent === '')
      );
      setAvailableOrders(claimable);

      // 2. Active order assigned to this rider
      const active = allOrders.find(o => 
        o.deliveryAgent === currentUser?.name && 
        o.status !== 'delivered' && 
        o.status !== 'cancelled'
      );
      
      setActiveOrder(active || null);
      if (active) {
        // Recover delivery step status
        if (active.status === 'confirmed') setDeliveryStep(0);
        else if (active.status === 'preparing') setDeliveryStep(1);
        else if (active.status === 'out_for_delivery') setDeliveryStep(2);
      }

      // 3. Past completed deliveries
      const completed = allOrders.filter(o => 
        o.deliveryAgent === currentUser?.name && 
        o.status === 'delivered'
      );
      setPastDeliveries(completed);

    } catch (err) {
      console.error('Error fetching rider dashboard:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchRiderOrders();
    }
  }, [currentUser]);

  // Periodic polling for new orders when online and no active job
  useEffect(() => {
    if (!isOnline || activeOrder) return;
    const interval = setInterval(fetchRiderOrders, 8000);
    return () => clearInterval(interval);
  }, [isOnline, activeOrder]);

  // Map loader for active delivery task
  useEffect(() => {
    if (loadingOrders || !activeOrder || !window.L) return;

    const restLat = 28.6298;
    const restLng = 77.2276;
    const custLat = activeOrder.deliveryLat || 28.6304;
    const custLng = activeOrder.deliveryLng || 77.2177;

    setTimeout(() => {
      const L = window.L;
      const container = document.getElementById(mapContainerId);
      if (!container) return;

      if (!mapRef.current) {
        const map = L.map(mapContainerId, {
          zoomControl: false,
          attributionControl: false
        }).setView([restLat, restLng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        const restIcon = L.divIcon({ html: '<div class="text-2xl">🏪</div>', className: 'bg-transparent border-0' });
        const homeIcon = L.divIcon({ html: '<div class="text-2xl">🏠</div>', className: 'bg-transparent border-0' });

        L.marker([restLat, restLng], { icon: restIcon }).addTo(map).bindPopup('Restaurant Store');
        L.marker([custLat, custLng], { icon: homeIcon }).addTo(map).bindPopup('Delivery Drop Location');

        L.polyline([[restLat, restLng], [custLat, custLng]], {
          color: '#3B82F6',
          dashArray: '5, 5',
          weight: 3
        }).addTo(map);

        mapRef.current = map;
        map.fitBounds([[restLat, restLng], [custLat, custLng]], { padding: [40, 40] });
      }
    }, 300);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loadingOrders, activeOrder]);

  const handleClaimOrder = async (orderId) => {
    try {
      await axios.patch(`/api/orders/${orderId}/status`, {
        deliveryAgent: currentUser.name,
        status: 'confirmed'
      });
      toast.success('Order claimed successfully! Safe ride.');
      setDeliveryStep(0);
      fetchRiderOrders();
    } catch (err) {
      toast.error('Failed to claim order');
    }
  };

  const handleWorkflowStep = async () => {
    if (!activeOrder) return;
    
    try {
      let nextStep = deliveryStep + 1;
      
      if (nextStep === 1) {
        // Arrived at restaurant
        await axios.patch(`/api/orders/${activeOrder.orderId}/status`, {
          status: 'preparing'
        });
        toast.success('Status: Arrived at Restaurant');
        setDeliveryStep(1);
      } else if (nextStep === 2) {
        // Picked up food
        await axios.patch(`/api/orders/${activeOrder.orderId}/status`, {
          status: 'out_for_delivery'
        });
        toast.success('Status: Food Picked Up! Out for Delivery');
        setDeliveryStep(2);
      } else if (nextStep === 3) {
        // Marked delivered
        await axios.patch(`/api/orders/${activeOrder.orderId}/status`, {
          status: 'delivered',
          paymentStatus: 'paid' // complete payment
        });
        toast.success('Order Delivered! Payout processed 🎉');
        setDeliveryStep(0);
        setActiveOrder(null);
        fetchRiderOrders();
      }
    } catch (err) {
      toast.error('Failed to update delivery workflow');
    }
  };

  if (!currentUser || (currentUser.role !== 'delivery' && currentUser.role !== 'admin')) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <span className="text-7xl block mb-4">⛔</span>
        <h2 className="text-2xl font-extrabold text-textPrimary">Access Denied</h2>
        <p className="text-textMuted text-sm mt-2">
          This dashboard is restricted to Zippli Delivery Partners. Please log into a delivery rider account to view jobs.
        </p>
        <Link to="/login" className="mt-6 bg-primary hover:bg-orange-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md inline-block transform active:scale-95 transition-all">
          🔑 Log In as Rider
        </Link>
      </div>
    );
  }

  const netEarnings = pastDeliveries.length * 40; // ₹40 delivery fee per order

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 text-xs">
      <Link to="/" className="text-primary hover:text-orange-600 font-bold mb-6 inline-block transition-all">
        ← Back to Customer App
      </Link>
      {/* Rider Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-card border border-gray-100 flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 animate-fade-in">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-3xl font-extrabold">
            🚴
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-textPrimary">{currentUser.name}</h1>
            <p className="text-[10px] text-textMuted mt-0.5">Rider ID: ZPL-D-{currentUser._id.slice(-6).toUpperCase()}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
              <span className="font-bold text-textPrimary text-[10px] uppercase">
                {isOnline ? 'Duty Online' : 'Duty Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Availability Switch */}
        <button
          onClick={() => {
            setIsOnline(!isOnline);
            toast.success(isOnline ? 'Went Offline. You will not get job offers.' : 'Went Online! Scanning for jobs.');
          }}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm shrink-0 border ${
            isOnline
              ? 'bg-red-50 hover:bg-red-100 border-red-100 text-red-600'
              : 'bg-green-50 hover:bg-green-100 border-green-150 text-success'
          }`}
        >
          {isOnline ? '🛑 Go Offline' : '🟢 Go Online'}
        </button>
      </div>

      {/* Grid Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Active Task or Available Jobs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Job Task */}
          {activeOrder ? (
            <div className="bg-white rounded-3xl p-6 shadow-card border border-primary animate-fade-in space-y-5">
              <div className="flex justify-between items-center border-b border-gray-150 pb-3">
                <div>
                  <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded font-extrabold uppercase tracking-wide">
                    ⚡ ACTIVE TASK
                  </span>
                  <h3 className="text-sm font-extrabold text-textPrimary mt-1.5">Order ID: #{activeOrder.orderId}</h3>
                </div>
                <span className="text-xs font-bold text-primary font-mono">₹40 Payout Pending</span>
              </div>

              {/* Map */}
              <div className="rounded-2xl border border-gray-100 overflow-hidden bg-gray-50 shadow-inner">
                <div id={mapContainerId} style={{ height: '260px' }} className="z-10 bg-gray-100"></div>
              </div>

              {/* Steps workflow progress bar */}
              <div className="grid grid-cols-3 gap-1.5 text-center font-bold text-[9px] uppercase tracking-wider">
                <div className={`p-2 rounded-lg ${deliveryStep >= 1 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-textMuted border'}`}>
                  🏪 At Store
                </div>
                <div className={`p-2 rounded-lg ${deliveryStep >= 2 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-textMuted border'}`}>
                  📦 Picked Up
                </div>
                <div className={`p-2 rounded-lg ${deliveryStep >= 3 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-textMuted border'}`}>
                  🏠 Delivered
                </div>
              </div>

              {/* Delivery info */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                <div className="flex justify-between border-b pb-2 border-gray-200">
                  <span className="font-bold text-textMuted uppercase tracking-wider text-[9px]">Pickup From:</span>
                  <span className="font-bold text-textPrimary">{activeOrder.restaurant}</span>
                </div>
                <div className="flex justify-between border-b pb-2 border-gray-200">
                  <span className="font-bold text-textMuted uppercase tracking-wider text-[9px]">Drop Address:</span>
                  <span className="font-semibold text-textPrimary max-w-[200px] text-right truncate">{activeOrder.customerAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-textMuted uppercase tracking-wider text-[9px]">Contact Recipient:</span>
                  <span className="font-bold text-textPrimary">{activeOrder.customerName} ({activeOrder.customerPhone})</span>
                </div>
                {activeOrder.deliveryInstructions && (
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-2.5 text-[10px] text-primary italic">
                    💬 Delivery Instructions: "{activeOrder.deliveryInstructions}"
                  </div>
                )}
              </div>

              {/* Workflow buttons */}
              <button
                onClick={handleWorkflowStep}
                className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl text-xs shadow-md transition-all transform active:scale-95 duration-200 flex justify-center items-center space-x-2"
              >
                {deliveryStep === 0 && (
                  <><span>🚲</span><span>Mark: Arrived at Restaurant</span></>
                )}
                {deliveryStep === 1 && (
                  <><span>📦</span><span>Mark: Food Picked Up & Departed</span></>
                )}
                {deliveryStep === 2 && (
                  <><span>✓</span><span>Mark: Handover & Delivered!</span></>
                )}
              </button>

            </div>
          ) : (
            /* Browse claimable requests */
            <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100 space-y-6">
              <h2 className="text-sm font-extrabold text-textPrimary flex items-center space-x-2">
                <span>📋</span><span>Available Delivery Jobs</span>
              </h2>

              {!isOnline ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100 border-dashed text-textMuted">
                  🔔 You are Offline. Toggle Online status above to look for deliveries.
                </div>
              ) : availableOrders.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100 border-dashed text-textMuted animate-pulse">
                  📡 Scanning for nearby restaurant ready signals... (No jobs at present)
                </div>
              ) : (
                <div className="space-y-4">
                  {availableOrders.map(o => (
                    <div key={o.orderId} className="border border-gray-100 rounded-2xl p-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary transition-all">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-primary">#{o.orderId}</span>
                          <span className="text-[9px] text-textMuted">•</span>
                          <span className="font-bold text-textPrimary">{o.restaurant}</span>
                        </div>
                        <p className="text-[10px] text-textMuted mt-1">Deliver to: <span className="font-semibold">{o.customerAddress}</span></p>
                        <span className="inline-block mt-2 bg-blue-50 text-blue-600 border border-blue-100 text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded">
                          Payout: ₹40 Delivery Fee
                        </span>
                      </div>
                      <button
                        onClick={() => handleClaimOrder(o.orderId)}
                        className="bg-primary hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-[10px] shadow-sm shrink-0 transition-all transform active:scale-95"
                      >
                        Claim Job 🚲
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Rider Stats & Ledger */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Earnings summary */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100 flex flex-col justify-between space-y-4">
            <h2 className="text-xs font-bold text-textMuted uppercase tracking-wider border-b pb-3 border-gray-150">Rider Ledger Account</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] text-textMuted uppercase tracking-wider font-bold block">Deliveries Completed</span>
                <span className="text-2xl font-extrabold text-textPrimary mt-1.5 block">{pastDeliveries.length} Jobs</span>
              </div>
              <div>
                <span className="text-[9px] text-textMuted uppercase tracking-wider font-bold block">Total Cash Disbursed</span>
                <span className="text-2xl font-extrabold text-emerald-500 mt-1.5 block">₹{netEarnings}</span>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-150 text-blue-600 text-[10px] p-2.5 rounded-xl">
              💡 Delivery partners earn a guaranteed flat rate of ₹40 for every successfully completed customer handover.
            </div>
          </div>

          {/* Past logs list */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100">
            <h2 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-4">Completed Deliveries</h2>
            
            {pastDeliveries.length === 0 ? (
              <div className="text-center py-8 text-textMuted text-[10px] italic">
                No completed orders registered in this login session.
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
                {pastDeliveries.map(o => (
                  <div key={o.orderId} className="border border-gray-50 rounded-xl p-3 bg-gray-50 text-[11px] flex justify-between items-center">
                    <div>
                      <span className="font-bold text-textPrimary">#{o.orderId}</span>
                      <p className="text-[9px] text-textMuted mt-0.5 truncate max-w-[120px]">{o.restaurant}</p>
                    </div>
                    <span className="font-extrabold text-emerald-600 text-xs shrink-0">+₹40.00</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
