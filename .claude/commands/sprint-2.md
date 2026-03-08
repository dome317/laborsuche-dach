# Sprint 2: Mobile + Clustering + Polish

Das Repo hat bereits einen Mobile Drawer. Deine Aufgabe: sicherstellen dass der Provider-Content dort korrekt funktioniert und visuelle Details nachziehen.

## Schritte

### SCHRITT 1: Mobile Drawer Content
- Prüfe ob der bestehende Mobile Drawer korrekt die Provider-Liste + Detail-Ansicht zeigt
- Filter-Chips als kompakte Leiste über der Karte (halbtransparent)
- Suchfeld als Lupen-Icon → Tap → expandiert
- Falls Drawer nicht gut funktioniert: anpassen
- Commit: "feat: mobile drawer with provider content"

### SCHRITT 2: Marker-Clustering
- Integriere leaflet.markercluster in die bestehende Leaflet-Map
- CSS importieren: `leaflet.markercluster/dist/MarkerCluster.css` + `MarkerCluster.Default.css`
- Cluster-Icons farblich nach Mehrheitskategorie der enthaltenen Marker
- Spiderfy bei Klick auf Cluster
- Prüfe: Rauszoomen → Marker gruppieren sich korrekt
- Commit: "feat: marker clustering with category colors"

### SCHRITT 3: Viewport-Sync
- Sidebar zeigt nur Provider die im aktuellen Kartenausschnitt sichtbar sind
- Beim Zoomen/Pannen aktualisiert sich die Liste live
- Zähler in Filter-Chips aktualisieren sich mit
- Commit: "feat: viewport-synced provider list"

### SCHRITT 4: Visuelle Polish
- Empty State bei leeren Filtern: "Keine Anbieter für diesen Filter gefunden"
- Selected-Marker: scale(1.2) + drop-shadow
- Hover auf Sidebar-Card ↔ Marker-Highlight auf Karte (bidirektional, wenn machbar)
- Smooth flyTo() statt hartem setView() überall
- Commit: "feat: visual polish — empty state, hover sync, animations"

### SCHRITT 5: Geolocation-Erweiterung
- Das Repo hat bereits Geolocation — erweitere es:
- Wenn Standort bekannt: sortiere Provider nach Entfernung
- Zeige Entfernung in km auf jeder Card ("2,3 km entfernt")
- Haversine-Formel oder Leaflet L.latLng.distanceTo()
- Commit: "feat: distance sorting with geolocation"

Wenn fertig: `npm run build` + auf Handy-Breite (375px) im Browser testen. Berichte ✅/❌.
