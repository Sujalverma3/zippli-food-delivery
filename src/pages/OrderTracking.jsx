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

      // Custom Div Icons (using emojis)
      const restIcon = L.divIcon({ html: '<div class="text-2xl drop-shadow-md">🏪</div>', className: 'bg-transparent border-0' });
      const homeIcon = L.divIcon({ html: '<div class="text-2xl drop-shadow-md">🏠</div>', className: 'bg-transparent border-0' });
      const bikeIcon = L.divIcon({ html: '<div class="text-2xl drop-shadow-md animate-bounce">🛵</div>', className: 'bg-transparent border-0' });

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
      <Link to="/" className="text-primary hover:text-orange-600 font-bold mb-6 inline-block transition-all text-xs">
        ← Back to Customer App
      </Link>
      {/* Upper Tracker Summary */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-card border border-gray-100 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 animate-fade-in">
        <div>
          <span className="text-xs font-bold text-textMuted uppercase tracking-wider block">Tracking Order</span>
          <h1 className="text-xl md:text-2xl font-extrabold text-textPrimary mt-1">#{order.orderId}</h1>
          <p className="text-xs text-textMuted mt-1">
            Restaurant: <span className="font-bold text-textPrimary">{order.restaurant}</span>
          </p>
          {order.deliveryInstructions && (
            <p className="text-[10px] text-primary italic mt-1 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded inline-block">
              💬 Instructions: "{order.deliveryInstructions}"
            </p>
          )}
        </div>

        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl min-w-[220px] shadow-sm flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-200 bg-white shrink-0 shadow-sm p-1 flex items-center justify-center">
              <img src="/images/foody_logo.png" alt="Foody Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xs font-bold text-primary uppercase block animate-pulse">Arriving in</span>
              <span className="text-2xl font-extrabold text-primary block mt-0.5">{timeLeft} Mins</span>
              <span className="text-[10px] text-textMuted block mt-0.5">
                Rider: <span className="font-bold text-textPrimary">{order.deliveryAgent || 'Zippli Partner'}</span>
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
          <div className="text-center md:text-right bg-green-50 border border-green-100 p-4 rounded-2xl min-w-[160px] shadow-sm">
            <span className="text-xs font-bold text-success uppercase block">Status</span>
            <span className="text-2xl font-extrabold text-success block mt-1">Delivered 🎉</span>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Map & Timeline */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Map Container */}
          <div className="bg-white rounded-3xl p-4 shadow-card border border-gray-100 overflow-hidden">
            <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-3 block pl-2">Live Delivery Route</h3>
            <div 
              id={mapContainerId} 
              style={{ height: '320px' }} 
              className="rounded-2xl overflow-hidden shadow-inner border border-gray-100 bg-gray-100 z-10"
            ></div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-card border border-gray-100">
            <h2 className="text-base font-extrabold text-textPrimary border-b border-gray-100 pb-3 mb-6">Delivery Timeline</h2>
            
            {order.status === 'cancelled' ? (
              <div className="text-center py-6">
                <span className="text-5xl">🚫</span>
                <h3 className="text-base font-bold text-textPrimary mt-4">Order Cancelled</h3>
                <p className="text-xs text-textMuted mt-1">This order was cancelled. Please check your payment refund status or re-order.</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-gray-100 space-y-8 ml-3">
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
                          : 'bg-white border-gray-200'
                      }`}></div>
                      
                      {isActive && (
                        <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-primary border-primary animate-ping"></div>
                      )}

                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${
                          isCompleted ? 'text-success' : isActive ? 'text-primary' : 'text-textMuted'
                        }`}>
                          {step.label}
                        </span>
                        <span className="text-xs text-textMuted mt-0.5 leading-snug">{step.desc}</span>
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
            <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100 animate-scale-up">
              <h2 className="text-base font-extrabold text-textPrimary border-b border-gray-100 pb-3 mb-4">Rate your Experience</h2>
              
              {rated ? (
                <div className="text-center py-4 space-y-2">
                  <div className="text-2xl text-yellow-400">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i}>{i < rating ? '★' : '☆'}</span>
                    ))}
                  </div>
                  <p className="text-xs text-textPrimary font-bold">You rated this: {rating} Stars</p>
                  {feedback && <p className="text-xs text-textMuted italic bg-gray-50 p-2.5 rounded-xl border border-gray-100">"{feedback}"</p>}
                </div>
              ) : (
                <form onSubmit={handleRatingSubmit} className="space-y-4">
                  <div className="text-center">
                    <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-2">Tap to Rate</label>
                    <div className="flex justify-center space-x-2 text-3xl">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`hover:scale-110 active:scale-95 transition-transform ${
                            star <= rating ? 'text-yellow-400' : 'text-gray-200'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1">Reviews & Comments</label>
                    <textarea
                      rows="3"
                      placeholder="Was the food hot? How was the delivery speed?"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none rounded-lg p-3 text-xs resize-none"
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
          <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100">
            <h2 className="text-base font-extrabold text-textPrimary border-b border-gray-100 pb-3 mb-4">Order Details</h2>
            
            <div className="space-y-3 mb-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs text-textMuted leading-tight">
                  <div>
                    <span className="font-semibold text-textPrimary block">{item.name}</span>
                    <span className="text-[10px] text-textMuted mt-0.5">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-medium text-textPrimary shrink-0">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-textMuted">
                <span>Total amount</span>
                <span className="font-semibold text-textPrimary">₹{order.totalAmount}</span>
              </div>
              <div className="flex justify-between text-textMuted">
                <span>Payment Mode</span>
                <span className="font-semibold text-textPrimary uppercase">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-textMuted">
                <span>Payment Status</span>
                <span className="font-semibold text-success capitalize">{order.paymentStatus}</span>
              </div>
            </div>

            {(order.status === 'placed' || order.status === 'confirmed') && (
              <button
                onClick={handleCancelOrder}
                className="w-full mt-6 border border-red-200 hover:border-red-500 text-red-500 hover:bg-red-50 transition-colors py-2.5 rounded-xl text-xs font-bold"
              >
                Cancel Order
              </button>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100">
            <h2 className="text-xs font-bold text-textMuted uppercase mb-3">Delivery Address</h2>
            <p className="text-xs font-semibold text-textPrimary leading-relaxed">{order.customerAddress}</p>
            <p className="text-xs text-textMuted mt-2">Recipient: {order.customerName} ({order.customerPhone})</p>
          </div>
        </div>

      </div>
    </div>
  );
}
