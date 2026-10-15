# 🤖 AGENTS.md — Orbital Monolith Project Guidelines & Behavioral Constraints

Fichier de directives et de règles d'ingénierie logicielle pour les agents AI travaillant sur la codebase **Orbital Monolith**.

---

## 🏗️ 1. Architecture & Principes Fondamentaux

1. **Framework & Layout Persistant** :
   - Next.js 16 (App Router) avec React Server Components (RSC) par défaut pour les pages statiques/serveur.
   - Le moteur WebGL Three.js est géré de façon centralisée et persistance via `UniverseEngineContext` dans [layout.tsx](file:///c:/Users/hanok/Dev/Personal-Project/Orbital-Monolith/src/app/dashboard/layout.tsx).
   - Les composants 3D dépendants de Three.js doivent **impérativement** être importés dynamiquement sans SSR (`dynamic(() => import(...), { ssr: false })`).

2. **Structure des Répertoires** :
   - `@/app/` : Routes App Router, layouts, globals.css.
   - `@/components/ui/` : Composants d'interface utilisateur, overlays, modales et contrôles.
   - `@/components/view/` : Scènes 3D Three.js (`SolarSystemView.tsx`, `SkyMapView.tsx`, `CelestialBody3D.tsx`).
   - `@/lib/` : Singleton de contexte React (`DashboardContext.tsx`, `UniverseEngineContext.tsx`).
   - `@/services/` : Calculs astrophysiques (distances, coordonnées célestes) & recherche.
   - `@/constants/` : Datasets astrophysiques JPL (Système Solaire) et Gaia DR3 (Étoiles).
   - `@/types/` : Modèles de données TypeScript stricts.

---

## 🎨 2. Design System & Règles UI/UX

1. **Tokens Sémantiques & CSS** :
   - Toujours utiliser les tokens du Design System définis dans `globals.css` (`--accent-primary`, `--basalt-surface` [Obsidian Glass haute netteté sans grain], `.monolith-panel`, `.monolith-card`).
   - Ne pas utiliser de couleurs brutes ad-hoc dans le code sans passer par les tokens sémantiques ou l'accentuation d'astre.
   - Ne pas réintroduire de filtres de grain ou de bruit de texture qui nuisent à la netteté et à la lisibilité de l'interface.


2. **Normes Mobile-First & Ergonomie Tactile** :
   - **Tactile Target** : Toutes les zones interactives (boutons, filtres, commutateurs) doivent posséder une hauteur minimale de **$44\times 44\text{px}$** (`min-h-[44px]`).
   - **Canvas WebGL Touch Policy** : Appliquer `touch-action: none` sur le viewport 3D persistant (`#universe-viewport`) pour empêcher le scroll indésirable du navigateur lors de l'interaction 3D au doigt.
   - **Drawer & Bottom Sheet** : Sur écran mobile (`< 768px`), la sidebar devient un **Navigation Drawer** coulissant avec backdrop flouté, et le panneau inspecteur s'affiche sous forme de **Bottom Sheet** réactive.

3. **Polices & Icônes** :
   - Utiliser uniquement des icônes vectorielles SVG (ex: `lucide-react`). **Interdiction d'utiliser des emojis comme icônes structurelles**.
   - Typographie principale : `Fira Code` / Monospace scientifique (`font-mono`).

---

## 🛡️ 3. Typage & Qualité du Code

1. **TypeScript Strict** :
   - Aucun type `any` implicite. Définir des interfaces et types clairs dans `@/types/index.ts`.
   - Utiliser systématiquement l'alias d'importation `@/*`.

2. **Hygiène du Code** :
   - Conserver tous les commentaires existants et docstrings pertinents.
   - Ne jamais effacer ou écraser le contenu des fichiers `.env` ou `.env.local` lors des éditions ; les commenter si nécessaire.

3. **Server Actions & State Updates** :
   - Privilégier le pattern `{ data, error }` pour les réponses de Server Actions ou hooks asynchrones.

---

## 🧪 4. Protocole de Validation & Vérification

Avant de déclarer une tâche ou une fonctionnalité comme terminée :

1. **Vérification TypeScript Strict** :
   ```bash
   pnpm type-check
   ```
   Doit renvoyer **0 erreur**.

2. **Validation du Build de Production** :
   ```bash
   pnpm build
   ```
   Toutes les routes statiques doivent être compilées proprement.

