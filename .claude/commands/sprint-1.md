# Sprint 1: Sidebar + Filter + Detail-Ansicht

Das Repo hat bereits ein Side-Panel-Layout. Deine Aufgabe: den Content durch unsere Provider-Daten ersetzen.

## Schritte

### SCHRITT 1: Filter-Chips
- Ersetze die bestehende Filter-/Kategorie-UI durch horizontale Chips:
  "Alle (5)" | "DEXA Body Scan (2)" | "Blutlabor (2)" | "Beides (1)"
- Zahlen aktualisieren sich live
- Marker auf der Karte filtern sich synchron mit den Chips
- Commit: "feat: category filter chips with live counts"

### SCHRITT 2: Provider-Liste in Sidebar
- Ersetze den bestehenden Sidebar-Content durch eine scrollbare Provider-Liste
- Jede Card zeigt: Name, Stadt, Kategorie-Badge (farbig), Preis (falls vorhanden)
- Klick auf Card → Provider auswählen (State setzen)
- Karte fliegt zum Marker (flyTo, zoom 14)
- Commit: "feat: provider list in sidebar"

### SCHRITT 3: Detail-Panel
- Bei ausgewähltem Provider: Detail-Ansicht in der Sidebar (ersetzt oder überlagert Liste)
- Zeigt:
  - Name (groß)
  - Kategorie-Badge
  - Adresse (vollständig)
  - Alle Services mit Preisen (als Liste)
  - Verifizierungs-Status Badge ("✓ Verifiziert" / "⚠ Nicht verifiziert")
  - Telefon (klickbar: `tel:`)
  - Website (klickbar, externer Link)
  - Buchungs-URL (falls vorhanden, als Button "Termin buchen")
  - "Route planen" → `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`
  - WhatsApp-Share-Button → `https://wa.me/?text=Schau mal: {name} – {website}`
  - "Zurück zur Liste" Button
- Commit: "feat: provider detail panel with contact + sharing"

### SCHRITT 4: Marker-Klick → Detail
- Klick auf Karte-Marker → öffnet Detail-Panel in Sidebar
- Selected Marker visuell hervorheben (größer, Schatten, oder andere Farbe)
- Commit: "feat: marker click opens detail with highlight"

### SCHRITT 5: Provider-Suche mit fuse.js
- Suchfeld oben in der Sidebar
- Fuzzy-Suche über: name, city, postalCode
- Ergebnisse filtern Liste UND Marker live
- Commit: "feat: fuzzy search with fuse.js"

### SCHRITT 6: URL-State für Deep-Links
- Filter + selectedId in URL-Search-Params: `?category=dexa&selected=dexa-muc-001`
- Optional: `?city=hannover` filtert nach Stadt
- Beim Laden: URL-Params auslesen und State initialisieren
- Deep-Links funktionieren (Coach schickt Link via WhatsApp an Kundin)
- Commit: "feat: URL state for deep linking"

Wenn fertig: `npm run build` prüfen, dann berichte ✅/❌ pro Feature.
