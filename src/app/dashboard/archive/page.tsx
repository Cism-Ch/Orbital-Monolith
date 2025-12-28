"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Search, Filter, BookOpen, ExternalLink, Sparkles, Shield, Compass } from 'lucide-react';

export default function ArchivePage() {
    const [filter, setFilter] = useState('ALL');

    const documents = [
        {
            id: 'sol-guide',
            title: 'Solar System Compendium',
            category: 'SYSTEM',
            intel: 'Comprehensive records of the 8 major planets and their dynamic orbits. Includes historical data on the Late Heavy Bombardment.',
            tags: ['G2 Star', 'Terrestrial', 'Gas Giants']
        },
        {
            id: 'const-myth',
            title: 'Stellar Constellations & Myths',
            category: 'GALAXY',
            intel: 'Analysis of the 88 official celestial zones. Exploration of the Ethiopian Royal Family saga and the Labors of Hercules.',
            tags: ['Mythology', '88 Zones', 'Arabic Influence']
        },
        {
            id: 'gaia-catalog',
            title: 'Gaia Astronomical Catalog v4',
            category: 'TECH',
            intel: 'High-precision 3D mapping of over 1 billion stars in the Milky Way. Documentation on galactic assembly and dark matter distribution.',
            tags: ['GAIA Mission', 'ESA', '1B+ Stars']
        },
        {
            id: 'trappist-1',
            title: 'TRAPPIST-1 Exoplanetary Study',
            category: 'GALAXY',
            intel: 'Detailed analysis of the 7 Earth-sized exoplanets orbiting a cool red dwarf 40 light-years away.',
            tags: ['Exoplanets', 'Habitability', '40LY']
        },
        {
            id: 'nebular-birth',
            title: 'Nebular Hypothesis Records',
            category: 'SYSTEM',
            intel: 'Historical reconstruction of the solar system birth from a collapsing molecular cloud 4.6 billion years ago.',
            tags: ['Accretion', 'Nebula', 'Protoplanetary']
        }
    ];

    const filteredDocs = filter === 'ALL' ? documents : documents.filter(d => d.category === filter);

    return (
        <div className="w-full h-full flex flex-col gap-8 p-4">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Database size={18} className="text-[var(--accent-primary)]" />
                        <span className="font-mono text-[9px] uppercase font-black text-white/40 tracking-[0.4em]">Integrated_Archives</span>
                    </div>
                    <h2 className="text-4xl font-black uppercase text-white tracking-widest">Gaia_Repository</h2>
                </div>

                <div className="flex gap-2 bg-black/40 backdrop-blur-3xl p-1.5 rounded-full border border-white/10 shadow-2xl">
                    {['ALL', 'SYSTEM', 'GALAXY', 'TECH'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${filter === cat
                                    ? 'bg-[var(--accent-primary)] text-black'
                                    : 'text-[#6c6c7a] hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredDocs.map((doc, i) => (
                            <motion.div
                                key={doc.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i * 0.1 }}
                                className="monolith-panel !rounded-[2.5rem] p-8 group hover:border-[var(--accent-primary)]/30 transition-all flex flex-col gap-6"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--accent-primary)] group-hover:scale-110 group-hover:bg-[var(--accent-primary)] group-hover:text-black transition-all">
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                                        <Sparkles size={10} className="text-[var(--accent-primary)]" />
                                        <span className="text-[7px] font-black uppercase text-white/40 tracking-widest">{doc.category}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-[var(--accent-primary)] transition-colors">{doc.title}</h3>
                                    <p className="text-[#6c6c7a] text-xs leading-relaxed font-bold">
                                        {doc.intel}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {doc.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 rounded-full bg-black/40 border border-white/5 text-[7px] font-black uppercase text-white/40 tracking-widest">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Shield size={12} className="text-emerald-500" />
                                        <span className="text-[8px] font-black text-[#6c6c7a] uppercase tracking-widest">Clearance_Lvl_4</span>
                                    </div>
                                    <button className="flex items-center gap-2 text-[9px] font-black uppercase text-[var(--accent-primary)] hover:gap-4 transition-all">
                                        Read_Intel <ExternalLink size={12} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Empty State / Coming Soon */}
                    <div className="monolith-panel !rounded-[2.5rem] p-8 border-dashed border-white/10 flex flex-col items-center justify-center text-center opacity-40">
                        <Compass size={40} className="text-[#6c6c7a] mb-4 animate-spin-slow" />
                        <span className="text-[10px] font-black text-[#6c6c7a] uppercase tracking-[0.3em]">Indexing New Sectors...</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
