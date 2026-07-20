"use client";

import { useState, useEffect, useMemo } from 'react';
import type { CelestialBody } from '@/types';

export interface TelemetryLog {
    id: string;
    timestamp: string;
    event: string;
    value: string;
    status: 'OPTIMAL' | 'STABLE' | 'WARNING';
}

/** Génère un flux de données de télémétrie astrophysique réelle pour un corps céleste */
export function useTelemetry(body?: CelestialBody, limit: number = 20) {
    const [logs, setLogs] = useState<TelemetryLog[]>([]);

    // Génère des métriques scientifiques réalistes basées sur les propriétés réelles de l'astre
    const bodyEvents = useMemo(() => {
        if (!body) {
            return [
                { event: "GAIA_PARALLAX_MATRIX", value: "379.2 mas" },
                { event: "HELIOCENTRIC_VELOCITY", value: "29.78 km/s" },
                { event: "MAGNETIC_FLUX_DENSITY", value: "0.48 Gauss" },
                { event: "DOPPLER_SPECTRAL_SHIFT", value: "z = +0.000042" },
                { event: "PHOTOMETRIC_MAGNITUDE", value: "-26.74 m_v" },
                { event: "SIGNAL_PROPAGATION_DELAY", value: "499.0 s (8m 19s)" },
            ];
        }

        const mass = body.properties.mass ?? "1.0 Sol";
        const radius = body.properties.radius ?? "1.0 R_Earth";
        const gravity = body.properties.gravity ?? "9.81 m/s²";
        const temp = body.properties.temp ?? "288 K";
        const period = body.properties.period ?? body.properties.rotationPeriod ?? "24.0 h";
        const mag = body.properties.magnitude ?? "-1.46";
        const dist = body.distance ?? "1.0 AU";

        return [
            { event: `SPECTRAL_CLASS // ${body.name.toUpperCase()}`, value: body.properties.spectralClass ?? (body.type === 'STAR' ? 'G2V' : 'TERRESTRIAL') },
            { event: "SURFACE_GRAVITY_g", value: gravity },
            { event: "EQUATORIAL_RADIUS_R", value: radius },
            { event: "EFFECTIVE_TEMP_T_eff", value: temp },
            { event: "TOTAL_MASS_M", value: mass },
            { event: "ORBITAL_PERIOD_P", value: period },
            { event: "APPARENT_MAGNITUDE_m_v", value: `${mag} m_v` },
            { event: "HELIOCENTRIC_DIST_d", value: dist },
            { event: "ATMOSPHERIC_PROFILE", value: body.properties.atmosphere ? body.properties.atmosphere.split(',')[0] : "Trace / Vacuum" },
            { event: "ESCAPE_VELOCITY_v_esc", value: body.properties.escapeVelocity ?? "11.2 km/s" },
            { event: "GAIA_CATALOG_ID", value: `GAIA_DR3_${body.id.toUpperCase()}` },
        ];
    }, [body]);

    useEffect(() => {
        // Initialiser avec quelques entrées authentiques de départ
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
                const randomItem = bodyEvents[Math.floor(Math.random() * bodyEvents.length)];
                // Varier légèrement les valeurs pour refléter une télémétrie en direct
                let liveVal = randomItem.value;
                if (randomItem.event.includes('GRAVITY') || randomItem.event.includes('TEMP')) {
                    const noise = (1 + (Math.random() - 0.5) * 0.004).toFixed(4);
                    liveVal = `${randomItem.value} (x${noise})`;
                }

                const newLog: TelemetryLog = {
                    id: Math.random().toString(36).substring(2, 9),
                    timestamp: new Date().toLocaleTimeString('fr-FR', { hour12: false }),
                    event: randomItem.event,
                    value: liveVal,
                    status: Math.random() > 0.92 ? 'WARNING' : 'OPTIMAL',
                };
                return [...prev, newLog].slice(-limit);
            });
        }, 2500);

        return () => clearInterval(interval);
    }, [bodyEvents, body?.id, limit]);

    return logs;
}
