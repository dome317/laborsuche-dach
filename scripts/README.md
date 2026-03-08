# Scraping & Processing Pipeline

Vierstufige Pipeline zur Datenerhebung und -verarbeitung für die Laborsuche DACH.

## Pipeline-Stufen

```
1. discover   → Kandidaten finden (Google Places API, Webrecherche)
2. classify   → DEXA Body Comp vs. Knochendichte unterscheiden (Keyword-Scoring)
3. geocode    → Adressen geocodieren und Koordinaten validieren
4. validate   → Daten prüfen, Duplikate entfernen, providers.json erzeugen
```

## Setup

```bash
cd scripts
python -m venv .venv
source .venv/bin/activate   # Linux/Mac
# .venv\Scripts\activate    # Windows
pip install -r requirements.txt
```

## Ausführung

```bash
# Komplette Pipeline
bash scripts/run_pipeline.sh

# Einzelne Stufen
python scripts/scrape/discover.py
python scripts/process/classify.py
python scripts/process/geocode.py
python scripts/process/validate.py
```

## Neue Region hinzufügen

1. `config.yaml` editieren — neue Region unter `regions` eintragen
2. Suchbegriffe und Radius anpassen
3. Pipeline erneut ausführen
4. Ergebnis prüfen und nach `public/data/providers.json` kopieren

## Abhängigkeiten

| Paket | Zweck |
|-------|-------|
| httpx | HTTP-Requests (async-fähig) |
| beautifulsoup4 | HTML-Parsing für Website-Analyse |
| geopy | Geocoding (Nominatim, Google) |
| pydantic | Schema-Validierung der Provider-Daten |
| rapidfuzz | Fuzzy-Matching für Duplikat-Erkennung |
| anthropic | Claude API für Grenzfall-Klassifikation |
| pyyaml | Config-Dateien lesen |

## Datenfluss

```
data/raw/          → Rohdaten aus Scraping (nicht im Git)
data/processed/    → Bereinigte Zwischenergebnisse
public/data/       → Finale providers.json (im Git)
```
