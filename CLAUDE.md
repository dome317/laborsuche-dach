# Laborsuche DACH

## Projekt
Interaktive Karte: DEXA Body Composition Scans + Blutuntersuchungen als Selbstzahler im DACH-Raum.
Coding-Challenge für Bahmann Coaching GmbH (Abnehm-Coaching, Hannover).
Basis: Fork von wellywahyudi/nextjs-leaflet-starter.

## Tech-Stack
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS (vom Starter-Repo)
- **Karte:** Vanilla Leaflet (NICHT react-leaflet, NICHT shadcn-map)
- **Tiles:** Carto Voyager: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`
- **Icons:** lucide-react (bereits im Repo)
- **Suche:** fuse.js (hinzufügen)
- **Clustering:** leaflet.markercluster (hinzufügen)
- **Daten:** Static JSON in `public/data/providers.json`
- **Python-Pipeline:** httpx, beautifulsoup4, geopy, pydantic, rapidfuzz

## Architektur-Regeln
- Das Repo nutzt vanilla Leaflet (L.map, L.marker) — NIEMALS react-leaflet importieren
- Kein shadcn/ui, kein shadcn-map — das Repo hat eigenes Komponentensystem
- TypeScript strict, keine `any`
- GeoJSON coordinates sind [lng, lat], NICHT [lat, lng]
- Unnötige Repo-Features (Measurement, Drawing, Context Menu) werden NICHT gelöscht, nur nicht gerendert/importiert

## Wichtig
- IMMER `npm run build` nach Code-Änderungen — 0 TypeScript-Fehler
- Jeden logischen Schritt committen mit aussagekräftiger Message
- providers.json MUSS im Repo eingecheckt sein
- Sidebar ist LINKS, Karte RECHTS (Desktop)
- Mobile: Karte fullscreen + Bottom Drawer

## Bewertungskriterien (Priorität)
1. Datenqualität (40%) — DEXA Body Comp ≠ Knochendichte unterscheiden!
2. Herangehensweise (20%) — Recherche dokumentiert, reproduzierbar
3. Code-Qualität (15%) — lesbar, strukturiert, kein Overengineering
4. Datenmodell (10%) — sauberes Schema, erweiterbar, API-tauglich
5. Kartenansicht (10%) — funktioniert, responsive, benutzbar
6. Dokumentation (5%) — README erklärt Setup + Entscheidungen
