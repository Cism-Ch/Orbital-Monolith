import { useEffect } from 'react';
import { CelestialBody } from '@/types';
import { SOLAR_SYSTEM } from '@/constants';

/** Converts a 6-digit hex color string to a comma-separated RGB triple (e.g. "#4deeea" → "77, 238, 234"). */
function hexToRgb(hex: string): string {
    const clean = hex.startsWith('#') ? hex.slice(1) : hex;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return '77, 238, 234';
    return `${r}, ${g}, ${b}`;
}

export const useAccentColors = (selectedBody: CelestialBody | null, hoveredBody: CelestialBody | null) => {
    useEffect(() => {
        const body = selectedBody || hoveredBody || SOLAR_SYSTEM[0];
        const root = document.documentElement;
        root.style.setProperty('--accent-primary', body.colors[0]);
        root.style.setProperty('--accent-primary-rgb', hexToRgb(body.colors[0]));
        root.style.setProperty('--accent-secondary', body.colors[1]);
    }, [selectedBody?.id, hoveredBody?.id]);
};
