#!/usr/bin/env python3
"""Stage 4: Geocode candidates with missing coordinates (Nominatim, cached)."""

import json
import re
import sys
import time
from pathlib import Path

from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

PROCESSED_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "processed"
CACHE_PATH = PROCESSED_DIR / "geocache.json"


def load_cache() -> dict:
    if CACHE_PATH.exists():
        with open(CACHE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache: dict) -> None:
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


def normalize_address(address: str) -> str:
    """Normalize address for better geocoding results."""
    replacements = {
        "Str.": "Straße",
        "str.": "straße",
        "Pl.": "Platz",
        "pl.": "platz",
    }
    for old, new in replacements.items():
        address = address.replace(old, new)
    return address.strip()


def geocode_address(geolocator: Nominatim, address: str, city: str, country: str, cache: dict) -> tuple[float | None, float | None]:
    """Geocode an address, using cache when available."""
    cache_key = f"{address}|{city}|{country}"
    if cache_key in cache:
        cached = cache[cache_key]
        return cached.get("lat"), cached.get("lng")

    query = f"{address}, {city}" if address else city
    country_codes = {"DE": "de", "AT": "at", "CH": "ch"}
    cc = country_codes.get(country, "de")

    try:
        location = geolocator.geocode(query, country_codes=cc, timeout=10)
        if location:
            cache[cache_key] = {"lat": location.latitude, "lng": location.longitude}
            return location.latitude, location.longitude
        else:
            # Try city-only fallback
            location = geolocator.geocode(city, country_codes=cc, timeout=10)
            if location:
                cache[cache_key] = {"lat": location.latitude, "lng": location.longitude}
                return location.latitude, location.longitude
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        print(f"  WARN: Geocoding failed for {query}: {e}")

    cache[cache_key] = {"lat": None, "lng": None}
    return None, None


def main() -> None:
    input_path = PROCESSED_DIR / "classified.json"
    if not input_path.exists():
        print(f"ERROR: {input_path} not found. Run classify.py first.", file=sys.stderr)
        sys.exit(1)

    with open(input_path, "r", encoding="utf-8") as f:
        candidates = json.load(f)

    cache = load_cache()
    geolocator = Nominatim(user_agent="laborsuche-dach-pipeline/1.0")

    already_have = 0
    geocoded = 0
    failed = 0

    for i, candidate in enumerate(candidates):
        lat = candidate.get("raw_lat")
        lng = candidate.get("raw_lng")

        if lat is not None and lng is not None:
            already_have += 1
            continue

        address = candidate.get("raw_address", "") or ""
        city = candidate.get("raw_city", "")
        country = candidate.get("raw_country", "DE")

        if address:
            address = normalize_address(address)

        print(f"  [{i+1}/{len(candidates)}] Geocoding {candidate.get('raw_name', 'unknown')}...")
        time.sleep(1.1)  # Rate limiting

        lat, lng = geocode_address(geolocator, address, city, country, cache)
        if lat is not None:
            candidate["raw_lat"] = lat
            candidate["raw_lng"] = lng
            geocoded += 1
        else:
            candidate["classification_status"] = "needs_review"
            failed += 1

    save_cache(cache)

    out_path = PROCESSED_DIR / "geocoded.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(candidates, f, ensure_ascii=False, indent=2)

    print(f"\n{already_have} bereits mit Koordinaten, {geocoded} geocoded, {failed} fehlgeschlagen")
    print(f"Output: {out_path}")


if __name__ == "__main__":
    main()
