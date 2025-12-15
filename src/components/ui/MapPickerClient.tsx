'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerClientProps {
    lat: number;
    lng: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

export default function MapPickerClient({ lat, lng, onLocationSelect }: MapPickerClientProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const defaultCenter: [number, number] = [33.5731, -7.5898]; // Casablanca

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Cleanup function to remove map instance on unmount or re-effect
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Initialize map if not already done
        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current).setView(
                lat && lng ? [lat, lng] : defaultCenter,
                13
            );

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);

            map.on('click', (e: L.LeafletMouseEvent) => {
                const { lat: clickedLat, lng: clickedLng } = e.latlng;
                onLocationSelect(clickedLat, clickedLng);

                // Update marker
                if (markerRef.current) {
                    markerRef.current.setLatLng([clickedLat, clickedLng]);
                } else {
                    markerRef.current = L.marker([clickedLat, clickedLng]).addTo(map);
                }

                map.flyTo([clickedLat, clickedLng], map.getZoom());
            });

            mapInstanceRef.current = map;
        } else {
            // Update view if props change but map exists (except we rely on internal state mostly)
            if (lat && lng) {
                // Only fly to if significantly different to avoid jitter? 
                // Actually relying on parent source of truth is fine.
                const currentCenter = mapInstanceRef.current.getCenter();
                if (Math.abs(currentCenter.lat - lat) > 0.0001 || Math.abs(currentCenter.lng - lng) > 0.0001) {
                    mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom());
                }
            }
        }

        // Sync marker with props
        if (mapInstanceRef.current) {
            if (lat && lng) {
                if (markerRef.current) {
                    markerRef.current.setLatLng([lat, lng]);
                } else {
                    markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
                }
            }
        }

    }, [lat, lng, onLocationSelect]); // Re-run if coordinates change

    return (
        <div
            ref={mapContainerRef}
            className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 relative z-0"
        />
    );
}
