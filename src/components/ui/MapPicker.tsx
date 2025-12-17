'use client';

import dynamic from 'next/dynamic';

const MapPickerClient = dynamic(() => import('./MapPickerClient'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />,
});

interface MapPickerProps {
    lat: number;
    lng: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

export default function MapPicker(props: MapPickerProps) {
    return <MapPickerClient {...props} />;
}
