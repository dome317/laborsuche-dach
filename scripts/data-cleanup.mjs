/**
 * Sprint 4 data cleanup script
 * - Remove 16 entries
 * - Split labors.at into 9 Wien locations
 * - Data corrections (websites, phones, prices, booking URLs)
 * - Add missing addresses and phone numbers
 * - Re-sort and re-ID
 * - Export CSV
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const jsonPath = join(__dirname, "..", "public", "data", "providers.json");
const csvPath = join(__dirname, "..", "data", "processed", "provider_review.csv");

const data = JSON.parse(readFileSync(jsonPath, "utf-8"));
let providers = data.providers;

console.log(`Starting with ${providers.length} providers`);

// ═══════════════════════════════════════════════════
// 1. REMOVE ENTRIES
// ═══════════════════════════════════════════════════

const removals = [
  // Duplicates
  "Mein Direktlabor - Labor Freiburg",
  "Mein Direktlabor - Labor Gotha",
  "Mein Direktlabor - Labor Jena",
  "Mein Direktlabor - Labor Stuttgart",
  "Mein Direktlabor - Labor München",
  "Mein Direktlabor - Labor Nürnberg",
  // Wrong category
  "Orthopäde Düsseldorf",
  // Temporary
  "Mein Direktlabor auf der FIBO",
  // Not confirmed self-pay
  "Viollier AG",
  "IMD Labor Frankfurt",
  "Zentrallabor Unimedizin Frankfurt",
  "Medicover Diagnostics München",
  "Synlab München",
  // Website unreachable
  "Lademannbogen",
  "Blackholm",
  "Medilys Hamburg",
];

const beforeCount = providers.length;
providers = providers.filter((p) => {
  const name = p.name.toLowerCase();
  return !removals.some((r) => name.includes(r.toLowerCase()));
});
console.log(`Removed ${beforeCount - providers.length} entries (expected 16)`);

// ═══════════════════════════════════════════════════
// 2. SPLIT labors.at INTO 9 LOCATIONS
// ═══════════════════════════════════════════════════

// Remove the combined entry
providers = providers.filter(
  (p) => !p.name.toLowerCase().includes("labors.at wien (9 standorte)")
);

// Wien district approximate coordinates [lng, lat]
const wienCoords = {
  "1020": [16.3908, 48.2167],
  "1100": [16.3737, 48.1700],
  "1110": [16.4175, 48.1715],
  "1120": [16.3300, 48.1750],
  "1130": [16.2926, 48.1875],
  "1150": [16.3350, 48.1950],
  "1200": [16.3750, 48.2350],
  "1210": [16.3995, 48.2700],
  "1220": [16.4700, 48.2250],
};

const laborsAtLocations = [
  { name: "labors.at Wien 2", street: "Praterstraße 22", postalCode: "1020", phone: "+43 1 260530" },
  { name: "labors.at Wien 10", street: "Favoritenstraße 80", postalCode: "1100", phone: "+43 1 260530" },
  { name: "labors.at Wien 11", street: "Simmeringer Hauptstraße 147", postalCode: "1110", phone: "+43 1 260530" },
  { name: "labors.at Wien 12", street: "Meidlinger Hauptstraße 7-9", postalCode: "1120", phone: "+43 1 260530" },
  { name: "labors.at Wien 13", street: "Hietzinger Kai 131/1.1", postalCode: "1130", phone: "+43 1 260530" },
  { name: "labors.at Wien 15", street: "Meiselstraße 8", postalCode: "1150", phone: "+43 1 260530" },
  { name: "labors.at Wien 20", street: "Leithastraße 19-23", postalCode: "1200", phone: "+43 1 260530" },
  { name: "labors.at Wien 21", street: "Kürschnergasse 6B", postalCode: "1210", phone: "+43 1 260535121" },
  { name: "labors.at Wien 22", street: "Langobardenstraße 103B", postalCode: "1220", phone: "+43 1 260530" },
];

for (const loc of laborsAtLocations) {
  const coords = wienCoords[loc.postalCode] || [16.3738, 48.2082];
  const slug = loc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
  providers.push({
    id: `blut-wien-new-${loc.postalCode}`,
    name: loc.name,
    slug,
    categories: ["blutlabor"],
    address: {
      street: loc.street,
      postalCode: loc.postalCode,
      city: "Wien",
      state: "Wien",
      country: "AT",
    },
    location: {
      type: "Point",
      coordinates: coords,
    },
    contact: {
      phone: loc.phone,
      website: "https://www.labors.at/standorte/",
      email: null,
      bookingUrl: null,
    },
    services: [
      {
        type: "blood_test_self_pay",
        name: "Blutuntersuchung Selbstzahler",
        description: null,
        selfPay: true,
        price: null,
        verification: {
          status: "verified",
          confidence: 0.95,
          date: "2026-03-09",
          method: "llm_recherche",
          notes: null,
        },
      },
    ],
    selfPay: true,
    verified: true,
    source: {
      origin: "llm_recherche",
      primaryUrl: "https://www.labors.at/standorte/",
      collectedAt: new Date().toISOString(),
    },
    tags: ["blutlabor", "selbstzahler", "wien", "österreich"],
  });
}

console.log(`Added 9 labors.at Wien locations`);

// ═══════════════════════════════════════════════════
// 3. DATA CORRECTIONS
// ═══════════════════════════════════════════════════

function findProvider(partialName) {
  return providers.find((p) =>
    p.name.toLowerCase().includes(partialName.toLowerCase())
  );
}

// a) MVZ Medizinisches Labor Hannover
let p = findProvider("MVZ Medizinisches Labor Hannover");
if (p) p.contact.website = "https://www.labor-limbach-hannover.de/";

// b) Mein Direktlabor Mainz phone
p = findProvider("Mein Direktlabor - Labor Mainz");
if (p) p.contact.phone = "+49 6131 5760860";

// c) Labor Berlin Charité
p = findProvider("Labor Berlin");
if (p) p.contact.website = "https://mein.laborberlin.com";

console.log("Applied data corrections");

// ═══════════════════════════════════════════════════
// 4. PRICE: Radiologie Baden
// ═══════════════════════════════════════════════════

p = findProvider("Radiologie Baden");
if (p) {
  const svc = p.services.find((s) => s.type === "dexa_body_composition");
  if (svc) {
    svc.price = { amount: 70, currency: "EUR", note: "€70" };
  }
}

console.log("Added price for Radiologie Baden");

// ═══════════════════════════════════════════════════
// 5. BOOKING URLs
// ═══════════════════════════════════════════════════

const bookingUrls = {
  "Radiologie Baden": "https://www.dzbaden.at/termine-befundabfrage/login-patienten/",
  "Dr. Max Chaimowicz": "https://www.chaimowicz.at/kontakt-ordinationen-termine/",
  "Radiologie Währing": "https://www.radiologiewaehring.at/termin-vereinbaren/",
  "Orthopädie em Veedel": "https://www.doctolib.de/einzelpraxis/koeln/orthopaedie-em-veedel",
  "Orthopädie Köln Widdersdorf": "https://orthopaedie-koeln-widdersdorf.de/wordpress_P/index.php/terminanfrage/",
  "Labor Vidotto": "https://www.labor-vidotto.at/termine/",
  "LAB TO GO": "https://labtogo.ch/termin-buchen-laboranalyse/",
  "Labor 28": "https://www.doctolib.de/labor/berlin/sonic-healthcare-medizinisches-versorgungszentrum-labor-28-gmbh",
  "Labor Dr. Heidrich": "https://www.labor-heidrich.de/fuer-patienten/ihr-labortermin/",
  "Medizinische Laboratorien Düsseldorf": "https://www.doctolib.de/gemeinschaftspraxis/duesseldorf/medizinische-laboratorien-duesseldorf/",
  "Labor Becker München": "https://www.labor-becker.de/termin",
  "Mein Direktlabor Scheeßel": "https://www.doctolib.de/praxis/scheessel/gerlach-jan/",
};

for (const [name, url] of Object.entries(bookingUrls)) {
  p = findProvider(name);
  if (p) {
    p.contact.bookingUrl = url;
  } else {
    console.warn(`  WARNING: Could not find provider: ${name}`);
  }
}

// All remaining Mein Direktlabor / Bioscientia without bookingUrl
providers.forEach((p) => {
  if (
    (p.name.toLowerCase().includes("mein direktlabor") ||
      p.name.toLowerCase().includes("bioscientia")) &&
    !p.contact.bookingUrl
  ) {
    p.contact.bookingUrl = "https://www.meindirektlabor.de/termine/";
  }
});

console.log("Added booking URLs");

// ═══════════════════════════════════════════════════
// 6. MISSING ADDRESSES + PHONE NUMBERS
// ═══════════════════════════════════════════════════

const addressFixes = [
  { match: "Labor Augsburg", street: "August-Wessels-Str. 5", postalCode: "86154", city: "Augsburg", phone: "+49 821 42010" },
  { match: "Bioscientia Berlin-Tiergarten", street: "Lützowstr. 24-26", postalCode: "10785", city: "Berlin", phone: "+49 30 48526136" },
  { match: "Labor 28", street: "Mecklenburgische Str. 28", postalCode: "14197", city: "Berlin", phone: "+49 30 820930" },
  { match: "Mein Direktlabor - Labor Berlin-Marzahn", street: "Mehrower Allee 22", postalCode: "12687", city: "Berlin", phone: "+49 30 48526128" },
  { match: "Labor Bremen", street: "Haferwende 12", postalCode: "28357", city: "Bremen", phone: "+49 421 20720" },
  { match: "Labor Celle", street: "Neumarkt 1", postalCode: "29221", city: "Celle", phone: "+49 5141 92560" },
  { match: "Medizinische Laboratorien Düsseldorf", street: "Nordstraße 44", postalCode: "40477", city: "Düsseldorf", phone: "+49 211 49780" },
  { match: "Bioscientia Labor Freiburg", street: "Berliner Allee 2", postalCode: "79110", city: "Freiburg", phone: "+49 761 40006580" },
  { match: "Mein Direktlabor - Labor Fulda", street: "Gerloser Weg 20", postalCode: "36039", city: "Fulda" },
  { match: "Bioscientia Labor Mittelhessen", street: "Rudolf-Diesel-Str. 4", postalCode: "35394", city: "Gießen", phone: "+49 641 300210" },
  { match: "Bioscientia Labor Gotha", street: "Huttenstraße 7", postalCode: "99867", city: "Gotha", phone: "+49 3641 401412" },
  { match: "Mein Direktlabor - Labor Hamburg-Nord", street: "Essener Str. 110", postalCode: "22419", city: "Hamburg" },
  { match: "Mein Direktlabor - Labor Stephansplatz", street: "Stephansplatz 3", postalCode: "20354", city: "Hamburg" },
  { match: "Bioscientia Labor Jena", street: "Löbstedter Str. 93", postalCode: "07749", city: "Jena", phone: "+49 3641 401320" },
  { match: "Mein Direktlabor - Labor Karlsruhe", street: "Am Rüppurrer Schloß 1", postalCode: "76199", city: "Karlsruhe" },
  { match: "Mein Direktlabor - Labor Ingelheim", street: "Konrad-Adenauer-Str. 17", postalCode: "55218", city: "Ingelheim am Rhein" },
  { match: "KiELab", street: "Dreiecksplatz 11", postalCode: "24103", city: "Kiel" },
  { match: "Bioscientia Labor Stuttgart", street: "Leinfelder Str. 60", postalCode: "70771", city: "Leinfelden-Echterdingen", phone: "+49 711 652243350" },
  { match: "Mein Direktlabor - Labor Mainz", street: "Wallstraße 3-5", postalCode: "55122", city: "Mainz" },
  { match: "Labor Staber München", street: "Paul-Wassermann-Str. 1", postalCode: "81829", city: "München", phone: "+49 89 630238980" },
  { match: "Labor Staber Nürnberg", street: "Deutschherrnstr. 15-19", postalCode: "90429", city: "Nürnberg", phone: "+49 911 9447076" },
  { match: "Mein Direktlabor - Labor Oldenburg", street: "Koppelstraße 1", postalCode: "26135", city: "Oldenburg" },
  { match: "Mein Direktlabor Scheeßel", street: "Am Meyerhof 7", postalCode: "27383", city: "Scheeßel", phone: "+49 4263 9859780" },
  { match: "Mein Direktlabor - Labor Saar", street: "Otto-Kaiser-Str. 8a", postalCode: "66386", city: "St. Ingbert" },
  { match: "Mein Direktlabor Sylt", street: "Dr.-Nicolas-Straße 3", postalCode: "25980", city: "Westerland", phone: "+49 4651 8899777" },
  { match: "Mein Direktlabor bei der WoGe", street: "Von-Steuben-Str. 17", postalCode: "67549", city: "Worms", phone: "+49 6241 977090" },
  { match: "A-Labs Switzerland", street: "Kilchbergstrasse 6", postalCode: "8134", city: "Adliswil", phone: "+41 44 442 00 09" },
];

let addressUpdates = 0;
for (const fix of addressFixes) {
  p = findProvider(fix.match);
  if (p) {
    if (fix.street) p.address.street = fix.street;
    if (fix.postalCode) p.address.postalCode = fix.postalCode;
    if (fix.city) p.address.city = fix.city;
    if (fix.phone) p.contact.phone = fix.phone;
    addressUpdates++;
  } else {
    console.warn(`  WARNING: Could not find provider for address fix: ${fix.match}`);
  }
}

console.log(`Updated addresses/phones for ${addressUpdates} providers`);

// ═══════════════════════════════════════════════════
// 8. RE-SORT AND RE-ID
// ═══════════════════════════════════════════════════

const countryOrder = { AT: 0, CH: 1, DE: 2 };
const categoryOrder = (p) =>
  p.categories.includes("dexa_body_composition") ? 0 : 1;

providers.sort((a, b) => {
  // First by category (DEXA first, then Blutlabor)
  const catDiff = categoryOrder(a) - categoryOrder(b);
  if (catDiff !== 0) return catDiff;
  // Then by country
  const countryDiff =
    (countryOrder[a.address.country] ?? 99) -
    (countryOrder[b.address.country] ?? 99);
  if (countryDiff !== 0) return countryDiff;
  // Then by city
  return a.address.city.localeCompare(b.address.city, "de");
});

// Assign new IDs
const idCounters = {
  "dexa-AT": 0,
  "dexa-CH": 0,
  "dexa-DE": 0,
  "blut-AT": 0,
  "blut-CH": 0,
  "blut-DE": 0,
};

providers.forEach((p) => {
  const prefix = p.categories.includes("dexa_body_composition")
    ? "dexa"
    : "blut";
  const country = p.address.country.toLowerCase();
  const key = `${prefix}-${p.address.country}`;
  idCounters[key] = (idCounters[key] || 0) + 1;
  const num = String(idCounters[key]).padStart(3, "0");
  p.id = `${prefix}-${country}-${num}`;
});

console.log(`Re-sorted and assigned new IDs`);

// Update meta
data.meta.totalCount = providers.length;
data.meta.generatedAt = new Date().toISOString();
data.providers = providers;

// Write JSON
writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
console.log(`Wrote ${providers.length} providers to providers.json`);

// ═══════════════════════════════════════════════════
// EXPORT CSV
// ═══════════════════════════════════════════════════

const BOM = "\uFEFF";
const headers = [
  "id",
  "name",
  "categories",
  "street",
  "postalCode",
  "city",
  "country",
  "phone",
  "website",
  "bookingUrl",
  "price",
  "currency",
  "verified",
  "selfPay",
];

const csvLines = [headers.join(";")];
for (const p of providers) {
  const price =
    p.services[0]?.price?.amount != null ? p.services[0].price.amount : "";
  const currency = p.services[0]?.price?.currency || "";
  const row = [
    p.id,
    p.name,
    p.categories.join(","),
    p.address.street || "",
    p.address.postalCode || "",
    p.address.city || "",
    p.address.country || "",
    p.contact.phone || "",
    p.contact.website || "",
    p.contact.bookingUrl || "",
    price,
    currency,
    p.verified ? "ja" : "nein",
    p.selfPay ? "ja" : "nein",
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
  csvLines.push(row.join(";"));
}

writeFileSync(csvPath, BOM + csvLines.join("\n") + "\n", "utf-8");
console.log(`Wrote CSV to ${csvPath}`);

// ═══════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════

const total = providers.length;
const dexaAT = providers.filter(
  (p) => p.categories.includes("dexa_body_composition") && p.address.country === "AT"
).length;
const dexaCH = providers.filter(
  (p) => p.categories.includes("dexa_body_composition") && p.address.country === "CH"
).length;
const dexaDE = providers.filter(
  (p) => p.categories.includes("dexa_body_composition") && p.address.country === "DE"
).length;
const blutAT = providers.filter(
  (p) => p.categories.includes("blutlabor") && p.address.country === "AT"
).length;
const blutCH = providers.filter(
  (p) => p.categories.includes("blutlabor") && p.address.country === "CH"
).length;
const blutDE = providers.filter(
  (p) => p.categories.includes("blutlabor") && p.address.country === "DE"
).length;
const verified = providers.filter((p) => p.verified).length;
const withPrice = providers.filter((p) =>
  p.services.some((s) => s.price?.amount)
).length;
const withAddress = providers.filter((p) => p.address.street).length;
const withPhone = providers.filter((p) => p.contact.phone).length;
const withBooking = providers.filter((p) => p.contact.bookingUrl).length;

console.log("\n═══ FINAL STATISTICS ═══");
console.log(`Gesamt: ${total}`);
console.log(`DEXA Body Comp: AT=${dexaAT}, CH=${dexaCH}, DE=${dexaDE} (${dexaAT + dexaCH + dexaDE} total)`);
console.log(`Blutlabor: AT=${blutAT}, CH=${blutCH}, DE=${blutDE} (${blutAT + blutCH + blutDE} total)`);
console.log(`Verified: ${verified}/${total} (${((verified / total) * 100).toFixed(1)}%)`);
console.log(`Mit Preis: ${withPrice}/${total} (${((withPrice / total) * 100).toFixed(1)}%)`);
console.log(`Mit Adresse: ${withAddress}/${total} (${((withAddress / total) * 100).toFixed(1)}%)`);
console.log(`Mit Telefon: ${withPhone}/${total} (${((withPhone / total) * 100).toFixed(1)}%)`);
console.log(`Mit bookingUrl: ${withBooking}/${total} (${((withBooking / total) * 100).toFixed(1)}%)`);
