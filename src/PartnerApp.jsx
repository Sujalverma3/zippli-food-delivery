import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import PartnerNavbar from './components/PartnerNavbar.jsx';

// Pages
import PartnerLoginPage from './pages/PartnerLoginPage.jsx';
import VendorDashboard from './pages/VendorDashboard.jsx';
import DeliveryDashboard from './pages/DeliveryDashboard.jsx';
import Dashboard from './pages/Dashboard.jsx';

// Dynamically determine basename for dev (/partner.html) and prod (/partner) compatibility
const getBasename = () => {
  return window.location.pathname.startsWith('/partner.html') ? '/partner.html' : '/partner';
};

function PartnerApp() {
  return (
    <BrowserRouter basename={getBasename()}>
      <AuthProvider>
        <div className="min-h-screen bg-background flex flex-col font-sans">
          <PartnerNavbar />
          <main className="flex-grow pt-20">
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<PartnerLoginPage />} />
              <Route path="/vendor/dashboard" element={<VendorDashboard />} />
              <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
          <Toaster position="top-center" reverseOrder={false} />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default PartnerApp;
