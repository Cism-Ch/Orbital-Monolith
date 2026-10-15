"use client";

/**
 * @file app/dashboard/layout.tsx
 * @description Layout principal du dashboard Orbital Monolith v3.
 *
 * Architecture SPA :
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  UniverseEngineProvider (WebGL unique, persistant)                      │
 * │  ┌─────────────────────────────────────────────────────────────────┐   │
 * │  │  #universe-viewport — canvas fixed z-0, toujours monté         │   │
 * │  │  ┌─────────────────────────────────────────────────────────┐   │   │
 * │  │  │  Vue 3D active (SolarSystem ou SkyMap) — overlay absolu │   │   │
 * │  │  └─────────────────────────────────────────────────────────┘   │   │
 * │  └─────────────────────────────────────────────────────────────────┘   │
 * │  Sidebar (z-50)  │  Contenu page (z-10, overlay)  │  Toolbox (z-60)   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Boîte à outils flottante (coin bas-gauche) :
 * - Auto-dépliante au focus (hover)
 * - Toggle SOLAR / SKY sans navigation
 * - Accès rapide aux fonctions du dashboard
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Compass, Database, Settings,
    Search, LogOut, Activity, Sparkles,
    Globe, Star, Ruler, Bell, X, Menu,
    ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { DashboardProvider, useDashboard } from '@/lib/DashboardContext';
import { UniverseEngineProvider, useUniverseEngine } from '@/lib/UniverseEngineContext';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { searchCelestial } from '@/services/celestialService';
import type { CelestialBody } from '@/types';

import { SceneControlPanel } from '@/components/ui/SceneControlPanel';

// ── Chargement dynamique SSR-free des scènes 3D ───────────────────────────────
const SolarSceneLogic = dynamic(
    () => import('@/components/view/SolarSystemView').then(m => m.SolarSystemView),
    { ssr: false }
);
const SkySceneLogic = dynamic(
    () => import('@/components/view/SkyMapView').then(m => m.SkyMapView),
    { ssr: false }
);

// ═════════════════════════════════════════════════════════════════════════════
// Composant interne (accès aux contextes DashboardProvider + UniverseEngine)
// ═════════════════════════════════════════════════════════════════════════════

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const {
        view, setView,
        searchQuery, setSearchQuery,
        selectedBody, setSelectedBody,
        setIsFocusMode,
        setHoveredBody,
        hoveredBody,
        toggleMeasuringMode,
        isMeasuringMode,
    } = useDashboard();

    // Récupère le containerRef du moteur pour monter le canvas
    const { containerRef: engineContainerRef } = useUniverseEngine();

    // Keyboard shortcut navigation
    useKeyboardNavigation();

    // State pour la sidebar escamotable
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    // State pour le tiroir de navigation mobile
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

    // Fermeture du drawer mobile lors d'un changement de page
    useEffect(() => {
        setIsMobileDrawerOpen(false);
    }, [pathname]);


    // ── Navigation sidebar ────────────────────────────────────────────────────

    const navItems = [
        { icon: LayoutDashboard, label: 'Sector Control',       href: '/dashboard'          },
        { icon: Compass,         label: 'Star Cartography',     href: '/dashboard/map'      },
        { icon: Database,        label: 'Gaia Archive',         href: '/dashboard/archive'  },
        { icon: Settings,        label: 'System Calibration',   href: '/dashboard/settings' },
    ];

    // ── Recherche ─────────────────────────────────────────────────────────────
    const searchResults = useMemo(
        () => searchQuery.trim() ? searchCelestial(searchQuery) : [],
        [searchQuery]
    );

    const handleSelectBody = useCallback((body: CelestialBody) => {
        setSelectedBody(body);
        setIsFocusMode(true);
        setSearchQuery('');
        if (pathname !== '/dashboard' && pathname !== '/dashboard/map') {
            router.push('/dashboard');
        }
    }, [setSelectedBody, setIsFocusMode, setSearchQuery, pathname, router]);

    // ── Boîte à outils flottante ──────────────────────────────────────────────
    const [toolboxOpen, setToolboxOpen] = useState(false);

    // Pages "opaques" : pas d'interaction 3D directe (archive, settings)
    const isOpaqueOverlay = ['/dashboard/archive', '/dashboard/settings'].includes(pathname ?? '');

    // Gestionnaires des scènes 3D (passés aux vues)
    const handleSelect = useCallback((body: CelestialBody) => {
        setSelectedBody(body);
        setIsFocusMode(true);
    }, [setSelectedBody, setIsFocusMode]);

    const handleHover = useCallback((body: CelestialBody | null) => {
        setHoveredBody(body);
    }, [setHoveredBody]);

    // State popover notifications
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    // Fermeture automatique sur Clic Extérieur & Touche Échap
    useEffect(() => {
        if (!showNotifications) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowNotifications(false);
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                const target = e.target as HTMLElement | null;
                if (!target?.closest('.notif-toggle-btn')) {
                    setShowNotifications(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotifications]);

    const systemNotifications = [
        { id: 1, title: 'GAIA Node Connected', text: 'Telemetry stream established at 12ms latency.', time: '2m ago' },
        { id: 2, title: 'Solar Flare Alert', text: 'Class M2.4 solar flare detected in Sector Sol-01.', time: '14m ago' },
        { id: 3, title: 'New Ephemeris Data', text: 'Gaia DR3 star position matrix updated.', time: '1h ago' },
    ];

    return (
        <div
            className="flex h-screen w-screen bg-[#050506] overflow-hidden font-mono"
        >
            {/* ═══════════════════════════════════════════════════════════════
                VIEWPORT 3D — Canvas WebGL persistant (jamais démonté)
                Position fixed, z-0 — en dessous de toute l'UI
                touchAction: none empêche le défilement tactile indésirable du navigateur
            ═══════════════════════════════════════════════════════════════ */}
            <div
                ref={engineContainerRef}
                id="universe-viewport"
                className="fixed inset-0 z-0"
                style={{
                    pointerEvents: isOpaqueOverlay ? 'none' : 'auto',
                    touchAction: 'none',
                }}
            >
                {/* Vue 3D active — en overlay absolu sur le canvas */}
                <div className="absolute inset-0 pointer-events-none">
                    {view === 'SOLAR'
                        ? <SolarSceneLogic onSelect={handleSelect} onHover={handleHover} />
                        : <SkySceneLogic   onSelect={handleSelect} onHover={handleHover} />
                    }
                </div>
            </div>

            {/* Grain cinématique (texture) */}
            <div className="grain fixed inset-0 z-[200] pointer-events-none" />
            {/* Scanline CRT */}
            <div className="scanline fixed pointer-events-none z-[199]" />

            {/* ═══════════════════════════════════════════════════════════════
                BOUTON MENU MOBILE HAMBURGER (md:hidden) — z-[110]
            ═══════════════════════════════════════════════════════════════ */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
                style={{ top: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
                className="md:hidden fixed left-3 z-[110] w-11 h-11 rounded-2xl bg-black/90 border border-white/20 backdrop-blur-2xl flex items-center justify-center text-[var(--accent-primary)] shadow-2xl pointer-events-auto cursor-pointer"
                aria-label="Toggle Mobile Navigation"
            >
                {isMobileDrawerOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>

            {/* Backdrop sombre flouté pour le tiroir mobile */}
            <AnimatePresence>
                {isMobileDrawerOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className="fixed inset-0 bg-black/75 backdrop-blur-md z-[95] md:hidden pointer-events-auto"
                    />
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════════════════════════════
                SIDEBAR ESCAMOTABLE & DRAWER MOBILE — Navigation principale (z-[100])
                Cachée par défaut sur PC (révélée au survol), coulissante sur mobile via bouton menu.
            ═══════════════════════════════════════════════════════════════ */}
            {/* Zone de détection du survol au bord gauche (desktop uniquement) */}
            <div
                className="hidden md:block fixed top-0 left-0 bottom-0 w-6 z-[99] cursor-pointer group"
                onMouseEnter={() => setIsSidebarHovered(true)}
                title="Survoler pour ouvrir la navigation"
            >
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-20 rounded-r-full bg-[var(--accent-primary)]/40 group-hover:bg-[var(--accent-primary)] group-hover:w-2 shadow-[0_0_15px_var(--accent-primary)] transition-all duration-300 animate-pulse" />
            </div>

            <aside
                onMouseEnter={() => setIsSidebarHovered(true)}
                onMouseLeave={() => setIsSidebarHovered(false)}
                className={`fixed top-0 left-0 bottom-0 z-[100] flex flex-col w-[260px] md:w-[72px] h-screen py-6 gap-6 items-center border-r border-white/10 bg-black/95 md:bg-black/85 backdrop-blur-2xl transition-transform duration-300 ease-in-out shadow-2xl ${
                    isMobileDrawerOpen
                        ? 'translate-x-0'
                        : isSidebarHovered
                            ? 'translate-x-0'
                            : '-translate-x-full'
                }`}
            >
                {/* Logo */}
                <div className="relative group flex items-center gap-3 w-full px-6 md:px-0 md:justify-center">
                    <Link href="/" onClick={() => setIsMobileDrawerOpen(false)}>
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-10 h-10 rounded-2xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-black transition-all cursor-pointer"
                        >
                            <Sparkles size={18} />
                        </motion.div>
                    </Link>
                    <span className="md:hidden font-mono font-black text-xs uppercase tracking-widest text-[var(--accent-primary)]">
                        Orbital Monolith
                    </span>
                    <div className="hidden md:flex absolute left-[52px] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-black/95 border border-[var(--accent-primary)]/30 backdrop-blur-2xl text-[var(--accent-primary)] font-mono font-bold uppercase tracking-wider whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 shadow-2xl z-[120] items-center gap-2" style={{ fontSize: 'var(--tooltip-font-size, 9px)' }}>
                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-black border-l border-b border-[var(--accent-primary)]/30" />
                        Orbital Monolith
                    </div>
                </div>

                {/* Nav items */}
                <nav className="flex flex-col gap-3 w-full px-4 md:px-0 md:items-center flex-1">
                    {navItems.map(item => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href} onClick={() => setIsMobileDrawerOpen(false)} className="relative group flex items-center gap-3.5 w-full md:w-auto md:justify-center min-h-[44px] px-3 md:px-0 rounded-2xl hover:bg-white/5 md:hover:bg-transparent">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${isActive
                                        ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 shadow-[0_0_20px_rgba(77,238,234,0.15)]'
                                        : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                                        }`}
                                >
                                    <item.icon size={18} />
                                </motion.div>
                                <span className="md:hidden font-mono text-[11px] font-bold uppercase tracking-wider text-white">
                                    {item.label}
                                </span>

                                {/* Tooltip PC */}
                                <div className="hidden md:flex absolute left-[52px] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-black/95 border border-white/15 backdrop-blur-2xl text-white font-mono font-bold uppercase tracking-wider whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 shadow-2xl z-[120] items-center gap-2" style={{ fontSize: 'var(--tooltip-font-size, 9px)' }}>
                                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-black border-l border-b border-white/15" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                                    {item.label}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Actions bas sidebar */}
                <div className="flex flex-col gap-3 w-full px-4 md:px-0 md:items-center relative">
                    {/* Notifications Button */}
                    <div className="relative group flex items-center gap-3.5 w-full md:w-auto md:justify-center notif-toggle-btn">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center cursor-pointer relative transition-all ${showNotifications ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 shadow-[0_0_15px_rgba(77,238,234,0.2)]' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
                        >
                            <Bell size={16} />
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-ping" />
                        </motion.div>
                        <span className="md:hidden font-mono text-[11px] font-bold uppercase tracking-wider text-white cursor-pointer" onClick={() => setShowNotifications(!showNotifications)}>
                            Alerts ({systemNotifications.length})
                        </span>

                        {/* Tooltip Notification PC */}
                        {!showNotifications && (
                            <div className="hidden md:flex absolute left-[52px] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-black/95 border border-white/15 backdrop-blur-2xl text-white font-mono font-bold uppercase tracking-wider whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 shadow-2xl z-[120] items-center gap-2" style={{ fontSize: 'var(--tooltip-font-size, 9px)' }}>
                                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-black border-l border-b border-white/15" />
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                                System Notifications
                            </div>
                        )}
                    </div>

                    {/* Télémétrie Shortcut */}
                    <div className="relative group flex items-center gap-3.5 w-full md:w-auto md:justify-center">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { router.push('/dashboard'); setIsMobileDrawerOpen(false); }}
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white/40 hover:text-[var(--accent-primary)] hover:bg-white/5 cursor-pointer"
                        >
                            <Activity size={16} />
                        </motion.div>
                        <span className="md:hidden font-mono text-[11px] font-bold uppercase tracking-wider text-white cursor-pointer" onClick={() => { router.push('/dashboard'); setIsMobileDrawerOpen(false); }}>
                            Live Telemetry
                        </span>
                        <div className="hidden md:flex absolute left-[52px] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-black/95 border border-white/15 backdrop-blur-2xl text-white font-mono font-bold uppercase tracking-wider whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 shadow-2xl z-[120] items-center gap-2" style={{ fontSize: 'var(--tooltip-font-size, 9px)' }}>
                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-black border-l border-b border-white/15" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                            Live Telemetry
                        </div>
                    </div>

                    {/* Quitter */}
                    <div className="relative group flex items-center gap-3.5 w-full md:w-auto md:justify-center">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { router.push('/'); setIsMobileDrawerOpen(false); }}
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-white/5 cursor-pointer"
                        >
                            <LogOut size={16} />
                        </motion.div>
                        <span className="md:hidden font-mono text-[11px] font-bold uppercase tracking-wider text-red-400 cursor-pointer" onClick={() => { router.push('/'); setIsMobileDrawerOpen(false); }}>
                            Exit Dashboard
                        </span>
                        <div className="hidden md:flex absolute left-[52px] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-black/95 border border-red-500/20 backdrop-blur-2xl text-red-400 font-mono font-bold uppercase tracking-wider whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 shadow-2xl z-[120] items-center gap-2" style={{ fontSize: 'var(--tooltip-font-size, 9px)' }}>
                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-black border-l border-b border-red-500/20" />
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                            Exit Dashboard
                        </div>
                    </div>
                </div>
            </aside>

            {/* ═══════════════════════════════════════════════════════════════
                PANNEAU DE NOTIFICATIONS FLOTTANT — Indépendant de la sidebar (z-[150])
                Sur mobile : centré bas de page. Sur PC : à côté de la sidebar.
            ═══════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {showNotifications && (
                    <motion.div
                        ref={notifRef}
                        initial={{ opacity: 0, y: 16, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-20 left-4 right-4 sm:left-20 sm:right-auto sm:w-80 monolith-panel !bg-black/95 !backdrop-blur-3xl p-5 border border-white/15 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-[150] space-y-4 pointer-events-auto select-none"
                    >
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2.5">
                                <Bell size={14} className="text-[var(--accent-primary)] animate-pulse" />
                                <span className="text-[9px] font-mono font-black uppercase text-white tracking-[0.25em]">System_Alerts</span>
                            </div>
                            <button
                                onClick={() => setShowNotifications(false)}
                                className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white flex items-center justify-center text-[10px] transition-colors cursor-pointer"
                                title="Close Alerts"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-2.5 max-h-[280px] sm:max-h-[320px] overflow-y-auto pr-1">
                            {systemNotifications.map(notif => (
                                <div key={notif.id} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/8 space-y-1.5 hover:border-[var(--accent-primary)]/30 hover:bg-white/[0.05] transition-all">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[8px] font-black text-white uppercase tracking-wide">{notif.title}</span>
                                        <span className="text-[7px] text-[#6c6c7a] font-mono">{notif.time}</span>
                                    </div>
                                    <p className="text-[8px] text-[#6c6c7a] leading-relaxed">{notif.text}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════════════════════════════
                HEADER — Barre de recherche et status (z-50)
            ═══════════════════════════════════════════════════════════════ */}
            <div 
                style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
                className="fixed top-0 left-0 right-0 z-50 p-3 sm:p-4 pl-16 md:pl-6 flex items-center gap-3 sm:gap-4 pointer-events-none"
            >
                {/* Barre de recherche */}
                <div className="relative pointer-events-auto flex-1 max-w-[220px] xs:max-w-[280px] sm:w-80 sm:flex-none">
                    <div className="flex items-center gap-2.5 bg-black/70 backdrop-blur-2xl border border-white/15 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 w-full">
                        <Search size={14} className="text-[var(--accent-primary)] flex-shrink-0" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search body..."
                            className="bg-transparent text-white text-[10px] sm:text-[11px] font-bold placeholder-white/30 outline-none flex-1 tracking-wide w-full"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white transition-colors p-1">
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* Dropdown résultats */}
                    <AnimatePresence>
                        {searchResults.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="absolute top-full mt-2 w-full max-h-[50vh] overflow-y-auto monolith-panel z-60 shadow-2xl"
                            >
                                {searchResults.slice(0, 6).map(body => (
                                    <button
                                        key={body.id}
                                        onClick={() => handleSelectBody(body)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0 min-h-[44px]"
                                    >
                                        <div className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: body.colors[0] }} />
                                        <div>
                                            <p className="text-white text-[10px] font-black uppercase">{body.name}</p>
                                            <p className="text-[#6c6c7a] text-[8px]">{body.scientificName}</p>
                                        </div>
                                        <span className="ml-auto text-[8px] font-black text-[var(--accent-primary)] uppercase">{body.type}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Corps survolé au vol (masqué sur très petit écran pour lisibilité) */}
                <AnimatePresence>
                    {hoveredBody && !searchQuery && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="hidden sm:flex pointer-events-none items-center gap-3 bg-black/70 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/8"
                        >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredBody.colors[0] }} />
                            <span className="text-[10px] font-black text-white uppercase tracking-wide">{hoveredBody.name}</span>
                            <span className="text-[8px] text-[#6c6c7a]">{hoveredBody.distance}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Status GAIA */}
                <div className="ml-auto flex items-center gap-2 sm:gap-3 pointer-events-none">
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-black/60 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-full border border-white/8">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[7px] sm:text-[8px] font-black text-white/50 uppercase tracking-widest">
                            <span className="hidden xs:inline">GAIA_NODE_01 :: </span>ONLINE
                        </span>
                    </div>
                    {isMeasuringMode && (
                        <div className="hidden xs:flex items-center gap-2 bg-[var(--accent-primary)]/10 px-3 py-1.5 rounded-full border border-[var(--accent-primary)]/30">
                            <Ruler size={10} className="text-[var(--accent-primary)]" />
                            <span className="text-[8px] font-black text-[var(--accent-primary)] uppercase tracking-widest">Measuring</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                CONTRÔLES SCÈNE 3D — Overlay autonome, z-40
                Permet d'ajuster grille, voie lactée, caméra et zoom sans interférence z-index.
            ═══════════════════════════════════════════════════════════════ */}
            <SceneControlPanel />

            {/* ═══════════════════════════════════════════════════════════════
                CONTENU PAGE — Overlay transparent, z-10
                Les pages rendues par Next.js s'affichent ici en overlay
                par-dessus le viewport 3D persistant.
            ═══════════════════════════════════════════════════════════════ */}
            <main className="relative z-10 flex-1 pt-[72px] h-full overflow-y-auto overflow-x-hidden pointer-events-none">
                {children}
            </main>

            {/* ═══════════════════════════════════════════════════════════════
                BOÎTE À OUTILS FLOTTANTE — Coin bas-gauche, z-40
                Auto-dépliante au focus (hover/touch).
                Toggle SOLAR/SKY, mode mesure, et actions rapides.
            ═══════════════════════════════════════════════════════════════ */}
            <div
                className="fixed bottom-[108px] left-3.5 md:bottom-8 md:left-6 z-30 md:z-40 flex flex-col gap-2 items-start pointer-events-auto"
                onMouseEnter={() => setToolboxOpen(true)}
                onMouseLeave={() => setToolboxOpen(false)}
            >
                {/* Panneau dépliant */}
                <AnimatePresence>
                    {toolboxOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                            className="bg-black/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-5 flex flex-col gap-4 shadow-2xl min-w-[220px]"
                        >
                            {/* Vue active */}
                            <div>
                                <p className="font-mono text-[7px] uppercase text-[#6c6c7a] font-black tracking-[0.3em] mb-3">
                                    Active View
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setView('SOLAR')}
                                        className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-2xl border text-[8px] font-black uppercase tracking-wider transition-all ${view === 'SOLAR'
                                            ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/40 text-[var(--accent-primary)]'
                                            : 'bg-white/5 border-white/8 text-white/40 hover:text-white hover:bg-white/8'
                                            }`}
                                    >
                                        <Globe size={16} />
                                        Solar
                                    </button>
                                    <button
                                        onClick={() => setView('SKY')}
                                        className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-2xl border text-[8px] font-black uppercase tracking-wider transition-all ${view === 'SKY'
                                            ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/40 text-[var(--accent-primary)]'
                                            : 'bg-white/5 border-white/8 text-white/40 hover:text-white hover:bg-white/8'
                                            }`}
                                    >
                                        <Star size={16} />
                                        Sky Map
                                    </button>
                                </div>
                            </div>

                            {/* Séparateur */}
                            <div className="h-px bg-white/5" />

                            {/* Corps sélectionné */}
                            {selectedBody && (
                                <div>
                                    <p className="font-mono text-[7px] uppercase text-[#6c6c7a] font-black tracking-[0.3em] mb-2">
                                        Selected Body
                                    </p>
                                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/5">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: selectedBody.colors[0] }} />
                                        <div>
                                            <p className="text-white text-[9px] font-black uppercase">{selectedBody.name}</p>
                                            <p className="text-[#6c6c7a] text-[7px]">{selectedBody.distance}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col gap-1.5">
                                <button
                                    onClick={toggleMeasuringMode}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all ${isMeasuringMode
                                        ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                                        : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <Ruler size={12} />
                                    {isMeasuringMode ? 'Stop Measuring' : 'Measure Distance'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bouton déclencheur */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setToolboxOpen(!toolboxOpen)}
                    className={`flex items-center gap-3 px-5 py-3 rounded-full border backdrop-blur-2xl shadow-xl transition-all ${toolboxOpen
                        ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/40 text-[var(--accent-primary)]'
                        : 'bg-black/60 border-white/10 text-white/50 hover:text-white'
                        }`}
                >
                    {view === 'SOLAR' ? <Globe size={14} /> : <Star size={14} />}
                    <span className="font-mono text-[8px] font-black uppercase tracking-wider">
                        {view === 'SOLAR' ? 'Sol System' : 'Sky Map'}
                    </span>
                    <motion.div animate={{ rotate: toolboxOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronUp size={12} />
                    </motion.div>
                </motion.button>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// Export : Layout enveloppé dans les providers
// ═════════════════════════════════════════════════════════════════════════════

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardProvider>
            <UniverseEngineProvider>
                <DashboardLayoutContent>
                    {children}
                </DashboardLayoutContent>
            </UniverseEngineProvider>
        </DashboardProvider>
    );
}
