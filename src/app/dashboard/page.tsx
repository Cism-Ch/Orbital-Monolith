"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SolarSystemView } from '@/components/view/SolarSystemView';
import { SkyMapView } from '@/components/view/SkyMapView';
import { CelestialBody } from '@/types';
import { SOLAR_SYSTEM } from '@/constants';
import { calculateDistance, searchCelestial } from '@/services/celestialService';
import { Info, Sparkles, Activity, ShieldCheck, Zap } from 'lucide-react';
import { useClock } from '@/hooks/useClock';
import { useAccentColors } from '@/hooks/useAccentColors';
import { TelemetryStream } from '@/components/ui/TelemetryStream';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { AstrometricalBridge } from '@/components/ui/AstrometricalBridge';
import { FocusView } from '@/components/ui/FocusView';

export default function DashboardPage() {
    const [state, setState] = useState({
        view: 'SOLAR' as 'SOLAR' | 'SKY',
        selectedBody: SOLAR_SYSTEM[0],
        searchQuery: '',
        isFocusMode: false,
        orientation: { rotation: 0, inclination: 45 },
        hoveredBody: null as CelestialBody | null,
        showGrid: false,
        showMilkyWay: true,
    });

    const time = useClock();
    useAccentColors(state.selectedBody, state.hoveredBody);

    const searchResults = useMemo(() =>
        searchCelestial(state.searchQuery),
        [state.searchQuery]
    );

    const distanceToEarth = useMemo(() =>
        calculateDistance(state.selectedBody, SOLAR_SYSTEM[2]),
        [state.selectedBody]
    );

    const handleSelectBody = useCallback((body: CelestialBody) => {
        setState(prev => ({ ...prev, selectedBody: body, isFocusMode: true }));
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
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Overlaid View Controls */}
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
                            <span className="text-[9px] uppercase text-[#6c6c7a] font-black block mb-1">Magnitude</span>
                            <span className="font-mono text-white font-bold">{state.selectedBody.properties.magnitude}</span>
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
