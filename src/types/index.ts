/**
 * @file types/index.ts
 * @description Types TypeScript exhaustifs pour Orbital Monolith v3.
 * Toutes les interfaces sont documentées et couvrent les données astronomiques réelles.
 */

// ── Énumérations ───────────────────────────────────────────────────────────────

/** Classification des corps célestes affichés dans l'application */
export enum CelestialType {
    PLANET       = 'PLANET',       // Planète (dont planètes naines)
    DWARF_PLANET = 'DWARF_PLANET', // Planète naine (Pluton, Cérès)
    STAR         = 'STAR',         // Étoile individuelle
    BINARY_STAR  = 'BINARY_STAR',  // Système binaire d'étoiles
    SYSTEM       = 'SYSTEM',       // Système stellaire complet ou galaxie
    NEBULA       = 'NEBULA',       // Nébuleuse
    GALAXY       = 'GALAXY',       // Galaxie
    ASTEROID     = 'ASTEROID',     // Astéroïde ou ceinture
}

/** Classe spectrale d'une étoile selon la classification de Harvard */
export type SpectralClass = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M' | 'L' | 'T' | 'Y';

/** Catégorie de luminosité (classification Yerkes) */
export type LuminosityClass = 'Ia' | 'Ib' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII';

// ── Corps Céleste ──────────────────────────────────────────────────────────────

/** Propriétés physiques mesurées ou calculées d'un corps céleste */
export interface PhysicalProperties {
    /** Masse (ex: "1.989 × 10^30 kg" ou "2.02 Sol") */
    mass: string;
    /** Rayon équatorial (ex: "696,340 km" ou "1.71 Sol") */
    radius: string;
    /** Température de surface en Kelvin (ex: "5,778 K") */
    temp: string;
    /** Accélération gravitationnelle de surface (ex: "274 m/s²") */
    gravity: string;
    /** Période orbitale (ex: "365.25 jours" ou "12 ans") */
    period?: string;
    /** Magnitude apparente vue depuis la Terre (ex: "-26.74") */
    magnitude?: string;
    /** Magnitude absolue (luminosité intrinsèque) */
    absoluteMagnitude?: string;
    /** Albédo géométrique [0-1] */
    albedo?: string;
    /** Excentricité orbitale [0-1] */
    eccentricity?: string;
    /** Inclinaison orbitale en degrés */
    inclination?: string;
    /** Nombre de lunes connues */
    moons?: string;
    /** Composition atmosphérique */
    atmosphere?: string;
    /** Vitesse d'échappement (ex: "11.2 km/s") */
    escapeVelocity?: string;
    /** Période de rotation (ex: "24h" ou "243 jours") */
    rotationPeriod?: string;
    /** Classe spectrale (étoiles seulement) */
    spectralClass?: string;
    /** Âge estimé (ex: "4.6 Ga") */
    age?: string;
    /** Luminosité (ex: "1.0 Sol") */
    luminosity?: string;
}

/** Coordonnées 2D/3D pour le positionnement dans les vues */
export interface CelestialPosition {
    /** Position X (coordonnées cartésiennes ou RA en degrés) */
    x: number;
    /** Position Y (coordonnées cartésiennes ou Dec en degrés) */
    y: number;
    /** Position Z optionnelle (pour les rendus 3D) */
    z?: number;
}

/** Corps céleste principal — entité de données astronomiques complète */
export interface CelestialBody {
    /** Identifiant unique stable (ex: "jupiter", "polaris") */
    id: string;
    /** Nom commun (ex: "Jupiter") */
    name: string;
    /** Désignation scientifique officielle (ex: "Alpha Orionis") */
    scientificName: string;
    /** Type de corps céleste */
    type: CelestialType;
    /** Distance de référence depuis la Terre ou le Soleil */
    distance: string;
    /** Description encyclopédique en français */
    description: string;
    /** Propriétés physiques mesurées */
    properties: PhysicalProperties;
    /** Palette de couleurs [primaire, secondaire] pour le rendu 3D et l'UI */
    colors: [string, string];
    /** Position dans l'espace de la vue (RA/Dec ou cartésien) */
    position: CelestialPosition;
    /** Fait remarquable ou anecdote */
    funFact?: string;
    /** URL de référence (Wikipedia, NASA JPL, etc.) */
    reference?: string;
}

// ── Constellation ──────────────────────────────────────────────────────────────

/** Constellation astronomique avec ses connexions entre étoiles */
export interface Constellation {
    /** Identifiant unique */
    id: string;
    /** Nom en français */
    name: string;
    /** Description mythologique ou culturelle */
    description: string;
    /** Contexte astronomique scientifique */
    astronomicalContext: string;
    /** Paires d'IDs d'étoiles formant les lignes de constellation */
    connections: [string, string][];
    /** Aire en degrés carrés (ex: "1279.66°²" pour Hydra) */
    area?: string;
    /** Meilleure période d'observation (ex: "Janvier") */
    bestObservation?: string;
    /** Objets Messier notables dans la constellation */
    messierObjects?: string[];
}

// ── État de l'Application ──────────────────────────────────────────────────────

/** Mode de vue 3D actif */
export type ViewMode = 'SOLAR' | 'SKY';

/** Mode de perspective de la caméra */
export type PerspectiveMode = 'heliocentric' | 'free';

/** Orientation de la vue (rotation et inclinaison) */
export interface ViewOrientation {
    rotation: number;
    inclination: number;
}

/** Point de mesure de distance entre deux corps célestes */
export interface DistanceMeasurement {
    pointA: CelestialBody | null;
    pointB: CelestialBody | null;
    /** Distance calculée en UA ou années-lumière */
    result: string | null;
}
