"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Satellite } from 'lucide-react';

interface LoaderProps {
    onComplete: () => void;
}

export const Loader: React.FC<LoaderProps> = ({ onComplete }) => {
    React.useEffect(() => {
        const timer = setTimeout(onComplete, 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            key="loader"
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#050506] z-[1000] flex flex-col items-center justify-center font-mono text-[var(--accent-primary)]"
        >
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-8 relative">
                <Globe size={64} className="animate-spin-slow opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Satellite size={32} />
                </div>
            </motion.div>
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} className="text-xs tracking-[0.8em] uppercase font-bold">
                Mapping Gaia Database...
            </motion.div>
        </motion.div>
    );
};
