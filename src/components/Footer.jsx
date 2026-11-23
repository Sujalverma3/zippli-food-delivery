import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#181920] dark:bg-[#090a0d] text-gray-300 mt-16 border-t border-transparent dark:border-neutral-850 transition-colors duration-200">
      {/* Top wave separator */}
      <div className="h-1 bg-gradient-to-r from-primary via-orange-400 to-red-500"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center space-x-2 mb-4 group">
              <span className="text-primary text-2xl font-extrabold">Zippli</span>
              <svg className="w-5 h-5 text-primary transition-transform group-hover:scale-110 duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-10h-9l1-8z" fill="currentColor"/>
              </svg>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Premium food delivery at your fingertips. From your favourite restaurants to your doorstep in minutes.
            </p>
            <div className="flex space-x-3 mt-5">
              {[
                {
                  name: 'Facebook',
                  svg: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 8H7v3h2v9h4v-9h3.6l.4-3H13V6c0-.5.5-1 1-1h3V2h-3c-3 0-5 2-5 5v1z"/></svg>
                },
                {
                  name: 'Twitter',
                  svg: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                },
                {
                  name: 'Instagram',
                  svg: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                },
                {
                  name: 'LinkedIn',
                  svg: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                }
              ].map((social, i) => (
                <button key={i} title={social.name} className="w-9 h-9 rounded-lg bg-white bg-opacity-10 hover:bg-primary hover:bg-opacity-100 flex items-center justify-center transition-all duration-200 text-gray-300 hover:text-white">
                  {social.svg}
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
                  <Link to={link.to} className="text-sm text-gray-400 hover:text-primary transition-colors duration-200 flex items-center space-x-2 group">
                    <svg className="w-2.5 h-2.5 text-primary shrink-0 transition-transform group-hover:translate-x-0.5 duration-200" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
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
                <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>Main Bazar, Deoband, Saharanpur, Uttar Pradesh, 247554</span>
              </li>
              <li className="flex items-center space-x-2.5 text-sm text-gray-400">
                <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <span>admin@harmonybits.in</span>
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
              <button className="bg-primary hover:bg-orange-600 text-white px-4 py-2.5 rounded-r-lg text-sm font-bold transition-colors flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </div>
            <div className="flex space-x-2 mt-5">
              <div className="bg-white bg-opacity-10 rounded-lg px-3 py-2 text-xs font-medium flex items-center space-x-1.5 cursor-pointer hover:bg-opacity-20 transition-all text-gray-300">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z"/></svg>
                <span>App Store</span>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg px-3 py-2 text-xs font-medium flex items-center space-x-1.5 cursor-pointer hover:bg-opacity-20 transition-all text-gray-300">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 5.277c0-.986.721-1.488 1.482-1.076l14.611 7.917c.76.412.76 1.08 0 1.492L4.482 21.527C3.721 21.939 3 21.437 3 20.45V5.277z"/></svg>
                <span>Play Store</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white border-opacity-10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500">
          <p className="flex items-center">
            <span>© 2026 Zippli. All rights reserved. Made with</span>
            <svg className="w-3.5 h-3.5 text-primary fill-current inline-block mx-1 align-middle hover:scale-125 transition-transform duration-300" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            <span>in India.</span>
          </p>
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
