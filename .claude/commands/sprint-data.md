# Sprint Data: Python Scraping + Processing Pipeline

Diese Pipeline läuft UNABHÄNGIG vom Frontend. Eigene Claude Code Session. Ergebnis: `public/data/providers.json`.

## Schritte

### SCHRITT 1: Requirements + Config
- Erstelle `scripts/requirements.txt`:
  ```
  httpx>=0.27
  beautifulsoup4>=4.12
  geopy>=2.4
  pydantic>=2.5
  rapidfuzz>=3.6
  anthropic>=0.40
  pyyaml>=6.0
  ```
- Erstelle `scripts/config.yaml`:
  ```yaml
  regions:
    DE:
      cities: [München, Berlin, Hamburg, Hannover, Köln, Frankfurt, Stuttgart, Nürnberg]
    AT:
      cities: [Wien, Graz, Salzburg]
    CH:
      cities: [Zürich, Bern, Basel]
  
  keywords:
    dexa_body_comp:
      positive:
        - { term: "body composition", weight: 3 }
        - { term: "körperzusammensetzung", weight: 3 }
        - { term: "viszerales fett", weight: 2 }
        - { term: "ganzkörper dexa", weight: 2 }
        - { term: "ganzkörper-dexa", weight: 2 }
        - { term: "körperfettanalyse", weight: 2 }
        - { term: "muskelmasse", weight: 2 }
        - { term: "fettmasse", weight: 2 }
        - { term: "lean mass", weight: 2 }
        - { term: "fat mass", weight: 2 }
        - { term: "body fat", weight: 2 }
        - { term: "körperfettanteil", weight: 1 }
        - { term: "longevity", weight: 1 }
      negative:
        - { term: "nur knochendichte", weight: -3 }
        - { term: "osteodensitometrie", weight: -2 }
        - { term: "osteoporose", weight: -2 }
        - { term: "frakturrisiko", weight: -1 }
  
    blut_selbstzahler:
      positive:
        - { term: "selbstzahler", weight: 3 }
        - { term: "ohne überweisung", weight: 3 }
        - { term: "direktlabor", weight: 3 }
        - { term: "privatperson", weight: 2 }
        - { term: "igel", weight: 1 }
        - { term: "blutabnahme", weight: 1 }
  
  classification:
    confirmed_threshold: 3
    review_threshold: 0
  
  geocoding:
    provider: nominatim
    rate_limit_seconds: 1.1
  
  dedup:
    name_similarity_threshold: 85
    geo_proximity_meters: 50
  ```
- Commit: "feat: pipeline requirements + config"

### SCHRITT 2: meindirektlabor.de Scraper
- Erstelle `scripts/scrape/meindirektlabor.py`:
  - Fetche https://www.meindirektlabor.de/ueber-uns/preisliste/ mit httpx
  - Parse mit BeautifulSoup: extrahiere alle Standort-Namen und Städte
  - Die Standorte stehen auf der Seite als Liste (Köln, Hamburg, Berlin, München, etc.)
  - Für jeden Standort: strukturiere als Kandidat mit name, city, country="DE", category="blutlabor"
  - Output: `data/raw/meindirektlabor.json`
- Commit: "feat: meindirektlabor scraper"

### SCHRITT 3: Keyword-Klassifikator
- Erstelle `scripts/process/classify.py`:
  - Lese config.yaml für Keyword-Weights
  - Für jeden Kandidaten: berechne Score basierend auf Website-Text oder Name
  - Score ≥ confirmed_threshold → status: "verified"
  - Score ≥ review_threshold und < confirmed → status: "unverified" (needs manual review)
  - Score < review_threshold → status: "excluded"
  - Output: `data/processed/classified.json`
  - Logge: "X confirmed, Y needs review, Z excluded"
- Commit: "feat: keyword classifier with scoring"

### SCHRITT 4: Geocoding
- Erstelle `scripts/process/geocode.py`:
  - Nominatim via geopy mit user_agent="laborsuche-dach"
  - Rate-Limiting: time.sleep(1.1) zwischen Requests
  - Cache: Ergebnisse in data/processed/geocache.json (nicht jedes Mal neu geocoden)
  - Für jeden Kandidaten: Adresse → [lng, lat] (GeoJSON-Reihenfolge!)
  - Fallback bei Fehler: loggen und überspringen
  - Output: data/processed/geocoded.json
- Commit: "feat: nominatim geocoding with cache"

### SCHRITT 5: Duplikat-Erkennung
- Erstelle `scripts/process/deduplicate.py`:
  - rapidfuzz.fuzz.token_sort_ratio auf (name, postalCode)
  - Threshold aus config.yaml (85%)
  - Geo-Proximity Check: <50m Radius + ähnlicher Name → Duplikat
  - Bei Treffer: Eintrag mit höherem confidence behalten
  - Logge: "X Duplikate gefunden und entfernt"
  - Output: data/processed/deduplicated.json
- Commit: "feat: fuzzy duplicate detection"

### SCHRITT 6: Validator + Export
- Erstelle `scripts/process/validate.py`:
  - Pydantic-Modelle die EXAKT dem TypeScript Provider-Interface entsprechen
  - Validiere jeden Eintrag
  - Generiere finales JSON im ProvidersData-Format mit meta-Objekt
  - Schreibe nach `public/data/providers.json` (relativ zum Projekt-Root)
  - Print Statistik-Tabelle:
    ```
    === Datenqualität ===
    Gesamt:         127
    DEXA Body Comp: 34
    Blutlabor:      93
    Verifiziert:    119 (94%)
    Regionen:       Bayern, Berlin, Niedersachsen
    ```
- Commit: "feat: pydantic validator + final export"

### SCHRITT 7: Pipeline-Runner
- Erstelle `scripts/run_pipeline.sh`:
  ```bash
  #!/bin/bash
  set -e
  echo "=== Laborsuche DACH Pipeline ==="
  echo "Step 1: Scraping..."
  python scripts/scrape/meindirektlabor.py
  echo "Step 2: Classifying..."
  python scripts/process/classify.py
  echo "Step 3: Geocoding..."
  python scripts/process/geocode.py
  echo "Step 4: Deduplicating..."
  python scripts/process/deduplicate.py
  echo "Step 5: Validating + Exporting..."
  python scripts/process/validate.py
  echo "=== Pipeline complete ==="
  echo "Output: public/data/providers.json"
  ```
- `chmod +x scripts/run_pipeline.sh`
- Commit: "feat: pipeline runner script"

Wenn fertig: berichte die Pipeline-Statistik und welche Schritte funktionieren.
