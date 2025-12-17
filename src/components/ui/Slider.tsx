'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';

interface SliderProps {
    min: number;
    max: number;
    step?: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    formatLabel?: (value: number) => string;
    className?: string;
}

export function Slider({
    min,
    max,
    step = 1,
    value,
    onChange,
    formatLabel = (v) => v.toString(),
    className,
}: SliderProps) {
    const [localValue, setLocalValue] = useState<[number, number]>(
        Array.isArray(value) && value.length === 2 ? value : [min, max]
    );
    const range = useRef<HTMLDivElement>(null);

    // Sync with prop changes
    useEffect(() => {
        if (Array.isArray(value) && value.length === 2) {
            setLocalValue(value);
        }
    }, [value]);

    // Defensive check
    const safeValue = (Array.isArray(localValue) && localValue.length === 2)
        ? localValue
        : [min, max];

    const getPercent = useCallback(
        (value: number) => Math.round(((value - min) / (max - min)) * 100),
        [min, max]
    );

    return (
        <div className={cn("w-full pt-6 pb-2", className)}>
            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                {/* Track highlight */}
                <div
                    className="absolute h-full bg-primary-500 rounded-full z-10"
                    style={{
                        left: `${getPercent(safeValue[0])}%`,
                        width: `${getPercent(safeValue[1]) - getPercent(safeValue[0])}%`,
                    }}
                />

                {/* Range Inputs */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={safeValue[0]}
                    onChange={(event) => {
                        const val = Math.min(Number(event.target.value), safeValue[1] - step);
                        const newValue: [number, number] = [val, safeValue[1]];
                        setLocalValue(newValue);
                        onChange(newValue);
                    }}
                    className={cn(
                        "absolute w-full h-full opacity-0 cursor-pointer pointer-events-none z-20",
                        "[&::-webkit-slider-thumb]:pointer-events-auto",
                        "[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5",
                        "[&::-webkit-slider-thumb]:cursor-pointer",
                        "[&::-moz-range-thumb]:pointer-events-auto",
                        "[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5"
                    )}
                    style={{ zIndex: safeValue[0] > max - 100 ? 5 : 3 }}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={safeValue[1]}
                    onChange={(event) => {
                        const val = Math.max(Number(event.target.value), safeValue[0] + step);
                        const newValue: [number, number] = [safeValue[0], val];
                        setLocalValue(newValue);
                        onChange(newValue);
                    }}
                    className={cn(
                        "absolute w-full h-full opacity-0 cursor-pointer pointer-events-none z-20",
                        "[&::-webkit-slider-thumb]:pointer-events-auto",
                        "[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5",
                        "[&::-moz-range-thumb]:pointer-events-auto",
                        "[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5"
                    )}
                />

                {/* Visual Thumbs */}
                <div
                    className="absolute h-5 w-5 -top-1.5 bg-white border-2 border-primary-500 rounded-full shadow-sm z-30 pointer-events-none transition-transform hover:scale-110"
                    style={{ left: `calc(${getPercent(safeValue[0])}% - 10px)` }}
                />
                <div
                    className="absolute h-5 w-5 -top-1.5 bg-white border-2 border-primary-500 rounded-full shadow-sm z-30 pointer-events-none transition-transform hover:scale-110"
                    style={{ left: `calc(${getPercent(safeValue[1])}% - 10px)` }}
                />

                {/* Labels below */}
                <div className="absolute top-4 left-0 text-xs text-gray-500 font-medium">
                    {formatLabel(safeValue[0])}
                </div>
                <div className="absolute top-4 right-0 text-xs text-gray-500 font-medium">
                    {formatLabel(safeValue[1])}
                </div>
            </div>
        </div>
    );
}
