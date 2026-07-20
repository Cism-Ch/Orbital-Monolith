"use client";

import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Database, Zap, Activity, ShieldCheck } from 'lucide-react';
import { CelestialBody } from '@/types';
import { TelemetryStream } from './TelemetryStream';
import { CelestialBody3D } from '@/components/view/CelestialBody3D';

interface FocusViewProps {
    body: CelestialBody;
    onClose: () => void;
}

export const FocusView: React.FC<FocusViewProps> = ({ body, onClose }) => {
    // Écoute de la touche Échap pour fermer la vue Focus
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Simulated extraction of scientific data from PDF context
    const scientificIntel = useMemo(() => {
        const intelMap: Record<string, string> = {
            'sun': "The anchor of the solar system, containing 99.86% of its total mass. A G2-type main-sequence star generating energy through nuclear fusion in its core. Current stability: STABLE.",
            'mercury': "The smallest planet in the system, only slightly larger than Earth's Moon. Positioned as the first planet from the Sun, it has no significant atmosphere.",
            'venus': "Notable for its retrograde rotation (spinning backward compared to most planets). It possesses a thick, toxic atmosphere reflecting high solar radiation.",
            'earth': "The only known planet to maintain stable bodies of liquid water. Home world and primary reference point for orbital dynamics.",
            'mars': "Marks the outer boundary of the inner terrestrial system. Known for its iron-oxide rich surface and thin atmosphere.",
            'jupiter': "The largest planet in the system, 318 times heavier than Earth. A gas giant mostly composed of hydrogen and helium.",
            'saturn': "Famous for its spectacular ring system composed of countless particles of ice and dust. Second largest gas giant.",
            'uranus': "An ice giant with a unique orbital tilt, effectively spinning on its side. Composed primarily of water, ammonia, and methane ices.",
            'neptune': "The most distant major planet, orbiting in the cold reaches of the system. Characterized by supersonic winds and icy composition.",
            'ceres': "The largest object in the Asteroid Belt and the only dwarf planet located in the inner Solar System."
        };
        return intelMap[body.id] || "Academic record currently undergoing encryption. Check Gaia Archive for full dataset update.";
    }, [body.id]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12 font-mono pointer-events-auto"
        >
            {/* Backdrop avec flou et détection de clic pour fermeture */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl cursor-pointer" onClick={onClose} />

            {/* Immersive Scanning Effect */}
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "100%", opacity: 1 }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-[var(--accent-primary)]/20 z-0 pointer-events-none"
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.1, opacity: 0 }}
                className="relative w-full h-full max-w-7xl monolith-panel !rounded-[4rem] !bg-black/80 flex flex-col lg:flex-row overflow-hidden border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]"
            >
                {/* Close Button Capsule */}
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/20 transition-all z-50 group cursor-pointer"
                    title="Close Focus View (Esc)"
                >
                    <X size={20} className="group-hover:rotate-90 transition-transform" />
                </button>

                {/* Left Side: Visual & Core Data */}
                <div className="flex-1 p-12 flex flex-col gap-6 relative justify-between overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
                        {/* 3D Hologram Viewer */}
                        <div className="flex-shrink-0 relative w-[280px] h-[320px] flex items-center justify-center bg-white/[0.01] border border-white/5 rounded-[3rem] overflow-hidden group shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
                            <div className="absolute inset-x-8 top-6 flex items-center justify-between border-b border-white/5 pb-2 text-[8px] font-black text-white/40 uppercase tracking-widest z-20 pointer-events-none">
                                <span>Holo_Projection</span>
                                <span className="text-[var(--accent-primary)] animate-pulse">Scanning...</span>
                            </div>
                            <CelestialBody3D body={body} size={240} showTitle={false} />
                            
                            {/* HUD Brackets inside Hologram */}
                            <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-white/20 rounded-tl-md" />
                            <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-white/20 rounded-tr-md" />
                            <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-white/20 rounded-bl-md" />
                            <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-white/20 rounded-br-md" />
                        </div>

                        {/* Text and Statistics */}
                        <div className="flex-1 flex flex-col gap-6 w-full">
                            <div>
                                <motion.h2
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="text-white text-4xl lg:text-5xl font-black uppercase tracking-tighter"
                                >
                                    {body.name}
                                </motion.h2>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-[var(--accent-primary)] text-[10px] font-black tracking-[0.4em] uppercase">{body.type}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                    <span className="text-[#6c6c7a] text-[10px] font-bold tracking-[0.2em] uppercase">{body.scientificName}</span>
                                </div>
                            </div>

                            <p className="text-[#6c6c7a] text-sm leading-relaxed font-bold">
                                {body.description}
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Mass', value: body.properties.mass, icon: Database },
                                    { label: 'Gravity', value: body.properties.gravity, icon: Zap },
                                    { label: 'Temperature', value: body.properties.temp, icon: Activity },
                                    { label: 'Distance', value: body.distance || '0 KM', icon: Sparkles }
                                ].map((stat, i) => (
                                    <motion.div
                                        key={stat.label}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + i * 0.1 }}
                                        className="bg-white/[0.03] border border-white/5 p-4 rounded-[1.5rem] space-y-1.5 hover:border-[var(--accent-primary)]/20 transition-colors"
                                    >
                                        <stat.icon size={14} className="text-[#6c6c7a]" />
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black uppercase text-[#6c6c7a] tracking-widest">{stat.label}</span>
                                            <span className="text-white font-black text-xs font-mono">{stat.value}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Scientific Archive Section (Integrated from Docs) */}
                    <div className="p-6 rounded-[2rem] bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 space-y-3">
                        <div className="flex items-center gap-3">
                            <ShieldCheck size={16} className="text-[var(--accent-primary)]" />
                            <h3 className="text-white text-xs font-black uppercase tracking-widest">Gaia_Archive_Extraction [v4.0]</h3>
                        </div>
                        <p className="text-white/60 text-xs leading-relaxed italic">
                            "{scientificIntel}"
                        </p>
                    </div>
                </div>

                {/* Right Side: Telemetry & Live Stream */}
                <div className="w-full lg:w-[450px] bg-white/[0.02] border-l border-white/5 p-12 flex flex-col gap-8">
                    <div className="space-y-6 flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Live_Stream :: {body.id.toUpperCase()}</h3>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-emerald-400 text-[9px] font-black tracking-widest">STREAMING</span>
                            </div>
                        </div>

                        <div className="flex-1 min-h-[400px]">
                            <TelemetryStream body={body} />
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-6 rounded-full bg-[var(--accent-primary)] text-black font-black uppercase text-xs tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_40px_rgba(var(--accent-primary-rgb),0.3)] cursor-pointer"
                    >
                        Close Telemetry Link →
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
