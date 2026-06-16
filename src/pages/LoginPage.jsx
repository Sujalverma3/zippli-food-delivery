import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const { login, register, logout } = useAuth();
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
        if (user.role !== 'customer') {
          logout();
          toast.error("Partners must register via the Partner Portal. Redirecting...");
          setTimeout(() => {
            window.location.href = '/partner.html';
          }, 2000);
          return;
        }
        redirectAfterLogin(user.role);
      } else {
        const user = await login(email, password);
        if (user.role !== 'customer') {
          logout();
          toast.error("Partner accounts cannot log in here. Redirecting to Partner Portal...");
          setTimeout(() => {
            window.location.href = '/partner.html';
          }, 2000);
          return;
        }
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



  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-orange-50 via-background to-gray-100">
      <Link to="/" className="text-primary hover:text-orange-600 font-bold mb-6 flex items-center space-x-1.5 transition-all text-xs">
        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        <span>Back to Customer Storefront</span>
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
            className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-all duration-200 flex items-center justify-center ${
              !isRegister ? 'border-primary text-primary bg-white' : 'border-transparent text-textMuted hover:text-textPrimary'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
            </svg>
            Log In
          </button>
          <button
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-all duration-200 flex items-center justify-center ${
              isRegister ? 'border-primary text-primary bg-white' : 'border-transparent text-textMuted hover:text-textPrimary'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
            </svg>
            Sign Up
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
                  className="w-full bg-gray-50 border border-gray-200 text-sm text-textPrimary px-4 py-2.5 rounded-xl focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
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
                  className="w-full bg-gray-50 border border-gray-200 text-sm text-textPrimary px-4 py-2.5 rounded-xl focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
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
              className="w-full bg-gray-50 border border-gray-200 text-sm text-textPrimary px-4 py-2.5 rounded-xl focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
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
              className="w-full bg-gray-50 border border-gray-200 text-sm text-textPrimary px-4 py-2.5 rounded-xl focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all duration-200 transform active:scale-[0.98] disabled:opacity-50 flex justify-center items-center space-x-2 text-sm mt-3"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              <span className="flex items-center justify-center space-x-1.5">
                {isRegister ? (
                  <>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                    </svg>
                    <span>Create Account</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                    </svg>
                    <span>Log In</span>
                  </>
                )}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
