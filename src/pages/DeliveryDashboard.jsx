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

        const restIcon = L.divIcon({ 
          html: `<div class="bg-indigo-600 text-white p-2 rounded-full shadow-lg border border-white flex items-center justify-center w-10 h-10">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>`, 
          className: 'bg-transparent border-0',
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        });
        const homeIcon = L.divIcon({ 
          html: `<div class="bg-emerald-600 text-white p-2 rounded-full shadow-lg border border-white flex items-center justify-center w-10 h-10">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
          </div>`, 
          className: 'bg-transparent border-0',
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        });

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
      <div className="max-w-md mx-auto text-center py-20 px-4 flex flex-col items-center justify-center">
        <svg className="w-16 h-16 text-red-500 mb-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <h2 className="text-2xl font-extrabold text-textPrimary">Access Denied</h2>
        <p className="text-textMuted text-sm mt-2">
          This dashboard is restricted to Zippli Delivery Partners. Please log into a delivery rider account to view jobs.
        </p>
        <Link to="/login" className="mt-6 bg-primary hover:bg-orange-655 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md inline-flex items-center space-x-1.5 transform active:scale-95 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
          </svg>
          <span>Log In as Rider</span>
        </Link>
      </div>
    );
  }

  const netEarnings = pastDeliveries.length * 40;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 text-xs">
      <Link to="/" className="text-primary hover:text-orange-655 font-bold mb-6 flex items-center space-x-1.5 transition-all text-xs">
        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        <span>Back to Customer App</span>
      </Link>
      {/* Rider Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-card border border-gray-100 flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 animate-fade-in">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center p-3 shadow-sm border border-blue-100">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="5.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="2"></circle>
              <circle cx="18.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="2"></circle>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 6a1 1 0 100-2 1 1 0 000 2zm-3.5 4.5l-2.5-3-3 2.5m10.5 4l-4.5-4.5H10L7.5 15h3l1.5-3 2.5 3h3.5"></path>
            </svg>
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
          className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm shrink-0 border flex items-center space-x-1.5 ${
            isOnline
              ? 'bg-red-50 hover:bg-red-100 border-red-100 text-red-655'
              : 'bg-green-50 hover:bg-green-100 border-green-150 text-success'
          }`}
        >
          {isOnline ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
              <span>Go Offline</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Go Online</span>
            </>
          )}
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
                <div className={`p-2 rounded-lg flex items-center justify-center space-x-1 ${deliveryStep >= 1 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-textMuted border'}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  <span>At Store</span>
                </div>
                <div className={`p-2 rounded-lg flex items-center justify-center space-x-1 ${deliveryStep >= 2 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-textMuted border'}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                  <span>Picked Up</span>
                </div>
                <div className={`p-2 rounded-lg flex items-center justify-center space-x-1 ${deliveryStep >= 3 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-textMuted border'}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                  <span>Delivered</span>
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
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-2.5 text-[10px] text-primary italic flex items-start space-x-1.5">
                    <svg className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    <span>Delivery Instructions: "{activeOrder.deliveryInstructions}"</span>
                  </div>
                )}
              </div>

              {/* Workflow buttons */}
              <button
                onClick={handleWorkflowStep}
                className="w-full bg-primary hover:bg-orange-655 text-white font-bold py-3.5 rounded-xl text-xs shadow-md transition-all transform active:scale-95 duration-200 flex justify-center items-center space-x-2"
              >
                {deliveryStep === 0 && (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="5.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="2"></circle><circle cx="18.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="2"></circle><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 6a1 1 0 100-2 1 1 0 000 2zm-3.5 4.5l-2.5-3-3 2.5m10.5 4l-4.5-4.5H10L7.5 15h3l1.5-3 2.5 3h3.5"></path></svg>
                    <span>Mark: Arrived at Restaurant</span>
                  </>
                )}
                {deliveryStep === 1 && (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                    <span>Mark: Food Picked Up & Departed</span>
                  </>
                )}
                {deliveryStep === 2 && (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>Mark: Handover & Delivered!</span>
                  </>
                )}
              </button>

            </div>
          ) : (
            /* Browse claimable requests */
            <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100 space-y-6">
              <h2 className="text-sm font-extrabold text-textPrimary flex items-center">
                <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                <span>Available Delivery Jobs</span>
              </h2>

              {!isOnline ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100 border-dashed text-textMuted flex flex-col items-center justify-center">
                  <svg className="w-8 h-8 text-gray-300 mb-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                  <span>You are Offline. Toggle Online status above to look for deliveries.</span>
                </div>
              ) : availableOrders.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100 border-dashed text-textMuted animate-pulse flex flex-col items-center justify-center">
                  <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                  <span>Scanning for nearby restaurant ready signals... (No jobs at present)</span>
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
                        className="bg-primary hover:bg-orange-655 text-white font-bold px-4 py-2 rounded-xl text-[10px] shadow-sm shrink-0 transition-all transform active:scale-95 flex items-center space-x-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="5.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="2"></circle><circle cx="18.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="2"></circle><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 6a1 1 0 100-2 1 1 0 000 2zm-3.5 4.5l-2.5-3-3 2.5m10.5 4l-4.5-4.5H10L7.5 15h3l1.5-3 2.5 3h3.5"></path></svg>
                        <span>Claim Job</span>
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
            <div className="bg-blue-50 border border-blue-150 text-blue-600 text-[10px] p-2.5 rounded-xl flex items-start space-x-1.5">
              <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Delivery partners earn a guaranteed flat rate of ₹40 for every successfully completed customer handover.</span>
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
