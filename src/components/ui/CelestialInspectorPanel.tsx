"use client";

/**
 * @file components/ui/CelestialInspectorPanel.tsx
 * @description Panneau d'inspection astre réutilisable — Orbital Monolith v3.3.
 * Utilisé par Sector Control (/dashboard) et Star Cartography / Sky Map (/dashboard/map).
 */

import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SOLAR_SYSTEM } from '@/constants';
import { calculateDistance } from '@/services/celestialService';
import { Sparkles, Zap, BarChart3, Thermometer, Gauge, Globe2, ChevronDown, ChevronUp, Lock, Unlock } from 'lucide-react';
import { useAccentColors } from '@/hooks/useAccentColors';
import { TelemetryStream } from '@/components/ui/TelemetryStream';
import { AstrometricalBridge } from '@/components/ui/AstrometricalBridge';
import { FocusView } from '@/components/ui/FocusView';
import { useDashboard } from '@/lib/DashboardContext';

/** Mappe les types de corps célestes vers des labels UI */
const TYPE_LABELS: Record<string, string> = {
    PLANET:       'Planète',
    DWARF_PLANET: 'Planète Naine',
    STAR:         'Étoile',
    BINARY_STAR:  'Système Binaire',
    SYSTEM:       'Système Stellaire',
    GALAXY:       'Galaxie',
    NEBULA:       'Nébuleuse',
    ASTEROID:     'Astéroïde',
};

export const CelestialInspectorPanel: React.FC = () => {
    const {
        selectedBody,
        setSelectedBody,
        isFocusMode,
        setIsFocusMode,
        hoveredBody,
        isLocked,
        toggleLock,
    } = useDashboard();

    const [isTelemetryCollapsed, setIsTelemetryCollapsed] = useState(false);

    // Si verrouillé -> afficher l'astre sélectionné. Sinon -> afficher le survol s'il existe, sinon l'astre sélectionné.
    const displayedBody = (isLocked && selectedBody) ? selectedBody : (hoveredBody || selectedBody);

    // Met à jour les couleurs d'accent CSS selon l'astre affiché
    useAccentColors(displayedBody, hoveredBody);

    // Distance de l'astre à la Terre
    const distanceToEarth = useMemo(() => {
        if (!displayedBody) return '0';
        if (displayedBody.type === 'STAR' && displayedBody.distance.includes('al')) {
            return displayedBody.distance;
        }
        return calculateDistance(displayedBody, SOLAR_SYSTEM[3]);
    }, [displayedBody]);

    return (
        <div className="h-full w-full flex pointer-events-none">
            {/* Zone gauche : transparente — le viewport 3D du layout est visible */}
            <div className="flex-1" />

            {/* Panneau droit : données et télémétrie */}
            <aside className="w-[400px] flex flex-col gap-5 p-4 overflow-y-auto pointer-events-auto pr-6 pb-24 z-30">

                {/* ── Fiche d'analyse astre sélectionné / survolé ───────────── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={displayedBody.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="monolith-panel p-7 !bg-white/[0.025] border-white/5 space-y-6"
                    >
                        {/* En-tête statut verrouillage/survol */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <div className="flex items-center gap-2">
                                {isLocked ? (
                                    <span className="flex items-center gap-1.5 text-[8px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                        <Lock size={9} /> Locked Target
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-[8px] font-black text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                                        <Unlock size={9} /> Live Hover Preview
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => toggleLock()}
                                className="text-[8px] font-black uppercase tracking-wider text-white/40 hover:text-white transition-colors underline cursor-pointer"
                            >
                                {isLocked ? 'Unlock Live Hover' : 'Lock Current'}
                            </button>
                        </div>

                        {/* En-tête astre */}
                        <div className="flex items-start gap-4">
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-lg transition-colors duration-300"
                                style={{
                                    backgroundColor: `${displayedBody.colors[0]}15`,
                                    borderColor: `${displayedBody.colors[0]}30`,
                                    boxShadow: `0 0 20px ${displayedBody.colors[0]}10`,
                                }}
                            >
                                <Sparkles size={18} style={{ color: displayedBody.colors[0] }} />
                            </div>
                            <div>
                                <h2 className="text-white text-2xl font-black uppercase tracking-tight leading-none mb-1">
                                    {displayedBody.name}
                                </h2>
                                <p className="text-[#6c6c7a] text-[8px] font-black tracking-[0.25em] uppercase">
                                    {TYPE_LABELS[displayedBody.type] ?? displayedBody.type}
                                    {' // '}
                                    {displayedBody.scientificName}
                                </p>
                                <p className="text-[var(--accent-primary)] text-[9px] font-bold mt-1">
                                    {displayedBody.distance}
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-[#6c6c7a] text-[11px] leading-relaxed">
                            {displayedBody.description}
                        </p>

                        {/* Grille de propriétés physiques */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { icon: BarChart3,   label: 'Masse',       value: displayedBody.properties.mass    },
                                { icon: Globe2,      label: 'Rayon',       value: displayedBody.properties.radius  },
                                { icon: Thermometer, label: 'Température', value: displayedBody.properties.temp    },
                                { icon: Gauge,       label: 'Gravité',     value: displayedBody.properties.gravity || displayedBody.properties.spectralClass || 'N/A' },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="bg-white/5 p-3.5 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Icon size={10} className="text-[var(--accent-primary)]" />
                                        <span className="text-[7px] uppercase text-[#6c6c7a] font-black tracking-widest">{label}</span>
                                    </div>
                                    <span className="font-mono text-white font-bold text-[9px] leading-snug">{value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Propriétés secondaires */}
                        {(displayedBody.properties.period || displayedBody.properties.moons || displayedBody.properties.atmosphere || displayedBody.properties.luminosity || displayedBody.funFact) && (
                            <div className="space-y-2 pt-2 border-t border-white/5">
                                {displayedBody.properties.period && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[7px] uppercase text-[#6c6c7a] font-black tracking-widest">Période Orbitale</span>
                                        <span className="text-white text-[9px] font-bold">{displayedBody.properties.period}</span>
                                    </div>
                                )}
                                {displayedBody.properties.luminosity && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[7px] uppercase text-[#6c6c7a] font-black tracking-widest">Luminosité</span>
                                        <span className="text-white text-[9px] font-bold">{displayedBody.properties.luminosity}</span>
                                    </div>
                                )}
                                {displayedBody.properties.moons && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[7px] uppercase text-[#6c6c7a] font-black tracking-widest">Lunes</span>
                                        <span className="text-white text-[9px] font-bold">{displayedBody.properties.moons}</span>
                                    </div>
                                )}
                                {displayedBody.properties.atmosphere && (
                                    <div>
                                        <span className="text-[7px] uppercase text-[#6c6c7a] font-black tracking-widest block mb-1">Atmosphère</span>
                                        <p className="text-white text-[9px] font-bold leading-snug">{displayedBody.properties.atmosphere}</p>
                                    </div>
                                )}
                                {displayedBody.funFact && (
                                    <div className="bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/15 rounded-xl p-3 mt-2">
                                        <span className="text-[var(--accent-primary)] text-[7px] font-black uppercase tracking-widest block mb-1">⚡ Fun Fact</span>
                                        <p className="text-white/70 text-[9px] leading-relaxed">{displayedBody.funFact}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pont astrométrique */}
                        <AstrometricalBridge selectedBody={displayedBody} distanceToEarth={distanceToEarth} />

                        {/* CTA Full Scan */}
                        <button
                            onClick={() => {
                                setSelectedBody(displayedBody);
                                setIsFocusMode(true);
                            }}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                            style={{
                                background: `linear-gradient(135deg, ${displayedBody.colors[0]}, ${displayedBody.colors[1]})`,
                                color: '#000',
                            }}
                        >
                            Initiate Full Scan
                            <Zap size={13} fill="currentColor" />
                        </button>
                    </motion.div>
                </AnimatePresence>

                {/* ── Flux de télémétrie live (rétractable) ───────────────── */}
                <motion.div
                    layout
                    className="monolith-panel p-6 !bg-white/[0.02] border-white/5 flex flex-col transition-all"
                >
                    <div
                        onClick={() => setIsTelemetryCollapsed(!isTelemetryCollapsed)}
                        className="flex items-center justify-between cursor-pointer select-none"
                    >
                        <div className="flex items-center gap-3">
                            <h3 className="text-white text-[9px] font-black uppercase tracking-[0.3em]">Live_Telemetry</h3>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-ping" />
                                <span className="text-[var(--accent-primary)] text-[8px] font-bold">STREAMING</span>
                            </div>
                        </div>

                        <button className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                            {isTelemetryCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        </button>
                    </div>

                    <AnimatePresence>
                        {!isTelemetryCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-5 overflow-hidden"
                            >
                                <TelemetryStream body={displayedBody} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </aside>

            {/* ── Overlay Focus View (modale plein écran) ───────────────────── */}
            <AnimatePresence>
                {isFocusMode && (
                    <FocusView body={selectedBody} onClose={() => setIsFocusMode(false)} />
                )}
            </AnimatePresence>
        </div>
    );
};
