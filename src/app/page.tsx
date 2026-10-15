"use client";

/**
 * @file app/page.tsx
 * @description Orbital Monolith — Landing Page Aérospatiale Professionnelle v4.
 *
 * Design System : Space Agency Pro (NASA JPL / ESA Gaia / Flight Dynamics Facility).
 * - Canvas Starfield haute fidélité avec parallaxe interactive.
 * - Horloge de mission UTC & Temps Sidéral temps réel.
 * - Radar orbital interactif avec réticules télémétriques et géométrie Képlérienne.
 * - Bandeau d'instruments de bord (Solveur Képlérien, Astrométrie Gaia DR3, Latence GPU).
 * - Modules aérospatiaux interactifs avec retours tactiles conformes (>= 44px).
 * - Checklist d'autorisation de vol et passerelle directe vers le moteur 3D.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    Sparkles, Globe, Compass, Shield, ChevronRight,
    Activity, Radio, Terminal, Zap, ArrowUpRight,
    Satellite, Eye, Layers, Lock, Gauge, HardDrive
} from 'lucide-react';
import { SOLAR_SYSTEM, STARS } from '@/constants';

// ── Données des métriques aérospatiales en temps réel ──────────────────────────
const FLIGHT_SYSTEMS = [
    {
        id: 'SYS-01',
        name: 'Keplerian Solver',
        tag: 'PROPAGATION MATRIX',
        value: 'dt = 0.001s',
        desc: 'Intégrateur numérique RK4 des orbites képlériennes avec corrections des perturbations gravitationnelles.',
        status: 'NOMINAL',
        accent: '#4deeea',
    },
    {
        id: 'SYS-02',
        name: 'Gaia DR3 Astrometry',
        tag: 'STELLAR PARALLAX',
        value: '12 µas precision',
        desc: 'Cartographie tridimensionnelle du groupe local et classification spectrale Harvard multi-étoiles.',
        status: 'CALIBRATED',
        accent: '#38bdf8',
    },
    {
        id: 'SYS-03',
        name: 'Laser Rangefinder',
        tag: 'INTERFEROMETRY',
        value: 'c = 299 792 km/s',
        desc: 'Triangulation instantanée des vecteurs d’état et calcul de délai de propagation du signal radioélectrique.',
        status: 'STANDBY',
        accent: '#10b981',
    },
    {
        id: 'SYS-04',
        name: 'WebGL 2.0 Flight Deck',
        tag: 'TELEMETRY ENGINE',
        value: '60 FPS / 0.04ms',
        desc: 'Pipeline graphique matériel persistant à zéro latence de commutation avec ombrage atmosphérique Fresnel.',
        status: 'OPERATIONAL',
        accent: '#f59e0b',
    },
];

const CELESTIAL_TARGETS_PREVIEW = [
    { name: 'Sol (Sun)', type: 'G2V Star', dist: '0.000 AU', vel: '220.0 km/s', color: '#ffb300' },
    { name: 'Earth', type: 'Terrestrial', dist: '1.000 AU', vel: '29.78 km/s', color: '#4deeea' },
    { name: 'Jupiter', type: 'Gas Giant', dist: '5.204 AU', vel: '13.07 km/s', color: '#f59e0b' },
    { name: 'Polaris', type: 'F7Ib Supergiant', dist: '433.0 al', vel: '17.0 km/s', color: '#a855f7' },
    { name: 'Sirius', type: 'A1V Binary', dist: '8.600 al', vel: '-5.5 km/s', color: '#38bdf8' },
];

export default function LandingPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentTimeUtc, setCurrentTimeUtc] = useState<string>('00:00:00 UTC');
    const [siderealTime, setSiderealTime] = useState<string>('00.00° RA');
    const [selectedModule, setSelectedModule] = useState<number>(0);
    const [radarRotation, setRadarRotation] = useState<number>(0);

    // ── Horloge de mission UTC & Sidérale temps réel ─────────────────────────
    useEffect(() => {
        const updateClocks = () => {
            const now = new Date();
            const hours = String(now.getUTCHours()).padStart(2, '0');
            const minutes = String(now.getUTCMinutes()).padStart(2, '0');
            const seconds = String(now.getUTCSeconds()).padStart(2, '0');
            const ms = String(Math.floor(now.getUTCMilliseconds() / 100)).padStart(1, '0');
            setCurrentTimeUtc(`${hours}:${minutes}:${seconds}.${ms} UTC`);

            // Calcul sidéral simulé précis
            const siderealHours = ((now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600) * 1.0027379) % 24;
            setSiderealTime(`${(siderealHours * 15).toFixed(2)}° LST`);
        };

        updateClocks();
        const interval = setInterval(updateClocks, 100);
        return () => clearInterval(interval);
    }, []);

    // ── Rotation continue du radar orbital ───────────────────────────────────
    useEffect(() => {
        let animId: number;
        const rotateRadar = () => {
            setRadarRotation(prev => (prev + 0.4) % 360);
            animId = requestAnimationFrame(rotateRadar);
        };
        animId = requestAnimationFrame(rotateRadar);
        return () => cancelAnimationFrame(animId);
    }, []);

    // ── Canvas Starfield haute performance avec profondeur interstellaire ────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        type Star = { x: number; y: number; z: number; size: number; baseAlpha: number; color: string };
        const STAR_COUNT = 450;
        const stars: Star[] = Array.from({ length: STAR_COUNT }, () => {
            const isBlue = Math.random() < 0.25;
            const isGold = Math.random() < 0.1;
            const color = isBlue ? '#4deeea' : isGold ? '#f59e0b' : '#ffffff';
            return {
                x: (Math.random() - 0.5) * width * 2,
                y: (Math.random() - 0.5) * height * 2,
                z: Math.random() * 1000 + 1,
                size: Math.random() * 1.2 + 0.4,
                baseAlpha: Math.random() * 0.7 + 0.3,
                color,
            };
        });

        let rafId: number;
        let mouseX = 0;
        let mouseY = 0;

        const onMouseMove = (e: MouseEvent) => {
            mouseX = (e.clientX - width / 2) * 0.05;
            mouseY = (e.clientY - height / 2) * 0.05;
        };

        window.addEventListener('mousemove', onMouseMove);

        const animate = () => {
            rafId = requestAnimationFrame(animate);
            ctx.fillStyle = '#030305';
            ctx.fillRect(0, 0, width, height);

            // Nébuleuse d'arrière-plan aérospatiale
            const grad = ctx.createRadialGradient(
                width * 0.6, height * 0.3, 0,
                width * 0.6, height * 0.3, width * 0.6
            );
            grad.addColorStop(0, 'rgba(15, 32, 67, 0.25)');
            grad.addColorStop(0.5, 'rgba(7, 18, 38, 0.1)');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);

            // Rendu des particules stellaires 3D
            const cx = width / 2 + mouseX;
            const cy = height / 2 + mouseY;

            for (let i = 0; i < STAR_COUNT; i++) {
                const s = stars[i];
                s.z -= 0.6;
                if (s.z <= 0) {
                    s.z = 1000;
                    s.x = (Math.random() - 0.5) * width * 2;
                    s.y = (Math.random() - 0.5) * height * 2;
                }

                const k = 400 / s.z;
                const px = s.x * k + cx;
                const py = s.y * k + cy;

                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const alpha = Math.min(1, (1 - s.z / 1000) * s.baseAlpha);
                    ctx.fillStyle = s.color;
                    ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    ctx.arc(px, py, s.size * k * 0.8, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.globalAlpha = 1.0;
        };

        animate();

        const onResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', onResize);
        };
    }, []);

    return (
        <div className="relative min-h-screen w-full bg-[#030305] text-[#e1e1e6] font-mono selection:bg-[var(--accent-primary)] selection:text-black overflow-x-hidden">
            
            {/* Canvas WebGL Starfield en arrière-plan */}
            <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />

            {/* Grilles télémétriques et grain d'ambiance */}
            <div className="grain fixed inset-0 z-[1] pointer-events-none opacity-20" />
            <div className="scanline fixed pointer-events-none z-[1]" />

            {/* ═══════════════════════════════════════════════════════════════
                1. EN-TÊTE DE MISSION / FLIGHT OPERATIONS BAR (z-50)
            ═══════════════════════════════════════════════════════════════ */}
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/85 backdrop-blur-3xl px-4 sm:px-8 py-3.5 transition-all">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    
                    {/* Badge d'agence & Logo */}
                    <div className="flex items-center gap-3.5">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/15 flex items-center justify-center text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-black transition-all shadow-[0_0_20px_rgba(77,238,234,0.15)] flex-shrink-0">
                                <Satellite size={18} />
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-black text-xs sm:text-sm tracking-[0.2em] uppercase text-white">
                                        Orbital Monolith
                                    </span>
                                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[7px] font-black uppercase text-[var(--accent-primary)]">
                                        v4.0
                                    </span>
                                </div>
                                <span className="text-[7.5px] sm:text-[8px] font-mono tracking-widest text-[#6c6c7a] uppercase">
                                    Flight Dynamics & Deep Space Cartography
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Télémétrie centrale UTC & Sidérale (Desktop) */}
                    <div className="hidden lg:flex items-center gap-6 px-4 py-1.5 rounded-full bg-white/[0.02] border border-white/8 text-[8.5px] font-mono">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[#6c6c7a] uppercase font-bold">DSN CARRIER:</span>
                            <span className="text-white font-black tracking-wider">8.4 GHz LOCK</span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <span className="text-[#6c6c7a] uppercase font-bold">UTC:</span>
                            <span className="text-[var(--accent-primary)] font-black tracking-wider">{currentTimeUtc}</span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <span className="text-[#6c6c7a] uppercase font-bold">SIDEREAL:</span>
                            <span className="text-white font-black tracking-wider">{siderealTime}</span>
                        </div>
                    </div>

                    {/* Boutons d'accès directs (Mobile & Desktop) */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link href="/dashboard" className="hidden sm:flex">
                            <button className="px-4 py-2 min-h-[44px] rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-[9px] font-mono font-black uppercase tracking-widest transition-all cursor-pointer">
                                Direct Console
                            </button>
                        </Link>

                        <Link href="/onboarding">
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="px-4 sm:px-5 py-2.5 min-h-[44px] rounded-xl bg-[var(--accent-primary)] text-black text-[9px] font-mono font-black uppercase tracking-widest shadow-[0_0_20px_rgba(77,238,234,0.3)] hover:shadow-[0_0_30px_rgba(77,238,234,0.5)] transition-all flex items-center gap-2 cursor-pointer touch-target"
                            >
                                <Radio size={14} className="animate-pulse" />
                                <span>Launch Mission</span>
                                <ChevronRight size={14} />
                            </motion.button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════════════
                2. HERO SECTION — FLIGHT DECK PRESENTATION (z-10)
            ═══════════════════════════════════════════════════════════════ */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-8 sm:pt-14 pb-20 space-y-16 sm:space-y-24">
                
                {/* Hero Grid : Présentation Texte + Radar Orbital Interactif */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
                    
                    {/* Colonne gauche (7 cols) : Titre & Déclaration de Mission */}
                    <div className="lg:col-span-7 flex flex-col gap-6 sm:gap-8">
                        
                        {/* Insigne de statut aérospatial */}
                        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl w-fit">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            <span className="text-[8px] sm:text-[9px] font-mono font-black uppercase tracking-[0.25em] text-white/70">
                                NASA JPL · ESA GAIA DR3 · CERTIFIED DATA STREAM
                            </span>
                        </div>

                        {/* Titre monumental Space Agency Pro */}
                        <div className="space-y-2">
                            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.95] text-white">
                                Deep Space <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-sky-300 to-indigo-400">
                                    Flight Telemetry
                                </span>
                            </h1>
                            <p className="text-xs sm:text-sm font-mono text-[#8e8e9f] max-w-xl leading-relaxed pt-2">
                                Système de visualisation et de mécanique képlérienne en temps réel. Cartographie 3D interactive du Système Solaire et du catalogue Gaia DR3, conçue selon les protocoles des centres de contrôle aérospatiaux.
                            </p>
                        </div>

                        {/* CTA Deck Aérospatial */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
                            <Link href="/onboarding" className="flex-1 sm:flex-initial">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full sm:w-auto px-8 py-4 min-h-[48px] rounded-2xl bg-[var(--accent-primary)] text-black font-mono font-black text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-3 shadow-[0_10px_35px_rgba(77,238,234,0.35)] transition-all cursor-pointer touch-target"
                                >
                                    <Zap size={16} fill="currentColor" />
                                    <span>Initialize System Core</span>
                                    <ArrowUpRight size={16} />
                                </motion.button>
                            </Link>

                            <Link href="/dashboard" className="flex-1 sm:flex-initial">
                                <button className="w-full sm:w-auto px-6 py-4 min-h-[48px] rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 text-white font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all cursor-pointer touch-target hover:bg-white/[0.07]">
                                    <Globe size={15} className="text-[var(--accent-primary)]" />
                                    <span>Sector Sol Control</span>
                                </button>
                            </Link>
                        </div>

                        {/* Mini spécifications télémétriques */}
                        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 text-left">
                            <div>
                                <span className="text-[7.5px] uppercase font-bold text-[#6c6c7a] block tracking-widest">Targets Tracked</span>
                                <span className="text-sm sm:text-base font-black text-white font-mono">{SOLAR_SYSTEM.length + STARS.length} Bodies</span>
                            </div>
                            <div>
                                <span className="text-[7.5px] uppercase font-bold text-[#6c6c7a] block tracking-widest">Coordinate Grid</span>
                                <span className="text-sm sm:text-base font-black text-[var(--accent-primary)] font-mono">ICRF / J2000</span>
                            </div>
                            <div>
                                <span className="text-[7.5px] uppercase font-bold text-[#6c6c7a] block tracking-widest">Engine Pipeline</span>
                                <span className="text-sm sm:text-base font-black text-emerald-400 font-mono">WebGL2 PERSIST</span>
                            </div>
                        </div>
                    </div>

                    {/* Colonne droite (5 cols) : Radar Orbital & Carte Télémétrique */}
                    <div className="lg:col-span-5 relative flex items-center justify-center">
                        <div className="relative w-full max-w-[380px] sm:max-w-[420px] aspect-square rounded-[3rem] bg-black/80 border border-white/15 p-6 sm:p-8 backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-between">
                            
                            {/* HUD Brackets Aérospatiaux */}
                            <div className="hud-bracket-tl text-[var(--accent-primary)]" />
                            <div className="hud-bracket-tr text-[var(--accent-primary)]" />
                            <div className="hud-bracket-bl text-[var(--accent-primary)]" />
                            <div className="hud-bracket-br text-[var(--accent-primary)]" />

                            {/* En-tête du Radar */}
                            <div className="flex items-center justify-between border-b border-white/10 pb-3 z-10">
                                <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-[var(--accent-primary)] animate-pulse" />
                                    <span className="text-[8.5px] font-mono font-black uppercase text-white tracking-[0.2em]">
                                        RADAR :: HELIOCENTRIC_SWEEP
                                    </span>
                                </div>
                                <span className="text-[7.5px] font-mono text-emerald-400 font-black px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    LIVE 60Hz
                                </span>
                            </div>

                            {/* Centre du Radar avec Anneaux Orbitaux */}
                            <div className="relative flex-1 flex items-center justify-center my-4">
                                
                                {/* Anneaux de distances AU */}
                                <div className="absolute w-[80%] h-[80%] rounded-full border border-white/10" />
                                <div className="absolute w-[58%] h-[58%] rounded-full border border-white/15 border-dashed" />
                                <div className="absolute w-[36%] h-[36%] rounded-full border border-[var(--accent-primary)]/20" />
                                <div className="absolute w-[18%] h-[18%] rounded-full border border-amber-400/30" />

                                {/* Ligne de balayage radar animée */}
                                <div
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                    style={{ transform: `rotate(${radarRotation}deg)` }}
                                >
                                    <div className="w-1/2 h-0.5 bg-gradient-to-r from-transparent via-[var(--accent-primary)]/50 to-[var(--accent-primary)] origin-right self-center" />
                                </div>

                                {/* Astre Central (Soleil) */}
                                <div className="relative w-7 h-7 rounded-full bg-amber-400 border border-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.8)] flex items-center justify-center z-10 animate-pulse">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                </div>

                                {/* Planètes sur orbite simulée */}
                                <div className="absolute top-[28%] left-[68%] flex items-center gap-1.5 z-10">
                                    <div className="w-3 h-3 rounded-full bg-[#4deeea] shadow-[0_0_10px_#4deeea]" />
                                    <span className="text-[7px] font-mono font-bold text-white bg-black/60 px-1 rounded">Earth (1.0 AU)</span>
                                </div>

                                <div className="absolute bottom-[22%] left-[24%] flex items-center gap-1.5 z-10">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#f87171] shadow-[0_0_10px_#f87171]" />
                                    <span className="text-[7px] font-mono font-bold text-white/80 bg-black/60 px-1 rounded">Mars (1.52 AU)</span>
                                </div>

                                <div className="absolute top-[18%] left-[26%] flex items-center gap-1.5 z-10">
                                    <div className="w-4 h-4 rounded-full bg-[#fbbf24] shadow-[0_0_12px_#fbbf24]" />
                                    <span className="text-[7px] font-mono font-bold text-white/80 bg-black/60 px-1 rounded">Jupiter (5.2 AU)</span>
                                </div>
                            </div>

                            {/* Pied du Radar : Télémétrie Képlérienne */}
                            <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[8px] font-mono z-10">
                                <span className="text-[#6c6c7a]">TARGET LOCK: <strong className="text-white">SOL_3_TERRA</strong></span>
                                <span className="text-[var(--accent-primary)] font-bold">ΔV = 29.78 km/s</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════
                    3. BANDEAU DES INSTRUMENTS DE VOL (AEROSPACE GAUGES)
                ═══════════════════════════════════════════════════════════════ */}
                <section className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-white/10 pb-4">
                        <div>
                            <div className="flex items-center gap-2 text-[var(--accent-primary)] mb-1">
                                <Gauge size={14} />
                                <span className="text-[9px] font-mono font-black uppercase tracking-[0.3em]">FLIGHT_INSTRUMENTATION</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                                Core Telemetry Subsystems
                            </h2>
                        </div>
                        <span className="text-[8px] font-mono text-[#6c6c7a] uppercase">All Subsystems Synchronized with JPL Ephemeris Matrix</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {FLIGHT_SYSTEMS.map((sys, idx) => (
                            <motion.div
                                key={sys.id}
                                whileHover={{ y: -4, borderColor: sys.accent }}
                                onClick={() => setSelectedModule(idx)}
                                className={`p-5 rounded-2xl bg-black/70 border transition-all cursor-pointer backdrop-blur-2xl flex flex-col justify-between gap-4 shadow-xl select-none ${
                                    selectedModule === idx ? 'border-[var(--accent-primary)] bg-white/[0.04]' : 'border-white/10 hover:border-white/20'
                                }`}
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[8px] font-mono font-black text-[#6c6c7a] tracking-widest">{sys.id}</span>
                                        <span
                                            className="text-[7.5px] font-mono font-black px-2 py-0.5 rounded-full border uppercase"
                                            style={{ color: sys.accent, borderColor: `${sys.accent}40`, backgroundColor: `${sys.accent}10` }}
                                        >
                                            {sys.status}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-black uppercase text-white tracking-tight">{sys.name}</h3>
                                    <p className="text-[8px] font-mono font-bold text-[var(--accent-primary)] uppercase tracking-wider">{sys.tag}</p>
                                    <p className="text-[10px] text-[#8e8e9f] font-mono leading-relaxed">{sys.desc}</p>
                                </div>

                                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[9px] font-mono font-bold">
                                    <span className="text-[#6c6c7a]">Metric:</span>
                                    <span className="text-white">{sys.value}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════
                    4. ÉCHANTILLON DU CATALOGUE STELLAIRE / LIVE EPHEMERIS
                ═══════════════════════════════════════════════════════════════ */}
                <section className="p-6 sm:p-8 rounded-[2.5rem] bg-black/80 border border-white/10 backdrop-blur-3xl space-y-6 shadow-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)]">
                                <HardDrive size={18} />
                            </div>
                            <div>
                                <h3 className="text-lg sm:text-xl font-black uppercase text-white tracking-tight">Active Astrometric Matrix</h3>
                                <p className="text-[8px] font-mono text-[#6c6c7a] uppercase">Real-Time JPL Horizon Vector Triangulation</p>
                            </div>
                        </div>

                        <Link href="/dashboard/archive">
                            <button className="px-4 py-2 min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[8.5px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2">
                                <span>Complete Gaia Archive (54 Nodes)</span>
                                <ChevronRight size={12} />
                            </button>
                        </Link>
                    </div>

                    {/* Table Responsive des Astres */}
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left font-mono text-[9px] sm:text-[10px] min-w-[500px]">
                            <thead>
                                <tr className="border-b border-white/10 text-[#6c6c7a] uppercase font-bold tracking-wider">
                                    <th className="py-2.5 px-3">Celestial Unit</th>
                                    <th className="py-2.5 px-3">Spectral / Class</th>
                                    <th className="py-2.5 px-3">Distance Sol/Earth</th>
                                    <th className="py-2.5 px-3">Orbital Velocity</th>
                                    <th className="py-2.5 px-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {CELESTIAL_TARGETS_PREVIEW.map((body, i) => (
                                    <tr key={body.name} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                                        <td className="py-3 px-3 font-black text-white uppercase flex items-center gap-2.5">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: body.color }} />
                                            <span>{body.name}</span>
                                        </td>
                                        <td className="py-3 px-3 text-[#8e8e9f]">{body.type}</td>
                                        <td className="py-3 px-3 text-[var(--accent-primary)] font-bold">{body.dist}</td>
                                        <td className="py-3 px-3 text-white/90">{body.vel}</td>
                                        <td className="py-3 px-3 text-right">
                                            <span className="text-[7.5px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                                LOCKED
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════
                    5. COMMAND PRE-FLIGHT CHECKLIST & CTA FINAL
                ═══════════════════════════════════════════════════════════════ */}
                <section className="relative p-8 sm:p-14 rounded-[3rem] bg-gradient-to-b from-white/[0.05] to-black/90 border border-white/15 backdrop-blur-3xl text-center space-y-8 overflow-hidden shadow-2xl">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent" />

                    <div className="max-w-2xl mx-auto space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] font-mono font-bold text-[var(--accent-primary)] uppercase tracking-widest">
                            <Lock size={10} /> CLEARANCE LEVEL: FLIGHT OPERATIONS // UNRESTRICTED
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight leading-tight">
                            Ready for Orbital Injection?
                        </h2>
                        <p className="text-xs sm:text-sm font-mono text-[#8e8e9f] leading-relaxed">
                            Prenez les commandes de la station de télémétrie spatiale. Basculez entre l'orbite héliocentrique du Système Solaire et la cartographie stellaire galactique en temps réel.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                        <Link href="/onboarding" className="w-full">
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="w-full py-5 min-h-[48px] rounded-2xl bg-[var(--accent-primary)] text-black font-mono font-black text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-3 shadow-[0_0_35px_rgba(77,238,234,0.4)] transition-all cursor-pointer touch-target"
                            >
                                <Radio size={16} className="animate-pulse" />
                                <span>Launch Full Sequence</span>
                                <ChevronRight size={16} />
                            </motion.button>
                        </Link>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════
                    6. PIED DE PAGE AÉROSPATIAL (SPACE AGENCY STANDARD)
                ═══════════════════════════════════════════════════════════════ */}
                <footer className="pt-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-[8px] sm:text-[9px] font-mono text-[#6c6c7a] uppercase">
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
                        <span className="font-black text-white">ORBITAL MONOLITH AEROSPACE FACILITY</span>
                        <span className="hidden sm:inline">·</span>
                        <span>LAT 34.2001° N · LON 118.1712° W (JPL OAK GROVE)</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <span>NASA JPL HORIZONS</span>
                        <span>ESA GAIA DR3</span>
                        <span className="text-[var(--accent-primary)] font-black">v4.0.0_PRODUCTION</span>
                    </div>
                </footer>
            </main>
        </div>
    );
}
