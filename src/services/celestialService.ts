import { CelestialBody } from '@/types';
import { SOLAR_SYSTEM, STARS } from '@/constants';

const ALL_BODIES = [...SOLAR_SYSTEM, ...STARS];

/**
 * Search celestial bodies by name or scientific name.
 *
 * When the query is empty, returns only the bodies relevant to the active `view`
 * so the browse list is contextual (SOLAR → planets/system, SKY → stars/deep-sky).
 * When a query is present, searches across ALL bodies regardless of view, allowing
 * cross-view discovery (e.g. typing "Sirius" while in SOLAR mode still finds it,
 * and selecting it will auto-switch the view to SKY via the caller).
 */
export const searchCelestial = (query: string, view?: 'SOLAR' | 'SKY'): CelestialBody[] => {
    const q = query.toLowerCase().trim();

    if (!q) {
        if (view === 'SOLAR') return SOLAR_SYSTEM;
        if (view === 'SKY') return STARS;
        return ALL_BODIES;
    }

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
