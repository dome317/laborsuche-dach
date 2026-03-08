#!/usr/bin/env python3
"""Stage 6: Pydantic validation, confidence scoring, and final JSON export."""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, field_validator

PROCESSED_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "processed"
OUTPUT_PATH = Path(__file__).resolve().parent.parent.parent / "public" / "data" / "providers.json"


# --- Pydantic models matching TypeScript interfaces ---

class PriceModel(BaseModel):
    amount: float | None
    currency: Literal["EUR", "CHF"]
    note: str | None


class ServiceVerificationModel(BaseModel):
    status: Literal["verified", "unverified", "excluded"]
    confidence: float
    date: str
    method: str
    notes: str | None


class ProviderServiceModel(BaseModel):
    type: Literal["dexa_body_composition", "dexa_bone_density", "blood_test_self_pay", "blood_test_referral"]
    name: str
    description: str | None
    selfPay: bool
    price: PriceModel | None
    verification: ServiceVerificationModel


class AddressModel(BaseModel):
    street: str
    postalCode: str
    city: str
    state: str
    country: Literal["DE", "AT", "CH"]


class LocationModel(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: tuple[float, float]  # [lng, lat]

    @field_validator("coordinates")
    @classmethod
    def validate_dach_coords(cls, v: tuple[float, float]) -> tuple[float, float]:
        lng, lat = v
        if not (5.0 <= lng <= 18.0):
            raise ValueError(f"Longitude {lng} outside DACH range (5-18)")
        if not (45.0 <= lat <= 56.0):
            raise ValueError(f"Latitude {lat} outside DACH range (45-56)")
        return v


class ContactModel(BaseModel):
    phone: str | None
    website: str
    email: str | None = None
    bookingUrl: str | None = None

    @field_validator("website")
    @classmethod
    def validate_website(cls, v: str) -> str:
        if not v.startswith("https://") and not v.startswith("http://"):
            raise ValueError(f"Website must start with https:// — got {v}")
        return v


class SourceModel(BaseModel):
    origin: str
    primaryUrl: str
    collectedAt: str


class ProviderModel(BaseModel):
    id: str
    name: str
    slug: str
    categories: list[Literal["dexa_body_composition", "blutlabor"]]
    address: AddressModel
    location: LocationModel
    contact: ContactModel
    services: list[ProviderServiceModel]
    selfPay: bool
    verified: bool
    source: SourceModel
    tags: list[str]


class MetaModel(BaseModel):
    version: str
    generatedAt: str
    totalCount: int
    regions: list[str]


class ProvidersDataModel(BaseModel):
    meta: MetaModel
    providers: list[ProviderModel]


# --- Helper functions ---

def slugify(name: str) -> str:
    """Create URL-safe slug from name."""
    slug = name.lower()
    replacements = {"ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss"}
    for old, new in replacements.items():
        slug = slug.replace(old, new)
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")


def extract_street_and_plz(address: str | None) -> tuple[str, str]:
    """Extract street and postal code from raw address."""
    if not address:
        return ("", "")
    # Try to find PLZ
    plz_match = re.search(r"\b(\d{4,5})\b", address)
    plz = plz_match.group(1) if plz_match else ""
    # Street is everything before PLZ
    if plz_match:
        street = address[:plz_match.start()].strip().rstrip(",")
    else:
        parts = address.split(",")
        street = parts[0].strip()
    return (street, plz)


def guess_state(city: str, country: str) -> str:
    """Guess the state/Bundesland from city name."""
    de_states = {
        "münchen": "Bayern", "nürnberg": "Bayern", "augsburg": "Bayern",
        "berlin": "Berlin",
        "hamburg": "Hamburg",
        "hannover": "Niedersachsen", "braunschweig": "Niedersachsen",
        "köln": "Nordrhein-Westfalen", "düsseldorf": "Nordrhein-Westfalen", "dortmund": "Nordrhein-Westfalen",
        "frankfurt": "Hessen", "wiesbaden": "Hessen",
        "stuttgart": "Baden-Württemberg", "freiburg": "Baden-Württemberg",
        "dresden": "Sachsen", "leipzig": "Sachsen",
    }
    if country == "AT":
        return city if city in ("Wien",) else city
    if country == "CH":
        return city
    return de_states.get(city.lower(), city)


def determine_categories(services: list[str]) -> list[str]:
    """Determine provider categories from service list.

    Only body composition and blutlabor are relevant categories.
    Bone-density-only providers are excluded upstream (candidate_to_provider returns None).
    """
    has_dexa = "dexa_body_composition" in services
    has_blut = "blood_test_self_pay" in services

    if has_dexa and has_blut:
        return ["dexa_body_composition", "blutlabor"]
    if has_dexa:
        return ["dexa_body_composition"]
    if has_blut:
        return ["blutlabor"]
    return []  # No relevant category — will be excluded


DEXA_PRICE_KEYWORDS = ("dexa", "dxa", "body", "scan", "composition", "körper", "fett")
BLOOD_PRICE_KEYWORDS = ("blut", "blood", "labor", "test", "check", "analyse")


def _make_price_obj(p: dict, country: str) -> dict:
    """Create a price object from extracted price data."""
    currency = p.get("currency", "EUR")
    if country == "CH":
        currency = "CHF"
    return {"amount": p["amount"], "currency": currency, "note": p.get("context")}


def _match_price_to_service(
    prices: list[dict], svc_type: str, country: str, num_service_types: int
) -> dict | None:
    """Find the best matching price for a service type. Returns price obj or None."""
    if not prices:
        return None

    # Determine which keywords to look for
    if svc_type in ("dexa_body_composition", "dexa_bone_density"):
        keywords = DEXA_PRICE_KEYWORDS
    elif svc_type in ("blood_test_self_pay", "blood_test_referral"):
        keywords = BLOOD_PRICE_KEYWORDS
    else:
        keywords = ()

    # Try to find a price whose context matches the service
    for p in prices:
        context = (p.get("context") or "").lower()
        if any(kw in context for kw in keywords):
            return _make_price_obj(p, country)

    # Fallback: if provider has only one service type, assign the first price
    # (context is often just "149 €" with no service keywords)
    if num_service_types == 1 and prices:
        return _make_price_obj(prices[0], country)

    return None


OFFICIAL_SOURCES = ("meindirektlabor", "medkompass", "labor-berlin", "synlab")


def _has_official_source(candidate: dict) -> bool:
    """Check if candidate has an official/authoritative source (including merged sources)."""
    source_type = candidate.get("source_type", "")
    all_sources = candidate.get("all_source_types", [source_type])
    return any(s in OFFICIAL_SOURCES for s in all_sources)


def _compute_service_verification(candidate: dict, svc_type: str) -> dict:
    """Compute verification for a specific service based on scores and source."""
    body_comp_score = candidate.get("body_comp_score", 0)
    blut_score = candidate.get("blut_score", 0)
    service_page = candidate.get("service_page_text")
    source_type = candidate.get("source_type", "")
    is_official = _has_official_source(candidate)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    if svc_type in ("dexa_body_composition", "dexa_bone_density"):
        score = body_comp_score
        if score >= 3 and service_page:
            return {"status": "verified", "confidence": 0.9, "date": today, "method": "website_service_page", "notes": None}
        if score >= 3:
            return {"status": "verified", "confidence": 0.7, "date": today, "method": "website_homepage", "notes": None}
    elif svc_type in ("blood_test_self_pay", "blood_test_referral"):
        score = blut_score
        # Official directory sources (meindirektlabor etc.) get highest confidence
        if is_official:
            return {"status": "verified", "confidence": 0.95, "date": today, "method": "official_directory", "notes": None}
        if score >= 3 and source_type == "apify":
            return {"status": "unverified", "confidence": 0.6, "date": today, "method": "google_places", "notes": None}
        if score >= 3:
            return {"status": "verified", "confidence": 0.7, "date": today, "method": "website_homepage", "notes": None}
    else:
        score = 0

    return {"status": "unverified", "confidence": 0.3, "date": today, "method": "unconfirmed", "notes": None}


def build_services(candidate: dict) -> list[dict]:
    """Build service objects from classified data with per-service verification."""
    classified = candidate.get("classified_services", [])
    prices = candidate.get("extracted_prices", [])
    country = candidate.get("raw_country", "DE")
    result = []

    service_names = {
        "dexa_body_composition": "DEXA Body Composition Scan",
        "dexa_bone_density": "DEXA Knochendichtemessung",
        "blood_test_self_pay": "Blutuntersuchung Selbstzahler",
    }

    num_service_types = len(classified)
    for svc_type in classified:
        price_obj = _match_price_to_service(prices, svc_type, country, num_service_types)
        verification = _compute_service_verification(candidate, svc_type)

        result.append({
            "type": svc_type,
            "name": service_names.get(svc_type, svc_type),
            "description": None,
            "selfPay": True,
            "price": price_obj,
            "verification": verification,
        })

    return result


def generate_id(candidate: dict, index: int) -> str:
    """Generate provider ID."""
    city = candidate.get("raw_city", "unknown").lower()
    city_short = {
        "münchen": "muc", "berlin": "ber", "hamburg": "hh",
        "hannover": "han", "köln": "cgn", "frankfurt": "ffm",
        "stuttgart": "str", "nürnberg": "nue",
        "wien": "wien", "graz": "graz",
        "zürich": "zrh", "bern": "bern", "basel": "bsl",
    }.get(city, city[:3])

    services = candidate.get("classified_services", [])
    if "dexa_body_composition" in services and "blood_test_self_pay" in services:
        prefix = "both"
    elif "dexa_body_composition" in services or "dexa_bone_density" in services:
        prefix = "dexa"
    else:
        prefix = "blut"

    return f"{prefix}-{city_short}-{index:03d}"


def build_tags(candidate: dict) -> list[str]:
    """Build tag list from candidate data."""
    tags = []
    services = candidate.get("classified_services", [])
    if "dexa_body_composition" in services:
        tags.extend(["dexa", "body-composition"])
    if "dexa_bone_density" in services:
        tags.extend(["dexa", "knochendichte"])
    if "blood_test_self_pay" in services:
        tags.extend(["blutlabor"])

    tags.append("selbstzahler")

    city = candidate.get("raw_city", "")
    if city:
        tags.append(city.lower())

    country = candidate.get("raw_country", "DE")
    if country == "AT":
        tags.append("österreich")
    elif country == "CH":
        tags.append("schweiz")

    source = candidate.get("source_type", "")
    if source == "meindirektlabor":
        tags.append("direktlabor")

    return list(dict.fromkeys(tags))  # Dedupe preserving order


def candidate_to_provider(candidate: dict, index: int) -> dict | None:
    """Convert a pipeline candidate to a Provider object."""
    lat = candidate.get("raw_lat")
    lng = candidate.get("raw_lng")
    if lat is None or lng is None:
        return None

    # Validate DACH bounds
    if not (45.0 <= lat <= 56.0) or not (5.0 <= lng <= 18.0):
        return None

    services = candidate.get("classified_services", [])
    if not services:
        return None

    # Skip bone-density-only providers (not relevant for the challenge)
    relevant_services = [s for s in services if s in ("dexa_body_composition", "blood_test_self_pay")]
    if not relevant_services:
        return None

    website = candidate.get("raw_website", "")
    if not website:
        return None

    street, plz = extract_street_and_plz(candidate.get("raw_address"))
    # Prefer explicit raw_postal_code from Apify/manual data over regex extraction
    if candidate.get("raw_postal_code"):
        plz = candidate["raw_postal_code"]
    city = candidate.get("raw_city", "")
    country = candidate.get("raw_country", "DE")
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    provider_id = generate_id(candidate, index)
    services_list = build_services(candidate)
    is_verified = any(s["verification"]["status"] == "verified" for s in services_list)

    return {
        "id": provider_id,
        "name": candidate.get("raw_name", ""),
        "slug": slugify(candidate.get("raw_name", "")),
        "categories": determine_categories(relevant_services),
        "address": {
            "street": street,
            "postalCode": plz,
            "city": city,
            "state": guess_state(city, country),
            "country": country,
        },
        "location": {
            "type": "Point",
            "coordinates": [lng, lat],  # GeoJSON: [lng, lat]
        },
        "contact": {
            "phone": candidate.get("raw_phone"),
            "website": website,
            "email": None,
            "bookingUrl": None,
        },
        "services": services_list,
        "selfPay": True,
        "verified": is_verified,
        "source": {
            "origin": candidate.get("source_type", "unknown"),
            "primaryUrl": website,
            "collectedAt": now_iso,
        },
        "tags": build_tags(candidate),
    }


def main() -> None:
    input_path = PROCESSED_DIR / "deduplicated.json"
    if not input_path.exists():
        print(f"ERROR: {input_path} not found. Run deduplicate.py first.", file=sys.stderr)
        sys.exit(1)

    with open(input_path, "r", encoding="utf-8") as f:
        candidates = json.load(f)

    providers = []
    skipped = 0
    invalid = 0
    for i, candidate in enumerate(candidates):
        provider = candidate_to_provider(candidate, i + 1)
        if not provider:
            skipped += 1
            continue

        # Validate each provider individually with Pydantic
        try:
            ProviderModel(**provider)
            providers.append(provider)
        except Exception as e:
            invalid += 1
            name = provider.get("name", "unknown")
            print(f"  INVALID: {name} — {e}", file=sys.stderr)

    total_input = len(candidates)
    if total_input > 0 and invalid / total_input > 0.2:
        print(f"ERROR: {invalid}/{total_input} entries ({invalid/total_input*100:.0f}%) failed validation. Aborting.", file=sys.stderr)
        sys.exit(1)

    # Collect regions
    regions = sorted(set(p["address"]["country"] for p in providers))

    # Build final structure
    data = {
        "meta": {
            "version": "2.0.0",
            "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "totalCount": len(providers),
            "regions": regions,
        },
        "providers": providers,
    }

    # Write output
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    # Stats
    dexa_bc = sum(1 for p in providers if "dexa_body_composition" in [s["type"] for s in p["services"]])
    dexa_bd = sum(1 for p in providers if "dexa_bone_density" in [s["type"] for s in p["services"]]
                  and "dexa_body_composition" not in [s["type"] for s in p["services"]])
    blut = sum(1 for p in providers if "blood_test_self_pay" in [s["type"] for s in p["services"]])
    both = sum(1 for p in providers if "dexa_body_composition" in p["categories"] and "blutlabor" in p["categories"])
    verified = sum(1 for p in providers if p["verified"])
    has_price = sum(1 for p in providers if any(s.get("price") for s in p["services"]))
    needs_review_count = sum(1 for c in candidates if c.get("classification_status") == "needs_review")

    verified_pct = f"{verified / len(providers) * 100:.0f}%" if providers else "0%"
    price_pct = f"{has_price / len(providers) * 100:.0f}%" if providers else "0%"

    print(f"""
=== Datenqualitaet Report ===
Valide exportiert:       {len(providers)}
Invalide uebersprungen:  {invalid}
Ohne Daten uebersprungen:{skipped}
DEXA Body Composition:   {dexa_bc}
DEXA Bone Density Only:  {dexa_bd}
Blutlabor Selbstzahler:  {blut}
Beides:                  {both}
Verifiziert (>=0.8):     {verified} ({verified_pct})
Needs Review:            {needs_review_count}
Regionen:                {regions}
Preise erfasst:          {has_price} ({price_pct})
""")
    print(f"Output: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
