# Claude Code Sprint-Plan (Final — Fork-basiert)

---

## ARCHITEKTUR

```
laborsuche-dach/                    ← Fork von wellywahyudi/nextjs-leaflet-starter
├── CLAUDE.md                       ← Claude Code liest das jede Session
├── .claude/commands/
│   ├── sprint-0.md                 ← /sprint-0 (Setup + Aufräumen + Schema + Marker)
│   ├── sprint-1.md                 ← /sprint-1 (Sidebar + Filter + Detail + Suche)
│   ├── sprint-2.md                 ← /sprint-2 (Mobile + Clustering + Polish)
│   ├── sprint-3.md                 ← /sprint-3 (Docker + PWA + README)
│   ├── sprint-data.md              ← /sprint-data (Python Pipeline — eigene Session)
│   └── validate.md                 ← Gate-Prompts zum Copy-Pasten
├── scripts/
│   ├── requirements.txt
│   ├── config.yaml                 ← Wird von sprint-data generiert
│   ├── scrape/
│   ├── process/
│   └── run_pipeline.sh
├── docs/
│   ├── LOS_GEHTS.md                ← Schritt-für-Schritt Anleitung
│   ├── COVERAGE_MATRIX.md          ← Jede Anforderung → wo umgesetzt
│   └── screenshots/
├── public/data/
│   └── providers.json              ← Finale Daten (im Repo eingecheckt)
├── types/
│   └── provider.ts                 ← Wird von Sprint 0 erstellt
├── Dockerfile                      ← Wird von Sprint 3 erstellt
├── docker-compose.yml              ← Wird von Sprint 3 erstellt
└── README.md                       ← Wird von Sprint 3 geschrieben
```

---

## WORKFLOW

```
VORBEREITUNG (30 Min):
  Fork → Clone → npm install → CLAUDE.md + Commands reinkopieren → Commit

TAG 1 — DATEN:
  ├── Claude Code Session 1: /sprint-data → Python-Pipeline generieren
  ├── Parallel: Apify Google Maps Scraper laufen lassen (Browser)
  ├── Parallel: meindirektlabor.de manuell prüfen
  ├── Parallel: 5-10 DEXA-Anbieter anrufen, Notizen machen
  └── Abends: Pipeline laufen lassen → providers.json

TAG 2 — FRONTEND BASIS:
  ├── Claude Code Session 2: /sprint-0 → Setup + Aufräumen + Marker
  ├── Gate 0 validieren
  ├── Echte providers.json einbauen (Dummy ersetzen)
  ├── /clear
  ├── Claude Code Session 3: /sprint-1 → Sidebar + Filter + Detail
  └── Gate 1 validieren

TAG 3 — POLISH:
  ├── Claude Code Session 4: /sprint-2 → Mobile + Clustering + Polish
  ├── Gate 2 validieren
  ├── /clear
  ├── Claude Code Session 5: /sprint-3 → Docker + PWA + README
  └── Gate 3 validieren

TAG 4 — SHIPPING:
  ├── README Platzhalter füllen (echte Zahlen)
  ├── Screenshots manuell erstellen
  ├── Clone-to-Run Test in frischem Ordner
  └── Push + Abgabe
```

---

## SESSION-REGELN

| Regel | Warum |
|-------|-------|
| `/clear` zwischen jedem Sprint | Context-Degradation ist der #1 Fehlergrund |
| `/sandbox` aktivieren | 84% weniger Permission-Prompts |
| Nie 2 Aufgaben in einer Session | Context-Verschmutzung |
| `/compact` bei >50% Context | Manuell auslösen bevor Claude es automatisch (schlechter) macht |
| Thinking Mode ON | `/config` → thinking: true für bessere Entscheidungen |
| Jeden Schritt committen | Rollback-Möglichkeit bei Fehlern |

---

## SLASH COMMANDS (im Projekt verfügbar)

| Command | Was passiert |
|---------|-------------|
| `/sprint-0` | Fork aufräumen, Schema einbauen, Marker auf Karte |
| `/sprint-1` | Sidebar, Filter, Detail-Panel, Suche, Deep-Links |
| `/sprint-2` | Mobile, Clustering, Viewport-Sync, Geolocation |
| `/sprint-3` | Docker, PWA, README, .gitignore, Final Check |
| `/sprint-data` | Komplette Python-Pipeline (eigene Session!) |
| `/validate` | Gate-Prompts zum Copy-Pasten nach jedem Sprint |

---

## NOTFALL-CHEATSHEET

| Problem | Lösung |
|---------|--------|
| Claude macht 2x gleichen Fehler | `/clear` → Fehler + Lösung in neuem Prompt beschreiben |
| Context voll | `/compact` manuell ODER `/clear` + Sprint neu |
| npm run build fehlschlägt | Error-Text in Claude Code pasten: "Fix this: [error]" |
| Repo-Feature kaputt nach Änderung | `git diff` → gezielt reverten |
| Zu wenig Daten nach Pipeline | Manuell: megeni.com, dexascan.com, diagnostikum.at |
| shadcn-map Versuchung | NEIN. Repo = vanilla Leaflet. Nicht mischen. |
