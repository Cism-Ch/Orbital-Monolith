import { NextResponse } from 'next/server';
import { fetchRealtimeDSN, fetchLiveNearEarthObjects } from '@/services/nasaService';

export const dynamic = 'force-dynamic';
export const revalidate = 30; // 30 secondes de cache Next.js

/**
 * Route API /api/telemetry
 * Fournit la télémétrie en direct du NASA Deep Space Network (DSN Now)
 * et les véritables astéroïdes géocroiseurs (Near-Earth Objects) du JPL.
 */
export async function GET() {
    try {
        const [dsn, neos] = await Promise.all([
            fetchRealtimeDSN(),
            fetchLiveNearEarthObjects(8),
        ]);

        return NextResponse.json({
            data: {
                dsn,
                neos,
                serverTime: new Date().toISOString(),
            },
            error: null,
        });
    } catch (err: any) {
        return NextResponse.json(
            {
                data: null,
                error: err?.message || 'Erreur lors de la récupération des données NASA',
            },
            { status: 500 }
        );
    }
}
