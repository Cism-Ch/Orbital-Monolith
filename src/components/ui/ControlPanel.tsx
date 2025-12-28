"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, Star, Navigation2 } from 'lucide-react';
import { CelestialBody } from '@/types';

interface ControlPanelProps {
    view: 'SOLAR' | 'SKY';
    setView: (view: 'SOLAR' | 'SKY') => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: CelestialBody[];
    onSelectBody: (body: CelestialBody) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
    view,
    setView,
    searchQuery,
    setSearchQuery,
    searchResults,
    onSelectBody,
}) => {
    return (
        <div className="w-full h-full flex flex-col gap-6">
            {/* View Switching Pill */}
            <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-full p-1.5 flex gap-1 shadow-2xl overflow-hidden self-start">
                {[
                    { id: 'SOLAR', label: 'System', icon: Globe },
                    { id: 'SKY', label: 'Deep Sky', icon: Star },
                ].map((item) => {
                    const active = view === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id as 'SOLAR' | 'SKY')}
                            className={`flex items-center gap-3 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${active ? 'text-black' : 'text-[#6c6c7a] hover:text-white'
                                }`}
                        >
                            {active && (
                                <motion.div
                                    layoutId="view-toggle"
                                    className="absolute inset-0 bg-[var(--accent-primary)] rounded-full z-[-1]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <item.icon size={14} />
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {/* Advanced Search Container */}
            <div className="flex-1 monolith-panel !rounded-[2.5rem] p-6 flex flex-col overflow-hidden min-h-[400px]">
                <div className="flex items-center gap-3 mb-6 px-2">
                    <Navigation2 size={16} className="text-[var(--accent-primary)] animate-pulse" />
                    <span className="font-mono text-[9px] uppercase font-black text-white/40 tracking-[0.4em]">Stellar_Search</span>
                </div>

                <div className="relative group mb-6">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#6c6c7a] group-focus-within:text-[var(--accent-primary)] transition-colors" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="IDENT_UNIT::SEARCH"
                        className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-16 pr-6 text-xs text-white placeholder:text-[#6c6c7a] focus:outline-none focus:border-[var(--accent-primary)]/30 focus:bg-white/[0.08] transition-all font-mono font-bold"
                    />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <AnimatePresence mode="popLayout">
                        <div className="space-y-3">
                            {searchResults.map((body, i) => (
                                <motion.button
                                    key={body.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => onSelectBody(body)}
                                    className="w-full flex items-center justify-between p-4 bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl border border-white/5 hover:border-[var(--accent-primary)]/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-[var(--accent-primary)]/20 transition-colors"
                                            style={{ background: `linear-gradient(135deg, ${body.colors[0]}22, transparent)` }}
                                        >
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: body.colors[0], boxShadow: `0 0 10px ${body.colors[0]}` }} />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-white text-xs font-black uppercase tracking-tight group-hover:text-[var(--accent-primary)] transition-colors">{body.name}</span>
                                            <span className="text-[#6c6c7a] text-[8px] font-bold uppercase tracking-widest">{body.type}</span>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-[#6c6c7a] font-mono group-hover:text-[var(--accent-primary)]">
                                        GO_TO »
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </AnimatePresence>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-[#6c6c7a]">
                    <span>UNITS_FOUND: {searchResults.length}</span>
                    <span className="animate-pulse">SYSTEM_STABLE</span>
                </div>
            </div>
        </div>
    );
};
