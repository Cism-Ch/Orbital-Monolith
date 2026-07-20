"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRightLeft, Radio, Globe2, Target, RotateCcw } from 'lucide-react';
import { CelestialBody } from '@/types';
import { useDashboard } from '@/lib/DashboardContext';
import { calculateDistance } from '@/services/celestialService';

interface AstrometricalBridgeProps {
    selectedBody: CelestialBody;
    distanceToEarth: string;
}

export const AstrometricalBridge: React.FC<AstrometricalBridgeProps> = ({
    selectedBody,
    distanceToEarth,
}) => {
    const {
        isMeasuringMode,
        toggleMeasuringMode,
        distancePoints,
        clearDistancePoints
    } = useDashboard();

    const pointA = distancePoints[0];
    const pointB = distancePoints[1];
    
    // Calculate distance between custom points if both are selected
    const customDistance = pointA && pointB ? calculateDistance(pointA, pointB) : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <Radio size={14} className="text-[var(--accent-primary)] animate-pulse" />
                    <span className="font-mono text-[9px] uppercase font-black text-white/40 tracking-[0.4em]">
                        {isMeasuringMode ? "Laser_Rangefinder" : "Relay_Bridge"}
                    </span>
                </div>
                
                <button
                    onClick={toggleMeasuringMode}
                    className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                        isMeasuringMode
                            ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/30"
                            : "bg-white/5 text-white/40 border-white/10 hover:text-white hover:border-white/20"
                    }`}
                    title="Toggle Interactive Laser Measurement"
                >
                    <Target size={10} />
                    {isMeasuringMode ? "Active" : "Measure"}
                </button>
            </div>

            {isMeasuringMode ? (
                /* Interactive Measurement Mode UI */
                <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        {/* Node A */}
                        <div className="flex flex-col items-center gap-3 flex-1 max-w-[80px]">
                            <div
                                className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
                                    pointA 
                                        ? "bg-white/5 text-white" 
                                        : "bg-black/20 border-dashed border-white/10 text-white/20"
                                }`}
                                style={pointA ? {
                                    backgroundColor: `${pointA.colors[0]}11`,
                                    borderColor: `${pointA.colors[0]}33`,
                                    color: pointA.colors[0]
                                } : {}}
                            >
                                <Radio size={20} className={pointA ? "animate-pulse" : ""} />
                            </div>
                            <span className="text-[8px] font-black uppercase text-white/40 text-center truncate w-full">
                                {pointA ? pointA.name : "Point A"}
                            </span>
                        </div>

                        {/* Connection Laser Line & Info */}
                        <div className="flex-1 flex flex-col items-center gap-2">
                            <div className="flex items-center gap-1 mb-1">
                                {customDistance ? (
                                    <>
                                        <span className="text-[10px] font-mono text-[var(--accent-primary)] font-black tracking-tighter">{customDistance}</span>
                                    </>
                                ) : (
                                    <span className="text-[8px] text-[#6c6c7a] font-bold uppercase tracking-widest animate-pulse">
                                        Select {pointA ? "Point B" : "Point A"}
                                    </span>
                                )}
                            </div>

                            <div className="w-full relative h-1 flex items-center">
                                <div className={`w-full h-px ${customDistance ? "bg-[var(--accent-primary)]/20" : "bg-white/10"}`} />
                                {customDistance && (
                                    <motion.div
                                        animate={{ x: [-20, 100] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                        className="absolute w-4 h-px bg-[var(--accent-primary)] shadow-[0_0_10px_var(--accent-primary)]"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Node B */}
                        <div className="flex flex-col items-center gap-3 flex-1 max-w-[80px]">
                            <div
                                className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
                                    pointB 
                                        ? "bg-white/5 text-white" 
                                        : "bg-black/20 border-dashed border-white/10 text-white/20"
                                }`}
                                style={pointB ? {
                                    backgroundColor: `${pointB.colors[0]}11`,
                                    borderColor: `${pointB.colors[0]}33`,
                                    color: pointB.colors[0]
                                } : {}}
                            >
                                <Radio size={20} className={pointB ? "animate-pulse" : ""} />
                            </div>
                            <span className="text-[8px] font-black uppercase text-white/40 text-center truncate w-full">
                                {pointB ? pointB.name : "Point B"}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {distancePoints.length > 0 && (
                            <button
                                onClick={clearDistancePoints}
                                className="flex-1 bg-white/5 border border-white/5 hover:border-white/10 text-white/60 hover:text-white font-black text-[9px] py-2 rounded-xl uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={10} /> Reset Points
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                /* Standard Earth-to-Planet Connection UI */
                <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        {/* Earth Node */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                <Globe2 size={24} />
                            </div>
                            <span className="text-[9px] font-black uppercase text-white/40">Earth</span>
                        </div>

                        {/* Connection Line & Data */}
                        <div className="flex-1 flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-mono text-white font-black tracking-tighter">{distanceToEarth}</span>
                                <span className="text-[8px] text-[#6c6c7a] font-bold">KM</span>
                            </div>

                            <div className="w-full relative h-1 flex items-center">
                                <div className="w-full h-px bg-white/10" />
                                <motion.div
                                    animate={{ x: [-20, 100] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute w-4 h-px bg-[var(--accent-primary)] shadow-[0_0_10px_var(--accent-primary)]"
                                />
                                <div className="absolute left-1/2 -translate-x-1/2 flex gap-1">
                                    <div className="w-1 h-1 rounded-full bg-white/20" />
                                    <div className="w-1 h-1 rounded-full bg-white/20" />
                                    <div className="w-1 h-1 rounded-full bg-white/20" />
                                </div>
                            </div>

                            <div className="mt-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 flex items-center gap-2">
                                <ArrowRightLeft size={10} className="text-[var(--accent-primary)]" />
                                <span className="text-[8px] font-black text-[#6c6c7a] uppercase tracking-widest">Signal_Delay: 3.4s</span>
                            </div>
                        </div>

                        {/* Target Node */}
                        <div className="flex flex-col items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-full border flex items-center justify-center transition-colors"
                                style={{
                                    backgroundColor: `${selectedBody.colors[0]}11`,
                                    borderColor: `${selectedBody.colors[0]}33`,
                                    color: selectedBody.colors[0]
                                }}
                            >
                                <Radio size={24} />
                            </div>
                            <span className="text-[9px] font-black uppercase text-white/40">{selectedBody.name}</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-2">
                        <div className="flex justify-between text-[8px] font-mono font-black uppercase tracking-widest text-[#6c6c7a]">
                            <span>Vector_Stabilization</span>
                            <span className="text-emerald-500">Locked</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "94%" }}
                                className="h-full bg-[var(--accent-primary)]"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
