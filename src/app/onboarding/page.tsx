"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Terminal,
    ShieldCheck,
    Activity,
    FastForward,
    Radio,
    Compass,
    Cpu,
    Orbit,
    ArrowRight,
    Zap,
    Crosshair,
    Layers,
    CheckCircle2
} from 'lucide-react';

interface SubsystemStatus {
    id: string;
    label: string;
    code: string;
    stageIndex: number;
    latency: string;
}

export default function OnboardingPage() {
    const router = useRouter();
    const [progress, setProgress] = useState(0);
    const [isLaunching, setIsLaunching] = useState(false);
    const [currentTime, setCurrentTime] = useState("");
    const [rollAngle, setRollAngle] = useState(0);
    const [activeTab, setActiveTab] = useState<'poll' | 'logs'>('poll');
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Sequence stages with timestamps and technical astrophysics verifications
    const stages = useMemo(() => [
        {
            countdown: "T-00:04.2",
            stage: "STAGE 01 // DSN CARRIER ACQUISITION",
            desc: "Locking Canberra 70M S-band carrier at 8445.22 MHz...",
            pctTarget: 18,
            log: "[0x00F8A4] S-BAND CARRIER LOCKED (DSS-43 70M, SNR +41.8 dB, BER < 1e-9)"
        },
        {
            countdown: "T-00:03.1",
            stage: "STAGE 02 // JPL DE440 EPHEMERIS SOLVER",
            desc: "Computing 6-DOF Keplerian osculating elements via Newton-Raphson...",
            pctTarget: 38,
            log: "[0x00F8B2] SOLVING KEPLER MEAN ANOMALY: M = E - e*sin(E). CONVERGED IN 4 ITERATIONS"
        },
        {
            countdown: "T-00:02.0",
            stage: "STAGE 03 // GAIA DR3 ASTROMETRIC INGEST",
            desc: "Streaming 10,000 stellar targets and 3D proper motion vectors...",
            pctTarget: 62,
            log: "[0x00F8C8] INGESTING GAIA DR3 HIPPARCOS STELLAR MATRIX (MAG <= 6.5, PARALLAX VERIFIED)"
        },
        {
            countdown: "T-00:01.1",
            stage: "STAGE 04 // WEBGL2 SHADER PIPELINE",
            desc: "Compiling celestial atmospheric shaders and FP32 floating point buffers...",
            pctTarget: 84,
            log: "[0x00F8D4] EXT_COLOR_BUFFER_FLOAT & FP32 HDR MATRICES COMPILED. 60 FPS SYNC READY"
        },
        {
            countdown: "T-00:00.3",
            stage: "STAGE 05 // FLIGHT READINESS POLL",
            desc: "All Flight Directors reporting final GO / NO-GO status...",
            pctTarget: 96,
            log: "[0x00F8E0] GUIDANCE, DSN, EPHEMERIS, AND SHADER PIPELINE ALL REPORT 'GO' TO LAUNCH"
        },
        {
            countdown: "T-00:00.0",
            stage: "STAGE 06 // ORBITAL INJECTION ENGAGED",
            desc: "Transfer vector locked. Commencing mission control cockpit injection...",
            pctTarget: 100,
            log: "[0x00F902] INJECTION DELTA-V = 3,240 m/s EXECUTED. LAUNCHING ORBITAL MONOLITH FLIGHT DECK"
        }
    ], []);

    const subsystems: SubsystemStatus[] = useMemo(() => [
        { id: "gnd", label: "GUIDANCE & TRAJECTORY", code: "6-DOF DE440", stageIndex: 1, latency: "0.8ms" },
        { id: "dsn", label: "DSN DEEP SPACE LINK", code: "S-BAND 70M", stageIndex: 0, latency: "1.4ms" },
        { id: "cat", label: "GAIA DR3 ASTROMETRY", code: "1.8B SOURCES", stageIndex: 2, latency: "2.1ms" },
        { id: "gpu", label: "WEBGL2 SHADER CORE", code: "FP32 COMPIL", stageIndex: 3, latency: "0.4ms" },
        { id: "clk", label: "SIDEREAL UTC MASTER", code: "ATOMIC SYNC", stageIndex: 0, latency: "0.1ms" },
        { id: "dir", label: "FLIGHT DIRECTOR CLEARANCE", code: "LEVEL 5 TITANIUM", stageIndex: 4, latency: "GO" },
    ], []);

    // Current active stage derived from progress
    const currentStageIndex = useMemo(() => {
        if (progress < 18) return 0;
        if (progress < 38) return 1;
        if (progress < 62) return 2;
        if (progress < 84) return 3;
        if (progress < 98) return 4;
        return 5;
    }, [progress]);

    const activeStage = stages[currentStageIndex];

    // Logs accrued up to current stage
    const activeLogs = useMemo(() => {
        return stages.slice(0, currentStageIndex + 1).map(s => s.log);
    }, [stages, currentStageIndex]);

    // Live UTC Clock
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const utc = now.toISOString().replace("T", " ").replace("Z", " UTC");
            setCurrentTime(utc);
        };
        updateClock();
        const interval = setInterval(updateClock, 100);
        return () => clearInterval(interval);
    }, []);

    // Gyroscope subtle oscillation simulation
    useEffect(() => {
        const gyroInterval = setInterval(() => {
            setRollAngle(Math.sin(Date.now() / 800) * 8);
        }, 50);
        return () => clearInterval(gyroInterval);
    }, []);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeLogs]);

    // Progressive launch countdown ticker
    useEffect(() => {
        if (isLaunching) return;

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    triggerLaunch();
                    return 100;
                }
                // Realistic non-linear progress simulation
                const increment = Math.max(1, Math.floor(Math.random() * 4) + 1);
                const nextVal = Math.min(100, prev + increment);
                return nextVal;
            });
        }, 120);

        return () => clearInterval(timer);
    }, [isLaunching]);

    // Final Launch Execution
    const triggerLaunch = () => {
        if (isLaunching) return;
        setIsLaunching(true);
        setTimeout(() => {
            router.push('/dashboard');
        }, 600);
    };

    return (
        <div className="fixed inset-0 bg-[#030305] text-[#e1e1e6] font-mono flex flex-col justify-between overflow-x-hidden overflow-y-auto select-none p-3 sm:p-6 lg:p-8">
            {/* Visual scanline, grain & aerospace ambient glow */}
            <div className="grain opacity-20 pointer-events-none" />
            <div className="scanline pointer-events-none" />

            {/* Central hyper-spatial warp transition effect */}
            <AnimatePresence>
                {isLaunching && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 2 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="fixed inset-0 z-50 bg-gradient-to-r from-[var(--accent-primary)]/40 via-white/80 to-[var(--accent-primary)]/40 backdrop-blur-3xl flex items-center justify-center pointer-events-none"
                    >
                        <div className="text-black font-black text-2xl sm:text-4xl tracking-[0.5em] uppercase text-center px-4">
                            ORBITAL INJECTION EXECUTED // ENTERING COCKPIT
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Corner HUD Brackets */}
            <div className="hud-bracket-tl text-[var(--accent-primary)]" />
            <div className="hud-bracket-tr text-[var(--accent-primary)]" />
            <div className="hud-bracket-bl text-[var(--accent-primary)]" />
            <div className="hud-bracket-br text-[var(--accent-primary)]" />

            {/* Background subtle radial aerospace gradient */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent-primary)]/5 rounded-full blur-[140px]" />
                <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-cyan-900/10 rounded-full blur-[120px]" />
            </div>

            {/* =========================================================================
                TOP BAR: Operations Command Identification & Live DSN Carrier
            ========================================================================= */}
            <header className="relative z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)] shadow-[0_0_15px_rgba(77,238,234,0.25)] flex-shrink-0">
                        <Orbit size={20} className="animate-spin-slow" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--accent-primary)]">
                                ORBITAL MONOLITH // LAUNCH COMPLEX 39A
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                ACTIVE
                            </span>
                        </div>
                        <h1 className="text-xs sm:text-sm font-bold tracking-wider text-white">
                            FLIGHT DIRECTOR INJECTION TERMINAL
                        </h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-[9px] text-[#8e8e9f]">
                    <div className="flex items-center gap-2">
                        <Radio size={12} className="text-emerald-400 animate-pulse" />
                        <span>DSN GOLDSTONE 70M: <strong className="text-white">LOCKED</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Activity size={12} className="text-[var(--accent-primary)]" />
                        <span>UTC: <strong className="text-white font-mono">{currentTime || "CALIBRATING..."}</strong></span>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                        <ShieldCheck size={12} className="text-cyan-400" />
                        <span>CLEARANCE: <strong className="text-white">LVL-5 TITANIUM</strong></span>
                    </div>
                </div>
            </header>

            {/* =========================================================================
                MAIN INSTRUMENTATION CONSOLE (Center Gyroscopic Horizon + Telemetry Grid)
            ========================================================================= */}
            <main className="relative z-10 flex-1 my-4 sm:my-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-center">
                
                {/* -------------------------------------------------------------
                    LEFT WING: Flight Readiness GO / NO-GO Poll (Desktop 3 cols)
                -------------------------------------------------------------- */}
                <div className="hidden lg:flex lg:col-span-3 flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#8e8e9f]">
                            <Cpu size={12} className="text-[var(--accent-primary)]" />
                            <span>FLIGHT READINESS POLL</span>
                        </div>
                        <span className="text-[8px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            ALL SYSTEMS GO
                        </span>
                    </div>

                    <div className="space-y-2">
                        {subsystems.map((sub) => {
                            const isReady = currentStageIndex >= sub.stageIndex;
                            return (
                                <div
                                    key={sub.id}
                                    className={`p-2.5 rounded-xl border transition-all ${
                                        isReady
                                            ? 'bg-white/[0.03] border-white/10 text-white'
                                            : 'bg-black/20 border-white/5 text-[#6c6c7a]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between text-[9px] mb-1">
                                        <span className="font-bold tracking-wider">{sub.label}</span>
                                        {isReady ? (
                                            <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                                <CheckCircle2 size={10} />
                                                GO
                                            </span>
                                        ) : (
                                            <span className="text-[var(--accent-primary)] animate-pulse font-medium">
                                                SYNCING...
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between text-[8px] text-[#8e8e9f]">
                                        <span>{sub.code}</span>
                                        <span className="font-mono">{sub.latency}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* -------------------------------------------------------------
                    CENTER STAGE: Gyroscopic Primary Flight Display (PFD) (6 cols)
                -------------------------------------------------------------- */}
                <div className="col-span-1 lg:col-span-6 flex flex-col items-center justify-center relative">
                    
                    {/* Primary Flight Display Gimbal & Horizon Target Reticle */}
                    <div className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 flex items-center justify-center my-2 sm:my-4">
                        
                        {/* Outer Rotating Degree Ring */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 rounded-full border border-[var(--accent-primary)]/20 border-dashed"
                        />

                        {/* Middle Horizon Dial */}
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-4 sm:inset-6 rounded-full border border-white/10 flex items-center justify-center"
                        >
                            {/* Degree markers */}
                            <span className="absolute top-1 text-[7px] text-[#8e8e9f] font-mono">000°</span>
                            <span className="absolute bottom-1 text-[7px] text-[#8e8e9f] font-mono">180°</span>
                            <span className="absolute left-1 text-[7px] text-[#8e8e9f] font-mono">270°</span>
                            <span className="absolute right-1 text-[7px] text-[#8e8e9f] font-mono">090°</span>
                        </motion.div>

                        {/* Artificial Horizon Pitch Ladder (oscillating with rollAngle) */}
                        <motion.div
                            style={{ rotate: rollAngle }}
                            className="absolute inset-10 sm:inset-14 rounded-full border border-[var(--accent-primary)]/30 flex flex-col items-center justify-center overflow-hidden bg-black/40 backdrop-blur-sm shadow-[inset_0_0_30px_rgba(77,238,234,0.05)]"
                        >
                            {/* Pitch Ladder horizontal lines */}
                            <div className="w-16 sm:w-24 h-px bg-white/20 my-1.5 flex justify-between px-1 text-[6px] text-[#8e8e9f]">
                                <span>+20</span><span>+20</span>
                            </div>
                            <div className="w-24 sm:w-32 h-px bg-white/30 my-1.5 flex justify-between px-1 text-[6px] text-[#8e8e9f]">
                                <span>+10</span><span>+10</span>
                            </div>
                            <div className="w-32 sm:w-44 h-0.5 bg-[var(--accent-primary)]/80 my-2 shadow-[0_0_8px_rgba(77,238,234,0.6)]" />
                            <div className="w-24 sm:w-32 h-px bg-white/30 my-1.5 flex justify-between px-1 text-[6px] text-[#8e8e9f]">
                                <span>-10</span><span>-10</span>
                            </div>
                            <div className="w-16 sm:w-24 h-px bg-white/20 my-1.5 flex justify-between px-1 text-[6px] text-[#8e8e9f]">
                                <span>-20</span><span>-20</span>
                            </div>
                        </motion.div>

                        {/* Targeting Reticle Crosshairs */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <Crosshair size={32} className="text-[var(--accent-primary)] opacity-70 animate-pulse" />
                        </div>

                        {/* Center Celestial Core Indicator */}
                        <div className="relative z-10 w-12 h-12 rounded-full bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/60 flex items-center justify-center shadow-[0_0_20px_rgba(77,238,234,0.4)]">
                            <Compass size={20} className="text-[var(--accent-primary)]" />
                        </div>

                        {/* Fixed HUD Corner Coordinates */}
                        <div className="absolute top-0 left-0 text-[8px] text-[var(--accent-primary)] font-mono">
                            RA: 18h 36m 56s
                        </div>
                        <div className="absolute top-0 right-0 text-[8px] text-[var(--accent-primary)] font-mono">
                            DEC: +38° 47' 01"
                        </div>
                        <div className="absolute bottom-0 left-0 text-[8px] text-[#8e8e9f] font-mono">
                            EPOCH: J2000.0
                        </div>
                        <div className="absolute bottom-0 right-0 text-[8px] text-emerald-400 font-mono">
                            LOCK: GAIA-OK
                        </div>
                    </div>

                    {/* Central Stage Description & Countdown Headline */}
                    <div className="text-center mt-3 max-w-md px-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-[var(--accent-primary)] font-bold tracking-widest mb-1.5 uppercase">
                            <Zap size={11} className="text-[var(--accent-primary)] animate-pulse" />
                            <span>{activeStage.countdown}</span>
                            <span className="text-[#6c6c7a]">|</span>
                            <span>{activeStage.stage}</span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-[#8e8e9f] leading-relaxed">
                            {activeStage.desc}
                        </p>
                    </div>

                    {/* Mobile Tab Switcher (Visible on < 1024px to toggle between Poll and Logs) */}
                    <div className="flex lg:hidden w-full max-w-sm mt-4 border border-white/10 rounded-xl overflow-hidden bg-black/40 p-1">
                        <button
                            onClick={() => setActiveTab('poll')}
                            className={`flex-1 py-2 text-[9px] font-bold tracking-wider rounded-lg transition-all min-h-[38px] ${
                                activeTab === 'poll'
                                    ? 'bg-[var(--accent-primary)] text-black font-black'
                                    : 'text-[#8e8e9f] hover:text-white'
                            }`}
                        >
                            SYSTEM STATUS POLL
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`flex-1 py-2 text-[9px] font-bold tracking-wider rounded-lg transition-all min-h-[38px] ${
                                activeTab === 'logs'
                                    ? 'bg-[var(--accent-primary)] text-black font-black'
                                    : 'text-[#8e8e9f] hover:text-white'
                            }`}
                        >
                            DSN TELEMETRY STREAM
                        </button>
                    </div>

                    {/* Mobile Conditional Content */}
                    <div className="w-full max-w-sm mt-3 lg:hidden">
                        {activeTab === 'poll' ? (
                            <div className="grid grid-cols-2 gap-2">
                                {subsystems.map((sub) => {
                                    const isReady = currentStageIndex >= sub.stageIndex;
                                    return (
                                        <div
                                            key={sub.id}
                                            className={`p-2 rounded-lg border text-[8px] ${
                                                isReady
                                                    ? 'bg-white/[0.03] border-white/10 text-white'
                                                    : 'bg-black/20 border-white/5 text-[#6c6c7a]'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="font-bold truncate">{sub.id.toUpperCase()}</span>
                                                {isReady ? (
                                                    <span className="text-emerald-400 font-bold">GO</span>
                                                ) : (
                                                    <span className="text-[var(--accent-primary)]">...</span>
                                                )}
                                            </div>
                                            <div className="text-[7px] text-[#8e8e9f] truncate">{sub.code}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-28 bg-black/60 border border-white/10 rounded-xl p-2.5 overflow-y-auto space-y-1 text-[8px] font-mono">
                                {activeLogs.map((log, i) => (
                                    <div key={i} className="text-white/70 leading-tight">
                                        <span className="text-[var(--accent-primary)] mr-1">&gt;</span>
                                        {log}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* -------------------------------------------------------------
                    RIGHT WING: Real-Time DSN Astrophysics Terminal Stream (Desktop 3 cols)
                -------------------------------------------------------------- */}
                <div className="hidden lg:flex lg:col-span-3 flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#8e8e9f]">
                            <Terminal size={12} className="text-[var(--accent-primary)]" />
                            <span>DSN TELEMETRY STREAM</span>
                        </div>
                        <span className="text-[8px] text-[var(--accent-primary)] font-bold">
                            BUFFER: 64KB FIFO
                        </span>
                    </div>

                    <div className="h-64 bg-black/50 border border-white/10 rounded-2xl p-3 flex flex-col justify-between backdrop-blur-md">
                        <div className="overflow-y-auto space-y-2 pr-1 custom-scrollbar text-[8px] leading-relaxed">
                            <div className="text-[#6c6c7a] border-b border-white/5 pb-1">
                                // NASA JPL HORIZONS / GAIA DR3 RECEPTION
                            </div>
                            {activeLogs.map((log, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-white/80"
                                >
                                    <span className="text-[var(--accent-primary)] mr-1.5 font-bold">&gt;</span>
                                    {log}
                                </motion.div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                        <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[7px] text-[#6c6c7a]">
                            <span>STATUS: RECVD_ACK</span>
                            <span className="text-emerald-400">CRC: 0x9AF4 [VALID]</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* =========================================================================
                BOTTOM CONSOLE: Segmented Power/Injection Bar & Mission Control Bypass
            ========================================================================= */}
            <footer className="relative z-20 border-t border-white/10 pt-4 flex flex-col gap-3">
                
                {/* Segmented Aerospace Progress Display */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[9px]">
                    <div className="flex items-center gap-2 text-[#8e8e9f]">
                        <Layers size={12} className="text-[var(--accent-primary)]" />
                        <span className="font-bold tracking-wider">ORBITAL INJECTION BUFFER:</span>
                        <span className="text-white font-mono font-bold">{progress}% READY</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#8e8e9f]">
                        <span>IGNITION SEQUENCE:</span>
                        <span className="text-emerald-400 font-bold uppercase tracking-widest">
                            {progress >= 100 ? "TRAJECTORY LOCKED" : "SYNCHRONIZING..."}
                        </span>
                    </div>
                </div>

                {/* High-Tech 24-Segment LED Progress Bar */}
                <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 p-1 rounded-xl bg-black/60 border border-white/10">
                    {Array.from({ length: 24 }).map((_, index) => {
                        const threshold = ((index + 1) / 24) * 100;
                        const isLit = progress >= threshold;
                        return (
                            <div
                                key={index}
                                className={`h-2.5 rounded-sm transition-all duration-150 ${
                                    isLit
                                        ? 'bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(77,238,234,0.7)]'
                                        : 'bg-white/5'
                                }`}
                            />
                        );
                    })}
                </div>

                {/* Bottom Control Buttons: Abort / Immediate Injection Bypass */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                    <div className="text-[8px] text-[#8e8e9f] hidden sm:block">
                        AUTOMATIC LAUNCH UPON 100% INJECTION LOCK // BYPASS AUTHORIZED
                    </div>

                    <button
                        onClick={triggerLaunch}
                        className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-white/5 hover:bg-[var(--accent-primary)] hover:text-black border border-white/10 hover:border-[var(--accent-primary)] text-white font-bold text-[9px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] active:scale-95 cursor-pointer touch-manipulation group"
                    >
                        <FastForward size={14} className="text-[var(--accent-primary)] group-hover:text-black transition-colors" />
                        <span>ABORT COUNTDOWN // MANUAL INJECTION OVERRIDE</span>
                        <ArrowRight size={13} className="text-white/60 group-hover:text-black transition-colors" />
                    </button>
                </div>
            </footer>
        </div>
    );
}
