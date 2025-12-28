"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, RotateCw, Layers } from 'lucide-react';

interface UniverseContainerProps {
    children?: React.ReactNode;
    containerRef: React.RefObject<HTMLDivElement | null>;
    orientation: { rotation: number; inclination: number };
    setOrientation: (o: { rotation: number; inclination: number }) => void;
    zoom: number;
    setZoom: (z: number | ((prev: number) => number)) => void;
    title: string;
    subtitle: string;
    // New Props for Layer Controls
    showGrid?: boolean;
    setShowGrid?: (v: boolean) => void;
    showMilkyWay?: boolean;
    setShowMilkyWay?: (v: boolean) => void;
}

export const UniverseContainer: React.FC<UniverseContainerProps> = ({
    children,
    containerRef,
    orientation,
    setOrientation,
    zoom,
    setZoom,
    title,
    subtitle,
    showGrid,
    setShowGrid,
    showMilkyWay,
    setShowMilkyWay
}) => {
    const [isImmersion, setIsImmersion] = React.useState(false);
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const isDraggingRef = React.useRef(false);
    const lastMouseRef = React.useRef({ x: 0, y: 0 });

    const toggleImmersion = async () => {
        if (!wrapperRef.current) return;

        if (!isImmersion) {
            try {
                if (wrapperRef.current.requestFullscreen) {
                    await wrapperRef.current.requestFullscreen();
                }
                setIsImmersion(true);
            } catch (err) {
                console.error("Fullscreen error:", err);
                setIsImmersion(true); // Fallback to CSS only
            }
        } else {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
            setIsImmersion(false);
        }
    };

    // Listen for fullscreen change events (e.g. Esc key)
    React.useEffect(() => {
        const handler = () => {
            if (!document.fullscreenElement) setIsImmersion(false);
        };
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // Mouse drag controls for rotation and inclination
    React.useEffect(() => {
        const canvas = containerRef.current;
        if (!canvas) return;

        const handleMouseDown = (e: MouseEvent) => {
            isDraggingRef.current = true;
            lastMouseRef.current = { x: e.clientX, y: e.clientY };
            canvas.style.cursor = 'grabbing';
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return;

            const deltaX = e.clientX - lastMouseRef.current.x;
            const deltaY = e.clientY - lastMouseRef.current.y;

            // Update rotation (horizontal drag)
            const rotationDelta = deltaX * 0.5;
            let newRotation = orientation.rotation + rotationDelta;
            
            // Keep rotation in range -180 to 180
            if (newRotation > 180) newRotation -= 360;
            if (newRotation < -180) newRotation += 360;

            // Update inclination (vertical drag)
            const inclinationDelta = -deltaY * 0.3;
            const newInclination = Math.max(0, Math.min(90, orientation.inclination + inclinationDelta));

            setOrientation({
                rotation: newRotation,
                inclination: newInclination
            });

            lastMouseRef.current = { x: e.clientX, y: e.clientY };
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
            canvas.style.cursor = 'move';
        };

        const handleMouseLeave = () => {
            isDraggingRef.current = false;
            canvas.style.cursor = 'move';
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [containerRef, orientation, setOrientation]);

    return (
        <div
            ref={wrapperRef}
            className={`relative w-full h-full flex items-center justify-center select-none overflow-hidden transition-all duration-700 ${isImmersion ? 'rounded-none' : 'rounded-[3rem] bg-black/20 border border-white/5 shadow-2xl'} group`}
        >
            {/* Background Canvas Container */}
            <div ref={containerRef} className="w-full h-full cursor-move bg-[#020203]" />

            {/* Content Injection */}
            {children}

            {/* HUD Overlay */}
            <AnimatePresence>
                {!isImmersion && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="pointer-events-none absolute inset-0"
                    >
                        {/* HUD Brackets */}
                        <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-[var(--accent-primary)]/40 rounded-tl-2xl" />
                        <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-[var(--accent-primary)]/40 rounded-tr-2xl" />
                        <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-[var(--accent-primary)]/40 rounded-bl-2xl" />
                        <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-[var(--accent-primary)]/40 rounded-br-2xl" />

                        {/* Top Viewport Indicator */}
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 bg-black/80 backdrop-blur-2xl px-10 py-4 rounded-full border border-white/10 shadow-2xl">
                            <span className="font-mono text-[8px] uppercase text-white/40 tracking-[0.4em] font-black">{title}</span>
                            <span className="font-mono text-[12px] text-[var(--accent-primary)] font-black tracking-[0.2em] uppercase">
                                {subtitle}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Right Controls - Optimized for both modes */}
            <div className={`absolute right-8 transition-all duration-500 ${isImmersion ? 'bottom-8' : 'bottom-8'} flex flex-col gap-3 z-30`}>
                <AnimatePresence>
                    {!isImmersion && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-black/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 flex flex-col gap-6 shadow-2xl min-w-[220px]"
                        >
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <Layers size={14} className="text-[var(--accent-primary)]" />
                                    <span className="font-mono text-[9px] uppercase tracking-widest text-white font-black">Matrix Control</span>
                                </div>
                                <div className="flex gap-1.5">
                                    {setShowGrid && (
                                        <button
                                            onClick={() => setShowGrid(!showGrid)}
                                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${showGrid ? 'bg-[var(--accent-primary)] text-black' : 'bg-white/5 text-white/40'}`}
                                        >
                                            <span className="text-[7px] font-black">G</span>
                                        </button>
                                    )}
                                    {setShowMilkyWay && (
                                        <button
                                            onClick={() => setShowMilkyWay(!showMilkyWay)}
                                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${showMilkyWay ? 'bg-[var(--accent-primary)] text-black' : 'bg-white/5 text-white/40'}`}
                                        >
                                            <span className="text-[7px] font-black">M</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between font-mono text-[8px] uppercase text-[#6c6c7a] font-bold">
                                        <span>Inclination</span>
                                        <span className="text-white">{orientation.inclination}°</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="90" value={orientation.inclination}
                                        onChange={(e) => setOrientation({ ...orientation, inclination: parseInt(e.target.value) })}
                                        className="slider-pill"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between font-mono text-[8px] uppercase text-[#6c6c7a] font-bold">
                                        <span>Rotation</span>
                                        <span className="text-white">{orientation.rotation}°</span>
                                    </div>
                                    <input
                                        type="range" min="-180" max="180" value={orientation.rotation}
                                        onChange={(e) => setOrientation({ ...orientation, rotation: parseInt(e.target.value) })}
                                        className="slider-pill"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className={`flex gap-2 items-center ${isImmersion ? 'flex-row' : 'flex-col items-end'}`}>
                    {isImmersion && (
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/10 mr-2">
                            <motion.button
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => setZoom(z => Math.min(Number(z) + 0.3, 8))}
                                className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white"
                            >
                                <Plus size={14} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => setZoom(z => Math.max(Number(z) - 0.3, 0.1))}
                                className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white"
                            >
                                <Minus size={14} />
                            </motion.button>
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={toggleImmersion}
                        className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${isImmersion ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-white/5 text-white/40 border-white/10 hover:text-white'}`}
                        title={isImmersion ? "Exit Immersion" : "Enter Immersion"}
                    >
                        {isImmersion ? <Minus size={20} /> : <Plus size={20} />}
                    </motion.button>

                    {!isImmersion && (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => setZoom(z => Math.min(Number(z) + 0.3, 8))}
                                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[var(--accent-primary)] hover:text-black transition-colors"
                            >
                                <Plus size={18} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => setZoom(z => Math.max(Number(z) - 0.3, 0.1))}
                                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[var(--accent-primary)] hover:text-black transition-colors"
                            >
                                <Minus size={18} />
                            </motion.button>
                            <motion.button
                                whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }}
                                onClick={() => { setOrientation({ rotation: 0, inclination: 45 }); setZoom(1); }}
                                className="w-12 h-12 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-black transition-all"
                            >
                                <RotateCw size={18} />
                            </motion.button>
                        </>
                    )}
                </div>
            </div>

            {/* Vignette Effect */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.7)]" />
        </div>
    );
};
