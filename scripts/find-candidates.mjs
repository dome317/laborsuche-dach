import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const classified = JSON.parse(readFileSync(join(__dirname, "..", "data", "processed", "classified.json"), "utf-8"));
const providers = JSON.parse(readFileSync(join(__dirname, "..", "public", "data", "providers.json"), "utf-8"));

// Extract domains from providers.json for dedup
function extractDomain(url) {
  if (!url) return null;
  try {
    return new URL(url.startsWith("http") ? url : "https://" + url).hostname.replace(/^www\./, "");
  } catch { return null; }
}

const existingDomains = new Set();
providers.providers.forEach(p => {
  [p.contact.website, p.contact.bookingUrl, p.source?.primaryUrl].forEach(u => {
    const d = extractDomain(u);
    if (d) existingDomains.add(d);
  });
});

// Also match by name (lowercased)
const existingNames = new Set(providers.providers.map(p => p.name.toLowerCase().trim()));

// Determine category + best score for each entry
function getCategory(e) {
  const svcs = (e.classified_services || []).map(s => s.type || s);
  if (svcs.includes("dexa_body_composition")) return "body_comp";
  if (svcs.includes("dexa_bone_density")) return "bone_only";
  if (svcs.includes("blood_test_self_pay")) return "blut";
  // Fallback to scores
  const bc = e.body_comp_score || 0;
  const bd = e.bone_density_score || 0;
  const bl = e.blut_score || 0;
  if (bc >= bd && bc >= bl) return "body_comp";
  if (bd >= bc && bd >= bl) return "bone_only";
  return "blut";
}

function getBestScore(e) {
  return Math.max(e.body_comp_score || 0, e.bone_density_score || 0, e.blut_score || 0);
}

// Filter candidates
const candidates = [];
for (const e of classified) {
  const name = (e.raw_name || "").trim();
  const city = (e.raw_city || "").trim();
  const website = (e.raw_website || "").trim();

  // Must have name, city, website
  if (!name || !city || !website) continue;

  const score = getBestScore(e);
  const source = e.source_type || "";

  // Score >= 3 OR apify source with website+city
  if (score < 3 && source !== "apify") continue;

  // Not already in providers.json
  const domain = extractDomain(website);
  if (domain && existingDomains.has(domain)) continue;
  if (existingNames.has(name.toLowerCase())) continue;

  // Determine why it was filtered
  const reasons = [];
  const cat = getCategory(e);

  if (cat === "body_comp" && score < 5) reasons.push(`Score ${score} < 5`);
  else if (cat === "bone_only" && score < 7) reasons.push(`Score ${score} < 7`);
  else if (cat === "blut" && score < 5) reasons.push(`Score ${score} < 5`);

  if (!e.raw_lat || !e.raw_lng) reasons.push("Keine Koordinaten");
  if (!e.raw_phone) reasons.push("Kein Telefon");
  if (!e.raw_address) reasons.push("Keine Adresse");
  if (e.classification_status === "needs_review") reasons.push("Needs review");

  if (reasons.length === 0) reasons.push("Unbekannt");

  candidates.push({
    name,
    city,
    country: (e.raw_country || "DE").toUpperCase(),
    category: cat,
    score,
    website,
    reasons: reasons.join("; "),
    bodyComp: e.body_comp_score || 0,
    boneDensity: e.bone_density_score || 0,
    blut: e.blut_score || 0,
  });
}

// Deduplicate by domain
const seenDomains = new Set();
const deduped = [];
for (const c of candidates) {
  const d = extractDomain(c.website);
  if (d && seenDomains.has(d)) continue;
  if (d) seenDomains.add(d);
  deduped.push(c);
}

// Sort by score descending
deduped.sort((a, b) => b.score - a.score);

// Limit to 40
const top = deduped.slice(0, 40);

// Print table
console.log("Nr | Name | Stadt | Land | Kategorie | Score | Website | Warum rausgefiltert");
console.log("---|------|-------|------|-----------|-------|---------|-------------------");
top.forEach((c, i) => {
  console.log(`${i + 1} | ${c.name} | ${c.city} | ${c.country} | ${c.category} | ${c.score} | ${c.website} | ${c.reasons}`);
});

console.log(`\nGesamt Kandidaten: ${deduped.length} (davon Top 40 angezeigt)`);

// Export CSV
const BOM = "\uFEFF";
const headers = ["Nr", "Name", "Stadt", "Land", "Kategorie", "Score", "BodyComp", "BoneDensity", "Blut", "Website", "Warum rausgefiltert"];
const csvLines = [headers.join(";")];
top.forEach((c, i) => {
  const row = [
    i + 1, c.name, c.city, c.country, c.category, c.score,
    c.bodyComp, c.boneDensity, c.blut, c.website, c.reasons,
  ].map(v => '"' + String(v).replace(/"/g, '""') + '"');
  csvLines.push(row.join(";"));
});

const csvPath = join(__dirname, "..", "data", "processed", "candidates_review.csv");
writeFileSync(csvPath, BOM + csvLines.join("\n") + "\n", "utf-8");
console.log(`\nCSV exportiert: ${csvPath}`);
