
import React, { ReactNode } from 'react';

interface LayoutProps {
    children: ReactNode;
    headerLeft: ReactNode;
    headerRight: ReactNode;
    sidebarLeft?: ReactNode;
    sidebarRight?: ReactNode;
    footer?: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ 
    children, 
    headerLeft, 
    headerRight, 
    sidebarLeft, 
    sidebarRight, 
    footer 
}) => {
    return (
        <div className="w-screen h-screen p-6 flex flex-col gap-6 relative overflow-hidden bg-[#050506]">
            <div className="grain" />
            <div className="scanline" />
            
            {/* Header */}
            <header className="flex justify-between items-center z-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#6c6c7a]">Orbital Command</span>
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
                        {headerLeft}
                    </h1>
                </div>
                <div className="text-right flex flex-col gap-1">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#6c6c7a]">Temporal Sync</span>
                    <div className="text-xl font-mono font-medium text-[var(--accent-primary)] dynamic-accent-text">
                        {headerRight}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-[340px_1fr_340px] gap-6 overflow-hidden">
                {/* Left Sidebar */}
                <div className="hidden md:flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    {sidebarLeft}
                </div>

                {/* Central Focus */}
                <main className="monolith-panel overflow-hidden flex items-center justify-center relative bg-[radial-gradient(circle_at_center,rgba(30,30,35,0.4)_0%,rgba(5,5,6,0.8)_100%)] shadow-2xl">
                    <div className="hud-bracket-tl text-[var(--accent-primary)]" />
                    <div className="hud-bracket-tr text-[var(--accent-primary)]" />
                    <div className="hud-bracket-bl text-[var(--accent-primary)]" />
                    <div className="hud-bracket-br text-[var(--accent-primary)]" />
                    {children}
                </main>

                {/* Right Sidebar */}
                <div className="hidden md:flex flex-col gap-6 overflow-y-auto pl-2 custom-scrollbar">
                    {sidebarRight}
                </div>
            </div>

            {/* Status Bar */}
            <footer className="h-12 monolith-panel !rounded-2xl !bg-white/5 border-none px-6 flex items-center gap-4 z-10">
                {footer}
            </footer>
        </div>
    );
};
