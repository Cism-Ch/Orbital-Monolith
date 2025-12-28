"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Compass,
    Database,
    Settings,
    Bell,
    Search,
    User,
    LogOut,
    Activity
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Sector Control', href: '/dashboard' },
        { icon: Compass, label: 'Star Cartography', href: '/dashboard/map' },
        { icon: Database, label: 'Gaia Archive', href: '/dashboard/archive' },
        { icon: Settings, label: 'System Calibration', href: '/dashboard/settings' },
    ];

    return (
        <div className="flex h-screen w-screen bg-[#050506] overflow-hidden p-6 gap-6 font-mono">
            {/* Floating Capsule Sidebar */}
            <motion.aside
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-24 lg:w-72 bg-black/40 border border-white/10 rounded-[3rem] flex flex-col z-50 backdrop-blur-3xl shadow-2xl relative overflow-hidden"
            >
                {/* Identity Header */}
                <div className="p-8 flex flex-col items-center lg:items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)] flex items-center justify-center shadow-[0_0_30px_rgba(var(--accent-primary-rgb),0.3)] group cursor-pointer relative">
                        <div className="w-6 h-6 bg-black rounded-lg rotate-45 group-hover:rotate-90 transition-transform duration-500" />
                        <div className="absolute inset-0 rounded-2xl ring-2 ring-[var(--accent-primary)] animate-ping opacity-20" />
                    </div>
                    <div className="hidden lg:block">
                        <h1 className="font-black text-white text-xl tracking-tighter uppercase leading-none">Monolith_Core</h1>
                        <span className="text-[9px] text-[var(--accent-primary)] font-bold tracking-[0.3em] uppercase">Deep Space Protocol</span>
                    </div>
                </div>

                {/* Primary Nav */}
                <nav className="flex-1 px-4 space-y-3 py-6">
                    {menuItems.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="block"
                            >
                                <motion.div
                                    whileHover={{ x: 5 }}
                                    className={`flex items-center gap-4 p-4 rounded-[2rem] transition-all group relative ${active
                                            ? 'bg-[var(--accent-primary)] text-black shadow-[0_10px_30px_rgba(var(--accent-primary-rgb),0.2)]'
                                            : 'text-[#6c6c7a] hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <item.icon size={20} className={active ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
                                    <span className="hidden lg:block font-black text-[11px] uppercase tracking-widest">{item.label}</span>

                                    {active && (
                                        <motion.div
                                            layoutId="sidebar-active"
                                            className="absolute -right-1 top-3 bottom-3 w-1.5 bg-black/20 rounded-full"
                                        />
                                    )}
                                </motion.div>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 space-y-4">
                    <div className="p-5 rounded-[2rem] bg-white/[0.03] border border-white/5 space-y-3 hidden lg:block">
                        <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black text-[#6c6c7a] uppercase tracking-widest">Link Integrity</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                animate={{ width: ["20%", "85%", "40%", "95%"] }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="h-full bg-[var(--accent-primary)]"
                            />
                        </div>
                    </div>

                    <button className="w-full flex items-center justify-center lg:justify-start gap-4 p-4 rounded-[2rem] text-[#6c6c7a] hover:text-red-400 hover:bg-red-400/10 transition-all group">
                        <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
                        <span className="hidden lg:block font-black text-[11px] uppercase tracking-widest">Terminate_Link</span>
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col gap-6 relative overflow-hidden">
                {/* Floating Navigation Header */}
                <motion.header
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="h-24 bg-black/40 border border-white/10 rounded-[3rem] flex items-center justify-between px-10 backdrop-blur-3xl shadow-2xl z-40"
                >
                    <div className="flex items-center gap-8 flex-1">
                        <div className="relative w-full max-w-lg group">
                            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#6c6c7a] group-focus-within:text-[var(--accent-primary)] transition-colors" />
                            <input
                                type="text"
                                placeholder="Universal Star Database Search..."
                                className="w-full bg-white/5 border border-white/5 rounded-full py-4 pl-16 pr-8 text-xs text-white focus:outline-none focus:border-[var(--accent-primary)]/30 focus:bg-white/[0.08] transition-all placeholder:text-[#6c6c7a] font-bold"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="hidden xl:flex items-center gap-6 pr-6 border-r border-white/10">
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] font-black text-[#6c6c7a] uppercase tracking-widest leading-none mb-1">Session_Uptime</span>
                                <span className="text-[12px] font-mono text-white font-black tracking-tighter">04:12:35:88</span>
                            </div>
                            <Activity size={20} className="text-[var(--accent-primary)] animate-pulse" />
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="relative w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#6c6c7a] hover:text-white hover:border-white/20 transition-all group">
                                <Bell size={18} className="group-hover:rotate-12" />
                                <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 bg-[var(--accent-primary)] rounded-full border-2 border-black animate-bounce" />
                            </button>
                            <div className="h-12 flex items-center gap-4 bg-white/5 border border-white/10 px-5 rounded-full cursor-pointer hover:bg-white/10 transition-colors">
                                <div className="flex flex-col items-end hidden lg:flex">
                                    <span className="text-[9px] font-black text-white uppercase tracking-tighter">User_Root</span>
                                    <span className="text-[7px] text-[var(--accent-primary)] font-bold tracking-widest uppercase">Admin_Access</span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-blue-600 shadow-lg shadow-[var(--accent-primary)]/20" />
                            </div>
                        </div>
                    </div>
                </motion.header>

                {/* Main View Port Container */}
                <main className="flex-1 relative overflow-hidden flex flex-col gap-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, scale: 0.98, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.02, y: -20 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="flex-1 h-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Global Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-[-1]">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--accent-primary)]/5 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[150px] rounded-full" />
            </div>

            {/* Aesthetic Grain & Scanlines */}
            <div className="grain pointer-events-none z-[100]" />
            <div className="scanline pointer-events-none z-[99]" />
        </div>
    );
}
