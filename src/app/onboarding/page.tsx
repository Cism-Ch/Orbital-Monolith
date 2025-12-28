"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Globe, Satellite, Terminal, ShieldCheck, Activity } from 'lucide-react';

export default function OnboardingPage() {
    const [step, setStep] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const router = useRouter();

    const sequence = [
        "Initializing GAIA_CORE_v2.5...",
        "Establishing Orbital Link...",
        "Syncing Sidereal Time...",
        "Mapping Local Group Stars...",
        "Accessing Monolith Database...",
        "Finalizing System Boot..."
    ];

    useEffect(() => {
        if (step < sequence.length) {
            const timer = setTimeout(() => {
                setLogs(prev => [...prev, sequence[step]]);
                setStep(s => s + 1);
            }, 600);
            return () => clearTimeout(timer);
        } else {
            const finalTimer = setTimeout(() => {
                router.push('/dashboard');
            }, 1000);
            return () => clearTimeout(finalTimer);
        }
    }, [step, router]);

    return (
        <div className="fixed inset-0 bg-[#050506] flex flex-col items-center justify-center font-mono overflow-hidden">
            <div className="grain opacity-20" />
            <div className="scanline" />

            <AnimatePresence mode="wait">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 flex flex-col items-center"
                >
                    {/* Visual Core */}
                    <div className="mb-12 relative">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="w-32 h-32 rounded-full border border-[var(--accent-primary)]/20 flex items-center justify-center"
                        >
                            <Globe size={48} className="text-[var(--accent-primary)] opacity-40" />
                        </motion.div>
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-[-20px] rounded-full border border-dashed border-[var(--accent-primary)]/10"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Satellite size={24} className="text-[var(--accent-primary)] animate-pulse" />
                        </div>
                    </div>

                    {/* Progress Text */}
                    <div className="text-center space-y-4">
                        <motion.h1
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-[var(--accent-primary)] text-xs tracking-[0.8em] uppercase font-black"
                        >
                            Orbital Monolith // System Boot
                        </motion.h1>

                        {/* Terminal Logs */}
                        <div className="h-32 w-64 md:w-80 bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-1 overflow-hidden backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2 text-[8px] text-[#6c6c7a]">
                                <Terminal size={10} />
                                <span>SYSTEM_CONSOLE_v2.5</span>
                            </div>
                            <div className="overflow-y-auto space-y-1 custom-scrollbar">
                                {logs.map((log, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-[9px] text-white/60 flex items-center gap-2"
                                    >
                                        <span className="text-[var(--accent-primary)] opacity-50">{">"}</span>
                                        {log}
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex gap-4 justify-center pt-4">
                            <div className="flex items-center gap-2 text-[8px] text-[#6c6c7a] uppercase font-bold">
                                <ShieldCheck size={10} className="text-emerald-500" />
                                <span>Sec_Link: OK</span>
                            </div>
                            <div className="flex items-center gap-2 text-[8px] text-[#6c6c7a] uppercase font-bold">
                                <Activity size={10} className="text-[var(--accent-primary)]" />
                                <span>Latency: 12ms</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Background Aesthetics */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--accent-primary)]/5 blur-[120px] rounded-full animate-pulse" />
            </div>
        </div>
    );
}
