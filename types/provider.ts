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

export type ProviderCategory = "dexa_body_composition" | "blutlabor"

export interface ProvidersData {
  meta: {
    version: string
    generatedAt: string
    totalCount: number
    regions: string[]
  }
  providers: Provider[]
}
