"use client";

/**
 * @file components/ui/SceneControlPanel.tsx
 * @description Panneau de contrôles de scène 3D autonome — Orbital Monolith v3.6.
 *
 * Adapté aux choix d'ergonomie mobile :
 * - Sur Desktop (md:) : Panneau dépliable avec sliders d'inclinaison, rotation et zoom.
 * - Sur Mobile (< md) : Pilote 100% gestuel (1 doigt rotation, 2 doigts pinch zoom).
 *   Les sliders volumineux sont masqués et remplacés par une barre flottante compacte
 *   (top-right sous le header) pour les bascules G, M, constellations, caméra libre et reset.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, RotateCw, RotateCcw, Waypoints, ChevronDown, ChevronUp } from 'lucide-react';
import { useDashboard } from '@/lib/DashboardContext';

export const SceneControlPanel: React.FC = () => {
    const {
        view,
        orientation,
        setOrientation,
        zoom,
        setZoom,
        showGrid,
        setShowGrid,
        showMilkyWay,
        setShowMilkyWay,
        showConstellations,
        setShowConstellations,
        perspectiveMode,
        setPerspectiveMode,
    } = useDashboard();

    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleResetView = useCallback(() => {
        setOrientation({ rotation: 0, inclination: 0 });
        setZoom(0.3);
    }, [setOrientation, setZoom]);

    return (
        <>
            {/* ═══════════════════════════════════════════════════════════════
                VERSION MOBILE (< md) : Barre flottante compacte (Top-Right)
                Complète le pilotage 100% gestuel (drag & pinch zoom) sans encombrer l'écran
            ═══════════════════════════════════════════════════════════════ */}
            <div className="flex md:hidden fixed top-[60px] right-3 z-40 items-center gap-1.5 p-1.5 bg-black/85 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl pointer-events-auto select-none">
                {/* Reset View */}
                <button
                    onClick={handleResetView}
                    title="Reset Camera View"
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer touch-target"
                    aria-label="Reset View"
                >
                    <RotateCcw size={14} />
                </button>

                {/* Free Orbit Camera Toggle */}
                <button
                    onClick={() => setPerspectiveMode(perspectiveMode === 'heliocentric' ? 'free' : 'heliocentric')}
                    title="Toggle Free Orbit Camera"
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 touch-target ${
                        perspectiveMode === 'free'
                            ? 'bg-[var(--accent-primary)] text-black shadow-[0_0_12px_rgba(77,238,234,0.3)]'
                            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                    }`}
                    aria-label="Toggle Free Orbit Camera"
                >
                    <RotateCw size={14} className={perspectiveMode === 'free' ? 'animate-spin-slow' : ''} />
                </button>

                {/* Grid Toggle */}
                <button
                    onClick={() => setShowGrid(!showGrid)}
                    title="Toggle Coordinate Grid"
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black transition-all cursor-pointer active:scale-95 touch-target ${
                        showGrid
                            ? 'bg-[var(--accent-primary)] text-black shadow-[0_0_12px_rgba(77,238,234,0.3)]'
                            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                    }`}
                    aria-label="Toggle Coordinate Grid"
                >
                    G
                </button>

                {/* Milky Way Toggle */}
                <button
                    onClick={() => setShowMilkyWay(!showMilkyWay)}
                    title="Toggle Milky Way"
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black transition-all cursor-pointer active:scale-95 touch-target ${
                        showMilkyWay
                            ? 'bg-[var(--accent-primary)] text-black shadow-[0_0_12px_rgba(77,238,234,0.3)]'
                            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                    }`}
                    aria-label="Toggle Milky Way"
                >
                    M
                </button>

                {/* Constellations Toggle (Sky Mode only) */}
                {view === 'SKY' && (
                    <button
                        onClick={() => setShowConstellations(!showConstellations)}
                        title="Toggle Constellations Lines"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 touch-target ${
                            showConstellations
                                ? 'bg-[var(--accent-primary)] text-black shadow-[0_0_12px_rgba(77,238,234,0.3)]'
                                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                        }`}
                        aria-label="Toggle Constellations Lines"
                    >
                        <Waypoints size={14} />
                    </button>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                VERSION DESKTOP (md:) : Panneau complet avec sliders
            ═══════════════════════════════════════════════════════════════ */}
            <div className="hidden md:flex fixed left-6 bottom-24 z-40 flex-col gap-3 pointer-events-auto select-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-black/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-5 flex flex-col gap-5 shadow-2xl min-w-[210px]"
                >
                    {/* En-tête + Toggles rapides */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Layers size={12} className="text-[var(--accent-primary)]" />
                            <span className="font-mono text-[8px] uppercase tracking-widest text-white font-black">
                                {view === 'SOLAR' ? 'Solar Control' : 'Sky Control'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {/* Toggle Grid */}
                            <button
                                onClick={() => setShowGrid(!showGrid)}
                                title="Toggle Coordinate Grid (G)"
                                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-black transition-all cursor-pointer ${showGrid ? 'bg-[var(--accent-primary)] text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                            >
                                G
                            </button>
                            {/* Toggle Milky Way */}
                            <button
                                onClick={() => setShowMilkyWay(!showMilkyWay)}
                                title="Toggle Milky Way (M)"
                                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-black transition-all cursor-pointer ${showMilkyWay ? 'bg-[var(--accent-primary)] text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                            >
                                M
                            </button>
                            {/* Toggle Constellations (SKY mode) */}
                            {view === 'SKY' && (
                                <button
                                    onClick={() => setShowConstellations(!showConstellations)}
                                    title="Toggle Constellations Lines"
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${showConstellations ? 'bg-[var(--accent-primary)] text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                                >
                                    <Waypoints size={12} />
                                </button>
                            )}
                            {/* Toggle Free Orbit Camera */}
                            <button
                                onClick={() => setPerspectiveMode(perspectiveMode === 'heliocentric' ? 'free' : 'heliocentric')}
                                title="Toggle Free Orbit Camera"
                                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${perspectiveMode === 'free' ? 'bg-[var(--accent-primary)] text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                            >
                                <RotateCw size={12} className={perspectiveMode === 'free' ? 'animate-spin-slow' : ''} />
                            </button>

                            {/* Bouton de repliement / dépliement */}
                            <button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                title={isCollapsed ? "Afficher les contrôles" : "Masquer les contrôles"}
                                className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/5 ml-1 cursor-pointer"
                            >
                                {isCollapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                        </div>
                    </div>

                    {/* Contenu repliable */}
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25 }}
                                className="flex flex-col gap-5 overflow-hidden"
                            >
                                {/* Sliders d'orientation et zoom */}
                                <div className={`space-y-3 ${perspectiveMode === 'free' ? 'opacity-30 pointer-events-none' : ''}`}>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between font-mono text-[7px] uppercase text-[#6c6c7a] font-bold">
                                            <span>Inclination</span>
                                            <span className="text-white">{Math.round(orientation.inclination)}°</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="90"
                                            value={orientation.inclination}
                                            onChange={e => setOrientation({ ...orientation, inclination: +e.target.value })}
                                            className="slider-pill w-full"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between font-mono text-[7px] uppercase text-[#6c6c7a] font-bold">
                                            <span>Rotation</span>
                                            <span className="text-white">{Math.round(orientation.rotation)}°</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-180"
                                            max="180"
                                            value={orientation.rotation}
                                            onChange={e => setOrientation({ ...orientation, rotation: +e.target.value })}
                                            className="slider-pill w-full"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between font-mono text-[7px] uppercase text-[#6c6c7a] font-bold">
                                            <span>Zoom</span>
                                            <span className="text-white">{zoom.toFixed(1)}×</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-0.3"
                                            max="5"
                                            step="0.1"
                                            value={zoom}
                                            onChange={e => setZoom(+e.target.value)}
                                            className="slider-pill w-full"
                                        />
                                    </div>
                                </div>

                                {/* Reset View Button */}
                                <button
                                    onClick={handleResetView}
                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[8px] uppercase font-black tracking-widest transition-all cursor-pointer"
                                >
                                    <RotateCcw size={10} />
                                    Reset View
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </>
    );
};
