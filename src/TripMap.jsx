import { useEffect, useRef } from 'react';

const STOP_COLORS = {
  start: '#4f8ef7',
  pickup: '#22c55e',
  dropoff: '#f59e0b',
  rest: '#7c3aed',
  sleeper: '#7c3aed',
  break: '#64748b',
  fuel: '#ec4899',
};

const STOP_ICONS = {
  start: '🚛',
  pickup: '📦',
  dropoff: '🏁',
  rest: '🛏',
  sleeper: '🛏',
  break: '⏸',
  fuel: '⛽',
};

export default function TripMap({ stops, routeWaypoints }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    // Load Leaflet CSS dynamically
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    const initMap = async () => {
      const L = (await import('leaflet')).default;

      // Fix default marker icons
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current && mapRef.current) {
        const map = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap contributors © CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
        layerGroupRef.current = L.layerGroup().addTo(map);
      }

      // Clear previous layers
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
      }

      const L2 = L;
      const lg = layerGroupRef.current;

      // Draw route polyline
      if (routeWaypoints && routeWaypoints.length > 1) {
        const validWaypoints = routeWaypoints.filter(wp =>
          Array.isArray(wp) && wp.length === 2 &&
          !isNaN(wp[0]) && !isNaN(wp[1]) &&
          wp[0] !== 0 && wp[1] !== 0
        );

        if (validWaypoints.length > 1) {
          // Outer glow
          L2.polyline(validWaypoints, {
            color: '#4f8ef7',
            weight: 6,
            opacity: 0.15,
          }).addTo(lg);

          // Main route line
          L2.polyline(validWaypoints, {
            color: '#4f8ef7',
            weight: 3,
            opacity: 0.9,
            dashArray: null,
          }).addTo(lg);
        }
      }

      // Add stop markers
      const bounds = [];
      if (stops && stops.length > 0) {
        stops.forEach((stop) => {
          if (!stop.lat || !stop.lon || stop.lat === 0 || stop.lon === 0) return;

          const color = STOP_COLORS[stop.stop_type] || '#8892b0';
          const icon = STOP_ICONS[stop.stop_type] || '📍';
          bounds.push([stop.lat, stop.lon]);

          // Custom circle marker
          const markerIcon = L2.divIcon({
            className: '',
            html: `
              <div style="
                width: 34px; height: 34px;
                background: #0a0d14;
                border: 2.5px solid ${color};
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-size: 14px;
                box-shadow: 0 0 10px ${color}55, 0 2px 8px rgba(0,0,0,0.6);
                cursor: pointer;
                transition: transform 0.2s ease;
              ">${icon}</div>
            `,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          });

          const marker = L2.marker([stop.lat, stop.lon], { icon: markerIcon });

          const popupContent = `
            <div style="
              background: #161b2e;
              border: 1px solid ${color};
              border-radius: 8px;
              padding: 12px;
              min-width: 220px;
              font-family: Inter, sans-serif;
              color: #e8eaf6;
            ">
              <div style="color: ${color}; font-weight: 700; font-size: 13px; margin-bottom: 8px;">
                ${icon} ${stop.name}
              </div>
              <div style="color: #8892b0; font-size: 11px; margin-bottom: 4px;">
                📍 ${stop.location}
              </div>
              <div style="font-size: 11px; color: #8892b0; margin-top: 6px; border-top: 1px solid #252d4a; padding-top: 6px;">
                <div>🕐 Arrive: <span style="color: #e8eaf6">${stop.arrival_time_formatted || 'N/A'}</span></div>
                <div>🕐 Depart: <span style="color: #e8eaf6">${stop.departure_time_formatted || 'N/A'}</span></div>
                <div>⏱ Duration: <span style="color: #e8eaf6">${stop.duration_formatted || 'N/A'}</span></div>
                <div>🛣 Odometer: <span style="color: #e8eaf6">${stop.odometer?.toLocaleString()} mi</span></div>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent, {
            maxWidth: 280,
            className: 'eld-popup',
          });

          marker.addTo(lg);
        });

        // Fit map to bounds
        if (bounds.length > 0) {
          try {
            mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
          } catch (e) {
            if (bounds[0]) mapInstanceRef.current.setView(bounds[0], 5);
          }
        }
      }
    };

    if (stops && stops.length > 0) {
      initMap().catch(console.error);
    }
  }, [stops, routeWaypoints]);

  return (
    <div className="map-container">
      <div ref={mapRef} className="map-element" />
      {/* Map Legend */}
      <div className="map-legend">
        <div className="map-legend-title">STOP TYPES</div>
        {Object.entries(STOP_ICONS).filter(([k]) => k !== 'sleeper').map(([key, icon]) => (
          <div key={key} className="map-legend-item">
            <div className="map-legend-dot" style={{ background: STOP_COLORS[key] }} />
            <span className="map-legend-label">
              {icon} {key.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
