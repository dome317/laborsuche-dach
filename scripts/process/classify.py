#!/usr/bin/env python3
"""Stage 3: Dual-axis service-level classification using keyword scoring."""

import csv
import json
import re
import sys
from pathlib import Path

import yaml

SCRIPTS_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DIR = SCRIPTS_DIR.parent / "data" / "processed"


def load_config() -> dict:
    config_path = SCRIPTS_DIR / "config.yaml"
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def score_text(text: str, keywords: list[dict]) -> int:
    """Calculate keyword score for a text."""
    text_lower = text.lower()
    total = 0
    for kw in keywords:
        if kw["term"] in text_lower:
            total += kw["weight"]
    return total


def extract_prices(text: str) -> list[dict]:
    """Extract price information from text."""
    prices = []
    # Match patterns like "€149", "149 €", "149 Euro", "ab 149", "CHF 200"
    patterns = [
        r"(?:€|EUR)\s*(\d+(?:[.,]\d{2})?)",
        r"(\d+(?:[.,]\d{2})?)\s*(?:€|EUR|Euro)",
        r"ab\s+(\d+(?:[.,]\d{2})?)\s*(?:€|EUR|Euro)?",
        r"CHF\s*(\d+(?:[.,]\d{2})?)",
        r"(\d+(?:[.,]\d{2})?)\s*CHF",
    ]
    for pattern in patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            amount_str = match.group(1).replace(",", ".")
            try:
                amount = float(amount_str)
                if 10 < amount < 2000:  # Sanity check
                    currency = "CHF" if "CHF" in match.group(0).upper() else "EUR"
                    prices.append({"amount": amount, "currency": currency, "context": match.group(0)})
            except ValueError:
                pass
    return prices


def classify_candidate(candidate: dict, config: dict) -> dict:
    """Classify a single candidate with dual-axis scoring."""
    keywords = config["keywords"]
    thresholds = config["classification"]

    # Combine texts (service page weighted 2x)
    homepage_text = candidate.get("website_text", "") or ""
    service_text = candidate.get("service_page_text", "") or ""
    combined_text = homepage_text + " " + service_text

    # Score on homepage
    bc_score_home = score_text(homepage_text, keywords["body_comp_positive"])
    bd_score_home = score_text(homepage_text, keywords["bone_density_signals"])
    bl_score_home = score_text(homepage_text, keywords["blut_selbstzahler_positive"])

    # Score on service page (2x weight)
    bc_score_svc = score_text(service_text, keywords["body_comp_positive"]) * 2
    bd_score_svc = score_text(service_text, keywords["bone_density_signals"]) * 2
    bl_score_svc = score_text(service_text, keywords["blut_selbstzahler_positive"]) * 2

    body_comp_score = bc_score_home + bc_score_svc
    bone_density_score = bd_score_home + bd_score_svc
    blut_score = bl_score_home + bl_score_svc

    # Context overrides
    combined_lower = combined_text.lower()
    if "nur knochendichte" in combined_lower or "keine fettmessung" in combined_lower:
        body_comp_score = 0

    # Determine services
    services: list[str] = []
    bc_threshold = thresholds["body_comp_confirmed_threshold"]
    bd_threshold = thresholds["bone_only_threshold"]

    if body_comp_score >= bc_threshold:
        services.append("dexa_body_composition")
    if bone_density_score >= bd_threshold:
        if body_comp_score < 1:
            services.append("dexa_bone_density")
        else:
            services.append("dexa_bone_density")
    if blut_score >= bc_threshold:
        services.append("blood_test_self_pay")

    # Status
    status = "confirmed" if services else "needs_review"

    # Extract prices
    prices = extract_prices(combined_text)

    candidate["body_comp_score"] = body_comp_score
    candidate["bone_density_score"] = bone_density_score
    candidate["blut_score"] = blut_score
    candidate["classified_services"] = services
    candidate["classification_status"] = status
    candidate["extracted_prices"] = prices

    return candidate


def main() -> None:
    input_path = PROCESSED_DIR / "enriched.json"
    if not input_path.exists():
        print(f"ERROR: {input_path} not found. Run enrich.py first.", file=sys.stderr)
        sys.exit(1)

    config = load_config()

    with open(input_path, "r", encoding="utf-8") as f:
        candidates = json.load(f)

    for candidate in candidates:
        classify_candidate(candidate, config)

    # Stats
    dexa_bc = sum(1 for c in candidates if "dexa_body_composition" in c.get("classified_services", []))
    dexa_bd_only = sum(1 for c in candidates
                       if "dexa_bone_density" in c.get("classified_services", [])
                       and "dexa_body_composition" not in c.get("classified_services", []))
    dexa_both = sum(1 for c in candidates
                    if "dexa_body_composition" in c.get("classified_services", [])
                    and "dexa_bone_density" in c.get("classified_services", []))
    blut = sum(1 for c in candidates if "blood_test_self_pay" in c.get("classified_services", []))
    needs_review = sum(1 for c in candidates if c.get("classification_status") == "needs_review")

    print(f"DEXA Body Comp confirmed: {dexa_bc}")
    print(f"DEXA Bone Only: {dexa_bd_only}")
    print(f"DEXA Both: {dexa_both}")
    print(f"Blutlabor confirmed: {blut}")
    print(f"Needs manual review: {needs_review}")

    # Export classified
    out_path = PROCESSED_DIR / "classified.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(candidates, f, ensure_ascii=False, indent=2)

    # Generate review CSV
    review_candidates = [c for c in candidates if c.get("classification_status") == "needs_review"]
    if review_candidates:
        review_path = PROCESSED_DIR / "needs_review.csv"
        with open(review_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["name", "city", "website", "body_comp_score", "bone_density_score", "blut_score", "enrichment_status"])
            for c in review_candidates:
                writer.writerow([
                    c.get("raw_name", ""),
                    c.get("raw_city", ""),
                    c.get("raw_website", ""),
                    c.get("body_comp_score", 0),
                    c.get("bone_density_score", 0),
                    c.get("blut_score", 0),
                    c.get("enrichment_status", ""),
                ])
        print(f"Review CSV: {review_path}")

    print(f"Output: {out_path}")


if __name__ == "__main__":
    main()
