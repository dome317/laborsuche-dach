#!/usr/bin/env python3
"""Stage 1: Ingest and merge raw data sources into unified candidate format."""

import json
import re
import sys
from pathlib import Path

RAW_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "raw"
OUT_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "processed"


def normalize_phone(phone: str | None) -> str | None:
    """Normalize phone numbers to international format."""
    if not phone:
        return None
    # Remove all non-digit characters except leading +
    cleaned = re.sub(r"[^\d+]", "", phone)
    # Add country code if missing
    if cleaned.startswith("0049"):
        cleaned = "+" + cleaned[2:]
    elif cleaned.startswith("049"):
        cleaned = "+49" + cleaned[3:]
    elif cleaned.startswith("0") and not cleaned.startswith("+"):
        cleaned = "+49" + cleaned[1:]  # Assume DE
    if not cleaned.startswith("+"):
        cleaned = "+49" + cleaned
    return cleaned


def normalize_website(url: str | None) -> str | None:
    """Normalize website URLs."""
    if not url:
        return None
    url = url.strip()
    if not url.startswith("http"):
        url = "https://" + url
    # Remove trailing slash
    url = url.rstrip("/")
    return url


def parse_apify_entry(entry: dict, source_file: str) -> dict:
    """Parse Apify Google Maps format."""
    lat = None
    lng = None
    if "location" in entry and isinstance(entry["location"], dict):
        lat = entry["location"].get("lat")
        lng = entry["location"].get("lng")
    elif "latitude" in entry:
        lat = entry.get("latitude")
        lng = entry.get("longitude")

    city = entry.get("city", "")
    country = "DE"
    addr = entry.get("address", entry.get("street", ""))
    if any(c in (addr + " " + city).lower() for c in ["österreich", "austria", "wien", "graz"]):
        country = "AT"
    elif any(c in (addr + " " + city).lower() for c in ["schweiz", "switzerland", "zürich", "bern", "basel"]):
        country = "CH"
    if entry.get("countryCode"):
        cc = entry["countryCode"].upper()
        if cc in ("DE", "AT", "CH"):
            country = cc

    return {
        "raw_name": entry.get("title", entry.get("name", "")),
        "raw_address": addr or None,
        "raw_city": city,
        "raw_country": country,
        "raw_phone": normalize_phone(entry.get("phone", entry.get("phoneUnformatted"))),
        "raw_website": normalize_website(entry.get("website", entry.get("url"))),
        "raw_lat": float(lat) if lat else None,
        "raw_lng": float(lng) if lng else None,
        "source_file": source_file,
        "source_type": "apify",
    }


def parse_manual_entry(entry: dict, source_file: str) -> dict:
    """Parse manual/meindirektlabor format."""
    source_type = entry.get("source_type", "manual")
    country = entry.get("country", "DE")
    return {
        "raw_name": entry.get("name", ""),
        "raw_address": entry.get("address"),
        "raw_city": entry.get("city", ""),
        "raw_country": country,
        "raw_phone": normalize_phone(entry.get("phone")),
        "raw_website": normalize_website(entry.get("website")),
        "raw_lat": float(entry["lat"]) if entry.get("lat") else None,
        "raw_lng": float(entry["lng"]) if entry.get("lng") else None,
        "source_file": source_file,
        "source_type": source_type,
    }


def detect_format(data: list[dict]) -> str:
    """Detect data format based on field names."""
    if not data:
        return "manual"
    sample = data[0]
    if "title" in sample or "placeId" in sample or "searchString" in sample:
        return "apify"
    return "manual"


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    if not RAW_DIR.exists():
        print(f"ERROR: Raw data directory not found: {RAW_DIR}", file=sys.stderr)
        sys.exit(1)

    raw_files = list(RAW_DIR.glob("*.json"))
    if not raw_files:
        print(f"ERROR: No JSON files found in {RAW_DIR}", file=sys.stderr)
        sys.exit(1)

    candidates: list[dict] = []
    source_count = 0

    for raw_file in sorted(raw_files):
        source_count += 1
        with open(raw_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        if not isinstance(data, list):
            data = [data]

        fmt = detect_format(data)
        parser = parse_apify_entry if fmt == "apify" else parse_manual_entry

        for entry in data:
            candidate = parser(entry, raw_file.name)
            if candidate["raw_name"]:  # Skip entries without name
                candidates.append(candidate)

    out_path = OUT_DIR / "candidates.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(candidates, f, ensure_ascii=False, indent=2)

    print(f"{len(candidates)} Kandidaten aus {source_count} Quellen zusammengeführt")
    print(f"Output: {out_path}")


if __name__ == "__main__":
    main()
