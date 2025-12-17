'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { createRoot } from 'react-dom/client';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

// Fix icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ResultsMapProps {
    businesses: any[];
}

export default function ResultsMap({ businesses }: ResultsMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);

    const defaultCenter: [number, number] = [33.5731, -7.5898];

    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    // Get User Location
    useEffect(() => {
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

    // Initialize Map (idempotent)
    useEffect(() => {
        const container = mapContainerRef.current;
        if (!container) return;

        // If a map already exists, do not recreate it
        if (mapInstanceRef.current) return;

        // Clear any stale Leaflet stamp from Fast Refresh / StrictMode
        if ((container as any)._leaflet_id !== undefined) {
            try {
                delete (container as any)._leaflet_id;
            } catch (e) {
                (container as any)._leaflet_id = undefined;
            }
            container.innerHTML = '';
        }

        try {
            const map = L.map(container).setView(defaultCenter, 13);
            mapInstanceRef.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);
        } catch (error) {
            console.error("Map initialization error:", error);
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
            const latest = mapContainerRef.current;
            if (latest) {
                try {
                    delete (latest as any)._leaflet_id;
                } catch (e) {
                    (latest as any)._leaflet_id = undefined;
                }
                latest.innerHTML = '';
            }
        };
    }, []);

    // Update Markers
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        const validBusinesses = businesses.filter(b => b.lat && b.lng);
        const bounds = L.latLngBounds([]);

        validBusinesses.forEach(business => {
            const marker = L.marker([business.lat, business.lng]).addTo(map);
            bounds.extend([business.lat, business.lng]);

            // Create a container for the popup content
            const popupContainer = document.createElement('div');
            const root = createRoot(popupContainer);

            // Render React component into the popup container
            root.render(
                <div className="min-w-[240px] p-1">
                    <div className="relative h-32 w-full mb-3 rounded-lg overflow-hidden bg-gray-100">
                        {business.logoUrl ? (
                            <img src={business.logoUrl} alt={business.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <span className="text-4xl">🏢</span>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-lg leading-tight">{business.name}</h3>
                        <div className="flex items-center bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs font-bold">
                            {business.averageRating || 'New'} <span className="ml-0.5">★</span>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{business.category?.nameEn || business.category?.name || 'Category'}</p>
                    <p className="text-xs text-gray-400 mb-3 truncate">{business.address}</p>

                    <div className="flex gap-2">
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${business.lat},${business.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                        >
                            <Button size="sm" variant="outline" className="w-full text-xs">Directions</Button>
                        </a>
                        <Link href={`/business/${business.id}`} className="flex-1 block">
                            <Button size="sm" className="w-full text-xs">Book</Button>
                        </Link>
                    </div>
                </div>
            );

            marker.bindPopup(popupContainer);
            markersRef.current.push(marker);
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
                .bindPopup("You are here")
                .addTo(map);
            
            markersRef.current.push(userMarker);
            bounds.extend([userLocation.lat, userLocation.lng]);
        }

        // Fit bounds
        if (validBusinesses.length > 0 || userLocation) {
            if (!bounds.isValid()) return; // Safety check
            map.fitBounds(bounds, { padding: [50, 50] });
        }

    }, [businesses, userLocation]);

    return (
        <div
            ref={mapContainerRef}
            className="h-[600px] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative z-0"
        />
    );
}
