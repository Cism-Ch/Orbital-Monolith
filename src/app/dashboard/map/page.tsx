"use client";

import React, { useState } from 'react';
import { SkyMapView } from '@/components/view/SkyMapView';
import { FocusView } from '@/components/ui/FocusView';
import { CelestialBody } from '@/types';
import { useAccentColors } from '@/hooks/useAccentColors';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Sparkles } from 'lucide-react';

// Orientation used on first load and when the reset button is pressed.
const INITIAL_ORIENTATION = { rotation: 0, inclination: 30 };

export default function MapPage() {
    const [state, setState] = useState({
        orientation: INITIAL_ORIENTATION,
        showGrid: true,
        showMilkyWay: true,
        selectedBody: null as CelestialBody | null,
        hoveredBody: null as CelestialBody | null
    });

    // Update accent colors to match the selected/hovered celestial body.
    useAccentColors(state.selectedBody, state.hoveredBody);

    return (
        <div className="w-full h-full relative overflow-hidden">
            {/* Main Interactive Map */}
            <SkyMapView
                onSelect={(body) => setState(p => ({ ...p, selectedBody: body }))}
                onHover={(body) => setState(p => ({ ...p, hoveredBody: body }))}
                orientation={state.orientation}
                setOrientation={(o) => setState(p => ({ ...p, orientation: o }))}
                showGrid={state.showGrid}
                setShowGrid={(v) => setState(p => ({ ...p, showGrid: v }))}
                showMilkyWay={state.showMilkyWay}
                setShowMilkyWay={(v) => setState(p => ({ ...p, showMilkyWay: v }))}
                defaultOrientation={INITIAL_ORIENTATION}
            />

            {/* Overlaid Page Meta (Minimalist) */}
            <div className="absolute top-10 left-10 z-50 pointer-events-none">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] backdrop-blur-xl">
                        <Compass size={20} className="animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-white text-xl font-black uppercase tracking-tighter">Sector_Cartography</h1>
                        <p className="text-[#6c6c7a] text-[8px] font-bold uppercase tracking-[0.3em]">Gaia Observational Array // Active</p>
                    </div>
                </div>
            </div>

            {/* Hover Info Tip */}
            <AnimatePresence>
                {state.hoveredBody && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-10 left-10 monolith-panel p-4 flex items-center gap-4 !bg-black/80 backdrop-blur-2xl border-[var(--accent-primary)]/30 z-50"
                    >
                        <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)]">
                            <Sparkles size={14} />
                        </div>
                        <div>
                            <p className="text-white text-[10px] font-black uppercase tracking-widest">{state.hoveredBody.name}</p>
                            <p className="text-[#6c6c7a] text-[8px] font-bold">{state.hoveredBody.scientificName}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Full detail panel — shown when a star or constellation is clicked */}
            <AnimatePresence>
                {state.selectedBody && (
                    <FocusView
                        body={state.selectedBody}
                        onClose={() => setState(p => ({ ...p, selectedBody: null }))}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
