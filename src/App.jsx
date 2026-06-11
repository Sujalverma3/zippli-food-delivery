import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './context/CartContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import RoleSwitcher from './components/RoleSwitcher.jsx';

// Pages
import HomePage from './pages/HomePage.jsx';
import RestaurantPage from './pages/RestaurantPage.jsx';
import CartPage from './pages/CartPage.jsx';
import OrderTracking from './pages/OrderTracking.jsx';
import Dashboard from './pages/Dashboard.jsx'; // Admin Dashboard
import LoginPage from './pages/LoginPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import VendorDashboard from './pages/VendorDashboard.jsx';
import DeliveryDashboard from './pages/DeliveryDashboard.jsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-background flex flex-col font-sans">
            <Navbar />
            <main className="flex-grow pt-20">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/restaurant/:id" element={<RestaurantPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/track/:orderId" element={<OrderTracking />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/vendor/dashboard" element={<VendorDashboard />} />
                <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
              </Routes>
            </main>
            <Footer />
            <RoleSwitcher />
            <Toaster position="top-center" reverseOrder={false} />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
