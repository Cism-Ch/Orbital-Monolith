import { CelestialBody } from '@/types';
import { SOLAR_SYSTEM, STARS } from '@/constants';
import { calculateAstrophysicalDistance } from './nasaService';

const ALL_BODIES = [...SOLAR_SYSTEM, ...STARS];

export const searchCelestial = (query: string): CelestialBody[] => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return ALL_BODIES.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.scientificName.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        (b.properties.spectralClass && b.properties.spectralClass.toLowerCase().includes(q))
    );
};

/**
 * Calcule la véritable distance astrophysique 3D entre deux corps célestes
 * avec unités astronomiques (UA), millions de kilomètres et délai de transmission de la lumière.
 */
export const calculateDistance = (a: CelestialBody, b: CelestialBody): string => {
    const result = calculateAstrophysicalDistance(a, b);
    return result.formatted;
};

export { calculateAstrophysicalDistance };

