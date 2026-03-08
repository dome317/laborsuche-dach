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
