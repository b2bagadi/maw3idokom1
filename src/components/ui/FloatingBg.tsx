'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function FloatingBg() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const items = [
        { Icon: Calendar, delay: 0, duration: 25, x: [0, 100, -50, 0], y: [0, -50, 100, 0], size: 48 },
        { Icon: Clock, delay: 5, duration: 30, x: [0, -80, 40, 0], y: [0, 60, -40, 0], size: 56 },
        { Icon: CheckCircle, delay: 2, duration: 28, x: [0, 60, -60, 0], y: [0, 40, -80, 0], size: 40 },
        { Icon: Calendar, delay: 10, duration: 35, x: [0, -120, 80, 0], y: [0, -90, 50, 0], size: 64 },
        { Icon: Clock, delay: 8, duration: 32, x: [0, 90, -70, 0], y: [0, -60, 90, 0], size: 36 },
        { Icon: Calendar, delay: 15, duration: 40, x: [0, 150, -100, 0], y: [0, 80, -120, 0], size: 52 },
    ];

    const color = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            {items.map((item, i) => (
                <motion.div
                    key={i}
                    className="absolute"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        color: color,
                    }}
                    animate={{
                        x: item.x,
                        y: item.y,
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: item.duration,
                        repeat: Infinity,
                        ease: "linear",
                        delay: item.delay,
                    }}
                >
                    <item.Icon size={item.size} strokeWidth={1.5} />
                </motion.div>
            ))}
        </div>
    );
}
