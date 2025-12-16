'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import { useClientTranslation } from '@/i18n/client';

// Fix Leaflet default icon issue
if (typeof window !== 'undefined') {
  // Only delete if it exists to avoid errors in strict mode
  if ((L.Icon.Default.prototype as any)._getIconUrl) {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
  }
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/marker-icon-2x.png',
    iconUrl: '/marker-icon.png',
    shadowUrl: '/marker-shadow.png',
  });
}

interface Business {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  address: string;
  logoUrl?: string;
}

function createBusinessIcon(business: Business) {
  const initial = business.name?.charAt(0)?.toUpperCase() || 'B';
  const logoHtml = business.logoUrl
    ? `<img src="${business.logoUrl}" alt="${business.name}" style="width:100%;height:100%;object-fit:cover;" />`
    : `<span style="font-weight:700;color:#111;font-size:14px;">${initial}</span>`;

  return L.divIcon({
    className: '',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
        <div style="width:56px;height:56px;border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,0.18);border:1px solid #e5e7eb;display:flex;align-items:center;justify-content:center;">
          ${logoHtml}
        </div>
        <div style="width:14px;height:14px;border-radius:9999px;background:#16a34a;border:2px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.25);"></div>
      </div>
    `,
    iconSize: [56, 74],
    iconAnchor: [28, 74],
    popupAnchor: [0, -70],
  });
}

export default function QuickFindMap({ businesses, selectedBusiness }: { businesses: Business[], selectedBusiness?: Business | null }) {
  const { t } = useClientTranslation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  
  // Default to Casablanca/Morocco center if no businesses
  const defaultCenter: [number, number] = [33.5731, -7.5898]; 
  
  const [isClient, setIsClient] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    setIsClient(true);
    // Get User Location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Error getting location:', error);
        }
      );
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!isClient) return;

    const container = mapContainerRef.current;
    if (!container) return;

    // Clear any stale Leaflet state on this container (Critical Fix for "Map container is already initialized")
    if ((container as any)._leaflet_id != null) {
      try {
        (container as any)._leaflet_id = undefined;
      } catch (e) {
        // noop
      }
      container.innerHTML = '';
    }

    // Ensure no lingering map instance
    if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
           console.warn('Map remove error', e);
        }
        mapInstanceRef.current = null;
        markersRef.current = [];
    }

    try {
      const map = L.map(container).setView(defaultCenter, 11);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
    } catch (error) {
       console.error("Error initializing map:", error);
       // If initialization fails, try to recover or just stop
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
      }
      if (container) {
        (container as any)._leaflet_id = undefined;
        container.innerHTML = '';
      }
    };
  }, [isClient]); // Run once when client-side confirmed

  // Update Markers when businesses change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const validBusinesses = businesses.filter(b => b.lat && b.lng);

    if (validBusinesses.length === 0) {
        map.setView(defaultCenter, 11);
        return;
    }

    // Add new markers
    const bounds = L.latLngBounds([]);
    
    validBusinesses.forEach(business => {
        if (!business.lat || !business.lng) return;
        
        const marker = L.marker([business.lat, business.lng], {
            icon: createBusinessIcon(business)
        })
        .bindPopup(`
            <div class="flex flex-col gap-2 min-w-[150px]">
              <div class="text-sm font-semibold">${business.name}</div>
              <div class="text-xs text-gray-500">${business.address}</div>
                <a 
                  href="https://www.google.com/maps/dir/?api=1&destination=${business.lat},${business.lng}" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  style="text-decoration: none;"
                >
                  ${t('quickFind.getDirections')}
                </a>

            </div>
        `)
        .addTo(map);
        
        markersRef.current.push(marker);
        bounds.extend([business.lat, business.lng]);
    });

    // Add User Location Marker
    if (userLocation) {
        const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `<div style="
                width: 20px;
                height: 20px;
                background-color: #3b82f6;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
            "></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
        });

          const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
              .bindPopup(t('quickFind.youAreHere'))
              .addTo(map);

        
        markersRef.current.push(userMarker);
        bounds.extend([userLocation.lat, userLocation.lng]);
    }

    // Fit bounds if we have markers or user location
    if (validBusinesses.length > 0 || userLocation) {
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }

  }, [businesses, isClient, userLocation]); // Run when businesses change or user location found

  if (!isClient) {
    return <div className="h-[300px] w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50" />;
  }

  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden shadow-inner border border-gray-200 relative z-0">
      <div 
        ref={mapContainerRef} 
        style={{ height: '100%', width: '100%' }} 
      />
    </div>
  );
}
