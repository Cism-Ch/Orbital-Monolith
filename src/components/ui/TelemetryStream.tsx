"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '@/hooks/useTelemetry';

export const TelemetryStream: React.FC = () => {
    const logs = useTelemetry();

    return (
        <div className="flex flex-col gap-3 font-mono h-full overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
                {logs.slice(-12).map((log) => (
                    <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                            opacity: { duration: 0.2 }
                        }}
                        className="flex items-center gap-4 bg-white/[0.03] border border-white/5 px-5 py-3 rounded-full group hover:bg-white/[0.08] hover:border-[var(--accent-primary)]/20 transition-all"
                    >
                        <span className="text-[9px] font-black text-[#6c6c7a] shrink-0 tracking-tighter">
                            [{log.timestamp}]
                        </span>
                        <div className="flex-1 flex items-center justify-between overflow-hidden">
                            <span className="text-[10px] font-black text-white/80 truncate uppercase tracking-tight group-hover:text-white">
                                {log.event}
                            </span>
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                                <span className="text-[9px] font-bold text-[var(--accent-primary)] shrink-0 opacity-80">
                                    {log.value}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Ambient Bottom Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
        </div>
    );
};
