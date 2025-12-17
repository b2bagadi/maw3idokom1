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

    const onSelectRef = useRef(onLocationSelect);

    useEffect(() => {
        onSelectRef.current = onLocationSelect;
    }, [onLocationSelect]);

    // Initialize map once
    useEffect(() => {
        let container = mapContainerRef.current;
        if (!container) return;

        // If Leaflet already stamped this node (Fast Refresh / StrictMode), replace with a fresh clone
        if ((container as any)._leaflet_id != null) {
            try {
                mapInstanceRef.current?.remove();
                markerRef.current = null;
            } catch (e) {
                // noop
            }
            const fresh = container.cloneNode(false) as HTMLDivElement;
            container.parentNode?.replaceChild(fresh, container);
            container = fresh;
        }

        const containerEl = container;


        // Ensure no lingering map instance and clear stale markup
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
            markerRef.current = null;
        }
        (containerEl as any)._leaflet_id = undefined;
        containerEl.innerHTML = '';

        const map = L.map(containerEl).setView(
            lat && lng ? [lat, lng] : defaultCenter,
            13
        );

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        if (lat && lng) {
            markerRef.current = L.marker([lat, lng]).addTo(map);
        }

        map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat: clickedLat, lng: clickedLng } = e.latlng;
            onSelectRef.current(clickedLat, clickedLng);

            // Update marker
            if (markerRef.current) {
                markerRef.current.setLatLng([clickedLat, clickedLng]);
            } else {
                markerRef.current = L.marker([clickedLat, clickedLng]).addTo(map);
            }

            map.flyTo([clickedLat, clickedLng], map.getZoom());
        });

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
            markerRef.current = null;
            (containerEl as any)._leaflet_id = undefined;
            containerEl.innerHTML = '';
        };
    }, []);

    // Keep marker/view in sync when props change
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (lat && lng) {
            map.setView([lat, lng], map.getZoom());
            if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng]);
            } else {
                markerRef.current = L.marker([lat, lng]).addTo(map);
            }
        }
    }, [lat, lng]);

    return (
        <div
            ref={mapContainerRef}
            className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 relative z-0"
        />
    );
}
