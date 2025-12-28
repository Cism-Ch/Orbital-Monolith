"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, Power } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="fixed inset-0 bg-[#050506] flex flex-col items-center justify-center font-mono overflow-hidden">
            <div className="grain" />
            <div className="scanline" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="relative z-10 text-center space-y-12"
            >
                <div>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="w-20 h-20 bg-[var(--accent-primary)] rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-[0_0_50px_rgba(var(--accent-primary-rgb),0.2)]"
                    >
                        <Sparkles className="text-black" size={40} />
                    </motion.div>
                    <h1 className="text-white text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4">
                        Orbital<br /><span className="text-[var(--accent-primary)]">Monolith</span>
                    </h1>
                    <p className="text-[#6c6c7a] text-[10px] md:text-xs font-bold tracking-[0.5em] uppercase px-4">
                        Next-Gen Stellar Dynamics & Visualization Engine
                    </p>
                </div>

                <div className="flex flex-col items-center gap-6">
                    <Link href="/onboarding">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-white/5 border border-white/10 hover:border-[var(--accent-primary)]/50 px-12 py-5 rounded-full text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-4 group transition-all backdrop-blur-md"
                        >
                            <Power size={16} className="text-[var(--accent-primary)] group-hover:animate-pulse" />
                            Initialize System_Core
                        </motion.button>
                    </Link>

                    <div className="flex items-center gap-3 text-[9px] text-[#6c6c7a] font-bold">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        GAIA_NODE_01 :: READY FOR BOOT
                    </div>
                </div>
            </motion.div>

            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--accent-primary)]/5 blur-[150px] rounded-full" />
                <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full" />
                <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-purple-500/5 blur-[120px] rounded-full" />
            </div>

            {/* Version Badge */}
            <div className="absolute bottom-8 left-8 text-[9px] text-[#6c6c7a] font-black uppercase tracking-widest flex items-center gap-4">
                <span>v2.5.0_ALPHA</span>
                <span className="w-px h-3 bg-white/10" />
                <span>DEEP_SPACE_PROTOCOLS_ENABLED</span>
            </div>
        </div>
    );
}
