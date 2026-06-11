import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');
  const [restaurantId, setRestaurantId] = useState('r1');

  const redirectPath = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        const user = await register(name, email, phone, password, role, role === 'restaurant' ? restaurantId : '');
        redirectAfterLogin(user.role);
      } else {
        const user = await login(email, password);
        redirectAfterLogin(user.role);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const redirectAfterLogin = (userRole) => {
    if (userRole === 'admin') navigate('/admin/dashboard');
    else if (userRole === 'restaurant') navigate('/vendor/dashboard');
    else if (userRole === 'delivery') navigate('/delivery/dashboard');
    else navigate(redirectPath);
  };

  const fillMockCredentials = (roleType) => {
    if (roleType === 'customer') {
      setEmail('customer@zippli.com');
      setPassword('password123');
      setIsRegister(false);
    } else if (roleType === 'vendor') {
      setEmail('vendor@zippli.com');
      setPassword('password123');
      setIsRegister(false);
    } else if (roleType === 'delivery') {
      setEmail('delivery@zippli.com');
      setPassword('password123');
      setIsRegister(false);
    } else if (roleType === 'admin') {
      setEmail('admin@zippli.com');
      setPassword('password123');
      setIsRegister(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-orange-50 via-background to-gray-100">
      <Link to="/" className="text-primary hover:text-orange-650 font-bold mb-6 flex items-center space-x-1.5 transition-all text-xs">
        <span>←</span> <span>Back to Customer Storefront</span>
      </Link>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden transform transition-all duration-300 hover:shadow-xl">
        {/* Banner */}
        <div className="bg-primary p-8 text-center text-white relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full translate-x-8 -translate-y-8"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white opacity-10 rounded-full -translate-x-4 translate-y-4"></div>
          <h2 className="text-3xl font-extrabold tracking-tight">Zippli</h2>
          <p className="text-orange-100 text-xs mt-1.5 font-medium uppercase tracking-wider">
            {isRegister ? 'Join the Taste Revolution' : 'Delivering Happiness Instantly'}
          </p>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-gray-100 bg-gray-50">
          <button
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-all duration-200 ${
              !isRegister ? 'border-primary text-primary bg-white' : 'border-transparent text-textMuted hover:text-textPrimary'
            }`}
          >
            🔑 Log In
          </button>
          <button
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-all duration-200 ${
              isRegister ? 'border-primary text-primary bg-white' : 'border-transparent text-textMuted hover:text-textPrimary'
            }`}
          >
            ✨ Sign Up
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {isRegister && (
            <>
              <div>
                <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-sm text-textPrimary px-4 py-2.5 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-sm text-textPrimary px-4 py-2.5 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1.5">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-sm text-textPrimary px-4 py-2.5 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1.5">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-sm text-textPrimary px-4 py-2.5 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {isRegister && (
            <div className="grid grid-cols-1 gap-4 pt-1">
              <div>
                <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1.5">Account Type (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-sm text-textPrimary px-4 py-2.5 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all"
                >
                  <option value="customer">Customer (Order Food)</option>
                  <option value="restaurant">Restaurant Partner (Vendor Panel)</option>
                  <option value="delivery">Delivery Partner (Rider App)</option>
                  <option value="admin">Administrator (Full Control)</option>
                </select>
              </div>

              {role === 'restaurant' && (
                <div>
                  <label className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1.5">Select Restaurant</label>
                  <select
                    value={restaurantId}
                    onChange={(e) => setRestaurantId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-sm text-textPrimary px-4 py-2.5 rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all"
                  >
                    <option value="r1">Pizza Palazzo (r1)</option>
                    <option value="r2">Burger Bistro (r2)</option>
                    <option value="r3">Biryani Darbar (r3)</option>
                    <option value="r4">Sushi Sakura (r4)</option>
                    <option value="r5">The Healthy Bowl (r5)</option>
                    <option value="r6">Wok N Roll (r6)</option>
                  </select>
                  <p className="text-[10px] text-textMuted mt-1">Associate this login with an existing storefront.</p>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all duration-200 transform active:scale-[0.98] disabled:opacity-50 flex justify-center items-center space-x-2 text-sm mt-3"
          >
            {loading ? (
              <><span className="animate-spin">⏳</span><span>Processing...</span></>
            ) : (
              <><span>{isRegister ? '🚀 Create Account' : '🔑 Log In'}</span></>
            )}
          </button>
        </form>

        {/* Demo Fast Login Ribbon */}
        <div className="px-8 pb-8 pt-2 border-t border-gray-100 bg-gray-50">
          <h4 className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-2.5 text-center">Fast-Track Demo Credentials</h4>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => fillMockCredentials('customer')}
              className="bg-white border border-gray-200 hover:border-primary hover:text-primary rounded-lg py-1.5 font-bold transition-all"
            >
              🧑‍💻 Customer
            </button>
            <button
              onClick={() => fillMockCredentials('vendor')}
              className="bg-white border border-gray-200 hover:border-primary hover:text-primary rounded-lg py-1.5 font-bold transition-all"
            >
              🍽️ Restaurant
            </button>
            <button
              onClick={() => fillMockCredentials('delivery')}
              className="bg-white border border-gray-200 hover:border-primary hover:text-primary rounded-lg py-1.5 font-bold transition-all"
            >
              🛵 Delivery
            </button>
            <button
              onClick={() => fillMockCredentials('admin')}
              className="bg-white border border-gray-200 hover:border-primary hover:text-primary rounded-lg py-1.5 font-bold transition-all"
            >
              ⚙️ Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
