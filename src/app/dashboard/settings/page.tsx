"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Eye, Volume2, Shield, Cpu, RefreshCcw, Type, Check, Sliders, MessageSquare, RotateCcw, Activity, HardDrive, Monitor, Zap } from 'lucide-react';
import { useDashboard } from '@/lib/DashboardContext';
import { useUniverseEngine } from '@/lib/UniverseEngineContext';
import { STARS, SOLAR_SYSTEM } from '@/constants';

export default function SettingsPage() {
    const {
        interfaceOpacity,
        setInterfaceOpacity,
        cosmicResonance,
        setCosmicResonance,
        interfaceVolume,
        setInterfaceVolume,
        hyperSpatialRendering,
        setHyperSpatialRendering,
        ambientOcclusion,
        setAmbientOcclusion,
        rootEncryption,
        setRootEncryption,
        biometricLink,
        setBiometricLink,
        fontSizeScale,
        setFontSizeScale,
        tooltipFontSize,
        setTooltipFontSize,
    } = useDashboard();
    const { renderer: engineRenderer } = useUniverseEngine();

    const [isResyncing, setIsResyncing] = useState(false);
    const [lastResyncTime, setLastResyncTime] = useState('Just now');
    const [resyncSuccess, setResyncSuccess] = useState(false);
    const [saveSavedNotice, setSaveSavedNotice] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'visual' | 'typography' | 'audio'>('all');

    // ── Real Live System Diagnostics State ─────────────────────────────────────
    const [fps, setFps] = useState<number>(60);
    const [memoryMb, setMemoryMb] = useState<string>('38.4 MB');
    const [gpuName, setGpuName] = useState<string>('WebGL 2.0 Hardware Accelerated');
    const [screenRes, setScreenRes] = useState<string>('1920x1080');
    const [storageSizeKb, setStorageSizeKb] = useState<string>('1.2 KB');

    const totalCatalogNodes = STARS.length + SOLAR_SYSTEM.length;

    // Mesure réelle des métriques système (FPS, GPU, Mémoire, Écran, Storage)
    useEffect(() => {
        let frameCount = 0;
        let lastTime = performance.now();
        let animId: number;

        // Calcul FPS réel en temps réel
        const calcFps = () => {
            frameCount++;
            const now = performance.now();
            if (now - lastTime >= 1000) {
                setFps(Math.round((frameCount * 1000) / (now - lastTime)));
                frameCount = 0;
                lastTime = now;
            }
            animId = requestAnimationFrame(calcFps);
        };
        animId = requestAnimationFrame(calcFps);

        // Informations d'affichage & matériel
        if (typeof window !== 'undefined') {
            setScreenRes(`${window.innerWidth}x${window.innerHeight} @ ${window.devicePixelRatio.toFixed(1)}x DPR`);

            // Information GPU réelle via le renderer WebGL existant (sans re-créer de contexte WebGL)
            try {
                if (engineRenderer?.current) {
                    const gl = engineRenderer.current.getContext();
                    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                    if (debugInfo) {
                        const rendererParam = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                        if (rendererParam) {
                            setGpuName(rendererParam.replace(/^ANGLE \((.*)\)$/, '$1').replace(/Direct3D11 vs_.*$/, '').trim());
                        }
                    }
                }
            } catch {
                // Fallback safe
            }

            // Calcul Taille mémoire & localStorage
            const updateDiagnostics = () => {
                const mem = (performance as any).memory;
                if (mem?.usedJSHeapSize) {
                    setMemoryMb(`${(mem.usedJSHeapSize / (1024 * 1024)).toFixed(1)} MB / ${(mem.jsHeapSizeLimit / (1024 * 1024)).toFixed(0)} MB`);
                } else {
                    setMemoryMb('Heap Optimal (Browser Shield)');
                }

                let totalBytes = 0;
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k) totalBytes += (localStorage.getItem(k) || '').length;
                }
                setStorageSizeKb(`${(totalBytes / 1024).toFixed(2)} KB`);
            };

            updateDiagnostics();
            const interval = setInterval(updateDiagnostics, 3000);

            return () => {
                cancelAnimationFrame(animId);
                clearInterval(interval);
            };
        }
    }, []);

    // Action de re-synchronisation réelle du système
    const handleResync = () => {
        if (isResyncing) return;
        setIsResyncing(true);
        setResyncSuccess(false);

        // Déclencher un redimensionnement WebGL et ré-appliquer les variables CSS
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('resize'));
            document.documentElement.style.fontSize = `${fontSizeScale}%`;
            document.documentElement.style.setProperty('--tooltip-font-size', `${tooltipFontSize}px`);
            document.documentElement.style.setProperty('--basalt-opacity', (interfaceOpacity / 100).toString());
            document.documentElement.style.setProperty('--ambient-occlusion', (ambientOcclusion / 100).toString());
            document.documentElement.setAttribute('data-hyperspatial', hyperSpatialRendering ? 'true' : 'false');
        }

        setTimeout(() => {
            setIsResyncing(false);
            setResyncSuccess(true);
            setLastResyncTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            setTimeout(() => setResyncSuccess(false), 4000);
        }, 1200);
    };

    const handleSaveSettings = () => {
        setFontSizeScale(fontSizeScale);
        setTooltipFontSize(tooltipFontSize);
        setInterfaceOpacity(interfaceOpacity);
        setAmbientOcclusion(ambientOcclusion);
        setHyperSpatialRendering(hyperSpatialRendering);

        setSaveSavedNotice(true);
        setTimeout(() => setSaveSavedNotice(false), 3000);
    };

    const handleResetDefaults = () => {
        setFontSizeScale(100);
        setTooltipFontSize(9);
        setInterfaceOpacity(85);
        setAmbientOcclusion(85);
        setHyperSpatialRendering(true);
        setCosmicResonance(true);
        setInterfaceVolume(60);
        setRootEncryption(false);
        setBiometricLink(true);

        setSaveSavedNotice(true);
        setTimeout(() => setSaveSavedNotice(false), 2000);
    };

    const tabs = [
        { id: 'all', label: 'All Settings', icon: Sliders },
        { id: 'visual', label: 'Visual Core', icon: Eye },
        { id: 'typography', label: 'Typography & Tooltips', icon: Type },
        { id: 'audio', label: 'Audio & Access', icon: Volume2 },
    ];

    const showSection = (tabId: string) => activeTab === 'all' || activeTab === tabId;

    return (
        <div className="w-full min-h-full p-3 sm:p-6 md:p-8 flex flex-col gap-5 sm:gap-8 max-w-5xl mx-auto pointer-events-auto pb-40 select-none">
            {/* Header des paramètres responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:px-8 sm:py-6 bg-black/70 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl">
                <div className="flex flex-col gap-1 sm:gap-1.5">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <Settings size={16} className="text-[var(--accent-primary)] animate-spin-slow sm:w-5 sm:h-5" />
                        <span className="font-mono text-[8px] sm:text-[9px] uppercase font-black text-white/40 tracking-[0.3em] sm:tracking-[0.4em]">System_Calibration</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-white tracking-wider sm:tracking-widest">Core_Settings</h2>
                </div>

                {/* Actions Header (Save & Reset) responsive */}
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleResetDefaults}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl sm:rounded-2xl text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                        title="Reset all settings to default values"
                    >
                        <RotateCcw size={12} />
                        Defaults
                    </button>
                    <button
                        onClick={handleSaveSettings}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 sm:gap-2.5 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[8px] sm:text-[9px] font-mono font-black uppercase tracking-wider sm:tracking-widest transition-all cursor-pointer border ${
                            saveSavedNotice
                                ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                : 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)]/40 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-black shadow-[0_0_20px_rgba(77,238,234,0.15)]'
                        }`}
                    >
                        {saveSavedNotice ? <Check size={14} /> : <Settings size={14} />}
                        {saveSavedNotice ? 'Saved!' : 'Save Modifications'}
                    </button>
                </div>
            </div>

            {/* Onglets de filtrage (Grid Responsive 100% visible) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full bg-black/80 backdrop-blur-2xl p-2 rounded-2xl border border-white/10 shadow-2xl">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center justify-center gap-2 sm:gap-2.5 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl text-[8.5px] sm:text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer text-center w-full truncate ${
                                isActive
                                    ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 shadow-[0_0_20px_rgba(77,238,234,0.25)]'
                                    : 'bg-white/5 border border-white/8 text-white/60 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <Icon size={14} className={`shrink-0 ${isActive ? 'text-[var(--accent-primary)]' : 'text-white/40'}`} />
                            <span className="truncate">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Grille des sections responsive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 pb-12">
                {/* 1. VISUAL CORE */}
                {showSection('visual') && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="monolith-panel !bg-black/80 !backdrop-blur-3xl !rounded-2xl sm:!rounded-[2.5rem] md:!rounded-[3rem] p-5 sm:p-7 md:p-8 space-y-5 sm:space-y-7 shadow-2xl"
                    >
                        <div className="flex items-center gap-3.5 sm:gap-4 border-b border-white/10 pb-3.5 sm:pb-4">
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--accent-primary)] flex-shrink-0">
                                <Eye size={18} />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">Visual Core</h3>
                                <p className="text-[7.5px] sm:text-[8px] font-mono text-[#6c6c7a] uppercase">Rendu graphique et opacité d'interface</p>
                            </div>
                        </div>

                        <div className="space-y-5 sm:space-y-6">
                            {/* Hyper-Spatial Rendering */}
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-wider block">Hyper-Spatial Rendering</span>
                                        <span className="text-[7.5px] sm:text-[8px] font-mono text-[#6c6c7a]">Effets CRT, grain cinématographique & scanlines</span>
                                    </div>
                                    <button 
                                        onClick={() => setHyperSpatialRendering(!hyperSpatialRendering)}
                                        className={`w-11 sm:w-12 h-5.5 sm:h-6 rounded-full p-1 transition-colors cursor-pointer flex-shrink-0 ${hyperSpatialRendering ? 'bg-[var(--accent-primary)]' : 'bg-white/10'}`}
                                    >
                                        <div className={`w-3.5 sm:w-4 h-3.5 sm:h-4 rounded-full bg-black transition-transform ${hyperSpatialRendering ? 'translate-x-5.5 sm:translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Interface Opacity */}
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] sm:text-[10px] font-black text-[#6c6c7a] uppercase tracking-widest">Interface Panel Opacity</span>
                                    <span className="text-[8.5px] sm:text-[9px] font-mono text-[var(--accent-primary)] font-black">{interfaceOpacity}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    className="slider-pill w-full" 
                                    value={interfaceOpacity} 
                                    onChange={(e) => setInterfaceOpacity(parseInt(e.target.value, 10))}
                                    min="20"
                                    max="100"
                                />
                            </div>

                            {/* Ambient Occlusion */}
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] sm:text-[10px] font-black text-[#6c6c7a] uppercase tracking-widest">Ambient Depth Intensity</span>
                                    <span className="text-[8.5px] sm:text-[9px] font-mono text-[var(--accent-primary)] font-black">{ambientOcclusion}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    className="slider-pill w-full" 
                                    value={ambientOcclusion} 
                                    onChange={(e) => setAmbientOcclusion(parseInt(e.target.value, 10))}
                                    min="0"
                                    max="100"
                                />
                            </div>

                            {/* Live Glassmorphism Preview */}
                            <div 
                                className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white/15 space-y-1.5 transition-all shadow-xl"
                                style={{ backgroundColor: `rgba(20, 20, 23, ${interfaceOpacity / 100})` }}
                            >
                                <span className="text-[7.5px] sm:text-[8px] font-mono uppercase text-[var(--accent-primary)] font-black tracking-widest block">Live Visual Core Preview</span>
                                <p className="text-[8.5px] sm:text-[9px] text-white/80 font-mono leading-tight">
                                    Panel Opacity: <span className="text-white font-bold">{interfaceOpacity}%</span> | Scanlines: <span className="text-emerald-400 font-bold">{hyperSpatialRendering ? 'ACTIVE' : 'OFF'}</span>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 2. TYPOGRAPHY & TOOLTIPS */}
                {showSection('typography') && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="monolith-panel !bg-black/80 !backdrop-blur-3xl !rounded-2xl sm:!rounded-[2.5rem] md:!rounded-[3rem] p-5 sm:p-7 md:p-8 space-y-5 sm:space-y-7 shadow-2xl"
                    >
                        <div className="flex items-center gap-3.5 sm:gap-4 border-b border-white/10 pb-3.5 sm:pb-4">
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--accent-primary)] flex-shrink-0">
                                <Type size={18} />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">Typography & Tooltips</h3>
                                <p className="text-[7.5px] sm:text-[8px] font-mono text-[#6c6c7a] uppercase">Taille de police globale et réglage des tooltips</p>
                            </div>
                        </div>

                        <div className="space-y-5 sm:space-y-6">
                            {/* Global Font Scale */}
                            <div className="flex flex-col gap-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] sm:text-[10px] font-black text-[#6c6c7a] uppercase tracking-widest">Global Font Scale</span>
                                    <span className="text-[8.5px] sm:text-[9px] font-mono text-[var(--accent-primary)] font-black">{fontSizeScale}% ({((10 * 0.75 * fontSizeScale) / 100).toFixed(1)} pt base)</span>
                                </div>
                                <input 
                                    type="range" 
                                    className="slider-pill w-full" 
                                    value={fontSizeScale} 
                                    onChange={(e) => setFontSizeScale(parseInt(e.target.value, 10))}
                                    min="80"
                                    max="125"
                                    step="5"
                                />
                                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
                                    {[
                                        { label: 'Compact (85%)', val: 85 },
                                        { label: 'Standard (100%)', val: 100 },
                                        { label: 'Large (115%)', val: 115 },
                                    ].map((preset) => (
                                        <button
                                            key={preset.val}
                                            onClick={() => setFontSizeScale(preset.val)}
                                            className={`py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[7.5px] sm:text-[8px] font-mono font-bold uppercase tracking-wider transition-all border cursor-pointer text-center truncate ${
                                                fontSizeScale === preset.val
                                                    ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tooltip Font Size Specific Control */}
                            <div className="flex flex-col gap-2.5 pt-2 border-t border-white/8">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-wider block">Tooltip Font Size</span>
                                        <span className="text-[7.5px] sm:text-[8px] font-mono text-[#6c6c7a]">Taille spécifique des tooltips d'icônes & sidebar</span>
                                    </div>
                                    <span className="text-[8.5px] sm:text-[9px] font-mono text-[var(--accent-primary)] font-black flex-shrink-0">{tooltipFontSize}px ({(tooltipFontSize * 0.75).toFixed(1)}pt)</span>
                                </div>
                                <input 
                                    type="range" 
                                    className="slider-pill w-full" 
                                    value={tooltipFontSize} 
                                    onChange={(e) => setTooltipFontSize(parseInt(e.target.value, 10))}
                                    min="7"
                                    max="14"
                                    step="1"
                                />
                                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
                                    {[
                                        { label: 'Small (7px)', val: 7 },
                                        { label: 'Standard (9px)', val: 9 },
                                        { label: 'Large (12px)', val: 12 },
                                    ].map((preset) => (
                                        <button
                                            key={preset.val}
                                            onClick={() => setTooltipFontSize(preset.val)}
                                            className={`py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[7.5px] sm:text-[8px] font-mono font-bold uppercase tracking-wider transition-all border cursor-pointer text-center truncate ${
                                                tooltipFontSize === preset.val
                                                    ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Interactive Tooltip Preview Widget responsive */}
                            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 overflow-x-auto">
                                <div className="flex items-center gap-2">
                                    <MessageSquare size={12} className="text-[var(--accent-primary)]" />
                                    <span className="text-[7.5px] sm:text-[8px] font-mono uppercase text-[#6c6c7a] font-bold">Live Tooltip Preview</span>
                                </div>
                                <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
                                    <div className="w-8 h-8 rounded-xl bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 flex items-center justify-center text-[var(--accent-primary)] flex-shrink-0">
                                        <Eye size={14} />
                                    </div>
                                    {/* Tooltip Sample */}
                                    <div 
                                        className="px-3 py-1.5 rounded-xl bg-black/95 border border-white/15 backdrop-blur-2xl text-white font-mono font-bold uppercase tracking-wider shadow-xl flex items-center gap-2 max-w-full overflow-hidden truncate"
                                        style={{ fontSize: `${tooltipFontSize}px` }}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse flex-shrink-0" />
                                        <span className="truncate">Sample Tooltip ({tooltipFontSize}px)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 3. NEURAL AUDIO & ACCESS CONTROL */}
                {showSection('audio') && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="monolith-panel !bg-black/80 !backdrop-blur-3xl !rounded-2xl sm:!rounded-[2.5rem] md:!rounded-[3rem] p-5 sm:p-7 md:p-8 space-y-5 sm:space-y-7 shadow-2xl"
                        >
                            <div className="flex items-center gap-3.5 sm:gap-4 border-b border-white/10 pb-3.5 sm:pb-4">
                                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--accent-primary)] flex-shrink-0">
                                    <Volume2 size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">Neural Audio</h3>
                                    <p className="text-[7.5px] sm:text-[8px] font-mono text-[#6c6c7a] uppercase">Sons d'ambiance et retours haptiques/sonores</p>
                                </div>
                            </div>

                            <div className="space-y-5 sm:space-y-6">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[9px] sm:text-[10px] font-black text-[#6c6c7a] uppercase tracking-widest">Cosmic Resonance</span>
                                    <button 
                                        onClick={() => setCosmicResonance(!cosmicResonance)}
                                        className={`w-11 sm:w-12 h-5.5 sm:h-6 rounded-full p-1 transition-colors cursor-pointer flex-shrink-0 ${cosmicResonance ? 'bg-[var(--accent-primary)]' : 'bg-white/10'}`}
                                    >
                                        <div className={`w-3.5 sm:w-4 h-3.5 sm:h-4 rounded-full bg-black transition-transform ${cosmicResonance ? 'translate-x-5.5 sm:translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] sm:text-[10px] font-black text-[#6c6c7a] uppercase tracking-widest">Interface Feedback Volume</span>
                                        <span className="text-[8.5px] sm:text-[9px] font-mono text-white font-black">{interfaceVolume}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        className="slider-pill w-full" 
                                        value={interfaceVolume} 
                                        onChange={(e) => setInterfaceVolume(parseInt(e.target.value, 10))}
                                        min="0"
                                        max="100"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="monolith-panel !bg-black/80 !backdrop-blur-3xl !rounded-2xl sm:!rounded-[2.5rem] md:!rounded-[3rem] p-5 sm:p-7 md:p-8 space-y-5 sm:space-y-7 shadow-2xl"
                        >
                            <div className="flex items-center gap-3.5 sm:gap-4 border-b border-white/10 pb-3.5 sm:pb-4">
                                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--accent-primary)] flex-shrink-0">
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">Access Control</h3>
                                    <p className="text-[7.5px] sm:text-[8px] font-mono text-[#6c6c7a] uppercase">Cryptage racine et sécurité biométrique</p>
                                </div>
                            </div>

                            <div className="space-y-5 sm:space-y-6">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[9px] sm:text-[10px] font-black text-[#6c6c7a] uppercase tracking-widest">Root Encryption</span>
                                    <button 
                                        onClick={() => setRootEncryption(!rootEncryption)}
                                        className={`w-11 sm:w-12 h-5.5 sm:h-6 rounded-full p-1 transition-colors cursor-pointer flex-shrink-0 ${rootEncryption ? 'bg-[var(--accent-primary)]' : 'bg-white/10'}`}
                                    >
                                        <div className={`w-3.5 sm:w-4 h-3.5 sm:h-4 rounded-full bg-black transition-transform ${rootEncryption ? 'translate-x-5.5 sm:translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[9px] sm:text-[10px] font-black text-[#6c6c7a] uppercase tracking-widest">Biometric Link</span>
                                    <button 
                                        onClick={() => setBiometricLink(!biometricLink)}
                                        className={`w-11 sm:w-12 h-5.5 sm:h-6 rounded-full p-1 transition-colors cursor-pointer flex-shrink-0 ${biometricLink ? 'bg-[var(--accent-primary)]' : 'bg-white/10'}`}
                                    >
                                        <div className={`w-3.5 sm:w-4 h-3.5 sm:h-4 rounded-full bg-black transition-transform ${biometricLink ? 'translate-x-5.5 sm:translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}

                {/* Section Diagnostic & Statut Système RÉEL (Moteur de télémétrie matérielle) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="monolith-panel !rounded-2xl sm:!rounded-[2.5rem] md:!rounded-[3rem] !bg-black/90 border border-white/15 p-6 sm:p-8 flex flex-col gap-6 md:col-span-2 text-left"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] flex-shrink-0">
                                <Cpu size={24} className={isResyncing ? "animate-spin text-[var(--accent-primary)]" : "animate-pulse"} />
                            </div>
                            <div>
                                <h4 className="text-white font-black uppercase text-sm sm:text-base tracking-widest flex items-center gap-2">
                                    Advanced Diagnostics Engine
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                </h4>
                                <p className="text-[#6c6c7a] text-[8px] sm:text-[9px] font-mono uppercase">Métriques matérielles, rendu WebGL 3D & performances en temps réel</p>
                            </div>
                        </div>

                        {/* Trigger Re-Sync */}
                        <button 
                            onClick={handleResync}
                            disabled={isResyncing}
                            className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl text-[8.5px] sm:text-[9px] font-mono font-black uppercase tracking-widest transition-all cursor-pointer border ${
                                resyncSuccess
                                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                    : 'bg-white/5 border border-white/10 text-white hover:bg-[var(--accent-primary)] hover:text-black shadow-[0_0_15px_rgba(77,238,234,0.15)]'
                            }`}
                        >
                            <RefreshCcw size={14} className={isResyncing ? "animate-spin" : ""} /> 
                            {isResyncing ? "Calibrating Sensors..." : resyncSuccess ? `✓ Synced (${totalCatalogNodes} Nodes)` : "Re-Sync Systems"}
                        </button>
                    </div>

                    {/* Grille des 4 Métriques Réelles Système */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        {/* FPS Réel */}
                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/8 space-y-1">
                            <div className="flex items-center gap-2 text-[#6c6c7a]">
                                <Zap size={12} className="text-amber-400" />
                                <span className="text-[7.5px] sm:text-[8px] font-mono font-bold uppercase">Live FPS</span>
                            </div>
                            <p className="text-base sm:text-lg font-mono font-black text-white">{fps} <span className="text-[9px] text-emerald-400">FPS</span></p>
                        </div>

                        {/* Heap Mémoire Réel */}
                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/8 space-y-1">
                            <div className="flex items-center gap-2 text-[#6c6c7a]">
                                <HardDrive size={12} className="text-[var(--accent-primary)]" />
                                <span className="text-[7.5px] sm:text-[8px] font-mono font-bold uppercase">JS Heap Memory</span>
                            </div>
                            <p className="text-xs sm:text-sm font-mono font-black text-white truncate">{memoryMb}</p>
                        </div>

                        {/* Nœuds Catalogue */}
                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/8 space-y-1">
                            <div className="flex items-center gap-2 text-[#6c6c7a]">
                                <Activity size={12} className="text-cyan-400" />
                                <span className="text-[7.5px] sm:text-[8px] font-mono font-bold uppercase">Catalog Nodes</span>
                            </div>
                            <p className="text-base sm:text-lg font-mono font-black text-white">{totalCatalogNodes} <span className="text-[9px] text-[#6c6c7a]">Objects</span></p>
                        </div>

                        {/* Résolution Écran & DPR */}
                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/8 space-y-1">
                            <div className="flex items-center gap-2 text-[#6c6c7a]">
                                <Monitor size={12} className="text-purple-400" />
                                <span className="text-[7.5px] sm:text-[8px] font-mono font-bold uppercase">Viewport DPR</span>
                            </div>
                            <p className="text-[10px] sm:text-xs font-mono font-black text-white truncate">{screenRes}</p>
                        </div>
                    </div>

                    {/* GPU & Performance detail */}
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="text-[8.5px] sm:text-[9px] font-mono font-black text-white uppercase truncate">
                                GPU Acceleration: <span className="text-[var(--accent-primary)]">{gpuName}</span>
                            </span>
                        </div>
                        <div className="text-[8px] font-mono text-[#6c6c7a] uppercase">
                            Storage Footprint: <span className="text-white font-bold">{storageSizeKb}</span> | Last Calibration: <span className="text-white font-bold">{lastResyncTime}</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
