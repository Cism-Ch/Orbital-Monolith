"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SolarSystemView } from '@/components/view/SolarSystemView';
import { SkyMapView } from '@/components/view/SkyMapView';
import { CelestialBody } from '@/types';
import { SOLAR_SYSTEM } from '@/constants';
import { calculateDistance, searchCelestial } from '@/services/celestialService';
import { Sparkles, Zap } from 'lucide-react';
import { useAccentColors } from '@/hooks/useAccentColors';
import { TelemetryStream } from '@/components/ui/TelemetryStream';
import { AstrometricalBridge } from '@/components/ui/AstrometricalBridge';
import { FocusView } from '@/components/ui/FocusView';
import { ControlPanel } from '@/components/ui/ControlPanel';

// Orientation used on first load and when the reset button is pressed.
const INITIAL_ORIENTATION = { rotation: 0, inclination: 10 };

// Set of IDs that belong to the Solar System view so we can auto-switch when
// a body from the search results or Sky Map is selected.
const SOLAR_SYSTEM_IDS = new Set(SOLAR_SYSTEM.map(b => b.id));

export default function DashboardPage() {
    const [state, setState] = useState({
        view: 'SOLAR' as 'SOLAR' | 'SKY',
        selectedBody: SOLAR_SYSTEM[0],
        searchQuery: '',
        isFocusMode: false,
        orientation: INITIAL_ORIENTATION,
        hoveredBody: null as CelestialBody | null,
        showGrid: false,
        showMilkyWay: true,
    });

    useAccentColors(state.selectedBody, state.hoveredBody);

    const distanceToEarth = useMemo(() =>
        calculateDistance(state.selectedBody, SOLAR_SYSTEM[2]),
        [state.selectedBody]
    );

    // Live search results derived from the current query.
    // Empty query → bodies scoped to the active view for contextual browsing.
    // Non-empty query → global search so cross-view objects are discoverable.
    const searchResults = useMemo(() =>
        searchCelestial(state.searchQuery, state.view),
        [state.searchQuery, state.view]
    );

    const handleSelectBody = useCallback((body: CelestialBody) => {
        // Auto-switch to the view that contains the selected body so the user
        // always lands in the correct visualisation context.
        const targetView: 'SOLAR' | 'SKY' = SOLAR_SYSTEM_IDS.has(body.id) ? 'SOLAR' : 'SKY';
        // Clear search query so ControlPanel shows the contextual list on next interaction.
        setState(prev => ({ ...prev, selectedBody: body, isFocusMode: true, searchQuery: '', view: targetView }));
    }, []);

    return (
        <div className="h-full w-full grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 p-6 overflow-hidden">
            {/* Main Interactive Canvas Section */}
            <div className="relative monolith-panel !bg-black/20 overflow-hidden group">
                {/* HUD Brackets */}
                <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-[var(--accent-primary)]/40 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-[var(--accent-primary)]/40 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-[var(--accent-primary)]/40 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-[var(--accent-primary)]/40 rounded-br-lg" />

                <AnimatePresence mode="wait">
                    {state.view === 'SOLAR' ? (
                        <motion.div
                            key="solar"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full w-full"
                        >
                            <SolarSystemView
                                onSelect={handleSelectBody}
                                onHover={(hoveredBody) => setState(p => ({ ...p, hoveredBody }))}
                                orientation={state.orientation}
                                setOrientation={(o) => setState(p => ({ ...p, orientation: o }))}
                                showGrid={state.showGrid}
                                setShowGrid={(v) => setState(p => ({ ...p, showGrid: v }))}
                                showMilkyWay={state.showMilkyWay}
                                setShowMilkyWay={(v) => setState(p => ({ ...p, showMilkyWay: v }))}
                                defaultOrientation={INITIAL_ORIENTATION}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="sky"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full w-full"
                        >
                            <SkyMapView
                                onSelect={handleSelectBody}
                                onHover={(hoveredBody) => setState(p => ({ ...p, hoveredBody }))}
                                orientation={state.orientation}
                                setOrientation={(o) => setState(p => ({ ...p, orientation: o }))}
                                showGrid={state.showGrid}
                                setShowGrid={(v) => setState(p => ({ ...p, showGrid: v }))}
                                showMilkyWay={state.showMilkyWay}
                                setShowMilkyWay={(v) => setState(p => ({ ...p, showMilkyWay: v }))}
                                defaultOrientation={INITIAL_ORIENTATION}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Overlaid View Controls — compact labels only when ControlPanel is in sidebar */}
                <div className="absolute bottom-6 left-6 z-40 bg-black/40 backdrop-blur-md border border-white/5 p-2 rounded-2xl flex items-center gap-2">
                    <button
                        onClick={() => setState(p => ({ ...p, view: 'SOLAR' }))}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.view === 'SOLAR' ? 'bg-[var(--accent-primary)] text-black' : 'text-white/40 hover:text-white'}`}
                    >
                        System
                    </button>
                    <button
                        onClick={() => setState(p => ({ ...p, view: 'SKY' }))}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.view === 'SKY' ? 'bg-[var(--accent-primary)] text-black' : 'text-white/40 hover:text-white'}`}
                    >
                        Deep_Sky
                    </button>
                </div>
            </div>

            {/* Right Side Data Panels */}
            <aside className="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                {/* View Toggle + Stellar Search */}
                <ControlPanel
                    view={state.view}
                    setView={(v) => setState(p => ({ ...p, view: v }))}
                    searchQuery={state.searchQuery}
                    setSearchQuery={(q) => setState(p => ({ ...p, searchQuery: q }))}
                    searchResults={searchResults}
                    onSelectBody={handleSelectBody}
                />

                {/* Object Analysis Card */}
                <motion.div
                    key={state.selectedBody.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="monolith-panel p-8 !bg-white/[0.02] border-white/5 space-y-8"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-lg shadow-[var(--accent-primary)]/5">
                            <Sparkles size={20} />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-white text-2xl font-black uppercase tracking-tight">{state.selectedBody.name}</h2>
                            <span className="text-[#6c6c7a] text-[10px] font-bold tracking-[0.2em] uppercase">{state.selectedBody.type} // IDENT: {state.selectedBody.scientificName}</span>
                        </div>
                    </div>

                    <p className="text-[#6c6c7a] text-sm leading-relaxed">
                        {state.selectedBody.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl">
                            <span className="text-[9px] uppercase text-[#6c6c7a] font-black block mb-1">Mass</span>
                            <span className="font-mono text-white font-bold">{state.selectedBody.properties.mass}</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl">
                            <span className="text-[9px] uppercase text-[#6c6c7a] font-black block mb-1">
                                {state.selectedBody.properties.period ? 'Orbital Period' : 'Temperature'}
                            </span>
                            <span className="font-mono text-white font-bold">
                                {state.selectedBody.properties.period ?? state.selectedBody.properties.temp}
                            </span>
                        </div>
                    </div>

                    <AstrometricalBridge
                        selectedBody={state.selectedBody}
                        distanceToEarth={distanceToEarth}
                    />

                    <button
                        onClick={() => setState(p => ({ ...p, isFocusMode: true }))}
                        className="w-full bg-[var(--accent-primary)] text-black font-black text-xs py-4 rounded-2xl uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        Initiate Full Scan
                        <Zap size={14} fill="currentColor" />
                    </button>
                </motion.div>

                {/* Real-time Telemetry Section */}
                <div className="flex-1 monolith-panel p-6 !bg-white/[0.02] border-white/5 flex flex-col min-h-[300px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Live_Telemetry</h3>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-ping" />
                            <span className="text-[var(--accent-primary)] text-[9px] font-bold">STREAMING</span>
                        </div>
                    </div>
                    <TelemetryStream />
                </div>
            </aside>

            {/* Focus Overlay */}
            <AnimatePresence>
                {state.isFocusMode && (
                    <FocusView
                        body={state.selectedBody}
                        onClose={() => setState(p => ({ ...p, isFocusMode: false }))}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
