"use client"

import * as React from "react"
import { cn } from "@clinic/ui"
import { motion, useAnimation } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { useEffect, useState, useCallback } from "react"

// Assuming the button component from @clinic/ui is exported
import { Button } from "@clinic/ui"

interface MagnetizeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    particleCount?: number;
    attractRadius?: number;
    text?: string;
}

interface Particle {
    id: number;
    x: number;
    y: number;
}

function MagnetizeButton({
    className,
    particleCount = 12,
    attractRadius = 50,
    text = "Book now",
    ...props
}: MagnetizeButtonProps) {
    const [isAttracting, setIsAttracting] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const particlesControl = useAnimation();

    useEffect(() => {
        const newParticles = Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            x: Math.random() * 360 - 180,
            y: Math.random() * 360 - 180,
        }));
        setParticles(newParticles);
    }, [particleCount]);

    const handleInteractionStart = useCallback(async () => {
        setIsAttracting(true);
        await particlesControl.start({
            x: 0,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 50,
                damping: 10,
            },
        });
    }, [particlesControl]);

    const handleInteractionEnd = useCallback(async () => {
        setIsAttracting(false);
        await particlesControl.start((i) => ({
            x: particles[i].x,
            y: particles[i].y,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15,
            },
        }));
    }, [particlesControl, particles]);

    return (
        <Button
            className={cn(
                "min-w-40 relative touch-none overflow-hidden",
                "bg-brand dark:bg-brand",
                "hover:bg-[#0d4d44] dark:hover:bg-[#0d4d44]",
                "text-white dark:text-white",
                "border border-[#0d4d44] dark:border-[#0d4d44]",
                "transition-all duration-300",
                "shadow-lg",
                className
            )}
            onMouseEnter={handleInteractionStart}
            onMouseLeave={handleInteractionEnd}
            onTouchStart={handleInteractionStart}
            onTouchEnd={handleInteractionEnd}
            {...props}
        >
            {particles.map((_, index) => (
                <motion.div
                    key={index}
                    custom={index}
                    initial={{ x: particles[index].x, y: particles[index].y }}
                    animate={particlesControl}
                    className={cn(
                        "absolute w-1.5 h-1.5 rounded-full pointer-events-none",
                        "bg-mint dark:bg-mint",
                        "transition-opacity duration-300",
                        isAttracting ? "opacity-100" : "opacity-0"
                    )}
                />
            ))}
            <span className="relative w-full flex items-center justify-center gap-2 pointer-events-none">
                {text}
                <ArrowRight
                    className={cn(
                        "w-4 h-4 transition-transform duration-300",
                        isAttracting && "translate-x-1"
                    )}
                />
            </span>
        </Button>
    );
}

export { MagnetizeButton }
