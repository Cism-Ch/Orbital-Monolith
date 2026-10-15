"use client";

/**
 * @file components/ui/CelestialInspectorPanel.tsx
 * @description Panneau d'inspection astre responsive avec snap points mobiles — Orbital Monolith v3.7.
 * Utilisé par Sector Control (/dashboard) et Star Cartography / Sky Map (/dashboard/map).
 *
 * Sur Mobile (< md) :
 * - Bottom Sheet avec 3 crans discrets :
 *   - 'peek' (~92px) : En-tête compact + mini CTA Scan, laissant >= 75% du viewport 3D visible.
 *   - 'half' (52dvh) : Vue médiane avec propriétés physiques et télémétrie synthétique.
 *   - 'full' (90dvh) : Vue complète avec stream de télémétrie en temps réel.
 * - Poignée tactile avec détection gestuelle (glissement haut/bas) et clics toggle.
 *
 * Sur Desktop (md:) :
 * - Panneau latéral fixe à droite (400px), scrollable naturellement, transparent sur le viewport.
 */

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SOLAR_SYSTEM } from '@/constants';
import { calculateDistance } from '@/services/celestialService';
import { Sparkles, Zap, BarChart3, Thermometer, Gauge, Globe2, ChevronDown, ChevronUp, Lock, Unlock, ChevronsUp, ChevronsDown } from 'lucide-react';
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
    PROBE:        'Sonde Spatiale (DSN)',
    DEEP_SKY:     'Objet Ciel Profond (DSO)',
};

type SnapState = 'peek' | 'half' | 'full';

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
    
    // Snap state pour mobile (< md) : par défaut 'peek' pour maximiser l'interaction 3D
    const [snapState, setSnapState] = useState<SnapState>('peek');

    // Référence tactile pour le swipe sur la poignée
    const touchStartY = useRef<number | null>(null);

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

    // Gestion du swipe vertical sur la poignée mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartY.current === null) return;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;
        touchStartY.current = null;

        if (deltaY < -35) {
            // Glissement vers le haut -> agrandir
            setSnapState(prev => prev === 'peek' ? 'half' : 'full');
        } else if (deltaY > 35) {
            // Glissement vers le bas -> réduire
            setSnapState(prev => prev === 'full' ? 'half' : 'peek');
        }
    };

    const cycleSnapState = useCallback(() => {
        setSnapState(prev => {
            if (prev === 'peek') return 'half';
            if (prev === 'half') return 'full';
            return 'peek';
        });
    }, []);

    // Hauteur dynamique selon snapState sur mobile
    const mobileHeightClass = useMemo(() => {
        switch (snapState) {
            case 'peek': return 'h-[92px]';
            case 'half': return 'h-[52dvh]';
            case 'full': return 'h-[90dvh]';
        }
    }, [snapState]);

    return (
        <div className="h-full w-full flex pointer-events-none">
            {/* Zone gauche : transparente — le viewport 3D du layout est visible */}
            <div className="flex-1 hidden md:block" />

            {/* ═══════════════════════════════════════════════════════════════
                PANNEAU DROIT (DESKTOP) / BOTTOM SHEET MULTI-SNAP (MOBILE)
            ═══════════════════════════════════════════════════════════════ */}
            <aside
                className={`fixed bottom-0 left-0 right-0 z-35 md:z-30 md:static md:w-[400px] flex flex-col md:h-full md:max-h-full overflow-y-auto pointer-events-auto rounded-t-[2.5rem] md:rounded-none border-t border-white/15 md:border-t-0 bg-black/95 md:bg-transparent backdrop-blur-3xl md:backdrop-blur-none shadow-[0_-10px_40px_rgba(0,0,0,0.8)] md:shadow-none transition-all duration-300 ease-out pb-6 md:pb-24 p-3.5 sm:p-5 md:pr-6 ${mobileHeightClass}`}
            >
                {/* ── Poignée tactile & En-tête Peek Mobile (< md) ────────── */}
                <div
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onClick={cycleSnapState}
                    className="md:hidden flex flex-col items-center gap-2 cursor-pointer pb-2 flex-shrink-0 select-none touch-target"
                >
                    <div className="w-12 h-1.5 rounded-full bg-white/25 active:bg-[var(--accent-primary)] transition-colors" />

                    {/* En mode peek, barre résumé concise */}
                    {snapState === 'peek' && (
                        <div className="flex items-center justify-between w-full px-2 pt-1 gap-3">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div
                                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border"
                                    style={{
                                        backgroundColor: `${displayedBody.colors[0]}20`,
                                        borderColor: `${displayedBody.colors[0]}40`,
                                    }}
                                >
                                    <Sparkles size={14} style={{ color: displayedBody.colors[0] }} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-white text-xs font-black uppercase truncate leading-none">
                                            {displayedBody.name}
                                        </h3>
                                        <span className="text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded bg-white/10 text-[var(--accent-primary)] truncate">
                                            {TYPE_LABELS[displayedBody.type] ?? displayedBody.type}
                                        </span>
                                    </div>
                                    <p className="text-[#6c6c7a] text-[8px] font-mono mt-0.5 truncate">
                                        {displayedBody.distance}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedBody(displayedBody);
                                        setIsFocusMode(true);
                                    }}
                                    className="px-3 py-1.5 min-h-[36px] rounded-xl text-[8px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all"
                                    style={{
                                        background: `linear-gradient(135deg, ${displayedBody.colors[0]}, ${displayedBody.colors[1]})`,
                                        color: '#000',
                                    }}
                                >
                                    <Zap size={10} fill="currentColor" />
                                    Scan
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSnapState('half');
                                    }}
                                    className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white"
                                    aria-label="Expand Inspector"
                                >
                                    <ChevronUp size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Contenu détaillé (Visible dès 'half' ou sur Desktop) ─── */}
                <div className={`flex flex-col gap-4 ${snapState === 'peek' ? 'hidden md:flex' : 'flex'}`}>
                    
                    {/* Barre de contrôle du volet sur mobile quand déployé */}
                    <div className="md:hidden flex items-center justify-between border-b border-white/10 pb-2 px-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] font-mono uppercase text-[#6c6c7a] tracking-widest font-black">
                                Inspector Mode :: {snapState.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            {snapState === 'half' ? (
                                <button
                                    onClick={() => setSnapState('full')}
                                    className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white text-[8px] font-mono flex items-center gap-1"
                                >
                                    <ChevronsUp size={12} /> Full
                                </button>
                            ) : (
                                <button
                                    onClick={() => setSnapState('half')}
                                    className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white text-[8px] font-mono flex items-center gap-1"
                                >
                                    <ChevronDown size={12} /> Half
                                </button>
                            )}
                            <button
                                onClick={() => setSnapState('peek')}
                                className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white text-[8px] font-mono flex items-center gap-1"
                            >
                                <ChevronsDown size={12} /> Collapse
                            </button>
                        </div>
                    </div>

                    {/* ── Fiche d'analyse astre sélectionné / survolé ───────── */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={displayedBody.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="monolith-panel p-4 sm:p-6 md:p-7 !bg-white/[0.025] border-white/5 space-y-4 sm:space-y-6"
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
                                    className="text-[8px] font-black uppercase tracking-wider text-white/40 hover:text-white transition-colors underline cursor-pointer touch-target flex items-center"
                                >
                                    {isLocked ? 'Unlock Live Hover' : 'Lock Current'}
                                </button>
                            </div>

                            {/* En-tête astre */}
                            <div className="flex items-start gap-3.5 sm:gap-4">
                                <div
                                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-lg transition-colors duration-300"
                                    style={{
                                        backgroundColor: `${displayedBody.colors[0]}15`,
                                        borderColor: `${displayedBody.colors[0]}30`,
                                        boxShadow: `0 0 20px ${displayedBody.colors[0]}10`,
                                    }}
                                >
                                    <Sparkles size={18} style={{ color: displayedBody.colors[0] }} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-white text-xl sm:text-2xl font-black uppercase tracking-tight leading-none mb-1 truncate">
                                        {displayedBody.name}
                                    </h2>
                                    <p className="text-[#6c6c7a] text-[8px] font-black tracking-[0.25em] uppercase truncate">
                                        {TYPE_LABELS[displayedBody.type] ?? displayedBody.type}
                                        {' // '}
                                        {displayedBody.scientificName}
                                    </p>
                                    <p className="text-[var(--accent-primary)] text-[9px] font-bold mt-1 truncate">
                                        {displayedBody.distance}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-[#6c6c7a] text-[10.5px] sm:text-[11px] leading-relaxed">
                                {displayedBody.description}
                            </p>

                            {/* Grille de propriétés physiques */}
                            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                                {[
                                    { icon: BarChart3,   label: 'Masse',       value: displayedBody.properties.mass    },
                                    { icon: Globe2,      label: 'Rayon',       value: displayedBody.properties.radius  },
                                    { icon: Thermometer, label: 'Température', value: displayedBody.properties.temp    },
                                    { icon: Gauge,       label: 'Gravité',     value: displayedBody.properties.gravity || displayedBody.properties.spectralClass || 'N/A' },
                                ].map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="bg-white/5 p-3 sm:p-3.5 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                                            <Icon size={10} className="text-[var(--accent-primary)] flex-shrink-0" />
                                            <span className="text-[7px] uppercase text-[#6c6c7a] font-black tracking-widest truncate">{label}</span>
                                        </div>
                                        <span className="font-mono text-white font-bold text-[8.5px] sm:text-[9px] leading-snug truncate block">{value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Propriétés secondaires */}
                            {(displayedBody.properties.period || displayedBody.properties.moons || displayedBody.properties.atmosphere || displayedBody.properties.luminosity || displayedBody.funFact) && (
                                <div className="space-y-2 pt-2 border-t border-white/5">
                                    {displayedBody.properties.period && (
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-[7px] uppercase text-[#6c6c7a] font-black tracking-widest">Période Orbitale</span>
                                            <span className="text-white text-[9px] font-bold">{displayedBody.properties.period}</span>
                                        </div>
                                    )}
                                    {displayedBody.properties.luminosity && (
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-[7px] uppercase text-[#6c6c7a] font-black tracking-widest">Luminosité</span>
                                            <span className="text-white text-[9px] font-bold">{displayedBody.properties.luminosity}</span>
                                        </div>
                                    )}
                                    {displayedBody.properties.moons && (
                                        <div className="flex justify-between items-center text-xs">
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
                                className="w-full flex items-center justify-center gap-3 py-3.5 sm:py-4 min-h-[44px] rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer touch-target"
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
                        className="monolith-panel p-4 sm:p-6 !bg-white/[0.02] border-white/5 flex flex-col transition-all"
                    >
                        <div
                            onClick={() => setIsTelemetryCollapsed(!isTelemetryCollapsed)}
                            className="flex items-center justify-between cursor-pointer select-none min-h-[44px]"
                        >
                            <div className="flex items-center gap-3">
                                <h3 className="text-white text-[9px] font-black uppercase tracking-[0.3em]">Live_Telemetry</h3>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-ping" />
                                    <span className="text-[var(--accent-primary)] text-[8px] font-bold">STREAMING</span>
                                </div>
                            </div>

                            <button className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors touch-target flex items-center justify-center">
                                {isTelemetryCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            </button>
                        </div>

                        <AnimatePresence>
                            {!isTelemetryCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-3 sm:mt-5 overflow-hidden"
                                >
                                    <TelemetryStream body={displayedBody} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
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
