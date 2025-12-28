"use client";

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Database, Zap, Activity, ShieldCheck, Globe, Star } from 'lucide-react';
import { CelestialBody } from '@/types';
import { TelemetryStream } from './TelemetryStream';

interface FocusViewProps {
    body: CelestialBody;
    onClose: () => void;
}

export const FocusView: React.FC<FocusViewProps> = ({ body, onClose }) => {
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12 font-mono"
        >
            {/* Backdrop with extreme blur */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl" onClick={onClose} />

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
                    className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all z-50 group"
                >
                    <X size={20} className="group-hover:rotate-90 transition-transform" />
                </button>

                {/* Left Side: Visual & Core Data */}
                <div className="flex-1 p-12 flex flex-col gap-8 relative">
                    <div className="flex items-center gap-6">
                        <motion.div
                            initial={{ rotate: -180, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            className="w-20 h-20 rounded-[2rem] bg-[var(--accent-primary)] flex items-center justify-center shadow-[0_0_40px_rgba(var(--accent-primary-rgb),0.3)]"
                        >
                            <Globe className="text-black" size={40} />
                        </motion.div>
                        <div>
                            <motion.h2
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="text-white text-5xl font-black uppercase tracking-tighter"
                            >
                                {body.name}
                            </motion.h2>
                            <div className="flex items-center gap-3">
                                <span className="text-[var(--accent-primary)] text-[10px] font-black tracking-[0.4em] uppercase">{body.type}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                <span className="text-[#6c6c7a] text-[10px] font-bold tracking-[0.2em] uppercase">{body.scientificName}</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-[#6c6c7a] text-lg leading-relaxed max-w-2xl font-bold">
                        {body.description}
                    </p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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
                                transition={{ delay: 0.4 + i * 0.1 }}
                                className="bg-white/[0.03] border border-white/5 p-6 rounded-[2rem] space-y-2 hover:border-[var(--accent-primary)]/20 transition-colors"
                            >
                                <stat.icon size={16} className="text-[#6c6c7a]" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase text-[#6c6c7a] tracking-widest">{stat.label}</span>
                                    <span className="text-white font-black text-sm font-mono">{stat.value}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Scientific Archive Section (Integrated from Docs) */}
                    <div className="mt-8 p-8 rounded-[3rem] bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 space-y-4">
                        <div className="flex items-center gap-3">
                            <ShieldCheck size={18} className="text-[var(--accent-primary)]" />
                            <h3 className="text-white text-xs font-black uppercase tracking-widest">Gaia_Archive_Extraction [v4.0]</h3>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed italic">
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
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-red-500 text-[9px] font-black tracking-widest">ENCRYPTED</span>
                            </div>
                        </div>

                        <div className="flex-1 min-h-[400px]">
                            <TelemetryStream />
                        </div>
                    </div>

                    <button className="w-full py-6 rounded-full bg-[var(--accent-primary)] text-black font-black uppercase text-xs tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_40px_rgba(var(--accent-primary-rgb),0.3)]">
                        Establish Data Link →
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
