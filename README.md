<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Orbital Monolith v2

**Advanced Stellar Dynamics & Visualization Engine** — Next.js 15 + Three.js + Tailwind CSS v4.

## Run Locally

**Prerequisites:** Node.js ≥ 18

1. Install dependencies:
   ```
   npm install
   ```
2. Start the development server:
   ```
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type validation (no emit) |

## Architecture Overview

```
src/
├── app/                    # Next.js App Router pages & layouts
│   ├── layout.tsx          # Root layout (grain + scanline effects)
│   ├── page.tsx            # Landing page
│   ├── onboarding/         # Boot sequence screen → redirects to /dashboard
│   └── dashboard/
│       ├── layout.tsx      # Sidebar + header + footer shell (client)
│       ├── page.tsx        # Main view (Solar System / Sky Map + panels)
│       ├── map/            # Full-screen Sky Cartography page
│       ├── archive/        # Gaia document archive page
│       └── settings/       # System calibration page
├── components/
│   ├── ui/                 # UI widgets (FocusView, TelemetryStream, ControlPanel, …)
│   └── view/               # Three.js views (SolarSystemView, SkyMapView, UniverseContainer, CelestialBody3D)
├── hooks/
│   ├── useUniverseEngine   # Shared Three.js renderer / scene / animation-loop lifecycle
│   ├── useAccentColors     # Updates --accent-primary CSS variables from selected body
│   ├── useTelemetry        # Live simulated telemetry log stream
│   └── useClock            # 100 ms precision wall-clock ticker
├── services/
│   └── celestialService    # Search & distance helpers
├── constants/index.ts      # SOLAR_SYSTEM, STARS, CONSTELLATIONS data
└── types/index.ts          # CelestialBody, CelestialType
```
