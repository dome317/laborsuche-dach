# Sprint 3: Docker + PWA + README + Shipping

Letzte Phase: Production-ready Verpackung. README ist dein Bewerbungsgespräch.

## Schritte

### SCHRITT 1: Docker Multi-Stage Build
- Erstelle `Dockerfile` im Projekt-Root:
  ```dockerfile
  FROM node:20-alpine AS build
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build

  FROM node:20-alpine AS runner
  WORKDIR /app
  COPY --from=build /app/.next/standalone ./
  COPY --from=build /app/.next/static ./.next/static
  COPY --from=build /app/public ./public
  EXPOSE 3000
  CMD ["node", "server.js"]
  ```
- Passe next.config falls nötig an: `output: 'standalone'`
- Erstelle `docker-compose.yml`:
  ```yaml
  services:
    app:
      build: .
      ports:
        - "3000:3000"
  ```
- Teste: `docker compose up` → http://localhost:3000 zeigt Karte
- Commit: "feat: docker setup with standalone build"

### SCHRITT 2: PWA Manifest
- Erstelle `public/manifest.json`:
  ```json
  {
    "name": "Laborsuche DACH",
    "short_name": "Laborsuche",
    "start_url": "/?source=pwa",
    "display": "standalone",
    "theme_color": "#2563EB",
    "background_color": "#ffffff",
    "icons": [
      { "src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml" }
    ]
  }
  ```
- Verlinke in Layout/Head: `<link rel="manifest" href="/manifest.json">`
- Commit: "feat: PWA manifest"

### SCHRITT 3: Screenshots
- Beschreibe mir welche Screenshots ich manuell machen soll (welche Ansicht, welche Filter aktiv)
- Nenne die Dateinamen: `docs/screenshots/desktop.png`, `docs/screenshots/mobile.png`
- Commit mache ich manuell nach dem Erstellen

### SCHRITT 4: README.md
Schreibe das README mit EXAKT dieser Struktur und diesem Ton.
Ziel: 180–250 Zeilen. Story > Checkliste. Professionell, nicht aufgeblasen.

```markdown
# Laborsuche DACH 🔬

**Das Problem:** Wer in Deutschland, Österreich oder der Schweiz einen DEXA
Body Composition Scan oder eine Blutuntersuchung als Selbstzahler sucht,
steht vor einem Informationsvakuum. Google zeigt hauptsächlich Praxen die
nur Knochendichtemessung anbieten — nicht Body Composition.

Auf [janbahmann.de/blog/koerperfett-reduzieren](https://www.janbahmann.de/blog/koerperfett-reduzieren)
wird die DEXA-Messung für Selbstzahler empfohlen — aber wohin genau? Diese
Laborsuche schließt die Lücke zwischen Coaching-Empfehlung und konkretem
Anbieter in der Nähe.

[Screenshot Desktop] [Screenshot Mobile]

## Quick Start

### Lokal starten
```bash
npm install
npm run dev
# → http://localhost:3000
```

### Mit Docker
```bash
docker compose up
# → http://localhost:3000
```

## Features

- **Interaktive Karte** mit farbcodierten Markern (DEXA = Blau, Blutlabor = Grün, Beides = Violett)
- **Filterfunktion** (Alle / DEXA Body Composition / Blutlabor Selbstzahler)
- **Detail-Ansicht** mit Preisen, Kontakt, Buchungslinks
- **Fuzzy-Suche** nach Name, Stadt oder PLZ
- **Deep-Links** für Coaches: `?category=dexa&city=hannover`
- **WhatsApp-Share** zum Teilen mit Coaching-Kunden
- **Marker-Clustering** bei vielen Anbietern im gleichen Gebiet
- **Geolocation** mit Entfernungsanzeige ("2,3 km entfernt")
- **Responsive** — Desktop-Sidebar + Mobile Bottom-Drawer
- **PWA-installierbar** — "Zum Startbildschirm hinzufügen"

## Datenqualität

| Metrik | Wert |
|--------|------|
| Gesamt-Einträge | [ZAHL] |
| DEXA Body Composition | [ZAHL] |
| Blutlabor Selbstzahler | [ZAHL] |
| Verifiziert | [ZAHL] ([X]%) |
| Telefonisch verifiziert | [ZAHL] DEXA-Anbieter |
| Regionen | [LISTE] |

### Recherche-Transparenz

**DEXA Body Composition:** [X] Kandidaten via Google Places API gefunden →
Keyword-Scoring klassifiziert [Y] als Body Composition → [Z] manuell +
telefonisch bestätigt. Erkenntnis: [N] von [M] angerufenen Praxen boten
nur Knochendichte, obwohl die Website "DEXA Scan" bewarb.

**Blutlabor:** meindirektlabor.de (Sonic Healthcare) lieferte [X] Standorte
als Basis. Ergänzt durch Bioscientia, Synlab und Einzellabore.

## Recherche-Methodik

### 1. Kandidatensuche
Google Places API via Apify (kostenloser Tier) + manuelle Recherche auf
megeni.com, dexascan.com, meindirektlabor.de.

### 2. Klassifikation (DEXA Body Comp vs. Knochendichte)
Keyword-Scoring auf Website-Texten:
- "Body Composition" / "Körperzusammensetzung" / "viszerales Fett" → +Score
- "Osteoporose" ohne Body-Comp-Kontext / "nur Knochendichte" → −Score
- Grenzfälle: Claude API als Classifier (mit Confidence-Score)

### 3. Verifizierung
Website-Prüfung + telefonische Verifizierung bei [X] DEXA-Anbietern.
Jeder Eintrag hat eine nachvollziehbare `verification`-Chain im Schema.

## Architektur-Entscheidungen

**Next.js + Leaflet:** Basierend auf einem bewährten Leaflet-Starter,
angepasst auf den Provider-Use-Case. Kein API-Key nötig — Reviewer
kann sofort starten.

**Statisches JSON statt Backend:** Für [ZAHL] Einträge ist kein
Backend/DB nötig. JSON liegt im Repo, ist versionierbar und
vom Reviewer direkt prüfbar.

**DEXA ≠ Knochendichte:** Die zentrale Designentscheidung im Datenmodell.
Das `services`-Array trennt explizit `dexa_body_composition` von
`dexa_bone_density`. Ein Anbieter kann beides anbieten.

## Datenmodell

[Gekürztes Schema-Beispiel hier einfügen]

Das `verification`-Objekt mit `confidence` Score und `method`
zeigt für jeden Eintrag: woher stammt er, wie sicher sind wir,
wann wurde er geprüft.

## Tech Stack

| Komponente | Wahl |
|-----------|------|
| Framework | Next.js + TypeScript |
| Karte | Leaflet + Carto Voyager Tiles |
| Clustering | leaflet.markercluster |
| Suche | fuse.js |
| Styling | Tailwind CSS |
| Container | Docker (standalone build) |

## Was ich bei mehr Zeit machen würde

- **Feedback-Loop:** Coaches/Kunden melden Aktualisierungen zurück (~1 Woche)
- **Embed-Modus:** `<iframe>` Integration für bestehende Plattformen (~2 Tage)
- **Automatisiertes Monitoring:** Scraper als Cron-Job prüft ob Anbieter noch aktiv (~3 Tage)
- **Coach vs. Kunden-Ansicht:** Interne Ansicht mit Notizen, externe mit vereinfachter Sprache (~1 Woche)
- **Aggregierte DEXA-Benchmarks:** Anonymisierte Scan-Ergebnisse als Coaching-KPI (Vision)

## Abschließender Gedanke

Diese Laborsuche löst ein konkretes Problem für Coaching-Kunden,
die objektive Daten zu ihrem Körperfettanteil und ihren Blutwerten
brauchen. Der eigentliche Wert liegt nicht in der Karte — sondern
darin, dass ein datenbasiertes Coaching-Unternehmen zum ersten Mal
eine kuratierte Infrastruktur für die diagnostischen Touchpoints
seiner Kunden aufbaut.
```

- Platzhalter [ZAHL], [LISTE] etc. lasse ich drin — die fülle ich nach der Datenrecherche
- Commit: "docs: README"

### SCHRITT 5: Scripts-Dokumentation
- Erstelle `scripts/README.md` mit:
  - Was die Pipeline macht (4 Stufen: discover → classify → geocode → validate)
  - Setup: `pip install -r requirements.txt`
  - Ausführung: `bash scripts/run_pipeline.sh`
  - Wie man eine neue Region hinzufügt (config.yaml editieren)
- Commit: "docs: scraping pipeline documentation"

### SCHRITT 6: .gitignore finalisieren
- Stelle sicher dass .gitignore enthält: node_modules, .next, .env*, *.log, .DS_Store, __pycache__, data/raw/ (Rohdaten nicht ins Repo), .venv
- NICHT ignorieren: public/data/providers.json, data/processed/ (optional)
- Commit: "chore: finalize gitignore"

### SCHRITT 7: Finaler Check
- `npm run build` → 0 Errors
- `npm run dev` → Karte + Marker + Filter + Sidebar + Mobile
- `docker compose up` → funktioniert
- Git log → saubere, lesbare History
- Berichte finalen Status.
