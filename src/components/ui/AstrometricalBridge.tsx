"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRightLeft, Radio, Globe2 } from 'lucide-react';
import { CelestialBody } from '@/types';

interface AstrometricalBridgeProps {
    selectedBody: CelestialBody;
    distanceToEarth: string;
}

export const AstrometricalBridge: React.FC<AstrometricalBridgeProps> = ({
    selectedBody,
    distanceToEarth,
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
                <Radio size={14} className="text-[var(--accent-primary)] animate-pulse" />
                <span className="font-mono text-[9px] uppercase font-black text-white/40 tracking-[0.4em]">Relay_Bridge</span>
            </div>

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
    );
};
