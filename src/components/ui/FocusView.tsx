"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Database, Zap, Activity, ShieldCheck, ExternalLink } from 'lucide-react';
import { CelestialBody, CelestialType } from '@/types';
import { TelemetryStream } from './TelemetryStream';
import { CelestialBody3D } from '@/components/view/CelestialBody3D';

interface FocusViewProps {
    body: CelestialBody;
    onClose: () => void;
}

export const FocusView: React.FC<FocusViewProps> = ({ body, onClose }) => {
    // Fermeture par touche Échap
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);


    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6 lg:p-12 font-mono pointer-events-auto"
        >
            {/* Backdrop avec flou et détection de clic pour fermeture */}
            <div className="absolute inset-0 bg-black/75 backdrop-blur-3xl cursor-pointer" onClick={onClose} />

            {/* Immersive Scanning Effect */}
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "100%", opacity: 1 }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-[var(--accent-primary)]/20 z-0 pointer-events-none"
            />

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.05, opacity: 0 }}
                className="relative w-full h-full max-w-7xl monolith-panel !rounded-none sm:!rounded-[2.5rem] lg:!rounded-[3.5rem] !bg-black/95 flex flex-col lg:flex-row overflow-hidden border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]"
            >
                {/* Close Button Capsule */}
                <button
                    onClick={onClose}
                    style={{ top: 'max(1rem, env(safe-area-inset-top, 0px))' }}
                    className="absolute right-4 sm:top-8 sm:right-8 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all z-50 group cursor-pointer touch-target"
                    title="Close Focus View (Esc)"
                    aria-label="Close Focus View"
                >
                    <X size={18} className="group-hover:rotate-90 transition-transform" />
                </button>

                {/* Left Side: Visual & Core Data */}
                <div className="flex-1 p-4 sm:p-8 lg:p-12 flex flex-col gap-6 relative justify-between overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-center lg:items-start">
                        {/* 3D Hologram Viewer */}
                        <div className="flex-shrink-0 relative w-full max-w-[240px] sm:w-[280px] h-[220px] sm:h-[320px] flex items-center justify-center bg-white/[0.01] border border-white/5 rounded-2xl sm:rounded-[3rem] overflow-hidden group shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
                            <div className="absolute inset-x-6 sm:inset-x-8 top-4 sm:top-6 flex items-center justify-between border-b border-white/5 pb-2 text-[8px] font-black text-white/40 uppercase tracking-widest z-20 pointer-events-none">
                                <span>Holo_Projection</span>
                                <span className="text-[var(--accent-primary)] animate-pulse">Scanning...</span>
                            </div>
                            <CelestialBody3D body={body} size={180} showTitle={false} />
                            
                            {/* HUD Brackets inside Hologram */}
                            <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-white/20 rounded-tl-md" />
                            <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-white/20 rounded-tr-md" />
                            <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-white/20 rounded-bl-md" />
                            <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-white/20 rounded-br-md" />
                        </div>

                        {/* Text and Statistics */}
                        <div className="flex-1 flex flex-col gap-5 sm:gap-6 w-full">
                            <div>
                                <motion.h2
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="text-white text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter"
                                >
                                    {body.name}
                                </motion.h2>
                                <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
                                    <span className="text-[var(--accent-primary)] text-[9px] sm:text-[10px] font-black tracking-[0.3em] uppercase">{body.type}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/20 hidden sm:inline" />
                                    <span className="text-[#6c6c7a] text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase">{body.scientificName}</span>
                                </div>
                            </div>

                            <p className="text-[#6c6c7a] text-sm leading-relaxed font-bold">
                                {body.description}
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Masse', value: body.properties.mass, icon: Database },
                                    {
                                        label: body.type === CelestialType.PROBE ? 'Vitesse' : 'Gravité',
                                        value: body.properties.speed || body.properties.gravity,
                                        icon: Zap
                                    },
                                    {
                                        label: body.type === CelestialType.PROBE ? 'Thermique' : 'Température',
                                        value: body.properties.temp,
                                        icon: Activity
                                    },
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

                    {/* Dossier scientifique vérifié & Référence officielle NASA / Gaia */}
                    <div className="p-5 sm:p-6 rounded-[2rem] bg-white/[0.02] border border-white/10 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2.5">
                                <ShieldCheck size={16} className="text-[var(--accent-primary)]" />
                                <h3 className="text-white text-xs font-black uppercase tracking-widest font-mono">
                                    {body.type === CelestialType.PROBE
                                        ? 'NASA Deep Space Network (DSN) Live Telemetry'
                                        : body.type === CelestialType.NEBULA || body.type === CelestialType.DEEP_SKY
                                        ? 'NASA Hubble & ESA Gaia Deep Sky Survey'
                                        : body.type === CelestialType.STAR
                                        ? 'ESA Gaia DR3 & Simbad Archive'
                                        : 'NASA JPL Horizons Certified Factsheet'}
                                </h3>
                            </div>
                            {body.reference && (
                                <a 
                                    href={body.reference} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[8px] font-mono font-bold text-[var(--accent-primary)] hover:underline flex items-center gap-1 uppercase"
                                >
                                    <span>NASA Fact Sheet</span>
                                    <ExternalLink size={10} />
                                </a>
                            )}
                        </div>

                        {body.funFact && (
                            <div className="text-[11px] sm:text-xs text-white/80 leading-relaxed font-mono">
                                <span className="text-[var(--accent-primary)] font-bold">PROPRIÉTÉ NOTABLE :: </span>
                                {body.funFact}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2 border-t border-white/5 text-[8px] sm:text-[8.5px] font-mono text-[#8e8e9f]">
                            {body.properties.period && <span>Période: <strong className="text-white">{body.properties.period}</strong></span>}
                            {body.properties.escapeVelocity && <span>V_esc: <strong className="text-white">{body.properties.escapeVelocity}</strong></span>}
                            {body.properties.atmosphere && <span>Atmosphère: <strong className="text-white">{body.properties.atmosphere}</strong></span>}
                            {body.properties.spectralClass && <span>Spectre: <strong className="text-white">{body.properties.spectralClass}</strong></span>}
                        </div>
                    </div>
                </div>

                {/* Right Side: Telemetry & Live Stream */}
                <div className="w-full lg:w-[450px] bg-white/[0.02] border-t lg:border-t-0 lg:border-l border-white/5 p-4 sm:p-8 lg:p-12 flex flex-col gap-6 sm:gap-8">
                    <div className="space-y-6 flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Live_Stream :: {body.id.toUpperCase()}</h3>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-emerald-400 text-[9px] font-black tracking-widest">STREAMING</span>
                            </div>
                        </div>

                        <div className="flex-1 min-h-[300px] sm:min-h-[400px]">
                            <TelemetryStream body={body} />
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 sm:py-5 min-h-[44px] rounded-full bg-[var(--accent-primary)] text-black font-black uppercase text-xs tracking-[0.25em] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                    >
                        Close Telemetry Link →
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
