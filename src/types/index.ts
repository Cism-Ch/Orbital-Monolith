
export enum CelestialType {
    PLANET = 'PLANET',
    STAR = 'STAR',
    CONSTELLATION = 'CONSTELLATION',
    SYSTEM = 'SYSTEM'
}

export interface CelestialBody {
    id: string;
    name: string;
    scientificName: string;
    type: CelestialType;
    distance: string; // from center
    description: string;
    properties: {
        mass: string;
        radius: string;
        temp: string;
        gravity: string;
        period?: string;
        magnitude?: string;
    };
    colors: [string, string]; // Dynamic accent colors [Primary, Secondary]
    position: { x: number; y: number; z?: number }; // For mapping
}
