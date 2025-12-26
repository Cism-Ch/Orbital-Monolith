
import { CelestialBody } from '../types';
import { SOLAR_SYSTEM, STARS } from '../constants';

const ALL_BODIES = [...SOLAR_SYSTEM, ...STARS];

export const searchCelestial = (query: string): CelestialBody[] => {
    const q = query.toLowerCase();
    return ALL_BODIES.filter(b => 
        b.name.toLowerCase().includes(q) || 
        b.scientificName.toLowerCase().includes(q)
    );
};

export const calculateDistance = (a: CelestialBody, b: CelestialBody): number => {
    // Basic Euclidean distance for demo purposes
    // In real app, we would use astronomical units or light years with coordinate mapping
    const dx = a.position.x - b.position.x;
    const dy = a.position.y - b.position.y;
    return Math.sqrt(dx * dx + dy * dy);
};
