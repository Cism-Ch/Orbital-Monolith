"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Eye, Volume2, Shield, Cpu, RefreshCcw } from 'lucide-react';

export default function SettingsPage() {
    const sections = [
        {
            title: 'Visual Core',
            icon: Eye,
            options: [
                { label: 'Hyper-Spatial Rendering', type: 'toggle', value: true },
                { label: 'Ambient Occlusion', type: 'slider', value: 85 },
                { label: 'Interface Opacity', type: 'slider', value: 40 }
            ]
        },
        {
            title: 'Neural Audio',
            icon: Volume2,
            options: [
                { label: 'Cosmic Resonance', type: 'toggle', value: true },
                { label: 'Interface Feedback', type: 'slider', value: 60 }
            ]
        },
        {
            title: 'Access Control',
            icon: Shield,
            options: [
                { label: 'Root Encryption', type: 'toggle', value: false },
                { label: 'Biometric Link', type: 'toggle', value: true }
            ]
        }
    ];

    return (
        <div className="w-full h-full p-4 flex flex-col gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2 px-4">
                <div className="flex items-center gap-3">
                    <Settings size={18} className="text-[var(--accent-primary)]" />
                    <span className="font-mono text-[9px] uppercase font-black text-white/40 tracking-[0.4em]">System_Calibration</span>
                </div>
                <h2 className="text-4xl font-black uppercase text-white tracking-widest">Core_Settings</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 pb-12">
                {sections.map((section, idx) => (
                    <motion.div
                        key={section.title}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="monolith-panel !rounded-[3rem] p-8 space-y-8"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--accent-primary)]">
                                <section.icon size={20} />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">{section.title}</h3>
                        </div>

                        <div className="space-y-6">
                            {section.options.map((opt) => (
                                <div key={opt.label} className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-[#6c6c7a] uppercase tracking-widest">{opt.label}</span>
                                        {opt.type === 'toggle' ? (
                                            <button className={`w-12 h-6 rounded-full p-1 transition-colors ${opt.value ? 'bg-[var(--accent-primary)]' : 'bg-white/10'}`}>
                                                <div className={`w-4 h-4 rounded-full bg-black transition-transform ${opt.value ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </button>
                                        ) : (
                                            <span className="text-[9px] font-mono text-white font-black">{opt.value}%</span>
                                        )}
                                    </div>
                                    {opt.type === 'slider' && (
                                        <input type="range" className="slider-pill" defaultValue={opt.value as number} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="monolith-panel !rounded-[3rem] !bg-[var(--accent-primary)]/5 border-dashed border-[var(--accent-primary)]/20 p-8 flex flex-col items-center justify-center gap-6"
                >
                    <div className="w-16 h-16 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)]">
                        <Cpu size={32} className="animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                        <h4 className="text-white font-black uppercase text-sm tracking-widest">Advanced Diagnostics</h4>
                        <p className="text-[#6c6c7a] text-[9px] font-bold uppercase tracking-widest leading-loose">
                            System health: 98.4%<br />
                            Last calibration: 2.5 hours ago
                        </p>
                    </div>
                    <button className="flex items-center gap-3 px-8 py-3 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase text-white hover:bg-[var(--accent-primary)] hover:text-black transition-all">
                        <RefreshCcw size={14} /> Re-Sync Systems
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
