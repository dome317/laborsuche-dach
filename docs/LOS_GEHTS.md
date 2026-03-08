# Los Geht's — Schritt für Schritt

## Tag 0: Vorbereitung (30 Min)

### 1. Repo forken + klonen
```bash
# Auf GitHub: Fork von https://github.com/wellywahyudi/nextjs-leaflet-starter
# Dann:
git clone https://github.com/dome317/nextjs-leaflet-starter.git laborsuche-dach
cd laborsuche-dach
npm install
npm run dev
# → Prüfe: http://localhost:3000 zeigt die Original-App
```

### 2. CLAUDE.md reinkopieren
```bash
# Kopiere die CLAUDE.md aus diesem Ordner ins Projekt-Root
cp /pfad/zu/CLAUDE.md ./CLAUDE.md
```

### 3. Sprint-Commands reinkopieren
```bash
mkdir -p .claude/commands
# Kopiere alle Sprint-Dateien:
cp /pfad/zu/.claude/commands/* .claude/commands/
```

### 4. Erster Commit
```bash
git add CLAUDE.md .claude/
git commit -m "chore: add Claude Code config + sprint commands"
```

---

## Tag 1: Daten (den ganzen Tag)

### Morgens: Parallele Datenquellen starten

**Terminal 1 — Apify Google Maps Scraper:**
1. Geh auf https://apify.com/compass/crawler-google-places
2. "Try for free" → Account erstellen
3. Queries eingeben (eine nach der anderen):
   - "DEXA Body Composition München"
   - "DEXA Body Composition Berlin"
   - "DEXA Körperzusammensetzung"
   - "Ganzkörper DEXA Scan"
   - "Blutuntersuchung Selbstzahler München"
   - "Labor ohne Überweisung Berlin"
   - "Blutabnahme Selbstzahler Hamburg"
   - "Direktlabor Hannover"
4. Ergebnisse als JSON exportieren → `data/raw/apify_results.json`

**Terminal 2 — Claude Code für Pipeline:**
```bash
cd laborsuche-dach
claude
# In Claude Code:
/sprint-data
```

**Parallel manuell — Telefon-Verifizierung:**
- 5–10 DEXA-Anbieter anrufen
- Frage: "Bieten Sie DEXA Body Composition an? Also Ganzkörper-Analyse mit Körperfett und Muskelmasse — nicht nur Knochendichte?"
- Notiere Antworten in einer Textdatei

**Parallel manuell — meindirektlabor.de:**
- https://www.meindirektlabor.de/ueber-uns/preisliste/ öffnen
- Alle Standorte sind dort gelistet — prüfe ob der Scraper sie gefunden hat

### Abends: Daten zusammenführen
- Apify-Ergebnisse + meindirektlabor-Scrape + manuelle Recherche → in Pipeline einspeisen
- `bash scripts/run_pipeline.sh` → providers.json
- Prüfe: wie viele Einträge? Wie viele verifiziert?

---

## Tag 2: Frontend Sprint 0 + 1

### Vormittag: Sprint 0
```bash
claude
# In Claude Code:
/sprint-0
# Wenn fertig:
/validate   # → Gate 0 Block pasten
```

### Nach Gate 0: Echte Daten einbauen
- Ersetze `public/data/providers.json` mit der echten Datei aus der Pipeline
- `npm run dev` → echte Marker auf der Karte!
- Commit: "data: replace dummy with real provider data"

### Nachmittag: Sprint 1
```bash
# In Claude Code:
/clear
/sprint-1
# Wenn fertig:
/validate   # → Gate 1 Block pasten
```

---

## Tag 3: Sprint 2 + 3

### Vormittag: Sprint 2
```bash
claude
/sprint-2
# Wenn fertig:
/validate   # → Gate 2 Block pasten
```

### Nachmittag: Sprint 3
```bash
/clear
/sprint-3
# Wenn fertig:
/validate   # → Gate 3 Block pasten
```

---

## Tag 4: Finalisierung

### Morgens: Eigener Clone-to-Run Test
```bash
cd /tmp
git clone https://github.com/dome317/laborsuche-dach.git test-clone
cd test-clone
npm install
npm run dev
# → Funktioniert ALLES ohne dein lokales Setup?
docker compose up
# → Funktioniert auch Docker?
```

### README Platzhalter füllen
- Öffne README.md
- Ersetze alle [ZAHL], [LISTE], [X] mit echten Werten aus der Pipeline-Statistik
- Screenshots einfügen (docs/screenshots/)

### Abgabe
- Finaler Push
- Repo-URL an Bahmann schicken

---

## Notfall-Situationen

| Problem | Lösung |
|---------|--------|
| Claude Code macht nach 2 Versuchen denselben Fehler | `/clear` → Fehler + gewünschtes Verhalten im Prompt beschreiben |
| Context wird voll | `/compact` oder `/clear` + Sprint neu starten |
| npm run build schlägt fehl | Fehler in Claude Code pasten: "Fix this TypeScript error: [error]" |
| Repo-Feature kaputt nach Änderung | `git diff` zeigen lassen, gezielt reverten |
| Zu wenig Daten nach Pipeline | Manuell ergänzen: megeni.com, dexascan.com, diagnostikum.at abgrasen |
| Apify Free Tier aufgebraucht | Google Maps manuell durchsuchen, Ergebnisse per Hand in JSON |
