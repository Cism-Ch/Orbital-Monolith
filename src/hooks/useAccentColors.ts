import { useEffect } from 'react';
import { CelestialBody } from '@/types';
import { SOLAR_SYSTEM } from '@/constants';

export const useAccentColors = (selectedBody: CelestialBody | null, hoveredBody: CelestialBody | null) => {
    useEffect(() => {
        const body = selectedBody || hoveredBody || SOLAR_SYSTEM[0];
        const root = document.documentElement;
        root.style.setProperty('--accent-primary', body.colors[0]);
        root.style.setProperty('--accent-secondary', body.colors[1]);
    }, [selectedBody?.id, hoveredBody?.id]);
};
