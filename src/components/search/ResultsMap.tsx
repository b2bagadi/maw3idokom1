'use client';

import { useEffect, useRef } from 'react';
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

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Cleanup if map already exists (shouldn't happen with refs check but safety first)
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const map = L.map(mapContainerRef.current).setView(defaultCenter, 13);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
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

        validBusinesses.forEach(business => {
            const marker = L.marker([business.lat, business.lng]).addTo(map);

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

        // Fit bounds
        if (validBusinesses.length > 0) {
            const bounds = L.latLngBounds(validBusinesses.map(b => [b.lat, b.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }

    }, [businesses]);

    return (
        <div
            ref={mapContainerRef}
            className="h-[600px] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative z-0"
        />
    );
}
