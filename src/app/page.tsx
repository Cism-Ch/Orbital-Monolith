"use client";

/**
 * @file app/page.tsx
 * @description Orbital Monolith — Landing Page Aérospatiale Haute Fidélité v4.2.
 *
 * Directives de design :
 * - Largeur fluide et plein écran sans marges excessives à gauche et à droite (suppression de max-w-7xl).
 * - Mini carte 3D interactive composée STRICTEMENT de points (THREE.Points, STARS dataset, Milky Way points).
 * - Bordures organiques et arrondies selon les standards du code (rounded-3xl, rounded-[2.5rem], rounded-[3rem], rounded-2xl).
 * - Design System canonique (.monolith-panel, .monolith-card, .glass-button).
 * - Norme ergonomique tactile (cibles >= 44x44px).
 */

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
    Satellite,
    Globe,
    Gauge,
    HardDrive,
    Lock,
    ChevronRight,
    ArrowUpRight,
    Radio,
    Zap,
} from 'lucide-react';
import { SOLAR_SYSTEM, STARS } from '@/constants';

// Import dynamique sans SSR pour le composant Three.js Points (Règle 1 AGENTS.md)
const MiniSkyMap3D = dynamic(
    () => import('@/components/ui/MiniSkyMap3D').then((mod) => mod.MiniSkyMap3D),
    {
        ssr: false,
        loading: () => (
            <div className="monolith-panel w-full h-[400px] sm:h-[480px] lg:h-[540px] flex flex-col items-center justify-center font-mono gap-3 border border-[var(--basalt-edge)] rounded-3xl sm:rounded-[2.5rem] md:rounded-[3rem]">
                <div className="w-10 h-10 rounded-full border-2 border-[var(--accent-primary)]/20 border-t-[var(--accent-primary)] animate-spin" />
                <span className="text-[9px] uppercase tracking-[0.25em] text-[var(--accent-primary)] font-bold">
                    INITIALIZING POINT CLOUD MATRIX...
                </span>
            </div>
        )
    }
);

// ── Données des sous-systèmes de vol ──────────────────────────────────────────
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

    // ── Horloge de mission UTC & Sidérale temps réel ─────────────────────────
    useEffect(() => {
        const updateClocks = () => {
            const now = new Date();
            const hours = String(now.getUTCHours()).padStart(2, '0');
            const minutes = String(now.getUTCMinutes()).padStart(2, '0');
            const seconds = String(now.getUTCSeconds()).padStart(2, '0');
            const ms = String(Math.floor(now.getUTCMilliseconds() / 100)).padStart(1, '0');
            setCurrentTimeUtc(`${hours}:${minutes}:${seconds}.${ms} UTC`);

            const siderealHours = ((now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600) * 1.0027379) % 24;
            setSiderealTime(`${(siderealHours * 15).toFixed(2)}° LST`);
        };

        updateClocks();
        const interval = setInterval(updateClocks, 100);
        return () => clearInterval(interval);
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
        const STAR_COUNT = 400;
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
            mouseX = (e.clientX - width / 2) * 0.04;
            mouseY = (e.clientY - height / 2) * 0.04;
        };

        window.addEventListener('mousemove', onMouseMove);

        const animate = () => {
            rafId = requestAnimationFrame(animate);
            ctx.fillStyle = '#030305';
            ctx.fillRect(0, 0, width, height);

            // Nébuleuse aérospatiale d'arrière-plan
            const grad = ctx.createRadialGradient(
                width * 0.55, height * 0.35, 0,
                width * 0.55, height * 0.35, width * 0.7
            );
            grad.addColorStop(0, 'rgba(12, 26, 54, 0.35)');
            grad.addColorStop(0.5, 'rgba(6, 14, 30, 0.15)');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);

            // Rendu des particules stellaires 3D
            const cx = width / 2 + mouseX;
            const cy = height / 2 + mouseY;

            for (let i = 0; i < STAR_COUNT; i++) {
                const s = stars[i];
                s.z -= 0.5;
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

            {/* Scanline CRT aérospatiale */}
            <div className="scanline fixed pointer-events-none z-[1]" />

            {/* ═══════════════════════════════════════════════════════════════
                1. EN-TÊTE DE MISSION FLUIDE SANS MARGES EXCESSIVES (z-50)
            ═══════════════════════════════════════════════════════════════ */}
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/85 backdrop-blur-3xl px-4 sm:px-8 lg:px-12 py-3.5 transition-all">
                <div className="w-full flex items-center justify-between gap-4">
                    
                    {/* Badge d'agence & Logo arrondi */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/15 flex items-center justify-center text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-black transition-all shadow-[0_0_20px_rgba(77,238,234,0.15)] flex-shrink-0">
                            <Satellite size={20} />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-xs sm:text-sm tracking-[0.2em] uppercase text-white">
                                    Orbital Monolith
                                </span>
                                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[7px] font-black uppercase text-[var(--accent-primary)]">
                                    v4.2_TITANIUM
                                </span>
                            </div>
                            <span className="text-[7.5px] sm:text-[8px] font-mono tracking-widest text-[#8e8e9f] uppercase">
                                NASA JPL · ESA GAIA FLIGHT OPERATIONS
                            </span>
                        </div>
                    </Link>

                    {/* Télémétrie centrale UTC & Sidérale */}
                    <div className="hidden lg:flex items-center gap-6 px-5 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[8.5px] font-mono">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                            <span className="text-[#8e8e9f] uppercase font-bold">DSN CARRIER:</span>
                            <span className="text-white font-black tracking-wider">8445.22 MHz LOCK</span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <span className="text-[#8e8e9f] uppercase font-bold">UTC:</span>
                            <span className="text-[var(--accent-primary)] font-black tracking-wider font-mono">{currentTimeUtc}</span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <span className="text-[#8e8e9f] uppercase font-bold">LST:</span>
                            <span className="text-white font-black tracking-wider font-mono">{siderealTime}</span>
                        </div>
                    </div>

                    {/* Boutons d'accès direct arrondis conformes Design System (>= 44px) */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link href="/dashboard" className="hidden sm:flex">
                            <button className="glass-button px-5 py-2.5 min-h-[44px] text-white/80 hover:text-white text-[9px] font-mono font-black uppercase tracking-widest cursor-pointer !rounded-full">
                                Direct Console
                            </button>
                        </Link>

                        <Link href="/onboarding">
                            <button className="px-5 sm:px-6 py-2.5 min-h-[44px] rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-black text-[9px] font-mono font-black uppercase tracking-widest shadow-[0_0_20px_rgba(77,238,234,0.35)] hover:shadow-[0_0_30px_rgba(77,238,234,0.5)] transition-all flex items-center gap-2 cursor-pointer touch-target active:scale-95">
                                <Radio size={14} className="animate-pulse" />
                                <span>Launch Mission</span>
                                <ChevronRight size={14} />
                            </button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════════════
                2. HERO COVER SECTION — PLEIN ÉCRAN FLUIDE (100vh Fold)
            ═══════════════════════════════════════════════════════════════ */}
            <section className="relative z-10 w-full min-h-[calc(100dvh-73px)] flex flex-col justify-between px-4 sm:px-8 lg:px-12 py-6 sm:py-10">
                
                {/* Grille Héroïque Plein Écran */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center flex-1 my-auto w-full">
                    
                    {/* Colonne Gauche (7 cols) : Déclaration de Mission & Contrôles */}
                    <div className="lg:col-span-7 flex flex-col gap-6 sm:gap-8">
                        
                        {/* Badge de certification du pipeline de données arrondi */}
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl w-fit">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            <span className="text-[8px] sm:text-[9px] font-mono font-black uppercase tracking-[0.25em] text-white/80">
                                NASA JPL HORIZONS · ESA GAIA DR3 · CERTIFIED PIPELINE
                            </span>
                        </div>

                        {/* Titre Aérospatial Monumental */}
                        <div className="space-y-3">
                            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.98] text-white">
                                Deep Space <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-sky-300 to-indigo-400">
                                    Flight Telemetry
                                </span>
                            </h1>
                            <p className="text-xs sm:text-sm font-mono text-[#8e8e9f] max-w-2xl leading-relaxed">
                                Moteur d'astrodynamique et de mécanique képlérienne temps réel. Cartographie 3D persistante du Système Solaire et du catalogue d'étoiles Gaia DR3, conçue selon les protocoles opérationnels de vol aérospatial.
                            </p>
                        </div>

                        {/* CTA Deck arrondi conforme Design System (>= 44px) */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-1">
                            <Link href="/onboarding" className="flex-1 sm:flex-initial">
                                <button className="w-full sm:w-auto px-8 py-4 min-h-[48px] rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-black font-mono font-black text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-3 shadow-[0_10px_35px_rgba(77,238,234,0.35)] transition-all cursor-pointer touch-target active:scale-95">
                                    <Zap size={16} fill="currentColor" />
                                    <span>Initialize System Core</span>
                                    <ArrowUpRight size={16} />
                                </button>
                            </Link>

                            <Link href="/dashboard" className="flex-1 sm:flex-initial">
                                <button className="glass-button w-full sm:w-auto px-7 py-4 min-h-[48px] text-white font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 cursor-pointer touch-target !rounded-full">
                                    <Globe size={15} className="text-[var(--accent-primary)]" />
                                    <span>Sector Sol Control</span>
                                </button>
                            </Link>
                        </div>

                        {/* Mini Métriques Aérospatiales Monolith-Card arrondies */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-white/10 text-left">
                            <div className="monolith-card !rounded-2xl sm:!rounded-3xl p-3.5 sm:p-4">
                                <span className="text-[7.5px] uppercase font-bold text-[#8e8e9f] block tracking-widest">Catalog Nodes</span>
                                <span className="text-xs sm:text-sm font-black text-white font-mono">{SOLAR_SYSTEM.length + STARS.length} Bodies</span>
                            </div>
                            <div className="monolith-card !rounded-2xl sm:!rounded-3xl p-3.5 sm:p-4">
                                <span className="text-[7.5px] uppercase font-bold text-[#8e8e9f] block tracking-widest">Astrometric Frame</span>
                                <span className="text-xs sm:text-sm font-black text-[var(--accent-primary)] font-mono">ICRF / J2000</span>
                            </div>
                            <div className="monolith-card !rounded-2xl sm:!rounded-3xl p-3.5 sm:p-4">
                                <span className="text-[7.5px] uppercase font-bold text-[#8e8e9f] block tracking-widest">Renderer Engine</span>
                                <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono">WebGL2 PERSIST</span>
                            </div>
                        </div>
                    </div>

                    {/* Colonne Droite (5 cols) : Mini Structure 3D d'Étoile composée UNIQUEMENT de points */}
                    <div className="lg:col-span-5 relative w-full flex items-center justify-center">
                        <MiniSkyMap3D />
                    </div>
                </div>

                {/* Barre de Statut Opérationnelle du Pli d'Écran (100% Largeur Fluide) */}
                <div className="w-full mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-[8px] sm:text-[8.5px] font-mono text-[#8e8e9f]">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>GOLDSTONE (DSS-14): <strong className="text-white">ONLINE</strong></span>
                        </div>
                        <span className="text-white/20">|</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>CANBERRA (DSS-43): <strong className="text-white">ONLINE</strong></span>
                        </div>
                        <span className="text-white/20 hidden sm:inline">|</span>
                        <div className="hidden sm:flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>MADRID (DSS-63): <strong className="text-white">ONLINE</strong></span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span>SNR: <strong className="text-[var(--accent-primary)]">+42.1 dB</strong></span>
                        <span>BER: <strong className="text-white">&lt; 10⁻¹⁰</strong></span>
                        <span className="text-emerald-400 font-bold uppercase tracking-wider">ALL SUBSYSTEMS NOMINAL</span>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                3. BANDEAU DES SOUS-SYSTÈMES FLUIDE ET ARRONDIS (AEROSPACE)
            ═══════════════════════════════════════════════════════════════ */}
            <main className="relative z-10 w-full px-4 sm:px-8 lg:px-12 py-16 sm:py-24 space-y-20 sm:space-y-28">
                
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
                        <span className="text-[8px] font-mono text-[#8e8e9f] uppercase">All Subsystems Synchronized with JPL Ephemeris Matrix</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {FLIGHT_SYSTEMS.map((sys, idx) => (
                            <div
                                key={sys.id}
                                onClick={() => setSelectedModule(idx)}
                                className={`monolith-card !rounded-2xl sm:!rounded-3xl p-5 sm:p-6 cursor-pointer flex flex-col justify-between gap-4 select-none transition-all ${
                                    selectedModule === idx ? '!border-[var(--accent-primary)] bg-white/[0.05] shadow-[0_0_20px_rgba(77,238,234,0.15)]' : ''
                                }`}
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[8px] font-mono font-black text-[#8e8e9f] tracking-widest">{sys.id}</span>
                                        <span
                                            className="text-[7.5px] font-mono font-black px-2.5 py-0.5 rounded-full border uppercase"
                                            style={{ color: sys.accent, borderColor: `${sys.accent}40`, backgroundColor: `${sys.accent}10` }}
                                        >
                                            {sys.status}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-black uppercase text-white tracking-tight">{sys.name}</h3>
                                    <p className="text-[8px] font-mono font-bold text-[var(--accent-primary)] uppercase tracking-wider">{sys.tag}</p>
                                    <p className="text-[9.5px] text-[#8e8e9f] font-mono leading-relaxed">{sys.desc}</p>
                                </div>

                                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[9px] font-mono font-bold">
                                    <span className="text-[#8e8e9f]">Metric:</span>
                                    <span className="text-white">{sys.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════
                    4. ÉCHANTILLON DU CATALOGUE STELLAIRE / ASTROMETRIC MATRIX
                ═══════════════════════════════════════════════════════════════ */}
                <section className="monolith-panel !rounded-3xl sm:!rounded-[2.5rem] md:!rounded-[3rem] p-6 sm:p-10 space-y-6 shadow-2xl relative">
                    <div className="hud-bracket-tl text-[var(--accent-primary)]" />
                    <div className="hud-bracket-tr text-[var(--accent-primary)]" />
                    <div className="hud-bracket-bl text-[var(--accent-primary)]" />
                    <div className="hud-bracket-br text-[var(--accent-primary)]" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)]">
                                <HardDrive size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg sm:text-xl font-black uppercase text-white tracking-tight">Active Astrometric Matrix</h3>
                                <p className="text-[8px] font-mono text-[#8e8e9f] uppercase">Real-Time JPL Horizon Vector Triangulation</p>
                            </div>
                        </div>

                        <Link href="/dashboard/archive">
                            <button className="glass-button px-5 py-2.5 min-h-[44px] text-white/80 hover:text-white text-[8.5px] font-mono font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer !rounded-full">
                                <span>Complete Gaia Archive (54 Nodes)</span>
                                <ChevronRight size={12} />
                            </button>
                        </Link>
                    </div>

                    {/* Table Responsive des Astres */}
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left font-mono text-[9px] sm:text-[10px] min-w-[500px]">
                            <thead>
                                <tr className="border-b border-white/10 text-[#8e8e9f] uppercase font-bold tracking-wider">
                                    <th className="py-3 px-3">Celestial Unit</th>
                                    <th className="py-3 px-3">Spectral / Class</th>
                                    <th className="py-3 px-3">Distance Sol/Earth</th>
                                    <th className="py-3 px-3">Orbital Velocity</th>
                                    <th className="py-3 px-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {CELESTIAL_TARGETS_PREVIEW.map((body) => (
                                    <tr key={body.name} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                                        <td className="py-3.5 px-3 font-black text-white uppercase flex items-center gap-2.5">
                                            <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: body.color, color: body.color }} />
                                            <span>{body.name}</span>
                                        </td>
                                        <td className="py-3.5 px-3 text-[#8e8e9f]">{body.type}</td>
                                        <td className="py-3.5 px-3 text-[var(--accent-primary)] font-bold">{body.dist}</td>
                                        <td className="py-3.5 px-3 text-white/90">{body.vel}</td>
                                        <td className="py-3.5 px-3 text-right">
                                            <span className="text-[7.5px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
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
                    5. COMMAND PRE-FLIGHT CHECKLIST & DEPARTURE HUB
                ═══════════════════════════════════════════════════════════════ */}
                <section className="monolith-panel !rounded-3xl sm:!rounded-[2.5rem] md:!rounded-[3rem] p-8 sm:p-14 text-center space-y-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent" />
                    <div className="hud-bracket-tl text-[var(--accent-primary)]" />
                    <div className="hud-bracket-tr text-[var(--accent-primary)]" />
                    <div className="hud-bracket-bl text-[var(--accent-primary)]" />
                    <div className="hud-bracket-br text-[var(--accent-primary)]" />

                    <div className="max-w-2xl mx-auto space-y-3">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-mono font-bold text-[var(--accent-primary)] uppercase tracking-widest">
                            <Lock size={10} /> CLEARANCE LEVEL: FLIGHT OPERATIONS // UNRESTRICTED
                        </div>
                        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase text-white tracking-tight leading-tight">
                            Ready for Orbital Injection?
                        </h2>
                        <p className="text-xs sm:text-sm font-mono text-[#8e8e9f] leading-relaxed">
                            Prenez les commandes de la station de télémétrie spatiale. Basculez entre l'orbite héliocentrique du Système Solaire et la cartographie stellaire galactique en temps réel.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                        <Link href="/onboarding" className="w-full">
                            <button className="w-full py-4 min-h-[48px] rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-black font-mono font-black text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-3 shadow-[0_0_35px_rgba(77,238,234,0.4)] transition-all cursor-pointer touch-target active:scale-95">
                                <Radio size={16} className="animate-pulse" />
                                <span>Launch Full Sequence</span>
                                <ChevronRight size={16} />
                            </button>
                        </Link>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════
                    6. PIED DE PAGE AÉROSPATIAL (SPACE AGENCY STANDARD)
                ═══════════════════════════════════════════════════════════════ */}
                <footer className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-[8px] sm:text-[9px] font-mono text-[#8e8e9f] uppercase">
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
                        <span className="font-black text-white">ORBITAL MONOLITH AEROSPACE FACILITY</span>
                        <span className="hidden sm:inline">·</span>
                        <span>LAT 34.2001° N · LON 118.1712° W (JPL OAK GROVE)</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <span>NASA JPL HORIZONS</span>
                        <span>ESA GAIA DR3</span>
                        <span className="text-[var(--accent-primary)] font-black">v4.2.0_TITANIUM</span>
                    </div>
                </footer>
            </main>
        </div>
    );
}
