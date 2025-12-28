"use client";

import React from 'react';
import { Cpu, Zap } from 'lucide-react';

interface FooterProps {
    currentTime: Date;
}

export const Footer: React.FC<FooterProps> = ({ currentTime }) => {
    return (
        <div className="flex w-full h-full items-center justify-between font-mono text-[10px] px-6">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 text-[var(--accent-primary)] dynamic-accent-text font-bold">
                    <Cpu size={14} className="animate-pulse" />
                    <span>TERMINAL_ACTIVE // GAIA_MAP_v2.5</span>
                </div>
                <div className="h-4 w-px bg-white/10 hidden sm:block" />
                <div className="hidden sm:flex items-center gap-2 text-[#6c6c7a]">
                    <Zap size={12} />
                    <span className="uppercase">Core Stability: 99.8%</span>
                </div>
            </div>
            <div className="flex items-center gap-8">
                <div className="hidden md:flex gap-4 text-[#6c6c7a] uppercase font-bold">
                    <span>MAPPED::1.0B STARS</span>
                    <span>LIMIT::V=20</span>
                </div>
                <div className="h-4 w-px bg-white/10 hidden md:block" />
                <div className="text-[#6c6c7a] uppercase">
                    Session: {Math.floor(currentTime.getTime() / 1000 % 10000)}s
                </div>
            </div>
        </div>
    );
};
