import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#1f1f2e] text-gray-300 mt-16">
      {/* Top wave separator */}
      <div className="h-1 bg-gradient-to-r from-primary via-orange-400 to-red-500"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <span className="text-primary text-2xl font-extrabold">Zippli</span>
              <span className="text-primary text-xl">⚡</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Premium food delivery at your fingertips. From your favourite restaurants to your doorstep in minutes.
            </p>
            <div className="flex space-x-3 mt-5">
              {['📘', '🐦', '📸', '🔗'].map((icon, i) => (
                <button key={i} className="w-9 h-9 rounded-lg bg-white bg-opacity-10 hover:bg-primary hover:bg-opacity-100 flex items-center justify-center text-sm transition-all duration-200">
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Home', to: '/' },
                { label: 'My Cart', to: '/cart' },
                { label: 'Admin Dashboard', to: '/dashboard' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-gray-400 hover:text-primary transition-colors duration-200 flex items-center space-x-2">
                    <span className="text-[10px] text-primary">▶</span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2.5 text-sm text-gray-400">
                <span className="text-primary mt-0.5">📍</span>
                <span>123 Food Street, Connaught Place, New Delhi, 110001</span>
              </li>
              <li className="flex items-center space-x-2.5 text-sm text-gray-400">
                <span className="text-primary">📞</span>
                <span>+91 1800-123-4567</span>
              </li>
              <li className="flex items-center space-x-2.5 text-sm text-gray-400">
                <span className="text-primary">✉️</span>
                <span>support@zippli.in</span>
              </li>
            </ul>
          </div>

          {/* Download / Newsletter */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Stay Updated</h4>
            <p className="text-sm text-gray-400 mb-4">Subscribe for exclusive offers and updates.</p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-grow bg-white bg-opacity-10 text-white text-sm px-3 py-2.5 rounded-l-lg border border-white border-opacity-10 focus:outline-none focus:border-primary placeholder-gray-500"
              />
              <button className="bg-primary hover:bg-orange-600 text-white px-4 py-2.5 rounded-r-lg text-sm font-bold transition-colors">
                →
              </button>
            </div>
            <div className="flex space-x-2 mt-5">
              <div className="bg-white bg-opacity-10 rounded-lg px-3 py-2 text-xs font-medium flex items-center space-x-1.5 cursor-pointer hover:bg-opacity-20 transition-all">
                <span>🍎</span><span>App Store</span>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg px-3 py-2 text-xs font-medium flex items-center space-x-1.5 cursor-pointer hover:bg-opacity-20 transition-all">
                <span>▶️</span><span>Play Store</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white border-opacity-10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500">
          <p>© 2024 Zippli. All rights reserved. Made with 🧡 in India.</p>
          <div className="flex space-x-4 mt-3 sm:mt-0">
            <span className="hover:text-gray-300 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-gray-300 cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-gray-300 cursor-pointer transition-colors">Refund Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
