import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function CartPage() {
  const { cart, updateQty, cartTotal, clearCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Simulated Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentState, setPaymentState] = useState('none'); // none, processing, pin_entry, success, failed
  const [pinCode, setPinCode] = useState('');
  const [paymentLoadingText, setPaymentLoadingText] = useState('Initializing Secure Session...');

  const deliveryFee = cartTotal > 0 ? (cartTotal >= 299 ? 0 : 30) : 0;
  const gst = Math.max(0, cartTotal - discountAmount) * 0.05;
  const grandTotal = Math.max(0, cartTotal - discountAmount + deliveryFee + gst);

  // Auto fill name/phone if logged in
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setPhone(currentUser.phone);
      if (currentUser.addresses && currentUser.addresses.length > 0) {
        setAddress(currentUser.addresses[0].street);
        setSelectedAddressId(currentUser.addresses[0]._id);
      }
    }
  }, [currentUser]);

  const handleAddressSelect = (addr) => {
    setSelectedAddressId(addr._id);
    setAddress(addr.street + (addr.details ? `, ${addr.details}` : ''));
  };

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return toast.error('Please enter a coupon code');
    
    if (appliedCoupon) {
      toast.error('Coupon already applied!');
      return;
    }

    setValidatingCoupon(true);
    try {
      const res = await axios.post('/api/coupons/validate', {
        code: code,
        cartAmount: cartTotal
      });
      const { discount, code: verifiedCode } = res.data;
      setDiscountAmount(discount);
      setAppliedCoupon(verifiedCode);
      toast.success(`Coupon ${verifiedCode} applied! Saved ₹${discount}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid Coupon Code');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setDiscountAmount(0);
    setAppliedCoupon('');
    setCouponCode('');
    toast.success('Coupon removed');
  };

  const startCheckout = (e) => {
    e.preventDefault();
    if (cart.length === 0) return toast.error('Your cart is empty');
    if (!name || !phone || !address) return toast.error('Please fill in name, phone and address');

    if (paymentMethod === 'cash') {
      // Place order directly
      executeOrderPlacement('cash');
    } else {
      // Trigger checkout gateway modal
      setShowPaymentModal(true);
      setPaymentState('processing');
      setPinCode('');
      setPaymentLoadingText('Contacting Payment Gateway...');

      setTimeout(() => {
        setPaymentState('pin_entry');
      }, 1800);
    }
  };

  const submitPINCode = (e) => {
    e.preventDefault();
    if (pinCode.length < 4) {
      toast.error('Please enter a valid PIN');
      return;
    }

    setPaymentState('processing');
    setPaymentLoadingText('Verifying credentials & transferring funds...');

    setTimeout(() => {
      setPaymentState('success');
      setTimeout(() => {
        executeOrderPlacement(paymentMethod);
      }, 1500);
    }, 2000);
  };

  const executeOrderPlacement = async (actualPaymentMethod) => {
    try {
      const orderData = {
        customerName: name,
        phone,
        address,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: ''
        })),
        restaurant: cart[0].restaurantName || 'Zippli Partner',
        paymentMethod: actualPaymentMethod,
        totalAmount: parseFloat(grandTotal.toFixed(2)),
        deliveryInstructions
      };

      const res = await axios.post('/api/orders', orderData);
      const createdOrder = res.data;
      
      toast.success('Order Placed Successfully!');
      clearCart();
      setShowPaymentModal(false);
      navigate(`/track/${createdOrder.orderId}`);
    } catch (err) {
      console.error('Error placing order:', err);
      toast.error(err.response?.data?.error || 'Failed to place order');
      setPaymentState('failed');
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <span className="text-7xl block mb-4">🔒</span>
        <h2 className="text-2xl font-extrabold text-textPrimary">Log In to Checkout</h2>
        <p className="text-textMuted text-sm mt-2">
          You need to be registered and logged in to Zippli to complete your food order.
        </p>
        <Link
          to="/login"
          state={{ from: '/cart' }}
          className="mt-6 bg-primary hover:bg-orange-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md inline-block transform active:scale-95 transition-all"
        >
          Click Here to Log In 🔑
        </Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <span className="text-7xl block mb-4">🛒</span>
        <h2 className="text-2xl font-extrabold text-textPrimary">Your Cart is Empty</h2>
        <p className="text-textMuted text-sm mt-2">
          Looks like you haven't added anything to your cart yet. Go ahead and explore top restaurants.
        </p>
        <Link
          to="/"
          className="mt-6 bg-primary hover:bg-orange-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md inline-block transform active:scale-95 transition-all"
        >
          See Restaurants Nearby
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
      <Link to="/" className="text-primary hover:text-orange-600 font-bold mb-6 inline-block transition-all text-xs">
        ← Back to Customer App
      </Link>
      <h1 className="text-2xl font-extrabold text-textPrimary mb-8">Secure Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Checkout Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Address Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
            <h2 className="text-base font-extrabold text-textPrimary border-b border-gray-100 pb-3 mb-4 flex items-center space-x-2">
              <span>🚚</span><span>Delivery Location</span>
            </h2>

            {/* Address Selection Cards */}
            {currentUser.addresses && currentUser.addresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {currentUser.addresses.map((addr) => (
                  <div
                    key={addr._id}
                    onClick={() => handleAddressSelect(addr)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all relative ${
                      selectedAddressId === addr._id
                        ? 'border-primary bg-orange-50 bg-opacity-40 shadow-sm'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-extrabold uppercase bg-white border px-2 py-0.5 rounded text-primary">
                        {addr.tag}
                      </span>
                      {selectedAddressId === addr._id && (
                        <span className="bg-primary text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">✓</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-textPrimary block truncate">{addr.street}</span>
                    <span className="text-[10px] text-textMuted block mt-0.5 truncate">{addr.details}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-orange-50 bg-opacity-50 border border-orange-100 rounded-xl mb-4 text-xs">
                ⚠️ You don't have any saved addresses. We will use the custom address field below. Add addresses in your{' '}
                <Link to="/profile" className="text-primary font-bold hover:underline">Profile Page</Link> for quicker selection.
              </div>
            )}

            {/* Address Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-textMuted uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none rounded-lg px-4 py-2.5 text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-textMuted uppercase mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter 10-digit number"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none rounded-lg px-4 py-2.5 text-sm transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-textMuted uppercase mb-1">Selected Street Address</label>
                <textarea
                  required
                  rows="3"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Complete Address (flat/house no, street, area, pincode)"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none rounded-lg px-4 py-2.5 text-sm transition-all resize-none"
                ></textarea>
              </div>

              {/* Delivery Instructions */}
              <div>
                <label className="block text-xs font-bold text-textMuted uppercase mb-1">Delivery Instructions (Optional)</label>
                <input
                  type="text"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="e.g. Leave with guard, Don't ring bell, Call on arrival"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none rounded-lg px-4 py-2.5 text-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
            <h2 className="text-base font-extrabold text-textPrimary border-b border-gray-100 pb-3 mb-4 flex items-center space-x-2">
              <span>💳</span><span>Payment Option</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'cash', name: 'Cash on Delivery', desc: 'Pay when food arrives', icon: '💵' },
                { id: 'card', name: 'Credit/Debit Card', desc: 'Simulated payment popup', icon: '💳' },
                { id: 'upi', name: 'UPI / NetBanking', desc: 'Simulated mobile flow', icon: '📱' }
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between h-28 transition-all relative ${
                    paymentMethod === method.id
                      ? 'border-primary bg-orange-50 bg-opacity-40 shadow-sm'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-2xl">{method.icon}</span>
                    {paymentMethod === method.id && (
                      <span className="bg-primary text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">✓</span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-textPrimary block leading-tight">{method.name}</span>
                    <span className="text-[10px] text-textMuted block mt-0.5 leading-tight">{method.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right billing sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
            <h2 className="text-base font-extrabold text-textPrimary border-b border-gray-100 pb-3 mb-4 flex items-center space-x-2">
              <span>🍽️</span><span>Review Items ({cart.length})</span>
            </h2>
            <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto pr-1 no-scrollbar">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2.5 first:pt-0">
                  <div className="text-xs pr-2">
                    <span className="font-semibold text-textPrimary block leading-snug">{item.name}</span>
                    <span className="text-[10px] text-textMuted block mt-0.5">₹{item.price} each</span>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="flex items-center bg-gray-50 text-textPrimary rounded px-2 py-0.5 border border-gray-200">
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} className="font-bold text-[10px]">−</button>
                      <span className="px-2 font-bold text-[10px]">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} className="font-bold text-[10px]">+</button>
                    </div>
                    <span className="text-xs font-bold text-textPrimary min-w-[50px] text-right">₹{item.price * item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
            <h2 className="text-base font-extrabold text-textPrimary border-b border-gray-100 pb-3 mb-4 flex items-center space-x-2">
              <span>🏷️</span><span>Apply Coupon</span>
            </h2>
            {appliedCoupon ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex justify-between items-center">
                <div className="text-xs text-success">
                  <span className="font-bold block">Applied: {appliedCoupon}</span>
                  <span className="text-[10px]">You saved ₹{discountAmount}!</span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs text-red-500 hover:text-red-700 font-bold transition-colors"
                >
                  REMOVE
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter Coupon (ZIPPLI50)"
                    className="flex-grow bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none rounded-lg px-3 py-2 text-xs uppercase transition-all"
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={validatingCoupon}
                    className="bg-primary hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all"
                  >
                    {validatingCoupon ? '...' : 'APPLY'}
                  </button>
                </div>
                <div className="text-[10px] text-textMuted italic">
                  Apply coupon codes like "ZIPPLI50" (50% off) or "WELCOME20" (20% off) to get a discount.
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100 space-y-4">
            <h2 className="text-base font-extrabold text-textPrimary border-b border-gray-100 pb-3">Bill Details</h2>
            <div className="space-y-2 text-xs text-textMuted">
              <div className="flex justify-between">
                <span>Cart Subtotal</span>
                <span className="font-medium text-textPrimary">₹{cartTotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Coupon Discount</span>
                  <span className="font-bold">-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Partner Fee</span>
                <span className="font-medium text-textPrimary">
                  {deliveryFee === 0 ? <span className="text-success font-bold">FREE</span> : `₹${deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span className="font-medium text-textPrimary">₹{gst.toFixed(2)}</span>
              </div>
              <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between text-sm font-extrabold text-textPrimary">
                <span>Total Payable</span>
                <span className="text-primary text-base">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={startCheckout}
              disabled={cart.length === 0}
              className="w-full bg-primary hover:bg-orange-600 text-white py-3.5 rounded-xl text-sm font-extrabold shadow-md transition-all transform active:scale-95 duration-200 disabled:opacity-50"
            >
              Confirm & Place Order 🍕
            </button>
          </div>
        </div>
      </div>

      {/* Simulated Secure Payment Gateway Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-100 transform transition-all duration-300 scale-100 animate-scale-up">
            
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white text-center">
              <div className="text-xs font-bold text-emerald-400 tracking-widest uppercase flex items-center justify-center space-x-1.5 mb-1">
                <span>🔒</span><span>Zippli Secure Pay</span>
              </div>
              <h3 className="text-sm font-bold text-slate-300">Transaction ID: ZPAY-{(Math.random()*1e9).toFixed(0)}</h3>
              <div className="text-3xl font-extrabold text-white mt-4">₹{grandTotal.toFixed(2)}</div>
              <p className="text-[10px] text-slate-400 mt-1">Paying {cart[0]?.restaurantName || 'Zippli Store'}</p>
            </div>

            {/* Content states */}
            {paymentState === 'processing' && (
              <div className="p-10 flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="text-xs text-textMuted font-bold text-center animate-pulse">{paymentLoadingText}</p>
              </div>
            )}

            {paymentState === 'pin_entry' && (
              <form onSubmit={submitPINCode} className="p-8 space-y-6">
                <div className="text-center">
                  <h4 className="text-xs font-extrabold text-textPrimary uppercase">
                    {paymentMethod === 'upi' ? '🛡️ Enter UPI PIN' : '🛡️ Enter 3-Digit Card CVV'}
                  </h4>
                  <p className="text-[10px] text-textMuted mt-1">
                    {paymentMethod === 'upi' ? 'Please enter your 4-digit bank transaction PIN' : 'Enter the CVV on the back of your credit/debit card'}
                  </p>
                </div>
                
                <input
                  type="password"
                  maxLength={paymentMethod === 'upi' ? 4 : 3}
                  required
                  placeholder={paymentMethod === 'upi' ? '••••' : '•••'}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  className="w-28 mx-auto block text-center text-2xl font-extrabold bg-gray-50 border border-gray-200 tracking-widest rounded-xl py-2 focus:outline-none focus:border-primary transition-all"
                />

                <div className="flex space-x-3 shrink-0">
                  <button
                    type="submit"
                    className="flex-grow bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-sm"
                  >
                    Submit Securely ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="bg-gray-100 hover:bg-gray-200 text-textMuted font-bold py-3 px-4 rounded-xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {paymentState === 'success' && (
              <div className="p-10 flex flex-col items-center justify-center space-y-4 animate-scale-up">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-500 text-3xl flex items-center justify-center shadow-inner">
                  ✓
                </div>
                <p className="text-sm font-extrabold text-emerald-600 uppercase tracking-wider text-center">Payment Successful!</p>
                <p className="text-[10px] text-textMuted text-center">Redirecting you to track order details...</p>
              </div>
            )}

            {paymentState === 'failed' && (
              <div className="p-10 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 text-3xl flex items-center justify-center shadow-inner">
                  ✕
                </div>
                <p className="text-sm font-extrabold text-red-600 uppercase tracking-wider text-center">Transaction Failed</p>
                <p className="text-[10px] text-textMuted text-center">There was an issue processing your request.</p>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all mt-4"
                >
                  Return to Checkout
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
