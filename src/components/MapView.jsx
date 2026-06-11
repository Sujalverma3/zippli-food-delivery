import React from 'react';

export default function MapView({ lat, lng, height = '300px' }) {
  if (!lat || !lng) {
    return (
      <div
        className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <span className="text-4xl block mb-2">📍</span>
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
