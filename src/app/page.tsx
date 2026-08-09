"use client";

/**
 * @file app/page.tsx
 * @description Orbital Monolith — Page d'accueil v3.
 *
 * Design : Space-noir cinématique avec :
 * - Starfield canvas animé (WebGL léger via Canvas 2D)
 * - Titre massif animé avec effet glitch
 * - Stats astronomiques en temps réel
 * - Boot sequence au chargement
 * - Effets grain + scanline + vignette
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    Power, Sparkles, Globe, Star, Telescope,
    Cpu, Wifi, Shield, ChevronRight
} from 'lucide-react';

// ── Données statiques affichées au boot ──────────────────────────────────────

const BOOT_LINES = [
    '> INITIALIZING GAIA_NODE_01...',
    '> STELLAR DATABASE: 54 OBJECTS INDEXED',
    '> THREE.JS ENGINE: WEBGL2 ENABLED',
    '> CONSTELLATION MAPPING: 11 PATTERNS LOADED',
    '> PLANETARY ORBITS: KEPLERIAN DYNAMICS ACTIVE',
    '> SPECTRAL CLASSIFICATION: HARVARD SYSTEM LOADED',
    '> DEEP SPACE PROTOCOLS: ENABLED',
    '> SYSTEM READY.',
];

const METRICS = [
    { label: 'Stars Catalogued',  value: '54',    suffix: 'objects',   icon: Star      },
    { label: 'Constellations',    value: '11',    suffix: 'patterns',  icon: Sparkles  },
    { label: 'Planetary Bodies',  value: '11',    suffix: 'tracked',   icon: Globe     },
    { label: 'Data Sources',      value: '4',     suffix: 'agencies',  icon: Telescope },
];

// ═════════════════════════════════════════════════════════════════════════════
// Composant principal
// ═════════════════════════════════════════════════════════════════════════════

export default function LandingPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [bootLine, setBootLine] = useState(0);
    const [bootDone, setBootDone] = useState(false);
    const [glitchActive, setGlitchActive] = useState(false);

    // ── Starfield canvas animé ─────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Générer les étoiles
        type Star = { x: number; y: number; r: number; a: number; speed: number; blink: number };
        const STAR_COUNT = 600;
        const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.2 + 0.2,
            a: Math.random() * 0.6 + 0.2,
            speed: (Math.random() - 0.5) * 0.03,
            blink: Math.random() * Math.PI * 2,
        }));

        let rafId: number;
        let t = 0;
        const animate = () => {
            rafId = requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Fond radial dégradé
            const grad = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, canvas.width * 0.7
            );
            grad.addColorStop(0, 'rgba(10, 5, 30, 1)');
            grad.addColorStop(1, 'rgba(5, 5, 6, 1)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Nébuleuse d'ambiance
            const nebGrad = ctx.createRadialGradient(
                canvas.width * 0.3, canvas.height * 0.4, 0,
                canvas.width * 0.3, canvas.height * 0.4, 400
            );
            nebGrad.addColorStop(0, 'rgba(77, 238, 234, 0.04)');
            nebGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = nebGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const nebGrad2 = ctx.createRadialGradient(
                canvas.width * 0.7, canvas.height * 0.6, 0,
                canvas.width * 0.7, canvas.height * 0.6, 350
            );
            nebGrad2.addColorStop(0, 'rgba(100, 50, 200, 0.05)');
            nebGrad2.addColorStop(1, 'transparent');
            ctx.fillStyle = nebGrad2;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Étoiles scintillantes
            t += 0.01;
            stars.forEach(s => {
                const alpha = s.a * (0.7 + 0.3 * Math.sin(t * s.speed * 60 + s.blink));
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.fill();
            });

            // Grille RA/Dec subtile
            ctx.strokeStyle = 'rgba(77, 238, 234, 0.025)';
            ctx.lineWidth = 0.5;
            for (let i = 0; i < canvas.width; i += 120) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.height);
                ctx.stroke();
            }
            for (let j = 0; j < canvas.height; j += 120) {
                ctx.beginPath();
                ctx.moveTo(0, j);
                ctx.lineTo(canvas.width, j);
                ctx.stroke();
            }
        };
        animate();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // ── Boot sequence ──────────────────────────────────────────────────────
    useEffect(() => {
        if (bootLine >= BOOT_LINES.length) {
            setTimeout(() => setBootDone(true), 600);
            return;
        }
        const delay = bootLine === 0 ? 400 : 180 + Math.random() * 120;
        const timer = setTimeout(() => setBootLine(prev => prev + 1), delay);
        return () => clearTimeout(timer);
    }, [bootLine]);

    // ── Effet glitch sur le titre ──────────────────────────────────────────
    useEffect(() => {
        if (!bootDone) return;
        const trigger = setInterval(() => {
            if (Math.random() < 0.15) {
                setGlitchActive(true);
                setTimeout(() => setGlitchActive(false), 120 + Math.random() * 80);
            }
        }, 3000);
        return () => clearInterval(trigger);
    }, [bootDone]);

    return (
        <div className="fixed inset-0 bg-[#050506] overflow-hidden font-mono">
            {/* Canvas starfield */}
            <canvas ref={canvasRef} className="absolute inset-0 z-0" />

            {/* Grain + scanline */}
            <div className="grain absolute inset-0 z-10 pointer-events-none" />
            <div className="scanline absolute pointer-events-none z-10" />

            {/* Vignette */}
            <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_250px_rgba(0,0,0,0.8)]" />

            {/* Contenu principal */}
            <div className="relative z-20 h-full flex flex-col items-center justify-center px-8">

                {/* ── Boot sequence terminal ─────────────────────────────────── */}
                <AnimatePresence>
                    {!bootDone && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed top-8 left-8 text-left space-y-1 z-30"
                        >
                            {BOOT_LINES.slice(0, bootLine).map((line, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className={`text-[9px] font-black tracking-wide ${i === bootLine - 1 ? 'text-[var(--accent-primary)]' : 'text-[#6c6c7a]'
                                        }`}
                                >
                                    {line}
                                    {i === bootLine - 1 && bootLine < BOOT_LINES.length && (
                                        <span className="inline-block w-2 h-2.5 bg-[var(--accent-primary)] ml-1 animate-pulse" />
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Contenu principal (post-boot) ─────────────────────────── */}
                <AnimatePresence>
                    {bootDone && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1.5 }}
                            className="flex flex-col items-center gap-16 text-center"
                        >
                            {/* Icône centrale */}
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
                                className="relative"
                            >
                                <div className="w-24 h-24 rounded-[2rem] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center shadow-[0_0_80px_rgba(77,238,234,0.15)]">
                                    <Sparkles size={40} className="text-[var(--accent-primary)]" />
                                </div>
                                {/* Anneaux orbitaux décoratifs */}
                                <div className="absolute -inset-6 border border-[var(--accent-primary)]/10 rounded-full animate-spin-slow" />
                                <div className="absolute -inset-12 border border-[var(--accent-primary)]/5 rounded-full" style={{ animation: 'spin 20s linear infinite reverse' }} />
                            </motion.div>

                            {/* Titre principal */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 1 }}
                                className="px-4"
                            >
                                <h1
                                    className={`text-[clamp(2.75rem,10vw,9rem)] font-black uppercase leading-none tracking-tighter text-white transition-all ${glitchActive ? 'skew-x-2 text-[var(--accent-primary)]' : ''}`}
                                    style={{ textShadow: glitchActive ? '4px 0 0 rgba(255,0,100,0.5), -4px 0 0 rgba(0,100,255,0.5)' : 'none' }}
                                >
                                    Orbital
                                </h1>
                                <h1 className="text-[clamp(2.75rem,10vw,9rem)] font-black uppercase leading-none tracking-tighter text-[var(--accent-primary)]"
                                    style={{ textShadow: '0 0 60px rgba(77, 238, 234, 0.3)' }}
                                >
                                    Monolith
                                </h1>
                                <p className="text-white/40 text-[8px] sm:text-[10px] font-black tracking-[0.3em] sm:tracking-[0.6em] uppercase mt-4 sm:mt-6 max-w-xl mx-auto">
                                    Next-Gen Stellar Dynamics & Deep Space Visualization Engine
                                </p>
                            </motion.div>

                            {/* Métriques */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.0, duration: 0.8 }}
                                className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 w-full max-w-4xl px-2"
                            >
                                {METRICS.map(({ label, value, suffix, icon: Icon }) => (
                                    <div key={label} className="flex flex-col items-center gap-1.5 sm:gap-2 bg-white/5 backdrop-blur-xl border border-white/8 rounded-2xl p-4 sm:px-6 sm:py-5">
                                        <Icon size={16} className="text-[var(--accent-primary)]" />
                                        <p className="text-white text-2xl sm:text-3xl font-black">{value}</p>
                                        <p className="text-[#6c6c7a] text-[7px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-center leading-tight">
                                            {label}<br />
                                            <span className="text-[var(--accent-primary)]">{suffix}</span>
                                        </p>
                                    </div>
                                ))}
                            </motion.div>

                            {/* CTA Buttons */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.3, duration: 0.8 }}
                                className="flex flex-col items-center gap-4 sm:gap-6 w-full max-w-sm px-4"
                            >
                                <Link href="/onboarding" className="w-full">
                                    <motion.button
                                        whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(77, 238, 234, 0.3)' }}
                                        whileTap={{ scale: 0.97 }}
                                        className="w-full flex items-center justify-center gap-3 sm:gap-4 bg-[var(--accent-primary)] text-black font-black text-[9px] uppercase tracking-[0.3em] sm:tracking-[0.4em] px-6 sm:px-12 py-4 sm:py-5 min-h-[48px] rounded-full cursor-pointer"
                                    >
                                        <Power size={14} />
                                        Initialize System_Core
                                        <ChevronRight size={14} />
                                    </motion.button>
                                </Link>

                                <Link href="/dashboard" className="w-full">
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:border-[var(--accent-primary)]/30 text-white/60 hover:text-white font-black text-[8px] uppercase tracking-[0.3em] px-6 sm:px-10 py-3.5 sm:py-4 min-h-[44px] rounded-full backdrop-blur-lg transition-all cursor-pointer"
                                    >
                                        Skip Onboarding
                                        <ChevronRight size={12} />
                                    </motion.button>
                                </Link>

                                {/* Status système */}
                                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[7.5px] sm:text-[8px] text-[#6c6c7a] font-black uppercase tracking-widest pt-2">
                                    <div className="flex items-center gap-2">
                                        <Wifi size={10} className="text-emerald-400" />
                                        <span>Node Online</span>
                                    </div>
                                    <div className="w-px h-3 bg-white/10" />
                                    <div className="flex items-center gap-2">
                                        <Cpu size={10} className="text-[var(--accent-primary)]" />
                                        <span>WebGL2 Ready</span>
                                    </div>
                                    <div className="hidden xs:block w-px h-3 bg-white/10" />
                                    <div className="flex items-center gap-2">
                                        <Shield size={10} className="text-purple-400" />
                                        <span>Secure Channel</span>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Version badge */}
                <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 text-[7px] sm:text-[8px] text-[#6c6c7a] font-black uppercase tracking-widest flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-3">
                    <span>v3.0.0_STABLE</span>
                    <span className="hidden sm:inline w-px h-3 bg-white/10" />
                    <span className="opacity-60 sm:opacity-100">NASA JPL · ESA · Gaia DR3</span>
                </div>
            </div>
        </div>
    );
}
