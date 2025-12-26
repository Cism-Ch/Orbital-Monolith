
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from './components/Layout';
import { SolarSystemView } from './components/SolarSystemView';
import { SkyMapView } from './components/SkyMapView';
import { CelestialBody3D } from './components/CelestialBody3D';
import { CelestialBody, AppState, CelestialType } from './types';
import { SOLAR_SYSTEM, STARS } from './constants';
import { calculateDistance, searchCelestial } from './services/celestialService';
import { Search, Map as MapIcon, Globe, Ruler, Activity, Info, Command, Maximize2, ChevronLeft, Zap, Satellite, Target, AlertTriangle, Cpu, Terminal, ShieldCheck, Database } from 'lucide-react';

const ALL_BODIES = [...SOLAR_SYSTEM, ...STARS];

// Simulated Telemetry Stream for Focus Mode
const TelemetryStream = () => {
    const [lines, setLines] = useState<string[]>([]);
    useEffect(() => {
        const interval = setInterval(() => {
            const hex = Array.from({ length: 4 }, () => Math.floor(Math.random() * 65536).toString(16).padStart(4, '0')).join(':');
            setLines(prev => [hex, ...prev].slice(0, 15));
        }, 150);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="font-mono text-[8px] text-white/5 opacity-50 select-none">
            {lines.map((line, i) => (
                <div key={i} className="mb-1">{line}</div>
            ))}
        </div>
    );
};

const App: React.FC = () => {
    const [state, setState] = useState<AppState>({
        view: 'SOLAR',
        selectedBody: SOLAR_SYSTEM[0],
        distancePoints: [],
        searchQuery: '',
        isFocusMode: false,
        skyOrientation: { rotation: 0, inclination: 0 },
        solarOrientation: { rotation: 0, inclination: 60 }
    });

    const [hoveredBody, setHoveredBody] = useState<CelestialBody | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 100);
        const loadTimer = setTimeout(() => setIsLoaded(true), 1200);
        return () => {
            clearInterval(timer);
            clearTimeout(loadTimer);
        };
    }, []);

    useEffect(() => {
        const body = state.selectedBody || hoveredBody || SOLAR_SYSTEM[0];
        const root = document.documentElement;
        root.style.setProperty('--accent-primary', body.colors[0]);
        root.style.setProperty('--accent-secondary', body.colors[1]);
    }, [state.selectedBody?.id, hoveredBody?.id]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            setState(prev => {
                const currentIndex = ALL_BODIES.findIndex(b => b.id === prev.selectedBody?.id);
                const nextIndex = (currentIndex + 1) % ALL_BODIES.length;
                return { ...prev, selectedBody: ALL_BODIES[nextIndex] };
            });
        }
        if (e.key === 's') {
            document.getElementById('celestial-search')?.focus();
        }
        if (e.key === 'v') {
            setState(prev => ({ ...prev, view: prev.view === 'SOLAR' ? 'SKY' : 'SOLAR' }));
        }
        if (e.key === 'f') {
            setState(prev => ({ ...prev, isFocusMode: !prev.isFocusMode }));
        }
        if (e.key === 'Escape') {
            setState(prev => ({ ...prev, isFocusMode: false }));
        }
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const handleSelect = useCallback((body: CelestialBody) => {
        setState(prev => ({ ...prev, selectedBody: body }));
    }, []);

    const toggleFocus = useCallback(() => {
        setState(prev => ({ ...prev, isFocusMode: !prev.isFocusMode }));
    }, []);

    const handleAddToDistance = useCallback((body: CelestialBody) => {
        setState(prev => {
            if (prev.distancePoints.length >= 2) return { ...prev, distancePoints: [body] };
            return { ...prev, distancePoints: [...prev.distancePoints, body] };
        });
    }, []);

    const searchResults = useMemo(() => {
        return state.searchQuery ? searchCelestial(state.searchQuery) : [];
    }, [state.searchQuery]);

    const solarSystemView = useMemo(() => (
        <SolarSystemView 
            onSelect={handleSelect} 
            onHover={setHoveredBody} 
            orientation={state.solarOrientation}
            setOrientation={(o) => setState(prev => ({...prev, solarOrientation: o}))}
        />
    ), [state.solarOrientation, handleSelect]);

    const skyMapView = useMemo(() => (
        <SkyMapView 
            onSelect={handleSelect} 
            onHover={setHoveredBody}
            orientation={state.skyOrientation}
            setOrientation={(o) => setState(prev => ({...prev, skyOrientation: o}))}
        />
    ), [state.skyOrientation, handleSelect]);

    return (
        <AnimatePresence>
            {!isLoaded ? (
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
            ) : (
                <motion.div key="main-app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                    <style dangerouslySetInnerHTML={{ __html: `
                        .app-dynamic-bg {
                            position: fixed; inset: 0; z-index: -1;
                            background: radial-gradient(circle at 50% 50%, var(--accent-secondary), #050506 80%);
                            opacity: 0.15; filter: blur(100px); pointer-events: none;
                        }
                        .animate-spin-slow { animation: spin 8s linear infinite; }
                        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                        .focus-grid { display: grid; grid-template-columns: 1fr 1fr; width: 100vw; height: 100vh; }
                        @media (max-width: 1024px) { .focus-grid { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; } }
                        .telemetry-col { position: absolute; right: 2rem; top: 8rem; }
                    ` }} />
                    <div className="app-dynamic-bg" />

                    <Layout
                        headerLeft={<motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-3">{state.selectedBody?.name || "TERMINAL"}<div className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full border border-white/10 opacity-40 font-mono tracking-widest uppercase">{state.selectedBody?.scientificName || "ID-UNKNOWN"}</div></motion.div>}
                        headerRight={<motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>{currentTime.getTime().toString().slice(0, 10)}<span className="opacity-30 text-sm">.{currentTime.getMilliseconds()}</span></motion.div>}
                        sidebarLeft={!state.isFocusMode && (
                            <div className="flex flex-col gap-6">
                                <div className="monolith-panel p-6 shadow-xl">
                                    <div className="flex items-center gap-2 mb-6"><div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" /><span className="font-mono text-[10px] uppercase text-[#6c6c7a] tracking-[0.2em] font-bold">Orbital Grid Control</span></div>
                                    <div className="flex flex-col gap-3">
                                        <button onClick={() => setState(p => ({ ...p, view: 'SOLAR' }))} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${state.view === 'SOLAR' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-lg shadow-[var(--accent-primary)]/10' : 'bg-white/5 border border-transparent hover:bg-white/10 opacity-70 hover:opacity-100'}`}><Globe size={18} /><span className="font-semibold text-sm uppercase tracking-wider">Planetary Sector</span></button>
                                        <button onClick={() => setState(p => ({ ...p, view: 'SKY' }))} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${state.view === 'SKY' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-lg shadow-[var(--accent-primary)]/10' : 'bg-white/5 border border-transparent hover:bg-white/10 opacity-70 hover:opacity-100'}`}><MapIcon size={18} /><span className="font-semibold text-sm uppercase tracking-wider">Deep Space Map</span></button>
                                    </div>
                                </div>
                                <div className="monolith-panel p-6 shadow-xl">
                                    <div className="flex items-center gap-2 mb-6"><div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" /><span className="font-mono text-[10px] uppercase text-[#6c6c7a] tracking-[0.2em] font-bold">Stellar Census</span></div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[ {v: 131, l: 'Local Objects'}, {v: 103, l: 'MS Stars'}, {v: 80, l: 'Red Dwarfs'}, {v: 21, l: 'Brown Dwarfs'} ].map(s => (
                                            <div key={s.l} className="bg-white/5 p-3 rounded-xl border border-white/5"><div className="text-[14px] font-black text-[var(--accent-primary)]">{s.v}</div><div className="text-[8px] uppercase text-white/30 font-bold">{s.l}</div></div>
                                        ))}
                                    </div>
                                </div>
                                <div className="monolith-panel p-6 shadow-xl">
                                    <div className="flex items-center gap-2 mb-6"><div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" /><span className="font-mono text-[10px] uppercase text-[#6c6c7a] tracking-[0.2em] font-bold">Vector Search</span></div>
                                    <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} /><input id="celestial-search" type="text" placeholder="SCAN GAIA CATALOG..." className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl font-mono text-xs focus:outline-none focus:border-[var(--accent-primary)] focus:ring-4 focus:ring-[var(--accent-primary)]/5 transition-all text-white placeholder:text-white/20" value={state.searchQuery} onChange={(e) => setState(p => ({ ...p, searchQuery: e.target.value }))} /></div>
                                    {searchResults.length > 0 && (
                                        <div className="mt-4 flex flex-col gap-2 max-h-[160px] overflow-y-auto custom-scrollbar border-t border-white/5 pt-4">
                                            {searchResults.map(b => (
                                                <button key={b.id} onClick={() => handleSelect(b)} className="monolith-card !p-3 flex justify-between items-center group"><span className="font-mono text-[11px] uppercase group-hover:text-[var(--accent-primary)] transition-colors">{b.name}</span><span className="text-[9px] opacity-30 font-mono tracking-tighter">IDENT::{b.scientificName}</span></button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        sidebarRight={!state.isFocusMode && (
                            <div className="flex flex-col gap-6">
                                <div className="monolith-panel p-6 shadow-xl relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" /><span className="font-mono text-[10px] uppercase text-[#6c6c7a] tracking-[0.2em] font-bold">Object Analysis</span></div><button onClick={toggleFocus} className="p-2 glass-button text-white/40 hover:text-[var(--accent-primary)]"><Maximize2 size={14} /></button></div>
                                    {state.selectedBody ? (
                                        <div className="flex flex-col gap-6">
                                            <div className="aspect-square w-full monolith-card !p-0 overflow-hidden bg-black/40 border-white/5 shadow-inner"><CelestialBody3D body={state.selectedBody} onClick={toggleFocus} /></div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5"><span className="font-mono text-[9px] text-[#6c6c7a] block uppercase mb-1 tracking-widest">Classification</span><span className="text-xs font-bold text-[var(--accent-primary)] uppercase">{state.selectedBody.type}</span></div>
                                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5"><span className="font-mono text-[9px] text-[#6c6c7a] block uppercase mb-1 tracking-widest">Mass Factor</span><span className="text-xs font-mono text-white/90">{state.selectedBody.properties.mass.split(' ')[0]}</span></div>
                                            </div>
                                            <p className="text-[11px] text-[#a1a1a6] leading-relaxed font-light bg-white/5 p-5 rounded-2xl border border-white/5 italic">"{state.selectedBody.description}"</p>
                                        </div>
                                    ) : <div className="text-[10px] text-white/10 uppercase text-center py-16 font-mono tracking-widest">Searching...</div>}
                                </div>
                                <div className="monolith-panel p-6 shadow-xl">
                                    <div className="flex items-center gap-2 mb-6"><div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" /><span className="font-mono text-[10px] uppercase text-[#6c6c7a] tracking-[0.2em] font-bold">Astrometrical Bridge</span></div>
                                    <div className="flex flex-col gap-3">
                                        <button onClick={() => state.selectedBody && handleAddToDistance(state.selectedBody)} className="glass-button w-full p-4 flex items-center justify-between group"><span className="font-mono text-[10px] uppercase text-white/40 group-hover:text-[var(--accent-primary)] transition-colors">Anchor Alpha</span><span className="text-xs font-bold truncate max-w-[150px]">{state.distancePoints[0]?.name || '---'}</span></button>
                                        <button disabled={state.distancePoints.length === 0} onClick={() => state.selectedBody && handleAddToDistance(state.selectedBody)} className="glass-button w-full p-4 flex items-center justify-between group disabled:opacity-20"><span className="font-mono text-[10px] uppercase text-white/40 group-hover:text-[var(--accent-primary)] transition-colors">Anchor Beta</span><span className="text-xs font-bold truncate max-w-[150px]">{state.distancePoints[1]?.name || '---'}</span></button>
                                        <AnimatePresence>{state.distancePoints.length === 2 && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-5 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 rounded-3xl relative overflow-hidden shadow-lg"><div className="absolute top-0 right-0 p-2 opacity-10"><Target size={48} /></div><span className="font-mono text-[10px] text-[var(--accent-primary)] block mb-1 uppercase tracking-widest font-black">Spatial Delta</span><span className="text-2xl font-black text-[var(--accent-primary)] font-mono leading-none">{calculateDistance(state.distancePoints[0], state.distancePoints[1]).toFixed(4)} <span className="text-xs font-normal">UNIT</span></span></motion.div>
                                        )}</AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        )}
                        footer={<div className="flex w-full h-full items-center justify-between font-mono text-[10px]"><div className="flex items-center gap-6"><div className="flex items-center gap-3 text-[var(--accent-primary)] dynamic-accent-text font-bold"><Cpu size={14} className="animate-pulse" /><span>TERMINAL_ACTIVE // GAIA_MAP_v2.5</span></div><div className="h-4 w-px bg-white/10" /><div className="flex items-center gap-2 text-[#6c6c7a]"><Zap size={12} /><span className="uppercase">Core Stability: 99.8%</span></div></div><div className="flex items-center gap-8"><div className="flex gap-4 text-[#6c6c7a] uppercase font-bold"><span>MAPPED::1.0B STARS</span><span>LIMIT::V=20</span></div><div className="h-4 w-px bg-white/10" /><div className="text-[#6c6c7a] uppercase">Session: {Math.floor(currentTime.getTime()/1000 % 10000)}s</div></div></div>}
                    >
                        <AnimatePresence mode="wait">
                            {state.isFocusMode && state.selectedBody ? (
                                <motion.div 
                                    key="focus-mode" 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    exit={{ opacity: 0 }} 
                                    className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-0 m-0 overflow-hidden"
                                >
                                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle at 30% 50%, var(--accent-primary), transparent 60%)` }} />
                                    
                                    {/* HUD Elements */}
                                    <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-[110]">
                                        <motion.button 
                                            whileHover={{ scale: 1.05 }} 
                                            whileTap={{ scale: 0.95 }} 
                                            onClick={toggleFocus} 
                                            className="p-4 glass-button flex items-center gap-4 group shadow-2xl rounded-full px-8"
                                        >
                                            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                                            <span className="font-black text-[10px] uppercase tracking-[0.4em]">Terminate Link</span>
                                        </motion.button>
                                        <div className="flex flex-col items-end gap-2 font-mono text-[10px] uppercase text-white/30 tracking-widest">
                                            <div className="flex items-center gap-3">
                                                <span>Encryption: AES-256</span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span>Data Link: NOMINAL</span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="telemetry-col hidden lg:block">
                                        <div className="flex items-center gap-2 mb-2 text-[var(--accent-primary)] opacity-50">
                                            <Database size={12} />
                                            <span className="font-mono text-[10px] uppercase tracking-widest">Real-time Stream</span>
                                        </div>
                                        <TelemetryStream />
                                    </div>

                                    <div className="focus-grid">
                                         <div className="relative group w-full h-full flex items-center justify-center">
                                            <div className="absolute w-[80%] h-[80%] border border-white/5 rounded-full pointer-events-none" />
                                            <div className="absolute w-[90%] h-[90%] border border-white/5 rounded-full border-dashed opacity-20 animate-spin-slow pointer-events-none" />
                                            <CelestialBody3D body={state.selectedBody} onClick={toggleFocus} />
                                         </div>

                                         <div className="flex flex-col gap-10 p-12 lg:p-24 overflow-y-auto max-h-full custom-scrollbar bg-black/60 backdrop-blur-3xl border-l border-white/10 relative">
                                             <div className="absolute top-0 right-0 p-8 opacity-5">
                                                <Terminal size={400} />
                                             </div>
                                             
                                             <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="border-l-[12px] border-[var(--accent-primary)] pl-12 relative z-10">
                                                 <div className="flex items-center gap-3 mb-6">
                                                     <div className="px-3 py-1 bg-[var(--accent-primary)] text-black font-black text-[10px] uppercase tracking-widest rounded-sm">Archive Profile 8.0</div>
                                                     <span className="font-mono text-[10px] uppercase text-[#6c6c7a] tracking-[0.4em] font-bold">Data Lock Active</span>
                                                 </div>
                                                 <p className="text-4xl md:text-6xl lg:text-7xl text-white font-extralight leading-[1.1] tracking-tighter max-w-2xl">{state.selectedBody.description}</p>
                                             </motion.div>

                                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                                                 {[ 
                                                     { l: 'MASS SPECTROMETRY', v: state.selectedBody.properties.mass, i: <Satellite size={24}/>, d: 'Core mass density projection' }, 
                                                     { l: 'THERMAL GRADIENT', v: state.selectedBody.properties.temp, i: <Zap size={24}/>, d: 'Surface equilibrium temperature' }, 
                                                     { l: 'ORBITAL CYCLE', v: state.selectedBody.properties.period || 'STATIONARY', i: <Activity size={24}/>, d: 'Sidereal orbital duration' }, 
                                                     { l: 'GEOMETRIC SCALE', v: state.selectedBody.properties.radius, i: <Globe size={24}/>, d: 'Volumetric radius measurement' } 
                                                 ].map((s, i) => (
                                                     <motion.div 
                                                        key={s.l} 
                                                        initial={{ opacity: 0, y: 40 }} 
                                                        animate={{ opacity: 1, y: 0 }} 
                                                        transition={{ delay: 0.3 + i * 0.1 }} 
                                                        className="monolith-panel !p-10 !bg-white/[0.03] border-white/5 shadow-2xl flex flex-col gap-5 !rounded-[2.5rem] group hover:bg-[var(--accent-primary)]/5 transition-colors border hover:border-[var(--accent-primary)]/20"
                                                     >
                                                         <div className="flex items-center gap-4 text-[#6c6c7a]">
                                                             <span className="p-3 bg-white/5 rounded-2xl group-hover:text-[var(--accent-primary)] transition-colors">{s.i}</span>
                                                             <div className="flex flex-col">
                                                                <span className="font-mono text-[11px] uppercase font-black tracking-widest text-white/80">{s.l}</span>
                                                                <span className="font-mono text-[8px] uppercase tracking-widest opacity-40">{s.d}</span>
                                                             </div>
                                                         </div>
                                                         <span className="text-3xl md:text-5xl font-black text-white tracking-tighter truncate leading-none">{s.v}</span>
                                                         <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                                                            <motion.div initial={{ width: 0 }} animate={{ width: '70%' }} transition={{ duration: 1.5, delay: 0.8 }} className="h-full bg-[var(--accent-primary)] opacity-40" />
                                                         </div>
                                                     </motion.div>
                                                 ))}
                                             </div>

                                             <motion.div 
                                                initial={{ opacity: 0 }} 
                                                animate={{ opacity: 1 }} 
                                                transition={{ delay: 0.8 }} 
                                                className="monolith-panel !p-12 !bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/20 shadow-inner !rounded-[3rem] relative z-10"
                                             >
                                                 <div className="flex items-center gap-5 mb-6">
                                                     <div className="p-4 bg-[var(--accent-primary)]/20 rounded-full text-[var(--accent-primary)] shadow-[0_0_20px_rgba(77,238,234,0.2)]">
                                                        <ShieldCheck size={24} />
                                                     </div>
                                                     <div className="flex flex-col">
                                                        <span className="font-mono text-[14px] uppercase text-white tracking-[0.3em] font-black">Observation Protocol</span>
                                                        <span className="font-mono text-[9px] uppercase text-[#6c6c7a] tracking-widest">Neural Link v4.2 Stable</span>
                                                     </div>
                                                 </div>
                                                 <p className="text-[18px] md:text-[24px] text-white/90 leading-relaxed font-light font-mono italic">
                                                     "Advanced telemetry mapping indicates deep-seated geological stability. Energy signature is consistent with class-A celestial protocols. Remote synchronization with the GAIA network is holding at 99.8% signal integrity."
                                                 </p>
                                             </motion.div>
                                         </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="normal-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full relative">
                                    {state.view === 'SOLAR' ? solarSystemView : skyMapView}
                                    <AnimatePresence>
                                        {hoveredBody && (
                                            <motion.div initial={{ opacity: 0, y: 30, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, scale: 0.9, x: '-50%' }} className="absolute bottom-20 left-1/2 monolith-panel !rounded-[4rem] p-10 px-20 border-[var(--accent-primary)]/50 z-50 shadow-[0_0_120px_rgba(0,0,0,0.9)] pointer-events-none" style={{ background: 'rgba(5, 5, 6, 0.95)' }}>
                                                <div className="flex flex-col items-center">
                                                    <div className="text-[11px] uppercase text-white/30 mb-5 tracking-[0.8em] font-black">Scanning Target ID</div>
                                                    <div className="text-6xl font-black uppercase tracking-tighter text-[var(--accent-primary)] dynamic-accent-text leading-none">{hoveredBody.name}</div>
                                                    <div className="h-px w-64 bg-white/10 my-8" />
                                                    <div className="flex gap-16 font-mono text-[13px] text-white/40 uppercase font-bold tracking-widest">
                                                        <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-[var(--accent-primary)]"/> POS::{hoveredBody.position.x.toFixed(2)}</div>
                                                        <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-[var(--accent-primary)]"/> RAD::{hoveredBody.distance}</div>
                                                        <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-[var(--accent-primary)]"/> TEMP::{hoveredBody.properties.temp}</div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default App;
