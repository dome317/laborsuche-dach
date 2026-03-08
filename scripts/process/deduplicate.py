#!/usr/bin/env python3
"""Stage 5: Multi-key duplicate detection and merging."""

import json
import math
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

import yaml
from rapidfuzz import fuzz

SCRIPTS_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DIR = SCRIPTS_DIR.parent / "data" / "processed"


def load_config() -> dict:
    config_path = SCRIPTS_DIR / "config.yaml"
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def normalize_url_key(url: str | None) -> str | None:
    """Extract normalized URL key for dedup (domain + path, no query/fragment)."""
    if not url:
        return None
    try:
        parsed = urlparse(url)
        domain = (parsed.netloc or parsed.path).lower().removeprefix("www.")
        # Include path to distinguish multi-location businesses (e.g. meindirektlabor.de/standorte/kiel/)
        path = parsed.path.rstrip("/").lower()
        return domain + path if path and path != "/" else domain
    except Exception:
        return None


def normalize_phone_for_dedup(phone: str | None) -> str | None:
    """Normalize phone for dedup comparison."""
    if not phone:
        return None
    return re.sub(r"[^\d]", "", phone)


def haversine_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in meters between two coordinates."""
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def extract_plz(address: str | None) -> str | None:
    """Extract postal code from address."""
    if not address:
        return None
    match = re.search(r"\b(\d{4,5})\b", address)
    return match.group(1) if match else None


# Source types that are more authoritative than generic scrapers
AUTHORITATIVE_SOURCES = ("meindirektlabor", "medkompass", "labor-berlin", "synlab")


def merge_entries(primary: dict, duplicate: dict) -> dict:
    """Merge duplicate into primary, keeping richer data."""
    for key in duplicate:
        if key not in primary or primary[key] is None:
            primary[key] = duplicate[key]

    # Track all source types encountered during merging
    sources = set(primary.get("all_source_types", [primary.get("source_type", "")]))
    sources.add(duplicate.get("source_type", ""))
    sources.discard("")
    primary["all_source_types"] = sorted(sources)

    # Prefer authoritative source_type over generic apify
    dup_source = duplicate.get("source_type", "")
    if dup_source in AUTHORITATIVE_SOURCES and primary.get("source_type") not in AUTHORITATIVE_SOURCES:
        primary["source_type"] = dup_source

    # Prefer entry with more classified services
    primary_services = primary.get("classified_services", [])
    dup_services = duplicate.get("classified_services", [])
    if len(dup_services) > len(primary_services):
        primary["classified_services"] = dup_services

    # Merge extracted prices (union, deduplicated by amount)
    primary_prices = primary.get("extracted_prices", [])
    dup_prices = duplicate.get("extracted_prices", [])
    existing_amounts = {p["amount"] for p in primary_prices}
    for p in dup_prices:
        if p["amount"] not in existing_amounts:
            primary_prices.append(p)
            existing_amounts.add(p["amount"])
    primary["extracted_prices"] = primary_prices

    return primary


def main() -> None:
    input_path = PROCESSED_DIR / "geocoded.json"
    if not input_path.exists():
        print(f"ERROR: {input_path} not found. Run geocode.py first.", file=sys.stderr)
        sys.exit(1)

    config = load_config()
    name_threshold = config["dedup"]["name_similarity_threshold"]
    geo_threshold = config["dedup"]["geo_proximity_meters"]

    with open(input_path, "r", encoding="utf-8") as f:
        candidates = json.load(f)

    # Index for dedup
    domain_index: dict[str, int] = {}
    phone_index: dict[str, int] = {}
    to_remove: set[int] = set()

    for i, c in enumerate(candidates):
        domain = normalize_url_key(c.get("raw_website"))
        phone = normalize_phone_for_dedup(c.get("raw_phone"))

        # Hard match: same domain
        if domain and domain in domain_index:
            j = domain_index[domain]
            if j not in to_remove:
                candidates[j] = merge_entries(candidates[j], c)
                to_remove.add(i)
                continue

        # Hard match: same phone
        if phone and phone in phone_index:
            j = phone_index[phone]
            if j not in to_remove:
                candidates[j] = merge_entries(candidates[j], c)
                to_remove.add(i)
                continue

        # Soft match: name similarity + PLZ or geo proximity
        name_i = c.get("raw_name", "")
        plz_i = extract_plz(c.get("raw_address"))
        lat_i = c.get("raw_lat")
        lng_i = c.get("raw_lng")

        for j in range(i):
            if j in to_remove:
                continue
            name_j = candidates[j].get("raw_name", "")

            # Name + PLZ match
            if plz_i and plz_i == extract_plz(candidates[j].get("raw_address")):
                sim = fuzz.token_sort_ratio(name_i, name_j)
                if sim >= name_threshold:
                    candidates[j] = merge_entries(candidates[j], c)
                    to_remove.add(i)
                    break

            # Geo proximity + name similarity
            lat_j = candidates[j].get("raw_lat")
            lng_j = candidates[j].get("raw_lng")
            if lat_i and lng_i and lat_j and lng_j:
                dist = haversine_meters(lat_i, lng_i, lat_j, lng_j)
                if dist < geo_threshold:
                    sim = fuzz.token_sort_ratio(name_i, name_j)
                    if sim >= 70:
                        candidates[j] = merge_entries(candidates[j], c)
                        to_remove.add(i)
                        break

        # Register in indices
        if i not in to_remove:
            if domain:
                domain_index[domain] = i
            if phone:
                phone_index[phone] = i

    # Remove duplicates
    deduped = [c for i, c in enumerate(candidates) if i not in to_remove]

    out_path = PROCESSED_DIR / "deduplicated.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(deduped, f, ensure_ascii=False, indent=2)

    print(f"{len(to_remove)} Duplikate gefunden und zusammengeführt")
    print(f"{len(deduped)} eindeutige Einträge verbleiben")
    print(f"Output: {out_path}")


if __name__ == "__main__":
    main()
