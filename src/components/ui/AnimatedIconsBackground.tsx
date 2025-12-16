"use client";

import { Calendar, Car, MapPin, Scissors, Sparkles, Stethoscope } from "lucide-react";
import clsx from "clsx";

interface AnimatedIconsBackgroundProps {
    className?: string;
    iconClassName?: string;
    intensity?: "subtle" | "normal";
}

const icons = [
    { Icon: Scissors, className: "top-10 left-12 animate-float", delay: "animate-delay-100" },
    { Icon: Stethoscope, className: "top-24 right-16 animate-float", delay: "animate-delay-200" },
    { Icon: Car, className: "bottom-16 left-24 animate-float", delay: "animate-delay-300" },
    { Icon: Sparkles, className: "bottom-10 right-10 animate-float", delay: "animate-delay-400" },
    { Icon: Calendar, className: "top-1/2 left-8 animate-float", delay: "animate-delay-200" },
    { Icon: MapPin, className: "top-1/3 right-1/4 animate-float", delay: "animate-delay-100" },
];

export function AnimatedIconsBackground({ className, iconClassName, intensity = "normal" }: AnimatedIconsBackgroundProps) {
    const baseIconClass = intensity === "subtle"
        ? "text-primary-600/35 dark:text-primary-200/45 drop-shadow-sm"
        : "text-primary-600/55 dark:text-primary-100/70 drop-shadow-md";

    return (
        <div className={clsx("absolute inset-0 pointer-events-none overflow-hidden", className)}>
            {/* soft glows */}
            <div className="absolute -top-24 -left-24 h-72 w-72 bg-primary-500/15 dark:bg-primary-500/20 blur-3xl" />
            <div className="absolute top-1/3 right-10 h-64 w-64 bg-primary-300/15 dark:bg-primary-200/20 blur-3xl" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-72 w-72 bg-secondary-400/10 dark:bg-secondary-300/15 blur-3xl" />

            {icons.map(({ Icon, className: pos, delay }, idx) => (
                <Icon
                    key={idx}
                    size={42}
                    className={clsx(
                        "absolute transition-opacity duration-300", pos, delay,
                        baseIconClass,
                        iconClassName
                    )}
                />
            ))}
        </div>
    );
}

export default AnimatedIconsBackground;
