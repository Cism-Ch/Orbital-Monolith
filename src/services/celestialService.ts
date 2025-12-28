import { CelestialBody } from '@/types';
import { SOLAR_SYSTEM, STARS } from '@/constants';

const ALL_BODIES = [...SOLAR_SYSTEM, ...STARS];

export const searchCelestial = (query: string): CelestialBody[] => {
    const q = query.toLowerCase();
    return ALL_BODIES.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.scientificName.toLowerCase().includes(q)
    );
};

export const calculateDistance = (a: CelestialBody, b: CelestialBody): string => {
    // Basic Euclidean distance for demo purposes
    const dx = a.position.x - b.position.x;
    const dy = a.position.y - b.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) return 'EQUATORIAL_ORIGIN';
    return (dist * 149.6).toFixed(2) + 'M KM';
};
