# Sprint 4: Frontend Polish — Template-Cleanup, Mobile UX, Icons, Detail-Panel

KONTEXT: Zwei unabhängige Code-Reviews haben dieselben Probleme identifiziert. Priorität nach Impact auf Bewertung (Kartenansicht 10%, Herangehensweise 20%, Code-Qualität 15%).

## PRIORITY 1: Template-Reste eliminieren (KRITISCH — Reviewer sieht das sofort)

a) Dateien LÖSCHEN:
```
rm -rf app/api/countries
rm public/data/world.geojson
rm components/map/MapSearchBar.tsx
rm components/map/MapDetailsPanel.tsx
rm components/map/MapMeasurementPanel.tsx
rm components/map/MapPOIPanel.tsx
rm components/map/MapContextMenu.tsx
rm components/map/LeafletGeoJSON.tsx
rm components/map/LeafletMarker.tsx
rm hooks/useMeasurement.ts
rm hooks/useMapContextMenu.ts
rm hooks/usePOIManager.ts
rm hooks/useMapMarkers.ts
```
Danach in components/map/index.ts die Exporte dieser Components entfernen. Prüfe alle imports im gesamten Projekt — nichts darf auf gelöschte Dateien referenzieren.

b) MapUser.tsx: "Welly Wahyudi / welly@example.com" komplett entfernen. Entweder durch neutrales "Laborsuche DACH"-Branding ersetzen oder die ganze User-Dropdown-Komponente entfernen. Kein fremder Name darf irgendwo im Code stehen.

c) Hero.tsx: "Next.js Leaflet Starter" → "Laborsuche DACH". Untertitel: "Finde DEXA Body Composition Scans und Selbstzahler-Blutlabore in Deutschland, Österreich und der Schweiz."

d) NavigationButtons.tsx: GitHub-Link → https://github.com/dome317/laborsuche-dach

e) MapTopBar.tsx: 360px Spacer für Suchleiste entfernen.

f) layout.tsx: lang="en" → lang="de"

g) Suche im gesamten Codebase nach weiteren Vorkommen von "Welly", "wahyudi", "welly@example", "nextjs-leaflet-starter" und entferne/ersetze alle.

## PRIORITY 2: Mobile UX Fixes

a) safe-area-top CSS-Klasse definieren in globals.css:
```css
.safe-area-top {
  padding-top: env(safe-area-inset-top, 0px);
}
```

b) Mobile Suche dauerhaft sichtbar machen, nicht hinter Extra-Tap verstecken. Suchfeld mit Search-Icon (lucide Search), placeholder "Ort, Anbieter oder PLZ suchen", rounded-xl, min-h-[44px] Tap-Target.

c) Bottom-Drawer: Initial auf 50% statt 35% öffnen, damit sofort 2-3 Provider-Cards sichtbar sind. Drag-Handle größer und sichtbarer machen (min 40px breit, 4px hoch, rounded-full, bg-slate-300).

d) Tile-Switcher auf Mobile ausblenden (hidden md:block) — auf Touch-Geräten ist das Hover-based UI kaputt.

e) fitBounds NUR initial beim ersten Laden oder per explizitem Button. NICHT bei jeder Filter-/Suchänderung — das nimmt dem Nutzer die Kontrolle über die Karte.

f) Resultcount anzeigen: "12 Anbieter im Kartenausschnitt" als kleines Label unter den Filter-Chips.

g) Geolocation-Fehlermeldung menschlich formulieren: "Standort konnte nicht ermittelt werden. Du kannst trotzdem nach Ort suchen." statt technischer Meldungen wie "Bitte HTTPS verwenden..."

## PRIORITY 3: Custom Icons + Farbschema

a) DEXA Body Composition Icon: Erstelle ein Custom SVG als React-Komponente (components/icons/BodyScanIcon.tsx). Minimalistische Körpersilhouette mit Scan-Linien oder Fadenkreuz-Overlay. Einfarbig, funktioniert in 16x16 bis 32x32. Verwende dieses Icon überall wo bisher das DEXA-Icon war: Filter-Chips, Marker, Provider-Liste, Detail-Panel.

b) Blutlabor Icon: Verwende Droplet aus lucide-react. Ersetze das bisherige Blutlabor-Icon überall konsistent.

c) Neues Farbschema — konsistent überall anwenden:
- DEXA: Violett (#7C3AED)
- Blutlabor: Warm-Rot (#DC2626)
- Verifiziert-Badge: Emerald (#10B981)
- Preis-Badge: Amber (#F59E0B)
- Text Primary: Slate-700 (#334155)
- Text Secondary: Slate-400 (#94A3B8)
- Background: White (#FFFFFF) + subtle Gray (#F9FAFB) für Sections

d) Leaflet-Marker als DivIcon mit den neuen Icons und Farben. Weißer Hintergrund-Circle mit subtle Drop-Shadow. Kein Default-Pin mehr.

e) Filter-Chips: Aktiver Chip bekommt die Kategorie-Farbe als Background. Inaktiver Chip: bg-slate-100. Mindestgröße min-h-[44px] für mobile Tap-Targets.

f) Marker-Cluster-Farben an das neue Schema anpassen.

## PRIORITY 4: Detail-Panel Redesign

a) Informationshierarchie umdrehen — above the fold muss stehen:
1. Kategorie-Badge (farbig, rounded-full) + Provider-Name (text-lg font-semibold)
2. Entfernung (wenn Geolocation aktiv) + Stadt mit kleinem MapPin-Icon
3. Preis prominent: Große Zahl in Amber wenn vorhanden, "Preis auf Anfrage" in Slate-400 wenn nicht
4. Verified-Badge: Grüner Dot + "Verifiziert" Text + Datum/Methode wenn vorhanden

b) Services als Tags/Pills (rounded-full, bg-slate-100, text-xs, px-3 py-1).

c) Sticky CTA-Footer am unteren Rand des Detail-Panels:
- Obere Zeile: Vertrauensbox mit Verifizierungsstatus (bg-emerald-50, text-emerald-800, rounded-xl)
- Untere Zeile: Button-Grid
  - "Route planen" = secondary (bg-gray-100, text-gray-900)
  - "Termin buchen" = primary (bg-blue-600, text-white) — NUR wenn bookingUrl existiert
  - Wenn KEIN bookingUrl: "Anrufen" als primary mit Phone-Icon
  - "Website öffnen" = secondary mit ExternalLink-Icon — NUR wenn website existiert
- Darunter volle Breite: "Per WhatsApp teilen" (bg-green-500, text-white) mit Share2-Icon

d) WhatsApp-Share Text verbessern:
```
${provider.name}
📍 ${provider.address.city}${distance ? ` (${distance} km entfernt)` : ''}
💰 ab ${lowestPrice} (nur wenn Preis vorhanden)
🔗 ${provider.contact.website || provider.contact.bookingUrl}
```

## PRIORITY 5: Kleine Polishes

a) Loading Skeletons für Provider-Liste: 3 animierte Placeholder-Cards (bg-slate-100 animate-pulse rounded-xl h-24) während isLoading=true.

b) Provider-Cards konsistentes Layout: Jede Card zeigt in dieser Reihenfolge:
- Zeile 1: Kategorie-Badge (klein, farbig) + Name (font-medium, truncate)
- Zeile 2: Stadt + Entfernung (text-sm text-slate-500)
- Zeile 3: Preis (font-semibold text-amber-600) ODER "Preis auf Anfrage" (text-slate-400)

c) Typography global aufräumen:
- Provider-Name: font-semibold text-base (nicht bold)
- Adresse/Stadt: text-sm text-slate-500
- Abstände zwischen Cards: gap-2
- Suchfeld: rounded-xl mit Search-Icon links

d) Homepage: Entweder redirect auf /map ODER die Hero-Page als echte Landing nutzen mit "Zur Karte" CTA-Button. Entscheide dich für eins, kein Zwischending.

## CONSTRAINTS
- Keine neuen npm-Pakete installieren
- lucide-react ist verfügbar: Droplet, Search, MapPin, Phone, ExternalLink, Share2, Navigation, Shield, ChevronLeft, X
- Tailwind-only Styling, kein custom CSS außer für safe-area-top und das SVG-Icon
- Mobile-first: Alles muss auf 375px Breite sauber funktionieren
- Nach allen Änderungen: `npm run build` muss ohne Fehler durchlaufen
- Committe als "feat: frontend polish — cleanup, mobile UX, icons, detail panel"
