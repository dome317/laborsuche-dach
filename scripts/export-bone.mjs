/**
 * Export bone-only DEXA entries from geocoded.json into providers.json
 * Quality filters: score >= 7, all fields present, keywords in website text
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const geocoded = JSON.parse(readFileSync(join(__dirname, "..", "data", "processed", "geocoded.json"), "utf-8"));
const providersPath = join(__dirname, "..", "public", "data", "providers.json");
const providersData = JSON.parse(readFileSync(providersPath, "utf-8"));

// 1. Find bone-only entries (have dexa_bone_density but NOT dexa_body_composition)
const boneOnly = geocoded.filter(e => {
  const svcs = (e.classified_services || []).map(s => s.type || s);
  return svcs.includes("dexa_bone_density") && !svcs.includes("dexa_body_composition");
});

console.log(`Total bone-only entries in geocoded.json: ${boneOnly.length}`);

// 2. Keyword check
function hasKeywords(e) {
  const text = ((e.website_text || "") + " " + (e.service_page_text || "")).toLowerCase();
  return text.includes("knochendichte") || text.includes("dexa") || text.includes("dxa") || text.includes("osteoporose") || text.includes("osteodensitometrie");
}

// 3. Quality filter
const qualified = boneOnly.filter(e =>
  e.bone_density_score >= 7 &&
  e.raw_lat && e.raw_lng &&
  e.raw_website &&
  e.raw_phone &&
  e.raw_address &&
  hasKeywords(e)
);

console.log(`After quality filter (score>=7, all fields, keywords): ${qualified.length}`);

// Show 5 examples
console.log("\n=== EXAMPLES ===");
qualified.slice(0, 5).forEach((e, i) => {
  console.log(`  ${i + 1}. score:${e.bone_density_score} | ${e.raw_name} | ${e.raw_city}, ${e.raw_country} | ${e.raw_website}`);
});

// 4. Deduplicate by name similarity - remove duplicates (same org, different locations named similarly)
// Also remove entries already in providers.json
const existingNames = new Set(providersData.providers.map(p => p.name.toLowerCase()));
const existingSlugs = new Set(providersData.providers.map(p => p.slug));

// Deduplicate: keep highest score per unique base name
const seen = new Map();
qualified.forEach(e => {
  // Normalize name for dedup
  const baseName = (e.raw_name || "").toLowerCase()
    .replace(/\s*\|\s*/g, " ")
    .replace(/standort.*/i, "")
    .replace(/mammographie.*/i, "")
    .trim();

  if (existingNames.has((e.raw_name || "").toLowerCase())) return; // skip existing

  const existing = seen.get(baseName);
  if (!existing || (e.bone_density_score || 0) > (existing.bone_density_score || 0)) {
    seen.set(baseName, e);
  }
});

const deduplicated = [...seen.values()];
console.log(`After dedup and excluding existing: ${deduplicated.length}`);

// 5. State mapping
const stateMap = {
  München: "Bayern", Mannheim: "Baden-Württemberg", Heidelberg: "Baden-Württemberg",
  Ettlingen: "Baden-Württemberg", Flensburg: "Schleswig-Holstein",
  "Ludwigshafen am Rhein": "Rheinland-Pfalz", Leverkusen: "Nordrhein-Westfalen",
  Köln: "Nordrhein-Westfalen", Bonn: "Nordrhein-Westfalen", Nürnberg: "Bayern",
  "Bad Nauheim": "Hessen", Berlin: "Berlin", Hamburg: "Hamburg", Bremen: "Bremen",
  Hannover: "Niedersachsen", Stuttgart: "Baden-Württemberg", Frankfurt: "Hessen",
  Düsseldorf: "Nordrhein-Westfalen", Dortmund: "Nordrhein-Westfalen",
  Essen: "Nordrhein-Westfalen", Dresden: "Sachsen", Leipzig: "Sachsen",
  Wien: "Wien", Zürich: "Zürich", Graz: "Steiermark", Linz: "Oberösterreich",
  Karlsruhe: "Baden-Württemberg", Augsburg: "Bayern", Wiesbaden: "Hessen",
  Mainz: "Rheinland-Pfalz", Kiel: "Schleswig-Holstein", Rostock: "Mecklenburg-Vorpommern",
};

// 6. Convert to provider format
const now = new Date().toISOString();
const newProviders = deduplicated.map(e => {
  const city = e.raw_city || "";
  const country = (e.raw_country || "DE").toUpperCase();
  const slug = (e.raw_name || "").toLowerCase().replace(/[^a-z0-9äöüß]+/g, "-").replace(/-+$/, "").replace(/^-+/, "");

  // Parse address parts
  const rawAddr = e.raw_address || "";
  const addrParts = rawAddr.split(",").map(s => s.trim());
  const street = addrParts[0] || "";

  return {
    id: "temp", // will be reassigned
    name: e.raw_name || "",
    slug,
    categories: ["knochendichte"],
    address: {
      street,
      postalCode: e.raw_postal_code || "",
      city,
      state: stateMap[city] || city,
      country,
    },
    location: {
      type: "Point",
      coordinates: [parseFloat(e.raw_lng), parseFloat(e.raw_lat)],
    },
    contact: {
      phone: e.raw_phone || null,
      website: e.raw_website || null,
      email: null,
      bookingUrl: null,
    },
    services: [{
      type: "dexa_bone_density",
      name: "Knochendichtemessung (DEXA)",
      description: null,
      selfPay: true,
      price: null,
      verification: {
        status: "verified",
        confidence: 0.85,
        date: "2026-03-09",
        method: "llm_recherche",
        notes: null,
      },
    }],
    selfPay: true,
    verified: true,
    source: {
      origin: "llm_recherche",
      primaryUrl: e.raw_website || e.service_page_url || null,
      collectedAt: now,
    },
    tags: ["knochendichte", "dexa", "selbstzahler", city.toLowerCase(), country === "AT" ? "österreich" : country === "CH" ? "schweiz" : "deutschland"],
  };
});

console.log(`\n=== NEW PROVIDERS TO ADD ===`);
newProviders.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.name} | ${p.address.city}, ${p.address.country} | ${p.contact.website}`);
});

// 7. Add to providers, also add bone density service to existing DEXA body comp providers
let bodyCompUpdated = 0;
providersData.providers.forEach(p => {
  if (p.categories.includes("dexa_body_composition")) {
    // Add knochendichte category
    if (!p.categories.includes("knochendichte")) {
      p.categories.push("knochendichte");
    }
    // Add bone density service if not present
    const hasBoneSvc = p.services.some(s => s.type === "dexa_bone_density");
    if (!hasBoneSvc) {
      p.services.push({
        type: "dexa_bone_density",
        name: "Knochendichtemessung",
        description: null,
        selfPay: true,
        price: null,
        verification: {
          status: "verified",
          confidence: 0.9,
          date: "2026-03-09",
          method: "llm_recherche",
          notes: null,
        },
      });
      bodyCompUpdated++;
    }
  }
});

console.log(`\nUpdated ${bodyCompUpdated} body comp providers with bone density service`);

// 8. Merge and re-sort
const allProviders = [...providersData.providers, ...newProviders];

const countryOrder = { AT: 0, CH: 1, DE: 2 };
const categoryOrder = (p) => {
  if (p.categories.includes("dexa_body_composition")) return 0;
  if (p.categories.includes("knochendichte") && !p.categories.includes("blutlabor")) return 1;
  return 2;
};

allProviders.sort((a, b) => {
  const catDiff = categoryOrder(a) - categoryOrder(b);
  if (catDiff !== 0) return catDiff;
  const countryDiff = (countryOrder[a.address.country] ?? 99) - (countryOrder[b.address.country] ?? 99);
  if (countryDiff !== 0) return countryDiff;
  return a.address.city.localeCompare(b.address.city, "de");
});

// 9. Assign new IDs
const idCounters = {};
allProviders.forEach(p => {
  let prefix;
  if (p.categories.includes("dexa_body_composition")) prefix = "dexa";
  else if (p.categories.includes("knochendichte")) prefix = "knochen";
  else prefix = "blut";

  const country = p.address.country.toLowerCase();
  const key = `${prefix}-${country}`;
  idCounters[key] = (idCounters[key] || 0) + 1;
  p.id = `${key}-${String(idCounters[key]).padStart(3, "0")}`;
});

// 10. Update meta and write
providersData.providers = allProviders;
providersData.meta.totalCount = allProviders.length;
providersData.meta.generatedAt = now;

writeFileSync(providersPath, JSON.stringify(providersData, null, 2) + "\n", "utf-8");

// 11. Statistics
const total = allProviders.length;
const dexaBC = allProviders.filter(p => p.categories.includes("dexa_body_composition")).length;
const boneOnlyFinal = allProviders.filter(p => p.categories.includes("knochendichte") && !p.categories.includes("dexa_body_composition")).length;
const blut = allProviders.filter(p => p.categories.includes("blutlabor")).length;
const bothDexa = allProviders.filter(p => p.categories.includes("dexa_body_composition") && p.categories.includes("knochendichte")).length;
const knochTotal = allProviders.filter(p => p.categories.includes("knochendichte")).length;

console.log("\n═══ FINAL STATISTICS ═══");
console.log(`Gesamt: ${total}`);
console.log(`DEXA Body Comp: ${dexaBC}`);
console.log(`Knochendichte (Bone Only): ${boneOnlyFinal}`);
console.log(`Blutlabor: ${blut}`);
console.log(`Davon Body Comp + Knochendichte (beides): ${bothDexa}`);
console.log(`Knochendichte gesamt (inkl. Body Comp): ${knochTotal}`);
console.log(`Verified: ${allProviders.filter(p => p.verified).length}/${total}`);
