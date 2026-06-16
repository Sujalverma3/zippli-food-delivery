import React from 'react';

export default function MapView({ lat, lng, height = '300px' }) {
  if (!lat || !lng) {
    return (
      <div
        className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <svg className="w-10 h-10 text-primary mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm text-textMuted font-medium">Location not available</p>
        </div>
      </div>
    );
  }

  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.008}%2C${lat - 0.005}%2C${lng + 0.008}%2C${lat + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height }}>
      <iframe
        title="Restaurant Location"
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        src={osmUrl}
        style={{ border: 0 }}
        loading="lazy"
      />
    </div>
  );
}
