#!/usr/bin/env python3
"""Stage 2: Enrich candidates with website text for classification."""

import json
import re
import sys
import time
from pathlib import Path

import httpx
from bs4 import BeautifulSoup

PROCESSED_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "processed"

# Links that likely contain service/pricing info
SERVICE_PATH_PATTERNS = [
    r"/leistung", r"/service", r"/preis", r"/angebot",
    r"/therapie", r"/diagnostik", r"/untersuchung",
    r"/dexa", r"/dxa", r"/body", r"/labor", r"/blut",
]

HEADERS = {
    "User-Agent": "LaborSuche-DACH-Pipeline/1.0 (research project; +https://github.com)",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "de-DE,de;q=0.9,en;q=0.5",
}


def extract_text(html: str, max_chars: int = 2000) -> str:
    """Extract readable text from HTML, preferring main content."""
    soup = BeautifulSoup(html, "html.parser")

    # Remove script, style, nav, footer
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    # Try main content areas first
    for selector in ["main", "article", '[role="main"]', ".content", "#content"]:
        el = soup.select_one(selector)
        if el:
            text = el.get_text(separator=" ", strip=True)
            if len(text) > 100:
                return text[:max_chars]

    # Fall back to body
    body = soup.find("body")
    if body:
        text = body.get_text(separator=" ", strip=True)
        return text[:max_chars]

    return soup.get_text(separator=" ", strip=True)[:max_chars]


def find_service_links(html: str, base_url: str) -> list[str]:
    """Find links to service/pricing pages."""
    soup = BeautifulSoup(html, "html.parser")
    links: list[str] = []

    for a_tag in soup.find_all("a", href=True):
        href = a_tag["href"].lower()
        for pattern in SERVICE_PATH_PATTERNS:
            if re.search(pattern, href):
                full_url = href
                if href.startswith("/"):
                    # Relative URL
                    from urllib.parse import urljoin
                    full_url = urljoin(base_url, href)
                elif not href.startswith("http"):
                    from urllib.parse import urljoin
                    full_url = urljoin(base_url, href)
                if full_url not in links:
                    links.append(full_url)
                break

    return links[:3]  # Max 3 service pages


def fetch_page(client: httpx.Client, url: str) -> str | None:
    """Fetch a page with error handling."""
    try:
        resp = client.get(url, follow_redirects=True, timeout=10)
        resp.raise_for_status()
        return resp.text
    except (httpx.HTTPError, httpx.TimeoutException) as e:
        print(f"  WARN: Failed to fetch {url}: {e}")
        return None


def main() -> None:
    input_path = PROCESSED_DIR / "candidates.json"
    if not input_path.exists():
        print(f"ERROR: {input_path} not found. Run ingest_merge.py first.", file=sys.stderr)
        sys.exit(1)

    with open(input_path, "r", encoding="utf-8") as f:
        candidates = json.load(f)

    success = 0
    failed = 0
    no_website = 0

    with httpx.Client(headers=HEADERS) as client:
        for i, candidate in enumerate(candidates):
            website = candidate.get("raw_website")
            if not website:
                candidate["website_text"] = None
                candidate["service_page_text"] = None
                candidate["service_page_url"] = None
                candidate["enrichment_status"] = "no_website"
                no_website += 1
                continue

            print(f"  [{i+1}/{len(candidates)}] Fetching {website}")

            # Rate limiting
            time.sleep(1.0)

            html = fetch_page(client, website)
            if not html:
                candidate["website_text"] = None
                candidate["service_page_text"] = None
                candidate["service_page_url"] = None
                candidate["enrichment_status"] = "failed"
                failed += 1
                continue

            candidate["website_text"] = extract_text(html)

            # Find and fetch service pages
            service_links = find_service_links(html, website)
            candidate["service_page_text"] = None
            candidate["service_page_url"] = None

            for link in service_links:
                time.sleep(1.0)
                service_html = fetch_page(client, link)
                if service_html:
                    service_text = extract_text(service_html)
                    if len(service_text) > 50:
                        candidate["service_page_text"] = service_text
                        candidate["service_page_url"] = link
                        break

            candidate["enrichment_status"] = "success"
            success += 1

    out_path = PROCESSED_DIR / "enriched.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(candidates, f, ensure_ascii=False, indent=2)

    print(f"\n{success} erfolgreich enriched, {failed} fehlgeschlagen, {no_website} ohne Website")
    print(f"Output: {out_path}")


if __name__ == "__main__":
    main()
