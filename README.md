# Laborsuche DACH

**Das Problem:** Wer in Deutschland, Österreich oder der Schweiz einen DEXA
Body Composition Scan oder eine Blutuntersuchung als Selbstzahler sucht,
steht vor einem Informationsvakuum. Google zeigt hauptsächlich Praxen die
nur Knochendichtemessung anbieten — nicht Body Composition.

Auf [janbahmann.de/blog/koerperfett-reduzieren](https://www.janbahmann.de/blog/koerperfett-reduzieren)
wird die DEXA-Messung für Selbstzahler empfohlen — aber wohin genau? Diese
Laborsuche schließt die Lücke zwischen Coaching-Empfehlung und konkretem
Anbieter in der Nähe.

<!-- Screenshots nach manueller Erstellung einbinden:
![Desktop](docs/screenshots/desktop.png)
![Mobile](docs/screenshots/mobile.png)
-->

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

```json
{
  "id": "dexa-muc-001",
  "name": "DEXA Zentrum München",
  "categories": ["dexa_body_composition"],
  "address": { "street": "...", "city": "München", "country": "DE" },
  "location": { "type": "Point", "coordinates": [11.582, 48.155] },
  "contact": { "phone": "...", "website": "...", "bookingUrl": "..." },
  "services": [{
    "type": "dexa_body_composition",
    "name": "DEXA Ganzkörper Body Composition",
    "selfPay": true,
    "price": { "amount": 149, "currency": "EUR" }
  }],
  "verification": {
    "status": "verified",
    "confidence": 0.9,
    "date": "2026-03-01",
    "method": "website + phone"
  }
}
```

Das `verification`-Objekt mit `confidence` Score und `method`
zeigt für jeden Eintrag: woher stammt er, wie sicher sind wir,
wann wurde er geprüft.

## Tech Stack

| Komponente | Wahl |
|-----------|------|
| Framework | Next.js 16 + TypeScript |
| Karte | Leaflet + Carto Voyager Tiles |
| Clustering | leaflet.markercluster |
| Suche | fuse.js |
| Styling | Tailwind CSS 4 |
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
