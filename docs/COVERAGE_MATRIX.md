# Abdeckungs-Matrix: Aufgabe → Umsetzung

Jede Anforderung aus der Challenge-Spec, wo sie umgesetzt wird, und was darüber hinaus geht.

---

## Teil 1: Daten beschaffen

| Anforderung | Wo umgesetzt | Sprint |
|------------|-------------|--------|
| Name der Praxis / des Labors | `provider.name` | Data |
| Kategorie (DEXA / Blutlabor) | `provider.categories[]` | Data |
| Angebotene Leistungen | `provider.services[]` mit type-Feld | Data |
| Body Comp vs. Knochendichte unterschieden | `services.type`: `dexa_body_composition` vs `dexa_bone_density` | Data |
| Adresse (Straße, PLZ, Ort) | `provider.address` Objekt | Data |
| Koordinaten (Lat/Lng) | `provider.location` als GeoJSON Point | Data |
| Kontakt (Telefon, Website) | `provider.contact` Objekt | Data |
| Selbstzahler möglich? | `provider.selfPay` Boolean + `services[].selfPay` | Data |
| Preise | `services[].price` Objekt (amount, currency, note) | Data |
| Mindestens eine Region | München + Berlin + Hannover + Hamburg (+ Wien) | Data |
| Ansatz dokumentiert | scripts/README.md + README Recherche-Methodik | Sprint 3 |

### Darüber hinaus (nicht gefordert, aber umgesetzt):
| Extra | Wo |
|-------|-----|
| Verification Chain (status, confidence, method, date) | `provider.verification` |
| Datenquelle pro Eintrag (URL + Timestamp) | `provider.source` |
| Keyword-Scoring für Klassifikation | scripts/process/classify.py |
| Telefonische Verifizierung dokumentiert | README |
| Duplikat-Erkennung | scripts/process/deduplicate.py |
| Bahmann-Blog-Referenz | README |

---

## Teil 2: Interaktive Karte

| Anforderung | Wo umgesetzt | Sprint |
|------------|-------------|--------|
| Karte zentriert auf gewählte Region | fitBounds() + DACH-Default | Sprint 0 |
| Marker pro Standort | Leaflet Marker aus providers.json | Sprint 0 |
| Farblich unterschieden nach Kategorie | Blau/Grün/Violett + lucide Icons | Sprint 0 |
| Popup oder Sidebar mit Details beim Klick | Sidebar Detail-Panel | Sprint 1 |
| Filtermöglichkeit (Alle / DEXA / Blutlabor) | Filter-Chips mit Live-Zähler | Sprint 1 |
| Responsive (Desktop + Mobil) | Sidebar (Desktop) + Drawer (Mobile) | Sprint 2 |

### Darüber hinaus:
| Extra | Wo | Sprint |
|-------|-----|--------|
| Fuzzy-Suche (Name, Stadt, PLZ) | fuse.js in Sidebar | Sprint 1 |
| Deep-Links (?category=dexa&city=hannover) | URL-State | Sprint 1 |
| WhatsApp-Share-Button | Detail-Panel | Sprint 1 |
| "Route planen" (Google Maps) | Detail-Panel | Sprint 1 |
| Direktanruf-Button (tel:) | Detail-Panel | Sprint 1 |
| Buchungs-URL Button | Detail-Panel | Sprint 1 |
| Marker-Clustering | leaflet.markercluster | Sprint 2 |
| Viewport-Sync (Liste = sichtbare Marker) | Sidebar | Sprint 2 |
| Geolocation + Entfernungsanzeige | Geolocation API | Sprint 2 |
| Selected-Marker-Highlight | CSS scale + shadow | Sprint 2 |
| Empty State bei leeren Filtern | UI | Sprint 2 |
| PWA installierbar | manifest.json | Sprint 3 |

---

## Teil 3: Datenstruktur

| Anforderung | Wo umgesetzt | Sprint |
|------------|-------------|--------|
| Alle erfassten Infos abbildet | types/provider.ts (vollständiges Interface) | Sprint 0 |
| Erweiterbar (neue Felder, Kategorien) | categories als Array, services als Array, tags | Sprint 0 |
| Sich für eine API eignet | JSON mit meta-Objekt, REST-kompatible Struktur | Sprint 0 |

### Darüber hinaus:
| Extra | Wo |
|-------|-----|
| GeoJSON Point Standard | location.coordinates |
| ISO 3166 Country Codes | address.country |
| Verification-Objekt mit Confidence | verification.confidence |
| Source-Tracking pro Eintrag | source.primaryUrl + collectedAt |
| Pydantic-Validierung (Python) | scripts/process/validate.py |

---

## Bonus-Features (alle optional laut Aufgabe)

| Bonus | Status | Wo |
|-------|--------|-----|
| Automatisierter Scraping-Ansatz | ✅ | scripts/ Pipeline (4 Stufen) |
| Clustering bei vielen Markern | ✅ | leaflet.markercluster (Sprint 2) |
| Geocoding von Adressen | ✅ | Nominatim via geopy (Sprint Data) |
| Docker-Setup | ✅ | Dockerfile + docker-compose.yml (Sprint 3) |
| Datenvalidierung | ✅ | Pydantic validate.py (Sprint Data) |
| Duplikat-Erkennung | ✅ | rapidfuzz deduplicate.py (Sprint Data) |

---

## Bewertungskriterien-Mapping

| Kriterium | Gewicht | Unsere Stärke |
|-----------|---------|---------------|
| Datenqualität | 40% | Keyword-Scoring + AI-Classifier + Telefon-Verifizierung + Verification Chain im Schema |
| Herangehensweise | 20% | 4-Stufen-Pipeline (discover→classify→geocode→validate), config.yaml für Reproduzierbarkeit, scripts/README.md |
| Code-Qualität | 15% | TypeScript strict, saubere Commits, Fork mit gezielten Anpassungen (kein Overengineering) |
| Datenmodell | 10% | GeoJSON, services Array, verification + source Objekte, Pydantic-validiert |
| Kartenansicht | 10% | Clustering, Filter, Suche, Deep-Links, WhatsApp-Share, Mobile Drawer, Geolocation |
| Dokumentation | 5% | Story-README mit Bahmann-Blog-Zitat, Methodik-Transparenz, "Bei mehr Zeit"-Section |
