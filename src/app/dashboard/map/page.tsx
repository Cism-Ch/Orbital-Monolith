"use client";

/**
 * @file app/dashboard/map/page.tsx
 * @description Star Cartography — Overlay minimaliste v3.
 *
 * La vue SKY est maintenant dans la boîte à outils flottante.
 * Cette page active automatiquement la vue SKY et affiche uniquement
 * le FocusView si un astre est sélectionné.
 */

import React, { useEffect } from 'react';
import { useDashboard } from '@/lib/DashboardContext';
import { CelestialInspectorPanel } from '@/components/ui/CelestialInspectorPanel';


export default function MapPage() {
    const { setView } = useDashboard();

    // Active automatiquement la vue SKY quand on arrive sur cette route
    useEffect(() => {
        setView('SKY');
    }, [setView]);

    return <CelestialInspectorPanel />;
}

