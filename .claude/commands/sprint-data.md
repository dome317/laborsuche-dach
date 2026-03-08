# Sprint Data v2: Python Pipeline (überarbeitet nach Codex + Grok Review)

Diese Pipeline läuft UNABHÄNGIG vom Frontend. Eigene Claude Code Session. Ergebnis: `public/data/providers.json`.

## Kritische Design-Regeln (aus Review)

1. **Service-Level Klassifikation**, NICHT Provider-Level. Ein Anbieter kann gleichzeitig Body Comp + Knochendichte anbieten. Zwei separate Scores.
2. **Enrich VOR Classify.** Ohne Website-Text ist Keyword-Scoring blind.
3. **Google Maps = Discovery, NICHT Verification.** Apify-Daten sind Kandidaten, keine bestätigten Einträge.
4. **Realistisches Ziel: 50–70 hochwertige Einträge.** Davon 20-30 DEXA Body Comp, 40+ Blutlabore.
5. **Anthropic API nur einsetzen wenn es auch im Code ist.** Kein Claim ohne Implementation.

## Pipeline-Architektur (6 Stufen)

```
data/raw/*.json (Apify + Chrome + manuell)
  → ingest_merge.py     (Format-Vereinheitlichung aller Quellen)
  → enrich.py           (Website-Text fetchen + Snippets speichern)
  → classify.py         (Dual-Score: body_comp_score + bone_density_score)
  → geocode.py          (Nur für fehlende Koordinaten!)
  → deduplicate.py      (Website/Phone/Adresse + Fuzzy-Name)
  → validate_export.py  (Pydantic + finaler JSON-Export)
```

## Schritte

### SCHRITT 1: Requirements + Config

- Erstelle `scripts/requirements.txt`:
  ```
  httpx>=0.27
  beautifulsoup4>=4.12
  geopy>=2.4
  pydantic>=2.5
  rapidfuzz>=3.6
  pyyaml>=6.0
  ```
  KEIN anthropic — wir claiimen keinen AI-Classifier den wir nicht bauen.

- Erstelle `scripts/config.yaml`:
  ```yaml
  regions:
    DE:
      cities: [München, Berlin, Hamburg, Hannover, Köln, Frankfurt, Stuttgart, Nürnberg]
    AT:
      cities: [Wien, Graz]
    CH:
      cities: [Zürich, Bern, Basel]

  keywords:
    body_comp_positive:
      - { term: "körperzusammensetzung", weight: 3 }
      - { term: "body composition", weight: 3 }
      - { term: "viszerales fett", weight: 3 }
      - { term: "fettmessung", weight: 3 }
      - { term: "körperfettanalyse", weight: 3 }
      - { term: "körperfettverteilung", weight: 3 }
      - { term: "ganzkörper-dexa", weight: 2 }
      - { term: "ganzkörper dexa", weight: 2 }
      - { term: "muskelmasse", weight: 2 }
      - { term: "fettmasse", weight: 2 }
      - { term: "lean mass", weight: 2 }
      - { term: "fat mass", weight: 2 }
      - { term: "fett- und muskelanalyse", weight: 2 }
      - { term: "appendicular lean mass", weight: 2 }
      - { term: "körperfettanteil", weight: 1 }
      - { term: "longevity check", weight: 1 }
      - { term: "longevity", weight: 1 }
      - { term: "sportmedizin", weight: 1 }

    bone_density_signals:
      - { term: "osteodensitometrie", weight: 4 }
      - { term: "nur knochendichte", weight: 4 }
      - { term: "knochendichtemessung allein", weight: 3 }
      - { term: "osteoporose", weight: 2 }
      - { term: "frakturrisiko", weight: 2 }
      - { term: "t-score", weight: 2 }
      - { term: "z-score", weight: 1 }
      - { term: "frax", weight: 1 }

    blut_selbstzahler_positive:
      - { term: "selbstzahler", weight: 3 }
      - { term: "ohne überweisung", weight: 3 }
      - { term: "direktlabor", weight: 3 }
      - { term: "privatperson", weight: 2 }
      - { term: "igel", weight: 1 }
      - { term: "blutabnahme", weight: 1 }

  classification:
    body_comp_confirmed_threshold: 3
    body_comp_review_threshold: 0
    bone_only_threshold: 3  # bone ≥ 3 AND body_comp < 1 → bone only

  geocoding:
    provider: nominatim
    rate_limit_seconds: 1.1

  dedup:
    name_similarity_threshold: 85
    geo_proximity_meters: 50
  ```
- Commit: "feat: pipeline config with dual-axis scoring"

### SCHRITT 2: Ingest + Merge

- Erstelle `scripts/process/ingest_merge.py`:
  - Liest ALLE JSON-Dateien aus `data/raw/`
  - Jede Datei kann ein anderes Format haben (Apify, meindirektlabor, manuell)
  - Normalisiert in ein einheitliches Kandidaten-Format:
    ```python
    {
      "raw_name": str,
      "raw_address": str | None,
      "raw_city": str,
      "raw_country": str,  # "DE", "AT", "CH"
      "raw_phone": str | None,
      "raw_website": str | None,
      "raw_lat": float | None,
      "raw_lng": float | None,
      "source_file": str,
      "source_type": str,  # "apify", "meindirektlabor", "manual", "megeni"
    }
    ```
  - Normalisiert: Telefonnummern (+49 Format), Website-URLs (https:// Prefix, trailing slash entfernen), Stadt-Namen (Umlaute konsistent)
  - Output: `data/processed/candidates.json`
  - Logge: "X Kandidaten aus Y Quellen zusammengeführt"
- Commit: "feat: ingest and merge raw data sources"

### SCHRITT 3: Enrich (Website-Text fetchen)

- Erstelle `scripts/process/enrich.py`:
  - Für jeden Kandidaten mit `raw_website`:
    - httpx GET auf die Website (timeout 10s, follow redirects)
    - BeautifulSoup: extrahiere Text aus `<main>`, `<article>`, oder `<body>`
    - Suche nach Service-/Leistungs-/Preis-Unterseiten: Links die "/leistung", "/service", "/preis", "/angebot" enthalten
    - Wenn gefunden: auch diese Seite fetchen
    - Speichere relevante Snippets (max 2000 Zeichen pro Seite)
  - Rate-Limiting: 1 Request/Sekunde, respektiere robots.txt via User-Agent
  - Output: ergänze jeden Kandidaten um:
    ```python
    {
      ...
      "website_text": str | None,       # Hauptseite
      "service_page_text": str | None,   # Leistungs-/Preisseite falls gefunden
      "service_page_url": str | None,
      "enrichment_status": "success" | "failed" | "no_website"
    }
    ```
  - Output: `data/processed/enriched.json`
  - Logge: "X erfolgreich enriched, Y fehlgeschlagen, Z ohne Website"
- Commit: "feat: website text enrichment"

### SCHRITT 4: Classify (Dual-Score)

- Erstelle `scripts/process/classify.py`:
  - Lese config.yaml für Keywords
  - Für jeden Kandidaten: berechne ZWEI Scores auf website_text + service_page_text:
    ```python
    body_comp_score = sum(weight for term, weight in body_comp_positive if term in text.lower())
    bone_density_score = sum(weight for term, weight in bone_density_signals if term in text.lower())
    blut_score = sum(weight for term, weight in blut_selbstzahler_positive if term in text.lower())
    ```
  - Gewichte service_page_text 2x höher als homepage_text
  - Kontextlogik:
    - "nur knochendichte" oder "keine fettmessung" → body_comp_score = 0 (override)
  - Klassifikation:
    - body_comp_score ≥ 3 → services enthält "dexa_body_composition"
    - bone_density_score ≥ 3 AND body_comp_score < 1 → services enthält NUR "dexa_bone_density"
    - bone_density_score ≥ 3 AND body_comp_score ≥ 3 → services enthält BEIDES
    - blut_score ≥ 3 → services enthält "blood_test_self_pay"
    - Kein Score ≥ 3 → status: "needs_review"
  - Extrahiere Preise wenn gefunden (Regex: "€\s?\d+", "\d+\s?Euro", "ab\s?\d+")
  - Output: `data/processed/classified.json`
  - Logge Statistik:
    ```
    DEXA Body Comp confirmed: X
    DEXA Bone Only: Y
    DEXA Both: Z
    Blutlabor confirmed: W
    Needs manual review: N
    ```
  - Generiere `data/processed/needs_review.csv` für manuelle Prüfung
- Commit: "feat: dual-axis service-level classifier"

### SCHRITT 5: Geocode (nur fehlende!)

- Erstelle `scripts/process/geocode.py`:
  - Für jeden Kandidaten: wenn raw_lat/raw_lng vorhanden → übernehmen (Apify hat die schon!)
  - NUR wenn Koordinaten fehlen: Nominatim geocoden
  - Adresse normalisieren vor Geocoding: "Str." → "Straße", Umlaute, etc.
  - Rate-Limiting: time.sleep(1.1) zwischen Requests
  - Cache: `data/processed/geocache.json`
  - Bei Fehler: loggen, Eintrag auf needs_review setzen
  - Output: `data/processed/geocoded.json`
  - Logge: "X bereits mit Koordinaten, Y geocoded, Z fehlgeschlagen"
- Commit: "feat: geocoding with cache (Nominatim, only missing)"

### SCHRITT 6: Deduplicate

- Erstelle `scripts/process/deduplicate.py`:
  - Primäre Dedup-Keys (harte Treffer):
    - Gleiche normalisierte Website-Domain
    - Gleiches Telefon (normalisiert)
  - Sekundäre Dedup-Keys (weiche Treffer):
    - rapidfuzz.fuzz.token_sort_ratio auf Name + PLZ > 85%
    - Geo-Proximity < 50m + Name-Similarity > 70%
  - Bei Treffer: Eintrag mit mehr Daten (Website, Services, Preise) behalten
  - Output: `data/processed/deduplicated.json`
  - Logge: "X Duplikate gefunden und zusammengeführt"
- Commit: "feat: multi-key duplicate detection"

### SCHRITT 7: Validate + Export

- Erstelle `scripts/process/validate_export.py`:
  - Pydantic-Modelle die EXAKT dem TypeScript Provider-Interface entsprechen
  - Validation Rules:
    - coordinates müssen im DACH-Bereich liegen (lat 45-55, lng 5-18)
    - website muss mit https:// beginnen
    - categories wird aus services[] abgeleitet
    - verification.confidence berechnen:
      - Hat enriched website_text + score ≥ 3: 0.8
      - Hat service_page mit Body-Comp-Keywords: 0.9
      - Telefonisch bestätigt (manuelles Flag): 0.95
      - Nur Apify-Snippet, nicht enriched: 0.4
  - Generiere finales JSON im ProvidersData-Format mit meta-Objekt
  - Schreibe nach `public/data/providers.json`
  - Print Statistik-Tabelle:
    ```
    === Datenqualität Report ===
    Gesamt:                  X
    DEXA Body Composition:   Y
    DEXA Bone Density Only:  Z
    Blutlabor Selbstzahler:  W
    Beides:                  V
    Verifiziert (≥0.8):      N (X%)
    Needs Review:            M
    Regionen:                [Liste]
    Preise erfasst:          P (X%)
    ```
- Commit: "feat: pydantic validation + confidence scoring + export"

### SCHRITT 8: Pipeline-Runner

- Erstelle `scripts/run_pipeline.sh`:
  ```bash
  #!/bin/bash
  set -e
  echo "=== Laborsuche DACH Pipeline ==="
  echo "Step 1/6: Ingesting raw data..."
  python scripts/process/ingest_merge.py
  echo "Step 2/6: Enriching with website text..."
  python scripts/process/enrich.py
  echo "Step 3/6: Classifying services..."
  python scripts/process/classify.py
  echo "Step 4/6: Geocoding missing coordinates..."
  python scripts/process/geocode.py
  echo "Step 5/6: Deduplicating..."
  python scripts/process/deduplicate.py
  echo "Step 6/6: Validating + Exporting..."
  python scripts/process/validate_export.py
  echo ""
  echo "=== Pipeline complete ==="
  echo "Output: public/data/providers.json"
  echo "Review: data/processed/needs_review.csv"
  ```
- `chmod +x scripts/run_pipeline.sh`
- Commit: "feat: pipeline runner (6 stages)"

### SCHRITT 9: Scripts README

- Aktualisiere `scripts/README.md`:
  - Pipeline-Übersicht (6 Stufen mit Diagramm)
  - Setup: `pip install -r requirements.txt`
  - Rohdaten: wo sie herkommen, welches Format
  - Ausführung: `bash scripts/run_pipeline.sh`
  - Manuelle Review: `data/processed/needs_review.csv` öffnen
  - Neue Region: Stadt in config.yaml eintragen, Rohdaten in data/raw/ ablegen
  - Design-Entscheidung: "Service-Level Klassifikation weil ein Anbieter gleichzeitig Body Composition und Knochendichte anbieten kann"
- Commit: "docs: updated pipeline documentation (6 stages)"

Wenn fertig: berichte Pipeline-Statistik und welche Schritte funktionieren.
