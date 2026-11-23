import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const STATUS_LABELS = {
  placed: 'Order Placed',
  confirmed: 'Restaurant Confirmed',
  preparing: 'Food is being prepared',
  out_for_delivery: 'Rider is on the way',
  delivered: 'Delivered',
};

export default function LiveOrderPill() {
  const [activeOrder, setActiveOrder] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const location = useLocation();

  // If user is currently on the tracking page for this order, don't show the floating pill
  const isTrackingPage = location.pathname.startsWith('/track/');

  const checkActiveOrder = async () => {
    try {
      const stored = localStorage.getItem('zippli_active_order');
      if (!stored) {
        setActiveOrder(null);
        return;
      }

      const orderMeta = JSON.parse(stored);
      // Older than 3 hours? Expire it
      if (Date.now() - orderMeta.placedAt > 3 * 60 * 60 * 1000) {
        localStorage.removeItem('zippli_active_order');
        setActiveOrder(null);
        return;
      }

      const res = await axios.get(`/api/orders/${orderMeta.orderId}`);
      const order = res.data;

      if (!order || order.status === 'delivered') {
        localStorage.removeItem('zippli_active_order');
        setActiveOrder(null);
      } else {
        setActiveOrder(order);
      }
    } catch {
      // If error or order not found, silently keep current or clear
    }
  };

  useEffect(() => {
    checkActiveOrder();
    const interval = setInterval(checkActiveOrder, 12000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  if (!activeOrder || isTrackingPage || dismissed) {
    return null;
  }

  const statusText = STATUS_LABELS[activeOrder.status] || 'Order in progress';

  return (
    <aside 
      aria-label="Active order tracking"
      className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-40 animate-bounce-short"
    >
      <div className="bg-neutral-900/95 dark:bg-neutral-850/95 text-white backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl border border-neutral-700/80 flex items-center gap-3.5 max-w-sm">
        {/* Pulsing Emerald Radar */}
        <div className="relative flex h-3 w-3 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-white truncate">
              {activeOrder.restaurant}
            </span>
            <span className="text-[10px] text-neutral-400">•</span>
            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
              Live
            </span>
          </div>
          <p className="text-xs text-neutral-300 font-medium truncate mt-0.5">
            {statusText}
          </p>
        </div>

        {/* Action Link */}
        <Link
          to={`/track/${activeOrder.orderId}`}
          className="bg-primary hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all duration-150 shrink-0 shadow-sm"
        >
          Track
        </Link>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-neutral-400 hover:text-white p-1 transition-colors -mr-1"
          title="Dismiss for now"
          aria-label="Dismiss tracking bar"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
