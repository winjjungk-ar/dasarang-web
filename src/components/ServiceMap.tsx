'use client';

import { useEffect, useRef } from 'react';

export default function ServiceMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      if (!mapRef.current) return;
      const L = (window as any).L;

      const map = L.map(mapRef.current).setView([37.1, 128.1], 10);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }).addTo(map);

      const cities = [
        { name: '충주시', lat: 36.99, lng: 127.93, color: '#E65100', tag: '확대' },
        { name: '제천시', lat: 37.13, lng: 128.19, color: '#D32F2F', tag: '중심지' },
        { name: '영월군', lat: 37.18, lng: 128.47, color: '#7B1FA2', tag: '신규' },
      ];

      cities.forEach(city => {
        // Outer pulsing circle
        const outerCircle = L.circleMarker([city.lat, city.lng], {
          radius: 18,
          color: city.color,
          fillColor: city.color,
          fillOpacity: 0.15,
          weight: 2,
          dashArray: '4 2',
        }).addTo(map);

        // Inner solid circle
        L.circleMarker([city.lat, city.lng], {
          radius: 8,
          color: 'white',
          fillColor: city.color,
          fillOpacity: 1,
          weight: 3,
        }).addTo(map).bindPopup(
          `<div style="text-align:center;font-size:14px;">
            <b style="color:${city.color}">${city.name}</b>
            <span style="background:${city.color};color:white;padding:1px 6px;border-radius:8px;font-size:11px;margin-left:4px;">${city.tag}</span>
            <br/>🚗 방문 간병 서비스
          </div>`
        );
      });
    };
    document.head.appendChild(script);
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '380px',
        borderRadius: '1.25rem',
        zIndex: 0,
      }}
    />
  );
}
