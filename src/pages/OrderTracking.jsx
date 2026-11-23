import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const STEPS = [
  { key: 'placed', label: 'Order Placed', desc: 'Your order has been recorded' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Restaurant accepted your order' },
  { key: 'preparing', label: 'Preparing', desc: 'Chef is preparing your fresh meal' },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Our delivery hero is on the way' },
  { key: 'delivered', label: 'Delivered', desc: 'Bon appetit!' }
];

export default function OrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(45);

  // Review & Rating State
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [rated, setRated] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Map reference
  const mapRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const pathLineRef = useRef(null);
  const mapContainerId = `map-${orderId}`;

  // Local animated coordinates for rider
  const [riderCoords, setRiderCoords] = useState(null);

  const fetchOrder = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await axios.get(`/api/orders/${orderId}`);
      setOrder(res.data);
      if (res.data.rating > 0) {
        setRated(true);
        setRating(res.data.rating);
        setFeedback(res.data.feedback);
      }
    } catch (err) {
      console.error('Error tracking order:', err);
      if (!silent) toast.error('Failed to get tracking details');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    const interval = setInterval(() => {
      fetchOrder(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId]);

  // Countdown timer
  useEffect(() => {
    if (!order) return;
    const estDate = new Date(order.estimatedDelivery);
    const updateCountdown = () => {
      const diffMs = estDate - new Date();
      const diffMins = Math.max(0, Math.ceil(diffMs / 60000));
      setTimeLeft(diffMins);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 15000);
    return () => clearInterval(timer);
  }, [order]);

  // Rider position interpolation
  useEffect(() => {
    if (!order) return;

    // Restaurant position (fallback coordinates if not present)
    const restLat = 28.6298;
    const restLng = 77.2276;
    const custLat = order.deliveryLat || 28.6304;
    const custLng = order.deliveryLng || 77.2177;

    if (order.status === 'out_for_delivery') {
      // If order is out for delivery, simulate movement
      let step = 0;
      const totalSteps = 100;
      
      const moveInterval = setInterval(() => {
        step += 1;
        if (step > totalSteps) {
          clearInterval(moveInterval);
          // Mark delivered locally or wait for backend status update
          return;
        }

        // Interpolate coordinates
        const ratio = step / totalSteps;
        const currentLat = restLat + (custLat - restLat) * ratio;
        const currentLng = restLng + (custLng - restLng) * ratio;

        setRiderCoords({ lat: currentLat, lng: currentLng });
        
        // Also inform the backend periodically of new coordinates
        if (step % 20 === 0) {
          axios.patch(`/api/orders/${order.orderId}/status`, {
            agentLat: currentLat,
            agentLng: currentLng
          }).catch(err => console.error(err));
        }

      }, 1000);

      return () => clearInterval(moveInterval);
    } else if (order.status === 'delivered') {
      setRiderCoords({ lat: custLat, lng: custLng });
    } else {
      // Rider is still at restaurant preparing
      setRiderCoords({ lat: restLat, lng: restLng });
    }
  }, [order?.status]);

  // Leaflet Map Initialization & Rendering
  useEffect(() => {
    if (loading || !order || !window.L) return;

    const restLat = 28.6298;
    const restLng = 77.2276;
    const custLat = order.deliveryLat || 28.6304;
    const custLng = order.deliveryLng || 77.2177;
    const currentRider = riderCoords || { lat: restLat, lng: restLng };

    // Initialize map
    if (!mapRef.current) {
      const L = window.L;
      const map = L.map(mapContainerId, {
        zoomControl: false,
        attributionControl: false
      }).setView([restLat, restLng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      // Custom Div Icons (using high-fidelity SVG badges)
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
      const bikeIcon = L.divIcon({ 
        html: `<div class="bg-primary text-white p-2 rounded-full shadow-lg border border-white flex items-center justify-center w-10 h-10 animate-bounce">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="5.5" cy="17.5" r="2.5" stroke="currentColor" stroke-width="2"></circle>
            <circle cx="18.5" cy="17.5" r="2.5" stroke="currentColor" stroke-width="2"></circle>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 6a1 1 0 100-2 1 1 0 000 2zm-3.5 4.5l-2.5-3-3 2.5m10.5 4l-4.5-4.5H10L7.5 15h3l1.5-3 2.5 3h3.5"></path>
          </svg>
        </div>`, 
        className: 'bg-transparent border-0',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });

      // Add markers
      L.marker([restLat, restLng], { icon: restIcon }).addTo(map).bindPopup('Restaurant Store');
      L.marker([custLat, custLng], { icon: homeIcon }).addTo(map).bindPopup('Your Address');
      
      const riderMarker = L.marker([currentRider.lat, currentRider.lng], { icon: bikeIcon }).addTo(map).bindPopup('Delivery Partner');
      riderMarkerRef.current = riderMarker;

      // Draw dotted path line
      const pathLine = L.polyline([[restLat, restLng], [custLat, custLng]], {
        color: '#FC8019',
        dashArray: '5, 10',
        weight: 3
      }).addTo(map);
      pathLineRef.current = pathLine;

      mapRef.current = map;

      // Fit bounds to fit both points
      map.fitBounds([[restLat, restLng], [custLat, custLng]], { padding: [30, 30] });
    } else {
      // Map already initialized, update Rider Marker location
      if (riderMarkerRef.current && riderCoords) {
        riderMarkerRef.current.setLatLng([riderCoords.lat, riderCoords.lng]);
      }
    }
  }, [loading, order, riderCoords]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await axios.delete(`/api/orders/${orderId}`);
      toast.success('Order cancelled successfully');
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not cancel order');
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRating(true);
    try {
      await axios.post(`/api/orders/${orderId}/rate`, { rating, feedback });
      toast.success('Thank you for your rating and feedback!');
      setRated(true);
      fetchOrder();
    } catch (err) {
      toast.error('Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-textPrimary">Order not found</h2>
        <p className="text-textMuted mt-1">Please check your Order ID or contact support.</p>
        <Link to="/" className="text-primary mt-4 inline-block font-semibold">Go Back Home</Link>
      </div>
    );
  }

  const getStepIndex = (status) => {
    if (status === 'cancelled') return -1;
    return STEPS.findIndex(s => s.key === status);
  };

  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
      <Link to="/" className="text-primary hover:text-orange-655 font-bold mb-6 flex items-center space-x-1.5 transition-all text-xs">
        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        <span>Back to Customer App</span>
      </Link>
      {/* Upper Tracker Summary */}
      <div className="bg-white dark:bg-[#16171e] rounded-3xl p-6 md:p-8 shadow-card border border-gray-100 dark:border-neutral-800 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 animate-fade-in">
        <div>
          <span className="text-xs font-bold text-textMuted dark:text-neutral-400 uppercase tracking-wider block">Tracking Order</span>
          <h1 className="text-xl md:text-2xl font-extrabold text-textPrimary dark:text-neutral-100 mt-1">#{order.orderId}</h1>
          <p className="text-xs text-textMuted dark:text-neutral-400 mt-1">
            Restaurant: <span className="font-bold text-textPrimary dark:text-neutral-100">{order.restaurant}</span>
          </p>
          {order.deliveryInstructions && (
            <p className="text-[10px] text-primary italic mt-1 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/60 px-2.5 py-1 rounded inline-flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              <span>Instructions: "{order.deliveryInstructions}"</span>
            </p>
          )}
        </div>

        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <div className="bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/60 p-4 rounded-2xl min-w-[220px] shadow-sm flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-200 dark:border-orange-800 bg-white dark:bg-neutral-800 shrink-0 shadow-sm p-1 flex items-center justify-center">
              <img src="/images/foody_logo.png" alt="Foody Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xs font-bold text-primary uppercase block animate-pulse">Arriving in</span>
              <span className="text-2xl font-extrabold text-primary block mt-0.5">{timeLeft} Mins</span>
              <span className="text-[10px] text-textMuted dark:text-neutral-400 block mt-0.5">
                Rider: <span className="font-bold text-textPrimary dark:text-neutral-200">{order.deliveryAgent || 'Zippli Partner'}</span>
              </span>
            </div>
          </div>
        )}

        {order.status === 'cancelled' && (
          <div className="text-center md:text-right bg-red-50 border border-red-100 p-4 rounded-2xl min-w-[160px]">
            <span className="text-xs font-bold text-red-500 uppercase block">Status</span>
            <span className="text-2xl font-extrabold text-red-500 block mt-1">Cancelled</span>
          </div>
        )}

        {order.status === 'delivered' && (
          <div className="text-center md:text-right bg-green-50 border border-green-100 p-4 rounded-2xl min-w-[160px] shadow-sm flex flex-col items-center md:items-end justify-center">
            <span className="text-xs font-bold text-success uppercase block">Status</span>
            <span className="text-xl font-extrabold text-success mt-1 flex items-center space-x-1">
              <svg className="w-5 h-5 text-success inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Delivered</span>
            </span>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Map & Timeline */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Map Container */}
          <div className="bg-white dark:bg-[#16171e] rounded-3xl p-4 shadow-card border border-gray-100 dark:border-neutral-800 overflow-hidden">
            <h3 className="text-xs font-bold text-textMuted dark:text-neutral-400 uppercase tracking-wider mb-3 block pl-2">Live Delivery Route</h3>
            <div 
              id={mapContainerId} 
              style={{ height: '320px' }} 
              className="rounded-2xl overflow-hidden shadow-inner border border-gray-100 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 z-10"
            ></div>
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-[#16171e] rounded-3xl p-6 md:p-8 shadow-card border border-gray-100 dark:border-neutral-800">
            <h2 className="text-base font-extrabold text-textPrimary dark:text-neutral-100 border-b border-gray-100 dark:border-neutral-800 pb-3 mb-6">Delivery Timeline</h2>
            
            {order.status === 'cancelled' ? (
              <div className="text-center py-6 flex flex-col items-center justify-center">
                <svg className="w-12 h-12 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
                </svg>
                <h3 className="text-base font-bold text-textPrimary dark:text-neutral-100 mt-4">Order Cancelled</h3>
                <p className="text-xs text-textMuted dark:text-neutral-400 mt-1">This order was cancelled. Please check your payment refund status or re-order.</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-gray-100 dark:border-neutral-800 space-y-8 ml-3">
                {STEPS.map((step, idx) => {
                  const isCompleted = idx < currentStepIdx;
                  const isActive = idx === currentStepIdx;
                  
                  return (
                    <div key={step.key} className="relative">
                      <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 ${
                        isCompleted 
                          ? 'bg-success border-success' 
                          : isActive 
                          ? 'bg-primary border-primary animate-pulse' 
                          : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700'
                      }`}></div>
                      
                      {isActive && (
                        <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-primary border-primary animate-ping"></div>
                      )}

                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${
                          isCompleted ? 'text-success' : isActive ? 'text-primary' : 'text-textMuted dark:text-neutral-400'
                        }`}>
                          {step.label}
                        </span>
                        <span className="text-xs text-textMuted dark:text-neutral-400 mt-0.5 leading-snug">{step.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Order Info & Ratings */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Rating / Review Card (visible only when delivered) */}
          {order.status === 'delivered' && (
            <div className="bg-white dark:bg-[#16171e] rounded-3xl p-6 shadow-card border border-gray-100 dark:border-neutral-800 animate-scale-up">
              <h2 className="text-base font-extrabold text-textPrimary dark:text-neutral-100 border-b border-gray-100 dark:border-neutral-800 pb-3 mb-4">Rate your Experience</h2>
              
              {rated ? (
                <div className="text-center py-4 space-y-2">
                  <div className="flex justify-center space-x-1 text-2xl text-yellow-400">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i}>
                        {i < rating ? (
                          <svg className="w-6 h-6 text-yellow-400 inline" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        ) : (
                          <svg className="w-6 h-6 text-gray-200 dark:text-neutral-700 inline" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" opacity="0.25"></path></svg>
                        )}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-textPrimary dark:text-neutral-100 font-bold">You rated this: {rating} Stars</p>
                  {feedback && <p className="text-xs text-textMuted dark:text-neutral-400 italic bg-gray-50 dark:bg-neutral-800 p-2.5 rounded-xl border border-gray-100 dark:border-neutral-700">"{feedback}"</p>}
                </div>
              ) : (
                <form onSubmit={handleRatingSubmit} className="space-y-4">
                  <div className="text-center">
                    <label className="text-[10px] font-bold text-textMuted dark:text-neutral-400 uppercase tracking-wider block mb-2">Tap to Rate</label>
                    <div className="flex justify-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`hover:scale-110 active:scale-95 transition-transform`}
                        >
                          {star <= rating ? (
                            <svg className="w-8 h-8 text-yellow-400 inline" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                          ) : (
                            <svg className="w-8 h-8 text-gray-200 dark:text-neutral-700 inline" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" opacity="0.25"></path></svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-textMuted dark:text-neutral-400 uppercase tracking-wider block mb-1">Reviews & Comments</label>
                    <textarea
                      rows="3"
                      placeholder="Was the food hot? How was the delivery speed?"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-textPrimary dark:text-neutral-100 focus:border-primary focus:bg-white dark:focus:bg-neutral-800 focus:outline-none rounded-lg p-3 text-xs resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingRating}
                    className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm transition-all text-center block"
                  >
                    {submittingRating ? 'Saving...' : '💾 Submit Feedback'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Details Card */}
          <div className="bg-white dark:bg-[#16171e] rounded-3xl p-6 shadow-card border border-gray-100 dark:border-neutral-800">
            <h2 className="text-base font-extrabold text-textPrimary dark:text-neutral-100 border-b border-gray-100 dark:border-neutral-800 pb-3 mb-4">Order Details</h2>
            
            <div className="space-y-3 mb-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs text-textMuted dark:text-neutral-400 leading-tight">
                  <div>
                    <span className="font-semibold text-textPrimary dark:text-neutral-100 block">{item.name}</span>
                    <span className="text-[10px] text-textMuted dark:text-neutral-400 mt-0.5">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-medium text-textPrimary dark:text-neutral-100 shrink-0">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 dark:border-neutral-800 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-textMuted dark:text-neutral-400">
                <span>Total amount</span>
                <span className="font-semibold text-textPrimary dark:text-neutral-100">₹{order.totalAmount}</span>
              </div>
              <div className="flex justify-between text-textMuted dark:text-neutral-400">
                <span>Payment Mode</span>
                <span className="font-semibold text-textPrimary dark:text-neutral-100 uppercase">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-textMuted dark:text-neutral-400">
                <span>Payment Status</span>
                <span className="font-semibold text-success capitalize">{order.paymentStatus}</span>
              </div>
            </div>

            {(order.status === 'placed' || order.status === 'confirmed') && (
              <button
                onClick={handleCancelOrder}
                className="w-full mt-6 border border-red-200 dark:border-red-900/60 hover:border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors py-2.5 rounded-xl text-xs font-bold"
              >
                Cancel Order
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-[#16171e] rounded-3xl p-6 shadow-card border border-gray-100 dark:border-neutral-800">
            <h2 className="text-xs font-bold text-textMuted dark:text-neutral-400 uppercase mb-3">Delivery Address</h2>
            <p className="text-xs font-semibold text-textPrimary dark:text-neutral-100 leading-relaxed">{order.customerAddress}</p>
            <p className="text-xs text-textMuted dark:text-neutral-400 mt-2">Recipient: {order.customerName} ({order.customerPhone})</p>
          </div>
        </div>

      </div>
    </div>
  );
}
