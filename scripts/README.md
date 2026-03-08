# Scraping & Processing Pipeline

Sechsstufige Pipeline zur Datenerhebung und -verarbeitung für die Laborsuche DACH.

## Design-Entscheidung

**Service-Level Klassifikation**, nicht Provider-Level. Ein Anbieter kann gleichzeitig Body Composition und Knochendichte anbieten — deshalb zwei separate Scores (`body_comp_score`, `bone_density_score`).

## Pipeline-Stufen

```
data/raw/*.json (Apify + Chrome + manuell)
  → ingest_merge.py     (Format-Vereinheitlichung aller Quellen)
  → enrich.py           (Website-Text fetchen + Snippets speichern)
  → classify.py         (Dual-Score: body_comp + bone_density + blut)
  → geocode.py          (Nur für fehlende Koordinaten, Nominatim + Cache)
  → deduplicate.py      (Website/Phone/Adresse + Fuzzy-Name)
  → validate_export.py  (Pydantic-Validierung + Confidence + JSON-Export)
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
python scripts/process/ingest_merge.py
python scripts/process/enrich.py
python scripts/process/classify.py
python scripts/process/geocode.py
python scripts/process/deduplicate.py
python scripts/process/validate_export.py
```

## Rohdaten

Rohdaten liegen in `data/raw/` als JSON-Dateien. Unterstützte Formate:

- **Apify** (Google Maps Scraper): Felder wie `title`, `placeId`, `location.lat`
- **Manuell/meindirektlabor**: Felder wie `name`, `address`, `lat`, `lng`

Der Ingest-Schritt erkennt das Format automatisch.

## Manuelle Review

Nach der Klassifikation werden Einträge ohne klare Service-Zuordnung in `data/processed/needs_review.csv` exportiert. Diese Datei manuell prüfen und ggf. Rohdaten ergänzen.

## Neue Region hinzufügen

1. Stadt in `config.yaml` unter `regions` eintragen
2. Rohdaten in `data/raw/` ablegen (beliebiges unterstütztes Format)
3. Pipeline erneut ausführen: `bash scripts/run_pipeline.sh`

## Abhängigkeiten

| Paket | Zweck |
|-------|-------|
| httpx | HTTP-Requests für Website-Enrichment |
| beautifulsoup4 | HTML-Parsing für Website-Analyse |
| geopy | Geocoding (Nominatim) |
| pydantic | Schema-Validierung der Provider-Daten |
| rapidfuzz | Fuzzy-Matching für Duplikat-Erkennung |
| pyyaml | Config-Dateien lesen |

## Datenfluss

```
data/raw/          → Rohdaten aus Scraping/Recherche
data/processed/    → Bereinigte Zwischenergebnisse (candidates → enriched → classified → geocoded → deduplicated)
public/data/       → Finale providers.json (im Git, vom Frontend konsumiert)
```
