"use client";

import { useState, useEffect, useMemo } from 'react';
import type { CelestialBody } from '@/types';
import { getKeplerianState } from '@/services/nasaService';

export interface TelemetryLog {
    id: string;
    timestamp: string;
    event: string;
    value: string;
    status: 'OPTIMAL' | 'STABLE' | 'WARNING';
}

/**
 * Génère un flux de données de télémétrie astrophysique rigoureuse
 * basé sur les éphémérides képlériennes réelles et le catalogue Gaia DR3.
 */
export function useTelemetry(body?: CelestialBody, limit: number = 20) {
    const [logs, setLogs] = useState<TelemetryLog[]>([]);

    // Génère des métriques scientifiques authentiques basées sur la physique réelle de l'astre
    const bodyEvents = useMemo(() => {
        if (!body) {
            return [
                { event: "ICRF_J2000_EPOCH", value: "2461328.5 JDTDB" },
                { event: "HELIOCENTRIC_VELOCITY // EARTH", value: "29.78 km/s" },
                { event: "SOLAR_CONSTANT_IRRADIANCE", value: "1361 W/m²" },
                { event: "SPEED_OF_LIGHT_c", value: "299 792,458 km/s" },
                { event: "ONE_WAY_LIGHT_TIME // 1 AU", value: "499.0 s (8m 19s)" },
                { event: "DEEP_SPACE_NETWORK_CARRIER", value: "X-BAND 8445.22 MHz" },
            ];
        }

        const events: { event: string; value: string }[] = [];

        // Si planète ou planète naine : calculs képlériens réels temps réel
        const kState = getKeplerianState(body.id, new Date());
        if (kState) {
            events.push(
                { event: "TRUE_HELIOCENTRIC_DIST", value: `${kState.heliocentricDistanceAu} UA (${(kState.heliocentricDistanceKm / 1e6).toFixed(1)}M km)` },
                { event: "VIS_VIVA_ORBITAL_SPEED", value: `${kState.orbitalSpeedKmS} km/s` },
                { event: "TRUE_ANOMALY_nu", value: `${kState.trueAnomalyDeg}°` },
                { event: "ONE_WAY_LIGHT_DELAY", value: `${kState.lightDelaySeconds} s` },
                { event: "ORBITAL_ECCENTRICITY_e", value: `${kState.eccentricity}` },
                { event: "ORBITAL_INCLINATION_i", value: `${kState.inclinationDeg}°` },
            );
        }

        // Propriétés physiques réelles du corps
        if (body.properties.mass) events.push({ event: "TOTAL_MASS_M", value: body.properties.mass });
        if (body.properties.radius) events.push({ event: "EQUATORIAL_RADIUS_R", value: body.properties.radius });
        if (body.properties.gravity) events.push({ event: "SURFACE_GRAVITY_g", value: body.properties.gravity });
        if (body.properties.escapeVelocity) events.push({ event: "ESCAPE_VELOCITY_v_esc", value: body.properties.escapeVelocity });
        if (body.properties.temp) events.push({ event: "EFFECTIVE_TEMP_T_eff", value: body.properties.temp });
        if (body.properties.period) events.push({ event: "SIDEREAL_PERIOD_P", value: body.properties.period });
        if (body.properties.rotationPeriod) events.push({ event: "ROTATION_PERIOD", value: body.properties.rotationPeriod });
        if (body.properties.spectralClass) events.push({ event: "SPECTRAL_CLASS", value: body.properties.spectralClass });
        if (body.properties.magnitude) events.push({ event: "APPARENT_MAGNITUDE_m_v", value: `${body.properties.magnitude} m_v` });
        if (body.properties.absoluteMagnitude) events.push({ event: "ABSOLUTE_MAGNITUDE_M_V", value: `${body.properties.absoluteMagnitude} M_v` });
        if (body.properties.albedo) events.push({ event: "GEOMETRIC_ALBEDO", value: `${body.properties.albedo}` });
        if (body.properties.moons) events.push({ event: "SATELLITE_COUNT", value: `${body.properties.moons}` });
        if (body.properties.atmosphere) events.push({ event: "ATMOSPHERIC_COMPOSITION", value: body.properties.atmosphere });

        // Coordonnées de pointage ICRF
        events.push({ event: "ICRF_SKY_COORDINATES", value: `RA ${body.position.x}° | DEC ${body.position.y}°` });

        return events;
    }, [body]);

    useEffect(() => {
        // Initialiser avec les 6 premières métriques authentiques
        const initialLogs: TelemetryLog[] = bodyEvents.slice(0, 6).map((item, idx) => ({
            id: `init-${idx}-${body?.id ?? 'default'}`,
            timestamp: new Date(Date.now() - (6 - idx) * 2000).toLocaleTimeString('fr-FR', { hour12: false }),
            event: item.event,
            value: item.value,
            status: 'STABLE',
        }));

        setLogs(initialLogs);

        const interval = setInterval(() => {
            setLogs(prev => {
                if (bodyEvents.length === 0) return prev;
                // Sélectionner un événement physique réel à diffuser
                const item = bodyEvents[Math.floor(Math.random() * bodyEvents.length)];

                const newLog: TelemetryLog = {
                    id: Math.random().toString(36).substring(2, 9),
                    timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
                    event: item.event,
                    value: item.value,
                    status: 'OPTIMAL',
                };
                return [...prev, newLog].slice(-limit);
            });
        }, 2500);

        return () => clearInterval(interval);
    }, [bodyEvents, body?.id, limit]);

    return logs;
}

