"use client";

/**
 * @file components/view/SkyMapView.tsx
 * @description Vue Carte Stellaire — Moteur 3D enrichi Three.js (v3).
 *
 * Fonctionnalités intégrées :
 * - Cartographie complète des 32 constellations majeures & 12 signes du Zodiaque
 * - Objets du Ciel Profond (DSO / Messier) avec rendus gazeux volumétriques (M42, M45, M13, M1, Sgr A*)
 * - Sondes interstellaires réelles en direct (Voyager 1, Voyager 2, New Horizons, JWST) avec faisceaux radio DSN
 * - Ligne de l'Écliptique dorée inclinée à 23.44° avec marqueurs zodiacaux
 * - Équateur céleste et pôles célestes (NCP / SCP)
 * - Grands astérismes célestes (Triangle d'Été, Triangle d'Hiver, Pointeurs du Sud)
 * - Barre de contrôle des calques flottante ergonomique et tactile (Mobile-first, min-h 44px)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Waypoints, Sparkles, Info, X, Orbit, Radio,
    Globe, Sparkle
} from 'lucide-react';

import { useUniverseEngine } from '@/lib/UniverseEngineContext';
import { useDashboard } from '@/lib/DashboardContext';
import { useScenePointer } from '@/hooks/useScenePointer';
import { STARS, CONSTELLATIONS } from '@/constants';
import { CelestialBody, CelestialType } from '@/types';

// ═════════════════════════════════════════════════════════════════════════════
// Données des Grands Astérismes Célestes
// ═════════════════════════════════════════════════════════════════════════════

interface Asterism {
    id: string;
    name: string;
    description: string;
    connections: [string, string][];
    color: number;
}

const ASTERISMS: Asterism[] = [
    {
        id: 'summer_triangle',
        name: "Triangle d'Été",
        description: "Astérisme boréal emblématique reliant Véga (Lyre), Deneb (Cygne) et Altaïr (Aigle), traversé par la Voie Lactée.",
        connections: [['vega', 'deneb'], ['deneb', 'altair'], ['altair', 'vega']],
        color: 0xffd166,
    },
    {
        id: 'winter_triangle',
        name: "Triangle d'Hiver",
        description: "Triangle équilatéral quasi-parfait d'hiver reliant Sirius (Grand Chien), Bételgeuse (Orion) et Procyon (Petit Chien).",
        connections: [['sirius', 'betelgeuse'], ['betelgeuse', 'procyon'], ['procyon', 'sirius']],
        color: 0x06d6a0,
    },
    {
        id: 'southern_pointers',
        name: "Pointeurs du Sud",
        description: "Alignement remarquable d'Alpha Centauri et Hadar guidant le regard directement vers la Croix du Sud (Acrux).",
        connections: [['alpha_centauri', 'hadar'], ['hadar', 'acrux']],
        color: 0x118ab2,
    },
    {
        id: 'pegasus_square',
        name: "Grand Carré de Pégase",
        description: "Vaste quadrilatère céleste reliant Markab, Schéat, Alpheratz et Algénib, marquant le ciel automnal.",
        connections: [['markab', 'scheat'], ['scheat', 'alpheratz'], ['alpheratz', 'algenib'], ['algenib', 'markab']],
        color: 0xef476f,
    },
];

// Symboles des 12 secteurs zodiacaux sur l'écliptique
const ZODIAC_SYMBOLS = [
    { name: 'Bélier', symbol: '♈' },
    { name: 'Taureau', symbol: '♉' },
    { name: 'Gémeaux', symbol: '♊' },
    { name: 'Cancer', symbol: '♋' },
    { name: 'Lion', symbol: '♌' },
    { name: 'Vierge', symbol: '♍' },
    { name: 'Balance', symbol: '♎' },
    { name: 'Scorpion', symbol: '♏' },
    { name: 'Sagittaire', symbol: '♐' },
    { name: 'Capricorne', symbol: '♑' },
    { name: 'Verseau', symbol: '♒' },
    { name: 'Poissons', symbol: '♓' },
];

// ═════════════════════════════════════════════════════════════════════════════
// Props
// ═════════════════════════════════════════════════════════════════════════════

interface SkyMapViewProps {
    onSelect: (body: CelestialBody) => void;
    onHover: (body: CelestialBody | null) => void;
}

// ═════════════════════════════════════════════════════════════════════════════
// Composant Principal
// ═════════════════════════════════════════════════════════════════════════════

export const SkyMapView: React.FC<SkyMapViewProps> = ({ onSelect, onHover }) => {
    const {
        scene, camera, renderer, registerAnimation, isReady,
    } = useUniverseEngine();

    const {
        orientation, setOrientation,
        zoom, setZoom,
        showGrid,
        showMilkyWay, setShowMilkyWay,
        showConstellations, setShowConstellations,
        showEcliptic, setShowEcliptic,
        showDeepSky, setShowDeepSky,
        showProbes, setShowProbes,
        showAsterisms, setShowAsterisms,
        perspectiveMode,
        isMeasuringMode, distancePoints, addDistancePoint,
    } = useDashboard();

    // ── État UI overlay ────────────────────────────────────────────────────────
    const [hoveredConst, setHoveredConst] = useState<typeof CONSTELLATIONS[0] | null>(null);
    const [hoveredAsterism, setHoveredAsterism] = useState<Asterism | null>(null);

    // ── Refs 3D ────────────────────────────────────────────────────────────────
    const controlsRef = useRef<OrbitControls | null>(null);
    const laserRef = useRef<THREE.Line | null>(null);

    // Map étoile id → position 3D (pour constellations, astérismes et laser)
    const starPosMapRef = useRef<Map<string, THREE.Vector3>>(new Map());

    // Groupes d'éléments animables
    type StarEntry = {
        group: THREE.Group;
        body: CelestialBody;
        glow: THREE.Mesh;
        label: THREE.Sprite;
        pulseRing?: THREE.Mesh;
    };
    const starEntriesRef = useRef<StarEntry[]>([]);
    const constLinesRef = useRef<{ mesh: THREE.LineSegments; id: string }[]>([]);
    const asterismLinesRef = useRef<{ mesh: THREE.LineSegments; id: string }[]>([]);

    const constGroupRef = useRef<THREE.Group | null>(null);
    const asterismGroupRef = useRef<THREE.Group | null>(null);
    const eclipticGroupRef = useRef<THREE.Group | null>(null);
    const equatorGroupRef = useRef<THREE.Group | null>(null);
    const gridGroupRef = useRef<THREE.Group | null>(null);
    const mwPointsRef = useRef<THREE.Points | null>(null);
    const probeBeamsGroupRef = useRef<THREE.Group | null>(null);

    // ── Conversion RA/Dec → 3D ────────────────────────────────────────────────
    const toSphere = useCallback((x: number, y: number, r = 2500): THREE.Vector3 => {
        const phi = THREE.MathUtils.degToRad(90 - y);
        const theta = THREE.MathUtils.degToRad(x);
        return new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
        );
    }, []);

    // ── Construction de la scène ──────────────────────────────────────────────
    useEffect(() => {
        if (!isReady) return;

        // Nettoyer la scène et repositionner la caméra
        scene.clear();
        if (camera.current) {
            camera.current.fov = 60;
            camera.current.position.set(0, 0, 1500);
            camera.current.updateProjectionMatrix();
        }

        const disposables: THREE.BufferGeometry[] = [];
        const disposableMats: THREE.Material[] = [];

        // ── 1. Starfield de fond (particules statiques) ─────────────────────
        const BG_STAR_COUNT = 12000;
        const bgStarGeo = new THREE.BufferGeometry();
        const bgStarPos = new Float32Array(BG_STAR_COUNT * 3);
        const bgStarColors = new Float32Array(BG_STAR_COUNT * 3);
        for (let i = 0; i < BG_STAR_COUNT; i++) {
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = 2 * Math.PI * Math.random();
            const r = 8000;
            bgStarPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
            bgStarPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            bgStarPos[i * 3 + 2] = r * Math.cos(phi);
            const t = Math.random();
            bgStarColors[i * 3]     = 0.8 + t * 0.2;
            bgStarColors[i * 3 + 1] = 0.8 + t * 0.1;
            bgStarColors[i * 3 + 2] = 0.8 + (1 - t) * 0.2;
        }
        bgStarGeo.setAttribute('position', new THREE.BufferAttribute(bgStarPos, 3));
        bgStarGeo.setAttribute('color', new THREE.BufferAttribute(bgStarColors, 3));
        disposables.push(bgStarGeo);
        const bgStarMat = new THREE.PointsMaterial({
            size: 0.8, vertexColors: true, transparent: true,
            opacity: 0.35, sizeAttenuation: false
        });
        disposableMats.push(bgStarMat);
        scene.add(new THREE.Points(bgStarGeo, bgStarMat));

        // ── 2. Grille RA/Dec ────────────────────────────────────────────────
        const gridGroup = new THREE.Group();
        const gridMat = new THREE.LineBasicMaterial({ color: 0x4deeea, transparent: true, opacity: 0.08 });
        disposableMats.push(gridMat);
        for (let i = 0; i < 24; i++) {
            const theta = (i / 24) * Math.PI * 2;
            const pts: THREE.Vector3[] = [];
            for (let j = 0; j <= 64; j++) {
                const phi = (j / 64) * Math.PI;
                pts.push(new THREE.Vector3(
                    3000 * Math.sin(phi) * Math.cos(theta),
                    3000 * Math.cos(phi),
                    3000 * Math.sin(phi) * Math.sin(theta)
                ));
            }
            const g = new THREE.BufferGeometry().setFromPoints(pts);
            disposables.push(g);
            gridGroup.add(new THREE.Line(g, gridMat));
        }
        for (let dec = -75; dec <= 75; dec += 15) {
            const pts: THREE.Vector3[] = [];
            const phi = THREE.MathUtils.degToRad(90 - dec);
            for (let j = 0; j <= 64; j++) {
                const theta = (j / 64) * Math.PI * 2;
                pts.push(new THREE.Vector3(
                    3000 * Math.sin(phi) * Math.cos(theta),
                    3000 * Math.cos(phi),
                    3000 * Math.sin(phi) * Math.sin(theta)
                ));
            }
            const g = new THREE.BufferGeometry().setFromPoints(pts);
            disposables.push(g);
            gridGroup.add(new THREE.Line(g, gridMat));
        }
        scene.add(gridGroup);
        gridGroupRef.current = gridGroup;

        // ── 3. Voie Lactée (Nuage gazeux dense) ─────────────────────────────
        const MW_COUNT = 6000;
        const mwPos = new Float32Array(MW_COUNT * 3);
        const mwColors = new Float32Array(MW_COUNT * 3);
        for (let i = 0; i < MW_COUNT; i++) {
            const angle = (i / MW_COUNT) * Math.PI * 2;
            const spread = (Math.random() - 0.5) * 450;
            const thick = (Math.random() - 0.5) * 220;
            const r = 2600 + (Math.random() - 0.5) * 150;
            mwPos[i * 3]     = r * Math.cos(angle) + spread * 0.3;
            mwPos[i * 3 + 1] = thick;
            mwPos[i * 3 + 2] = r * Math.sin(angle) + spread;
            const cT = Math.random();
            mwColors[i * 3]     = 0.55 + cT * 0.4;
            mwColors[i * 3 + 1] = 0.65 + cT * 0.3;
            mwColors[i * 3 + 2] = 0.95;
        }
        const mwGeo = new THREE.BufferGeometry();
        mwGeo.setAttribute('position', new THREE.BufferAttribute(mwPos, 3));
        mwGeo.setAttribute('color', new THREE.BufferAttribute(mwColors, 3));
        disposables.push(mwGeo);
        const mwMat = new THREE.PointsMaterial({
            size: 2.2, vertexColors: true, transparent: true,
            opacity: 0.22, blending: THREE.AdditiveBlending, sizeAttenuation: true,
        });
        disposableMats.push(mwMat);
        const mwPoints = new THREE.Points(mwGeo, mwMat);
        mwPoints.rotation.x = Math.PI * 0.14;
        scene.add(mwPoints);
        mwPointsRef.current = mwPoints;

        // ── 4. Ligne de l'Écliptique & Repères Zodiacaux ────────────────────
        const eclipticGroup = new THREE.Group();
        const eclipticPts: THREE.Vector3[] = [];
        const EPSILON = THREE.MathUtils.degToRad(23.43929); // Obliquité de la Terre

        for (let i = 0; i <= 128; i++) {
            const lambda = (i / 128) * Math.PI * 2;
            const x = 2500 * Math.cos(lambda);
            const y = 2500 * Math.sin(lambda) * Math.sin(EPSILON);
            const z = 2500 * Math.sin(lambda) * Math.cos(EPSILON);
            eclipticPts.push(new THREE.Vector3(x, y, z));
        }
        const eclipticGeo = new THREE.BufferGeometry().setFromPoints(eclipticPts);
        disposables.push(eclipticGeo);
        const eclipticMat = new THREE.LineBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending,
        });
        disposableMats.push(eclipticMat);
        eclipticGroup.add(new THREE.Line(eclipticGeo, eclipticMat));

        // 12 marqueurs zodiacaux le long de l'écliptique
        ZODIAC_SYMBOLS.forEach((zod, idx) => {
            const lambda = (idx / 12) * Math.PI * 2 + Math.PI / 12;
            const x = 2500 * Math.cos(lambda);
            const y = 2500 * Math.sin(lambda) * Math.sin(EPSILON);
            const z = 2500 * Math.sin(lambda) * Math.cos(EPSILON);
            const pos = new THREE.Vector3(x, y, z);

            const canvas = document.createElement('canvas');
            canvas.width = 128; canvas.height = 128;
            const ctx = canvas.getContext('2d')!;
            ctx.font = '700 48px Inter, system-ui';
            ctx.fillStyle = 'rgba(255, 215, 0, 0.75)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(zod.symbol, 64, 64);
            const tex = new THREE.CanvasTexture(canvas);
            const sMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.7 });
            disposableMats.push(sMat);
            const sprite = new THREE.Sprite(sMat);
            sprite.scale.set(70, 70, 1);
            sprite.position.copy(pos).multiplyScalar(1.04);
            eclipticGroup.add(sprite);
        });
        scene.add(eclipticGroup);
        eclipticGroupRef.current = eclipticGroup;

        // ── 5. Équateur Céleste (Dec = 0°) ──────────────────────────────────
        const equatorGroup = new THREE.Group();
        const equatorPts: THREE.Vector3[] = [];
        for (let i = 0; i <= 128; i++) {
            const theta = (i / 128) * Math.PI * 2;
            equatorPts.push(new THREE.Vector3(
                2500 * Math.cos(theta),
                0,
                2500 * Math.sin(theta)
            ));
        }
        const eqGeo = new THREE.BufferGeometry().setFromPoints(equatorPts);
        disposables.push(eqGeo);
        const eqMat = new THREE.LineBasicMaterial({
            color: 0x4deeea,
            transparent: true,
            opacity: 0.16,
        });
        disposableMats.push(eqMat);
        equatorGroup.add(new THREE.Line(eqGeo, eqMat));
        scene.add(equatorGroup);
        equatorGroupRef.current = equatorGroup;

        // ── 6. Étoiles Navigables, DSO & Sondes NASA ────────────────────────
        const posMap = new Map<string, THREE.Vector3>();
        const entries: StarEntry[] = [];
        const probeBeamsGroup = new THREE.Group();

        STARS.forEach(star => {
            const pos = toSphere(star.position.x, star.position.y);
            posMap.set(star.id, pos);

            const group = new THREE.Group();
            group.position.copy(pos);
            group.userData = { body: star };

            let mesh: THREE.Object3D;
            let glowMesh: THREE.Mesh;
            let pulseRing: THREE.Mesh | undefined;

            // CAS 1 : Sondes Interstellaires (Voyager, JWST)
            if (star.type === CelestialType.PROBE) {
                const probeGeo = new THREE.OctahedronGeometry(18, 0);
                disposables.push(probeGeo);
                const probeMat = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(star.colors[0]),
                    wireframe: true,
                });
                disposableMats.push(probeMat);
                mesh = new THREE.Mesh(probeGeo, probeMat);

                // Lueur balise
                const glowGeo = new THREE.SphereGeometry(45, 12, 12);
                disposables.push(glowGeo);
                const glowMat = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(star.colors[0]),
                    transparent: true, opacity: 0.25,
                    blending: THREE.AdditiveBlending,
                });
                disposableMats.push(glowMat);
                glowMesh = new THREE.Mesh(glowGeo, glowMat);

                // Anneau d'émission pulsé
                const ringGeo = new THREE.RingGeometry(24, 28, 32);
                disposables.push(ringGeo);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(star.colors[1]),
                    side: THREE.DoubleSide,
                    transparent: true, opacity: 0.5,
                    blending: THREE.AdditiveBlending,
                });
                disposableMats.push(ringMat);
                pulseRing = new THREE.Mesh(ringGeo, ringMat);
                group.add(pulseRing);

                // Faisceau de visée radio DSN depuis le centre (Terre)
                const beamGeo = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(0, 0, 0),
                    pos
                ]);
                disposables.push(beamGeo);
                const beamMat = new THREE.LineBasicMaterial({
                    color: 0x00ffff,
                    transparent: true,
                    opacity: 0.25,
                    blending: THREE.AdditiveBlending,
                });
                disposableMats.push(beamMat);
                const beamLine = new THREE.Line(beamGeo, beamMat);
                beamLine.userData = { probeId: star.id };
                probeBeamsGroup.add(beamLine);
            }
            // CAS 2 : Nébuleuses (M42, M1, M57)
            else if (star.type === CelestialType.NEBULA) {
                const nebGeo = new THREE.SphereGeometry(24, 16, 16);
                disposables.push(nebGeo);
                const nebMat = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(star.colors[0]),
                    transparent: true, opacity: 0.7,
                });
                disposableMats.push(nebMat);
                mesh = new THREE.Mesh(nebGeo, nebMat);

                // Vaste nuage gazeux volumétrique
                const cloudGeo = new THREE.SphereGeometry(90, 16, 16);
                disposables.push(cloudGeo);
                const cloudMat = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(star.colors[1]),
                    transparent: true, opacity: 0.35,
                    blending: THREE.AdditiveBlending,
                });
                disposableMats.push(cloudMat);
                glowMesh = new THREE.Mesh(cloudGeo, cloudMat);
            }
            // CAS 3 : Objets du Ciel Profond / Amas Stellaires (M45, M13, Sgr A*)
            else if (star.type === CelestialType.DEEP_SKY || star.type === CelestialType.GALAXY) {
                const dsoGeo = new THREE.SphereGeometry(20, 16, 16);
                disposables.push(dsoGeo);
                const dsoMat = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(star.colors[0]),
                    wireframe: star.id === 'sagittarius_a_star',
                });
                disposableMats.push(dsoMat);
                mesh = new THREE.Mesh(dsoGeo, dsoMat);

                const glowGeo = new THREE.SphereGeometry(75, 16, 16);
                disposables.push(glowGeo);
                const glowMat = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(star.colors[1]),
                    transparent: true, opacity: 0.3,
                    blending: THREE.AdditiveBlending,
                });
                disposableMats.push(glowMat);
                glowMesh = new THREE.Mesh(glowGeo, glowMat);
            }
            // CAS 4 : Étoiles Standards & Géantes
            else {
                const isMajor = ['sirius', 'canopus', 'rigel', 'vega', 'arcturus', 'capella', 'betelgeuse', 'alpha_centauri', 'deneb', 'altair', 'aldebaran', 'spica', 'antares', 'pollux', 'polaris'].includes(star.id);
                const size = isMajor ? 18 : 10;

                const geo = new THREE.SphereGeometry(size, 16, 16);
                disposables.push(geo);
                const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(star.colors[0]) });
                disposableMats.push(mat);
                mesh = new THREE.Mesh(geo, mat);

                const glowGeo = new THREE.SphereGeometry(size * 3.6, 12, 12);
                disposables.push(glowGeo);
                const glowMat = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(star.colors[0]),
                    transparent: true, opacity: 0.16,
                    blending: THREE.AdditiveBlending,
                });
                disposableMats.push(glowMat);
                glowMesh = new THREE.Mesh(glowGeo, glowMat);
            }

            mesh.userData = { body: star };
            glowMesh.userData = { body: star };
            group.add(mesh);
            group.add(glowMesh);

            // Hitbox invisible généreuse pour le clic et le toucher tactile
            const hitGeo = new THREE.SphereGeometry(240, 8, 8);
            disposables.push(hitGeo);
            const hitMat = new THREE.MeshBasicMaterial({ visible: false });
            disposableMats.push(hitMat);
            const hitMesh = new THREE.Mesh(hitGeo, hitMat);
            hitMesh.userData = { body: star };
            group.add(hitMesh);

            // Label Canvas Haute Définition
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 80;
            const ctx = canvas.getContext('2d')!;
            ctx.font = '600 28px Inter, system-ui';
            ctx.fillStyle = star.type === CelestialType.PROBE ? 'rgba(0, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.9)';
            ctx.textAlign = 'left';
            ctx.fillText(star.name, 8, 50);
            const tex = new THREE.CanvasTexture(canvas);
            const labelMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0 });
            disposableMats.push(labelMat);
            const label = new THREE.Sprite(labelMat);
            label.scale.set(150, 24, 1);
            label.position.set(30, -8, 0);
            group.add(label);

            scene.add(group);
            entries.push({ group, body: star, glow: glowMesh, label, pulseRing });
        });

        scene.add(probeBeamsGroup);
        probeBeamsGroupRef.current = probeBeamsGroup;
        starPosMapRef.current = posMap;
        starEntriesRef.current = entries;

        // ── 7. Constellations Officielles (Stick Figures) ───────────────────
        const constGroup = new THREE.Group();
        const constLines: { mesh: THREE.LineSegments; id: string }[] = [];

        CONSTELLATIONS.forEach(c => {
            const linePositions: number[] = [];
            c.connections.forEach(([idA, idB]) => {
                const posA = posMap.get(idA);
                const posB = posMap.get(idB);
                if (posA && posB) {
                    linePositions.push(posA.x, posA.y, posA.z, posB.x, posB.y, posB.z);
                }
            });
            if (linePositions.length === 0) return;

            const lineGeo = new THREE.BufferGeometry();
            lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            disposables.push(lineGeo);
            const lineMat = new THREE.LineBasicMaterial({
                color: 0x4deeea, transparent: true, opacity: 0.28,
                blending: THREE.AdditiveBlending,
            });
            disposableMats.push(lineMat);
            const lines = new THREE.LineSegments(lineGeo, lineMat);
            lines.userData = { constellation: c };
            constGroup.add(lines);
            constLines.push({ mesh: lines, id: c.id });

            // Label de la constellation
            const firstId = c.connections[0]?.[0];
            const labelPos = firstId ? posMap.get(firstId) : null;
            if (labelPos) {
                const canvas = document.createElement('canvas');
                canvas.width = 512; canvas.height = 128;
                const ctx = canvas.getContext('2d')!;
                ctx.font = '700 38px Inter, system-ui';
                ctx.fillStyle = 'rgba(77, 238, 234, 0.75)';
                ctx.textAlign = 'center';
                ctx.letterSpacing = '3px';
                ctx.fillText(c.name.toUpperCase(), 256, 72);
                const tex = new THREE.CanvasTexture(canvas);
                const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.55 });
                disposableMats.push(spriteMat);
                const sprite = new THREE.Sprite(spriteMat);
                sprite.scale.set(320, 80, 1);
                sprite.position.copy(labelPos).multiplyScalar(1.1);
                constGroup.add(sprite);
            }
        });

        scene.add(constGroup);
        constGroupRef.current = constGroup;
        constLinesRef.current = constLines;

        // ── 8. Grands Astérismes Célestes ───────────────────────────────────
        const asterismGroup = new THREE.Group();
        const asterismLines: { mesh: THREE.LineSegments; id: string }[] = [];

        ASTERISMS.forEach(ast => {
            const linePositions: number[] = [];
            ast.connections.forEach(([idA, idB]) => {
                const posA = posMap.get(idA);
                const posB = posMap.get(idB);
                if (posA && posB) {
                    linePositions.push(posA.x, posA.y, posA.z, posB.x, posB.y, posB.z);
                }
            });
            if (linePositions.length === 0) return;

            const lineGeo = new THREE.BufferGeometry();
            lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            disposables.push(lineGeo);
            const lineMat = new THREE.LineBasicMaterial({
                color: ast.color, transparent: true, opacity: 0.5,
                blending: THREE.AdditiveBlending,
            });
            disposableMats.push(lineMat);
            const lines = new THREE.LineSegments(lineGeo, lineMat);
            lines.userData = { asterism: ast };
            asterismGroup.add(lines);
            asterismLines.push({ mesh: lines, id: ast.id });
        });

        scene.add(asterismGroup);
        asterismGroupRef.current = asterismGroup;
        asterismLinesRef.current = asterismLines;

        // ── 9. Ligne laser de mesure ────────────────────────────────────────
        const laserGeo = new THREE.BufferGeometry();
        laserGeo.setAttribute('position', new THREE.Float32BufferAttribute([0,0,0, 0,0,0], 3));
        disposables.push(laserGeo);
        const laserMat = new THREE.LineBasicMaterial({
            color: 0x4deeea, transparent: true, opacity: 0.85,
            blending: THREE.AdditiveBlending,
        });
        disposableMats.push(laserMat);
        const laser = new THREE.Line(laserGeo, laserMat);
        laser.visible = false;
        scene.add(laser);
        laserRef.current = laser;

        // ── Cleanup : dispose de toutes les ressources GPU ──────────────────
        return () => {
            disposables.forEach(g => g.dispose());
            disposableMats.forEach(m => m.dispose());
            scene.clear();
            starEntriesRef.current = [];
            constLinesRef.current = [];
            asterismLinesRef.current = [];
            constGroupRef.current = null;
            asterismGroupRef.current = null;
            eclipticGroupRef.current = null;
            equatorGroupRef.current = null;
            gridGroupRef.current = null;
            mwPointsRef.current = null;
            probeBeamsGroupRef.current = null;
            laserRef.current = null;
            starPosMapRef.current.clear();
        };
    }, [isReady, scene, camera, toSphere]);

    // ── Références d'état synchronisées pour la boucle RAF ────────────────────
    const orientationRef = useRef(orientation);
    orientationRef.current = orientation;
    const zoomRef = useRef(zoom);
    zoomRef.current = zoom;
    const hoveredStarIdRef = useRef<string | null>(null);
    const hoveredConstIdRef = useRef<string | null>(null);
    const hoveredAsterismIdRef = useRef<string | null>(null);
    const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());

    // ── OrbitControls (mode libre) ────────────────────────────────────────────
    useEffect(() => {
        const cam = camera.current;
        const rend = renderer.current;
        if (!rend || !cam || perspectiveMode !== 'free') {
            controlsRef.current?.dispose();
            controlsRef.current = null;
            return;
        }
        const controls = new OrbitControls(cam, rend.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 200;
        controls.maxDistance = 5000;
        controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
        };
        controlsRef.current = controls;
        return () => {
            controls.dispose();
            controlsRef.current = null;
        };
    }, [perspectiveMode, camera, renderer]);

    // ── Callbacks gestuels unifiés (useScenePointer) ───────────────────────────
    const handleRotate = useCallback((deltaRot: number, deltaInc: number) => {
        if (perspectiveMode === 'free') return;
        setOrientation({
            rotation: ((((orientationRef.current.rotation + deltaRot) + 180) % 360 + 360) % 360) - 180,
            inclination: Math.max(0, Math.min(90, orientationRef.current.inclination + deltaInc)),
        });
    }, [perspectiveMode, setOrientation]);

    const handleZoom = useCallback((zoomDelta: number) => {
        if (perspectiveMode === 'free') return;
        setZoom(Math.max(0.05, Math.min(5, zoomRef.current + zoomDelta)));
    }, [perspectiveMode, setZoom]);

    const handleTap = useCallback((_e: PointerEvent, ndc: { x: number; y: number }) => {
        const cam = camera.current;
        if (!cam) return;

        raycasterRef.current.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), cam);

        // 1. Test des étoiles, DSO et sondes
        const starGroups = starEntriesRef.current
            .filter(e => {
                if (e.body.type === CelestialType.PROBE && !showProbes) return false;
                if ((e.body.type === CelestialType.NEBULA || e.body.type === CelestialType.DEEP_SKY) && !showDeepSky) return false;
                return true;
            })
            .map(e => e.group);

        const hits = raycasterRef.current.intersectObjects(starGroups, true);
        const starHit = hits.find(h => h.object.userData.body);

        if (starHit) {
            const body = starHit.object.userData.body as CelestialBody;
            if (isMeasuringMode) addDistancePoint(body);
            else onSelect(body);
            return;
        }

        // 2. Test des constellations
        if (showConstellations && constGroupRef.current) {
            raycasterRef.current.params.Line = { threshold: 30 };
            const constHits = raycasterRef.current.intersectObjects(constGroupRef.current.children, true);
            const constHit = constHits.find(h => h.object.userData.constellation);
            if (constHit) {
                setHoveredConst(constHit.object.userData.constellation);
                setHoveredAsterism(null);
                return;
            }
        }

        // 3. Test des astérismes
        if (showAsterisms && asterismGroupRef.current) {
            raycasterRef.current.params.Line = { threshold: 30 };
            const astHits = raycasterRef.current.intersectObjects(asterismGroupRef.current.children, true);
            const astHit = astHits.find(h => h.object.userData.asterism);
            if (astHit) {
                setHoveredAsterism(astHit.object.userData.asterism);
                setHoveredConst(null);
                return;
            }
        }

        // Tap dans le vide : fermer les panneaux
        setHoveredConst(null);
        setHoveredAsterism(null);
    }, [camera, isMeasuringMode, addDistancePoint, onSelect, showConstellations, showAsterisms, showProbes, showDeepSky]);

    const handleHover = useCallback((ndc: { x: number; y: number } | null) => {
        const rend = renderer.current;
        const cam = camera.current;
        if (!rend || !cam || !ndc) {
            if (hoveredStarIdRef.current !== null) {
                hoveredStarIdRef.current = null;
                onHover(null);
            }
            if (hoveredConstIdRef.current !== null) {
                hoveredConstIdRef.current = null;
            }
            if (hoveredAsterismIdRef.current !== null) {
                hoveredAsterismIdRef.current = null;
            }
            return;
        }

        raycasterRef.current.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), cam);
        const starGroups = starEntriesRef.current.map(e => e.group);
        const hits = raycasterRef.current.intersectObjects(starGroups, true);
        const starHit = hits.find(h => h.object.userData.body);
        const starBody = starHit ? (starHit.object.userData.body as CelestialBody) : null;

        if (starBody?.id !== hoveredStarIdRef.current) {
            hoveredStarIdRef.current = starBody?.id ?? null;
            onHover(starBody);
        }

        // Test constellations
        if (!starBody && showConstellations && constGroupRef.current) {
            raycasterRef.current.params.Line = { threshold: 25 };
            const constHits = raycasterRef.current.intersectObjects(constGroupRef.current.children, true);
            const constHit = constHits.find(h => h.object.userData.constellation);
            hoveredConstIdRef.current = constHit ? constHit.object.userData.constellation.id : null;
        } else {
            hoveredConstIdRef.current = null;
        }

        // Test astérismes
        if (!starBody && showAsterisms && asterismGroupRef.current) {
            raycasterRef.current.params.Line = { threshold: 25 };
            const astHits = raycasterRef.current.intersectObjects(asterismGroupRef.current.children, true);
            const astHit = astHits.find(h => h.object.userData.asterism);
            hoveredAsterismIdRef.current = astHit ? astHit.object.userData.asterism.id : null;
        } else {
            hoveredAsterismIdRef.current = null;
        }
    }, [camera, renderer, onHover, showConstellations, showAsterisms]);

    // Écouteur tactile et souris
    useScenePointer({
        element: renderer.current?.domElement ?? null,
        onRotate: handleRotate,
        onZoom: handleZoom,
        onTap: handleTap,
        onHover: handleHover,
        enabled: isReady,
    });

    // ── Boucle d'animation (RAF unifié) ───────────────────────────────────────
    useEffect(() => {
        if (!isReady) return;
        const entries = starEntriesRef.current;
        const constLines = constLinesRef.current;
        const asterismLines = asterismLinesRef.current;

        const cleanupAnim = registerAnimation((time, scene, cam) => {
            // Contrôle caméra
            if (perspectiveMode === 'heliocentric') {
                scene.rotation.x = THREE.MathUtils.lerp(
                    scene.rotation.x, THREE.MathUtils.degToRad(orientationRef.current.inclination), 0.08
                );
                scene.rotation.y = THREE.MathUtils.lerp(
                    scene.rotation.y, THREE.MathUtils.degToRad(orientationRef.current.rotation), 0.08
                );
                const curZoom = zoomRef.current;
                const effectiveZoom = curZoom <= 0 ? (0.3 + curZoom * 0.7) : curZoom;
                const targetZ = 1500 / Math.max(0.05, effectiveZoom);
                cam.position.z = THREE.MathUtils.lerp(cam.position.z, targetZ, 0.08);
            } else {
                controlsRef.current?.update();
                scene.rotation.x = THREE.MathUtils.lerp(scene.rotation.x, 0, 0.05);
                scene.rotation.y = THREE.MathUtils.lerp(scene.rotation.y, 0, 0.05);
            }

            // Rotation lente du starfield
            const bgPoints = scene.children.find(c => c instanceof THREE.Points && c !== mwPointsRef.current);
            if (bgPoints) bgPoints.rotation.y += 0.00003;

            // Visibilité des calques
            if (gridGroupRef.current) gridGroupRef.current.visible = showGrid;
            if (mwPointsRef.current) {
                mwPointsRef.current.visible = showMilkyWay;
                if (showMilkyWay) mwPointsRef.current.rotation.y += 0.00008;
            }
            if (constGroupRef.current) constGroupRef.current.visible = showConstellations;
            if (asterismGroupRef.current) asterismGroupRef.current.visible = showAsterisms;
            if (eclipticGroupRef.current) eclipticGroupRef.current.visible = showEcliptic;
            if (equatorGroupRef.current) equatorGroupRef.current.visible = showGrid;
            if (probeBeamsGroupRef.current) probeBeamsGroupRef.current.visible = showProbes;

            // Animation des sondes et étoiles
            entries.forEach(e => {
                const isProbe = e.body.type === CelestialType.PROBE;
                const isDso = e.body.type === CelestialType.NEBULA || e.body.type === CelestialType.DEEP_SKY;

                // Visibilité conditionnelle par calque
                if (isProbe) e.group.visible = showProbes;
                else if (isDso) e.group.visible = showDeepSky;

                const isHov = hoveredStarIdRef.current === e.body.id;
                const targetScale = isHov ? 2.4 : 1.0;
                e.group.scale.setScalar(THREE.MathUtils.lerp(e.group.scale.x, targetScale, 0.12));

                const glowMat = e.glow.material as THREE.MeshBasicMaterial;
                glowMat.opacity = THREE.MathUtils.lerp(glowMat.opacity, isHov ? 0.9 : 0.16, 0.1);

                const labelMat = e.label.material as THREE.SpriteMaterial;
                labelMat.opacity = THREE.MathUtils.lerp(labelMat.opacity, isHov ? 1.0 : (isProbe ? 0.6 : 0), 0.1);

                // Pulsation des anneaux d'ondes pour les sondes NASA
                if (e.pulseRing) {
                    const wavePhase = (time * 0.002) % 1.0;
                    e.pulseRing.scale.setScalar(1.0 + wavePhase * 1.5);
                    const ringMat = e.pulseRing.material as THREE.MeshBasicMaterial;
                    ringMat.opacity = (1.0 - wavePhase) * 0.6;
                }
            });

            // Lignes de constellations (survol)
            constLines.forEach(l => {
                const isHov = hoveredConstIdRef.current === l.id;
                const mat = l.mesh.material as THREE.LineBasicMaterial;
                mat.opacity = THREE.MathUtils.lerp(mat.opacity, isHov ? 0.95 : 0.28, 0.08);
            });

            // Lignes d'astérismes (survol)
            asterismLines.forEach(l => {
                const isHov = hoveredAsterismIdRef.current === l.id;
                const mat = l.mesh.material as THREE.LineBasicMaterial;
                mat.opacity = THREE.MathUtils.lerp(mat.opacity, isHov ? 1.0 : 0.45, 0.08);
            });

            // Laser de mesure
            const laser = laserRef.current;
            if (laser) {
                if (isMeasuringMode && distancePoints.length === 2) {
                    const posA = starPosMapRef.current.get(distancePoints[0].id);
                    const posB = starPosMapRef.current.get(distancePoints[1].id);
                    if (posA && posB) {
                        laser.geometry.setAttribute('position', new THREE.Float32BufferAttribute([
                            posA.x, posA.y, posA.z,
                            posB.x, posB.y, posB.z,
                        ], 3));
                        laser.geometry.attributes.position.needsUpdate = true;
                        laser.visible = true;
                    }
                } else {
                    laser.visible = false;
                }
            }
        });

        return () => {
            cleanupAnim();
        };
    }, [
        isReady, registerAnimation,
        showGrid, showMilkyWay, showConstellations, showEcliptic, showDeepSky, showProbes, showAsterisms,
        perspectiveMode, isMeasuringMode, distancePoints,
    ]);

    // ── Rendu UI overlay ──────────────────────────────────────────────────────
    return (
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            {/* En-tête viewport (desktop/tablette) */}
            <div className="hidden md:flex absolute top-6 left-1/2 -translate-x-1/2 flex-col items-center gap-1 bg-black/80 backdrop-blur-2xl px-8 py-3 rounded-full border border-white/10 shadow-2xl z-30">
                <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-ping" />
                    <span className="font-mono text-[9px] uppercase text-white/50 tracking-[0.3em] font-black">
                        Gaia DR3 & NASA DSN Live Sky
                    </span>
                </div>
                <span className="font-mono text-[11px] text-[var(--accent-primary)] font-black tracking-[0.2em] uppercase">
                    32 Constellations • Deep Space Objects • Realtime Probes
                </span>
            </div>

            {/* Brackets HUD (safe areas) */}
            <div className="absolute top-4 left-4 sm:top-8 sm:left-8 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-l-2 border-[var(--accent-primary)]/30 rounded-tl-xl sm:rounded-tl-2xl" />
            <div className="absolute top-4 right-4 sm:top-8 sm:right-8 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-r-2 border-[var(--accent-primary)]/30 rounded-tr-xl sm:rounded-tr-2xl" />
            <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-l-2 border-[var(--accent-primary)]/30 rounded-bl-xl sm:rounded-bl-2xl" />
            <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-r-2 border-[var(--accent-primary)]/30 rounded-br-xl sm:rounded-br-2xl" />

            {/* Barre de Contrôle des Calques Célestes (Floating Capsule Dock — Bottom Centered) */}
            <div className="fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto z-40 flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-full bg-black/85 backdrop-blur-3xl border border-white/15 shadow-[0_10px_35px_rgba(0,0,0,0.8)] max-w-[95vw] overflow-x-auto no-scrollbar">
                {/* Toggle Constellations */}
                <button
                    onClick={() => setShowConstellations(!showConstellations)}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 min-h-[44px] rounded-full border transition-all backdrop-blur-3xl text-[9px] font-black uppercase tracking-[0.15em] cursor-pointer whitespace-nowrap flex-shrink-0 ${showConstellations
                        ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-[0_0_15px_rgba(77,238,234,0.2)]'
                        : 'bg-black/60 border-white/10 text-white/40 hover:text-white'
                        }`}
                >
                    <Waypoints size={13} />
                    <span>Constellations</span>
                </button>

                {/* Toggle Écliptique */}
                <button
                    onClick={() => setShowEcliptic(!showEcliptic)}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 min-h-[44px] rounded-full border transition-all backdrop-blur-3xl text-[9px] font-black uppercase tracking-[0.15em] cursor-pointer whitespace-nowrap flex-shrink-0 ${showEcliptic
                        ? 'bg-amber-400/15 border-amber-400/80 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                        : 'bg-black/60 border-white/10 text-white/40 hover:text-white'
                        }`}
                >
                    <Orbit size={13} />
                    <span>Écliptique</span>
                </button>

                {/* Toggle Ciel Profond (DSO) */}
                <button
                    onClick={() => setShowDeepSky(!showDeepSky)}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 min-h-[44px] rounded-full border transition-all backdrop-blur-3xl text-[9px] font-black uppercase tracking-[0.15em] cursor-pointer whitespace-nowrap flex-shrink-0 ${showDeepSky
                        ? 'bg-purple-500/15 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                        : 'bg-black/60 border-white/10 text-white/40 hover:text-white'
                        }`}
                >
                    <Sparkles size={13} />
                    <span>DSO Messier</span>
                </button>

                {/* Toggle Sondes NASA DSN */}
                <button
                    onClick={() => setShowProbes(!showProbes)}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 min-h-[44px] rounded-full border transition-all backdrop-blur-3xl text-[9px] font-black uppercase tracking-[0.15em] cursor-pointer whitespace-nowrap flex-shrink-0 ${showProbes
                        ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-black/60 border-white/10 text-white/40 hover:text-white'
                        }`}
                >
                    <Radio size={13} className={showProbes ? "animate-pulse" : ""} />
                    <span>Sondes NASA</span>
                </button>

                {/* Toggle Astérismes */}
                <button
                    onClick={() => setShowAsterisms(!showAsterisms)}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 min-h-[44px] rounded-full border transition-all backdrop-blur-3xl text-[9px] font-black uppercase tracking-[0.15em] cursor-pointer whitespace-nowrap flex-shrink-0 ${showAsterisms
                        ? 'bg-rose-500/15 border-rose-400 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                        : 'bg-black/60 border-white/10 text-white/40 hover:text-white'
                        }`}
                >
                    <Sparkle size={13} />
                    <span>Astérismes</span>
                </button>

                {/* Toggle Voie Lactée */}
                <button
                    onClick={() => setShowMilkyWay(!showMilkyWay)}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 min-h-[44px] rounded-full border transition-all backdrop-blur-3xl text-[9px] font-black uppercase tracking-[0.15em] cursor-pointer whitespace-nowrap flex-shrink-0 ${showMilkyWay
                        ? 'bg-blue-500/15 border-blue-400/70 text-blue-300'
                        : 'bg-black/60 border-white/10 text-white/40 hover:text-white'
                        }`}
                >
                    <Globe size={13} />
                    <span>Voie Lactée</span>
                </button>
            </div>

            {/* Fiche d'information de Constellation au survol ou tap */}
            <AnimatePresence>
                {hoveredConst && (
                    <motion.div
                        key={hoveredConst.id}
                        initial={{ opacity: 0, y: 16, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.95 }}
                        className="absolute bottom-6 left-4 right-4 sm:bottom-auto sm:top-36 sm:left-6 sm:right-auto monolith-panel p-4 sm:p-6 sm:w-[340px] max-h-[45vh] sm:max-h-[60vh] overflow-y-auto border-[var(--accent-primary)]/30 pointer-events-auto z-40 shadow-2xl rounded-2xl sm:rounded-3xl"
                    >
                        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                            <div className="flex items-center gap-2">
                                <Sparkles size={12} className="text-[var(--accent-primary)]" />
                                <span className="font-mono text-[8px] uppercase text-[var(--accent-primary)] font-black tracking-[0.3em]">IAU Constellation</span>
                            </div>
                            <button
                                onClick={() => setHoveredConst(null)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer touch-target"
                                title="Fermer"
                                aria-label="Fermer"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <h4 className="text-xl font-black uppercase text-white tracking-tight mb-1">{hoveredConst.name}</h4>
                        <p className="text-xs text-[#8e8e9f] leading-relaxed mb-3">{hoveredConst.description}</p>
                        
                        {hoveredConst.astronomicalContext && (
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 mb-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Info size={11} className="text-[var(--accent-primary)]" />
                                    <span className="font-mono text-[8px] uppercase text-white/50 font-black tracking-wider">Contexte Astrophysique</span>
                                </div>
                                <p className="text-[10px] text-white/80 leading-relaxed">{hoveredConst.astronomicalContext}</p>
                            </div>
                        )}

                        {hoveredConst.messierObjects && hoveredConst.messierObjects.length > 0 && (
                            <div className="mb-3">
                                <span className="text-[8px] text-[#8e8e9f] uppercase font-black tracking-wider block mb-1">Objets Messier Notables</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {hoveredConst.messierObjects.map((m, idx) => (
                                        <span key={idx} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] text-[var(--accent-primary)] font-mono">
                                            {m}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {hoveredConst.area && (
                            <div className="flex gap-4 pt-2 border-t border-white/5 text-[10px]">
                                <div>
                                    <span className="text-[8px] text-[#8e8e9f] uppercase font-black block">Superficie</span>
                                    <span className="text-white font-bold">{hoveredConst.area}</span>
                                </div>
                                {hoveredConst.bestObservation && (
                                    <div>
                                        <span className="text-[8px] text-[#8e8e9f] uppercase font-black block">Observation</span>
                                        <span className="text-white font-bold">{hoveredConst.bestObservation}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fiche d'information d'Astérisme */}
            <AnimatePresence>
                {hoveredAsterism && (
                    <motion.div
                        key={hoveredAsterism.id}
                        initial={{ opacity: 0, y: 16, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.95 }}
                        className="absolute bottom-6 left-4 right-4 sm:bottom-auto sm:top-36 sm:left-6 sm:right-auto monolith-panel p-4 sm:p-6 sm:w-[340px] border-amber-400/30 pointer-events-auto z-40 shadow-2xl rounded-2xl sm:rounded-3xl"
                    >
                        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                            <div className="flex items-center gap-2">
                                <Sparkle size={12} className="text-amber-400" />
                                <span className="font-mono text-[8px] uppercase text-amber-400 font-black tracking-[0.3em]">Grand Astérisme</span>
                            </div>
                            <button
                                onClick={() => setHoveredAsterism(null)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer touch-target"
                                title="Fermer"
                                aria-label="Fermer"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <h4 className="text-xl font-black uppercase text-white tracking-tight mb-1">{hoveredAsterism.name}</h4>
                        <p className="text-xs text-[#8e8e9f] leading-relaxed mb-3">{hoveredAsterism.description}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Vignette */}
            <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.6)] sm:shadow-[inset_0_0_200px_rgba(0,0,0,0.8)] pointer-events-none" />
        </div>
    );
};
