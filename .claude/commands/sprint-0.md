# Sprint 0: Fork Setup + Aufräumen

Du arbeitest auf einem Fork von wellywahyudi/nextjs-leaflet-starter.
Das Repo ist bereits geklont. Deine Aufgabe: aufräumen und für unseren Use-Case vorbereiten.

## Schritte (committe nach jedem)

### SCHRITT 1: Repo verstehen
- Lies die Projektstruktur: welche Komponenten gibt es, wo liegt der Map-Code, wo das State-Management
- Identifiziere: welche Features behalten wir, welche entfernen wir aus der UI
- Berichte mir kurz die Struktur bevor du weitermachst

### SCHRITT 2: Dependencies hinzufügen
- `npm install fuse.js leaflet.markercluster`
- `npm install -D @types/leaflet.markercluster`
- Prüfe: `npm run build` → fehlerfrei
- Commit: "chore: add fuse.js + leaflet.markercluster"

### SCHRITT 3: Unnötige UI-Features deaktivieren
- Finde wo Measurement Tools, Drawing Tools, Context Menu, CRUD für Custom Places, Import/Export gerendert werden
- Entferne NUR die Imports/Renders dieser Komponenten — lösche NICHT die Dateien
- Prüfe: `npm run build` → fehlerfrei
- Prüfe: `npm run dev` → Karte lädt ohne Fehler, ohne die entfernten Features
- Commit: "refactor: remove unused UI features (measurement, drawing, context menu)"

### SCHRITT 4: Provider-Datenmodell einbauen
- Erstelle `types/provider.ts` mit folgendem Interface:

```typescript
export interface Provider {
  id: string                    // z.B. "dexa-muc-001"
  name: string
  slug: string
  categories: ProviderCategory[]
  address: {
    street: string
    postalCode: string
    city: string
    state: string
    country: "DE" | "AT" | "CH"
  }
  location: {
    type: "Point"
    coordinates: [number, number]  // [lng, lat] GeoJSON!
  }
  contact: {
    phone: string | null
    website: string
    email?: string | null
    bookingUrl?: string | null
  }
  services: ProviderService[]
  selfPay: boolean
  verification: {
    status: "verified" | "unverified" | "excluded"
    confidence: number            // 0.0 - 1.0
    date: string                  // ISO date
    method: string                // z.B. "website + phone"
    notes: string | null
  }
  source: {
    origin: string                // z.B. "google_places", "meindirektlabor"
    primaryUrl: string
    collectedAt: string           // ISO datetime
  }
  tags: string[]
}

export interface ProviderService {
  type: "dexa_body_composition" | "dexa_bone_density" | "blood_test_self_pay" | "blood_test_referral"
  name: string
  description: string | null
  selfPay: boolean
  price: {
    amount: number | null
    currency: "EUR" | "CHF"
    note: string | null
  } | null
}

export type ProviderCategory = "dexa_body_composition" | "blutlabor" | "both"

export interface ProvidersData {
  meta: {
    version: string
    generatedAt: string
    totalCount: number
    regions: string[]
  }
  providers: Provider[]
}
```

- Commit: "feat: provider type definitions"

### SCHRITT 5: Dummy-Daten erstellen
- Erstelle `public/data/providers.json` mit 5 realistischen Dummy-Providern:
  - "DEXA Zentrum München" (DEXA Body Composition, Leopoldstraße, München)
  - "Mein Direktlabor Hamburg" (Blutlabor Selbstzahler, Hamburg)
  - "BodyScan Berlin" (DEXA Body Composition, Berlin)
  - "Labor Hannover Nord" (Blutlabor Selbstzahler, Hannover — Bahmann-Stadt!)
  - "Diagnostikum Wien" (Beides: DEXA + Blut, Wien)
- Nutze realistische Adressen und korrekte Koordinaten (Google Maps nachschlagen)
- Alle Felder befüllen, auch verification + source
- Commit: "feat: dummy provider data (5 entries)"

### SCHRITT 6: Daten laden + Marker anzeigen
- Lade providers.json (fetch oder import)
- Ersetze die existierenden Marker/POIs im Repo durch Provider-Marker
- Farbcodierung: Blau (#2563EB) = DEXA, Grün (#10B981) = Blut, Violett (#8B5CF6) = Beides
- Nutze lucide-react Icons in den Markern: Activity für DEXA, Droplets für Blut
- Karte zentriert auf DACH: lat 48.5, lng 10.5, zoom 6
- fitBounds() damit alle Marker sichtbar sind
- Prüfe: `npm run dev` → 5 farbige Marker auf der Karte
- Commit: "feat: provider markers with category colors"

Wenn fertig: `npm run build` prüfen, dann berichte was funktioniert ✅ und was nicht ❌.
