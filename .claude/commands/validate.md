# Validierungs-Gates

Paste den jeweiligen Gate-Block nach einem Sprint in Claude Code.

---

## Gate 0 (nach Sprint 0)

```
Validiere Sprint 0. Prüfe JEDEN Punkt:

1. `npm run build` → 0 Errors, 0 Warnings?
2. `npm run dev` → Karte sichtbar auf localhost:3000?
3. 5 Marker sichtbar auf der Karte?
4. Marker sind farblich unterschieden (Blau/Grün/Violett)?
5. Karte zeigt beim Start alle Marker (fitBounds)?
6. Measurement/Drawing/Context Menu sind NICHT sichtbar?
7. types/provider.ts existiert mit vollständigem Interface?
8. public/data/providers.json existiert mit 5 Einträgen?
9. Git log zeigt saubere Commits?

Berichte: ✅/❌ pro Punkt. Bei ❌ → was genau ist das Problem?
```

---

## Gate 1 (nach Sprint 1)

```
Validiere Sprint 1. Prüfe JEDEN Punkt:

1. `npm run build` → 0 Errors?
2. Filter-Chips sichtbar: Alle / DEXA / Blutlabor?
3. Klick auf "DEXA" → nur DEXA-Marker + Cards sichtbar?
4. Zahlen auf Chips stimmen mit Anzahl überein?
5. Provider-Liste in Sidebar zeigt alle gefilterten Provider?
6. Klick auf Card → Detail-Panel öffnet?
7. Detail zeigt: Name, Adresse, Services, Preise, Kontakt?
8. WhatsApp-Share-Button generiert korrekten wa.me Link?
9. "Route planen" Link öffnet Google Maps?
10. Klick auf Marker → flyTo + Detail öffnet?
11. Selected Marker sieht anders aus (hervorgehoben)?
12. Suchfeld: "München" eintippen → nur München-Provider?
13. URL ändert sich bei Filter/Selection?
14. Seite neu laden mit ?category=dexa → Filter ist vorausgewählt?

Berichte: ✅/❌ pro Punkt.
```

---

## Gate 2 (nach Sprint 2)

```
Validiere Sprint 2. Prüfe JEDEN Punkt:

1. `npm run build` → 0 Errors?
2. Browser auf 375px Breite: Karte fullscreen, Bottom Drawer sichtbar?
3. Mobile: Filter-Chips über der Karte?
4. Mobile: Klick auf Marker → Drawer öffnet mit Detail?
5. Clustering: Rauszoomen → Marker gruppieren sich?
6. Cluster-Klick → zoomed rein oder spiderfied?
7. Sidebar zeigt nur Provider im sichtbaren Kartenausschnitt?
8. Zoomen/Pannen → Liste aktualisiert sich live?
9. Empty State sichtbar wenn Filter nichts ergibt?
10. Geolocation-Button → Entfernung auf Cards sichtbar?

Berichte: ✅/❌ pro Punkt.
```

---

## Gate 3 (nach Sprint 3)

```
Validiere Sprint 3 (Final). Prüfe JEDEN Punkt:

1. `npm run build` → 0 Errors?
2. `npm run dev` → vollständige App auf localhost:3000?
3. `docker compose up` → identische App auf localhost:3000?
4. README.md existiert, >150 Zeilen, <300 Zeilen?
5. README hat: Quick Start, Features, Datenqualität-Tabelle, Methodik?
6. README referenziert janbahmann.de/blog?
7. README erklärt DEXA Body Comp ≠ Knochendichte?
8. README hat "Was ich bei mehr Zeit machen würde" mit Zeitschätzungen?
9. scripts/README.md erklärt Pipeline-Setup und Erweiterung?
10. .gitignore: node_modules, .next, .env sind drin?
11. providers.json ist NICHT in .gitignore (muss im Repo sein)?
12. manifest.json existiert mit korrekten PWA-Feldern?
13. Git log → saubere, lesbare Commit-History?

Berichte: ✅/❌ pro Punkt. Bei allem ✅ → READY TO SHIP.
```
