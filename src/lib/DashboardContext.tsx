"use client";

/**
 * @file lib/DashboardContext.tsx
 * @description État global du dashboard Orbital Monolith v3.
 *
 * Contient :
 * - Vue active (SOLAR / SKY)
 * - Corps céleste sélectionné et survolé
 * - Recherche textuelle
 * - Mode focus (vue détail)
 * - Orientation 3D et zoom
 * - Mode de mesure de distance
 * - Paramètres de calibration système
 *
 * Note : Démarrage sur la vue SKY (carte stellaire) selon les specs v3.
 */

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    type ReactNode,
} from 'react';
import { CelestialBody, ViewMode, ViewOrientation } from '@/types';
import { STARS } from '@/constants';

// ── Interface du contexte ─────────────────────────────────────────────────────

interface DashboardContextType {
    // ── Vue active ─────────────────────────────────────────────────────────────
    view: ViewMode;
    setView: (v: ViewMode) => void;

    // ── Sélection, survol et verrouillage ──────────────────────────────────────
    selectedBody: CelestialBody;
    setSelectedBody: (body: CelestialBody) => void;
    hoveredBody: CelestialBody | null;
    setHoveredBody: (body: CelestialBody | null) => void;
    isLocked: boolean;
    setIsLocked: (locked: boolean) => void;
    toggleLock: (body?: CelestialBody) => void;

    // ── Recherche ──────────────────────────────────────────────────────────────
    searchQuery: string;
    setSearchQuery: (q: string) => void;

    // ── Mode Focus ─────────────────────────────────────────────────────────────
    isFocusMode: boolean;
    setIsFocusMode: (mode: boolean) => void;

    // ── Orientation et zoom de la vue 3D ──────────────────────────────────────
    orientation: ViewOrientation;
    setOrientation: (o: ViewOrientation) => void;
    zoom: number;
    setZoom: (z: number) => void;

    // ── Layers visuels ─────────────────────────────────────────────────────────
    showGrid: boolean;
    setShowGrid: (v: boolean) => void;
    showMilkyWay: boolean;
    setShowMilkyWay: (v: boolean) => void;
    showConstellations: boolean;
    setShowConstellations: (v: boolean) => void;

    // ── Perspective caméra ─────────────────────────────────────────────────────
    perspectiveMode: 'heliocentric' | 'free';
    setPerspectiveMode: (m: 'heliocentric' | 'free') => void;

    // ── Mesure de distance ─────────────────────────────────────────────────────
    isMeasuringMode: boolean;
    distancePoints: CelestialBody[];
    toggleMeasuringMode: () => void;
    addDistancePoint: (body: CelestialBody) => void;
    clearDistancePoints: () => void;

    // ── Paramètres de calibration système ────────────────────────────────────
    interfaceOpacity: number;
    setInterfaceOpacity: (v: number) => void;
    cosmicResonance: boolean;
    setCosmicResonance: (v: boolean) => void;
    interfaceVolume: number;
    setInterfaceVolume: (v: number) => void;
    hyperSpatialRendering: boolean;
    setHyperSpatialRendering: (v: boolean) => void;
    ambientOcclusion: number;
    setAmbientOcclusion: (v: number) => void;
    rootEncryption: boolean;
    setRootEncryption: (v: boolean) => void;
    biometricLink: boolean;
    setBiometricLink: (v: boolean) => void;
    fontSizeScale: number;
    setFontSizeScale: (v: number) => void;
    tooltipFontSize: number;
    setTooltipFontSize: (v: number) => void;
}

// ── Création du contexte ──────────────────────────────────────────────────────

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Vue par défaut : SKY (carte stellaire) selon les specs v3
    const [view, setView] = useState<ViewMode>('SKY');

    const [selectedBody, setSelectedBodyState] = useState<CelestialBody>(
        STARS.find(s => s.id === 'polaris') ?? STARS[0]
    );
    const [hoveredBody, setHoveredBody] = useState<CelestialBody | null>(null);
    const [isLocked, setIsLocked] = useState<boolean>(false);

    // Enveloppe de sélection qui verrouille automatiquement sur le corps sélectionné
    const setSelectedBody = useCallback((body: CelestialBody) => {
        setSelectedBodyState(body);
        setIsLocked(true);
    }, []);

    const toggleLock = useCallback((body?: CelestialBody) => {
        if (body) {
            setSelectedBodyState(body);
            setIsLocked(true);
        } else {
            setIsLocked(prev => !prev);
        }
    }, []);

    const [searchQuery, setSearchQuery] = useState('');
    const [isFocusMode, setIsFocusMode] = useState(false);

    // Orientation de départ 0° / 0° et zoom par défaut 0.3
    const [orientation, setOrientation] = useState<ViewOrientation>({
        rotation: 0,
        inclination: 0,
    });
    const [zoom, setZoom] = useState(0.3);

    // Layers : Voie Lactée et Constellations activées par défaut, grille désactivée
    const [showGrid, setShowGrid] = useState(false);
    const [showMilkyWay, setShowMilkyWay] = useState(true);
    const [showConstellations, setShowConstellations] = useState(true);
    const [perspectiveMode, setPerspectiveMode] = useState<'heliocentric' | 'free'>('heliocentric');

    // Mesure de distance
    const [isMeasuringMode, setIsMeasuringMode] = useState(false);
    const [distancePoints, setDistancePoints] = useState<CelestialBody[]>([]);

    // ── Calibration système & persistance ──────────────────────────────────────
    // IMPORTANT : Toujours initialiser avec les valeurs par défaut (identiques serveur & client)
    // puis lire localStorage dans un useEffect post-hydration pour éviter le mismatch d'hydration.
    const [interfaceOpacity, setInterfaceOpacityState] = useState<number>(85);
    const [ambientOcclusion, setAmbientOcclusionState] = useState<number>(85);
    const [hyperSpatialRendering, setHyperSpatialRenderingState] = useState<boolean>(true);
    const [cosmicResonance, setCosmicResonance] = useState(true);
    const [interfaceVolume, setInterfaceVolume] = useState(60);
    const [rootEncryption, setRootEncryption] = useState(false);
    const [biometricLink, setBiometricLink] = useState(true);
    const [fontSizeScale, setFontSizeScaleState] = useState<number>(100);
    const [tooltipFontSize, setTooltipFontSizeState] = useState<number>(9);

    // Hydratation depuis localStorage — exécutée uniquement côté client, après le premier rendu
    useEffect(() => {
        const savedOpacity = localStorage.getItem('orbital_interface_opacity');
        if (savedOpacity) setInterfaceOpacityState(parseInt(savedOpacity, 10));

        const savedAmbient = localStorage.getItem('orbital_ambient_occlusion');
        if (savedAmbient) setAmbientOcclusionState(parseInt(savedAmbient, 10));

        const savedHyper = localStorage.getItem('orbital_hyperspatial');
        if (savedHyper !== null) setHyperSpatialRenderingState(savedHyper === 'true');

        const savedFont = localStorage.getItem('orbital_font_scale');
        if (savedFont) setFontSizeScaleState(parseInt(savedFont, 10));

        const savedTooltip = localStorage.getItem('orbital_tooltip_font_size');
        if (savedTooltip) setTooltipFontSizeState(parseInt(savedTooltip, 10));
    }, []);

    // Setters réactifs avec persistance localStorage et mise à jour DOM en direct
    const setInterfaceOpacity = useCallback((val: number) => {
        setInterfaceOpacityState(val);
        if (typeof window !== 'undefined') {
            localStorage.setItem('orbital_interface_opacity', val.toString());
            document.documentElement.style.setProperty('--basalt-opacity', (val / 100).toString());
        }
    }, []);

    const setAmbientOcclusion = useCallback((val: number) => {
        setAmbientOcclusionState(val);
        if (typeof window !== 'undefined') {
            localStorage.setItem('orbital_ambient_occlusion', val.toString());
            document.documentElement.style.setProperty('--ambient-occlusion', (val / 100).toString());
        }
    }, []);

    const setHyperSpatialRendering = useCallback((val: boolean) => {
        setHyperSpatialRenderingState(val);
        if (typeof window !== 'undefined') {
            localStorage.setItem('orbital_hyperspatial', val ? 'true' : 'false');
            document.documentElement.setAttribute('data-hyperspatial', val ? 'true' : 'false');
        }
    }, []);

    const setFontSizeScale = useCallback((scale: number) => {
        setFontSizeScaleState(scale);
        if (typeof window !== 'undefined') {
            localStorage.setItem('orbital_font_scale', scale.toString());
            document.documentElement.style.fontSize = `${scale}%`;
        }
    }, []);

    const setTooltipFontSize = useCallback((size: number) => {
        setTooltipFontSizeState(size);
        if (typeof window !== 'undefined') {
            localStorage.setItem('orbital_tooltip_font_size', size.toString());
            document.documentElement.style.setProperty('--tooltip-font-size', `${size}px`);
        }
    }, []);

    // Effet d'application initiale des variables CSS au démarrage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.documentElement.style.fontSize = `${fontSizeScale}%`;
            document.documentElement.style.setProperty('--tooltip-font-size', `${tooltipFontSize}px`);
            document.documentElement.style.setProperty('--basalt-opacity', (interfaceOpacity / 100).toString());
            document.documentElement.style.setProperty('--ambient-occlusion', (ambientOcclusion / 100).toString());
            document.documentElement.setAttribute('data-hyperspatial', hyperSpatialRendering ? 'true' : 'false');
        }
    }, [fontSizeScale, tooltipFontSize, interfaceOpacity, ambientOcclusion, hyperSpatialRendering]);

    // ── Actions mesure ────────────────────────────────────────────────────────
    const toggleMeasuringMode = useCallback(() => {
        setIsMeasuringMode(prev => {
            if (prev) setDistancePoints([]);
            return !prev;
        });
    }, []);

    const addDistancePoint = useCallback((body: CelestialBody) => {
        setDistancePoints(prev => {
            // Éviter les doublons
            if (prev.some(b => b.id === body.id)) return prev;
            // Max 2 points : glissement de la fenêtre
            if (prev.length >= 2) return [prev[1], body];
            return [...prev, body];
        });
    }, []);

    const clearDistancePoints = useCallback(() => {
        setDistancePoints([]);
    }, []);

    // ── Valeur ────────────────────────────────────────────────────────────────
    return (
        <DashboardContext.Provider
            value={{
                view, setView,
                selectedBody, setSelectedBody,
                hoveredBody, setHoveredBody,
                isLocked, setIsLocked, toggleLock,
                searchQuery, setSearchQuery,
                isFocusMode, setIsFocusMode,
                orientation, setOrientation,
                zoom, setZoom,
                showGrid, setShowGrid,
                showMilkyWay, setShowMilkyWay,
                showConstellations, setShowConstellations,
                perspectiveMode, setPerspectiveMode,
                isMeasuringMode,
                distancePoints,
                toggleMeasuringMode,
                addDistancePoint,
                clearDistancePoints,
                interfaceOpacity, setInterfaceOpacity,
                cosmicResonance, setCosmicResonance,
                interfaceVolume, setInterfaceVolume,
                hyperSpatialRendering, setHyperSpatialRendering,
                ambientOcclusion, setAmbientOcclusion,
                rootEncryption, setRootEncryption,
                biometricLink, setBiometricLink,
                fontSizeScale, setFontSizeScale,
                tooltipFontSize, setTooltipFontSize,
            }}
        >
            {children}
        </DashboardContext.Provider>
    );
};

// ── Hook consommateur ─────────────────────────────────────────────────────────

export const useDashboard = (): DashboardContextType => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('[Dashboard] useDashboard() doit être utilisé dans un <DashboardProvider>.');
    }
    return context;
};
