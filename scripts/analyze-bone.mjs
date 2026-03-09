import { readFileSync } from "fs";
const d = JSON.parse(readFileSync("data/processed/classified.json", "utf-8"));

// Find entries with dexa_bone_density service but NOT body_composition
const boneOnly = d.filter(e => {
  const svcs = (e.classified_services || []).map(s => s.type || s);
  return svcs.includes("dexa_bone_density") && !svcs.includes("dexa_body_composition");
});
console.log("Bone-only entries (dexa_bone_density service, no body_comp):", boneOnly.length);

// Score distribution
const scores = {};
boneOnly.forEach(e => { const s = e.bone_density_score || 0; scores[s] = (scores[s] || 0) + 1; });
console.log("bone_density_score distribution:", JSON.stringify(scores));

// Check website_text for keywords
function hasKeywords(e) {
  const text = ((e.website_text || "") + " " + (e.service_page_text || "")).toLowerCase();
  return text.includes("knochendichte") || text.includes("dexa") || text.includes("dxa") || text.includes("osteoporose");
}

// Qualified: score >= 7, coords, website, phone, address, keywords
const qualified = boneOnly.filter(e =>
  e.bone_density_score >= 7 &&
  e.raw_lat && e.raw_lng &&
  e.raw_website &&
  e.raw_phone &&
  e.raw_address &&
  hasKeywords(e)
);
console.log("\nQualified (score>=7, all fields, keywords):", qualified.length);

// Score >= 5 with all fields
const relaxed5 = boneOnly.filter(e =>
  e.bone_density_score >= 5 &&
  e.raw_lat && e.raw_lng &&
  e.raw_website &&
  e.raw_phone &&
  hasKeywords(e)
);
console.log("Relaxed (score>=5, all fields, keywords):", relaxed5.length);

// Score >= 3 with all fields
const relaxed3 = boneOnly.filter(e =>
  e.bone_density_score >= 3 &&
  e.raw_lat && e.raw_lng &&
  e.raw_website &&
  e.raw_phone &&
  hasKeywords(e)
);
console.log("Relaxed (score>=3, all fields, keywords):", relaxed3.length);

// Show 5 examples from qualified
console.log("\n=== EXAMPLES (score >= 7) ===");
qualified.slice(0, 5).forEach(e => {
  console.log(`  Score: ${e.bone_density_score} | ${e.raw_name} | ${e.raw_city} | ${e.raw_website}`);
});

// Show all qualified
console.log("\n=== ALL QUALIFIED (score >= 7) ===");
qualified.forEach((e, i) => {
  console.log(`  ${i + 1}. Score: ${e.bone_density_score} | ${e.raw_name} | ${e.raw_city}, ${e.raw_country} | ${e.raw_website}`);
});

// Also check: among all bone entries (not just bone-only), how many already in providers.json?
const providers = JSON.parse(readFileSync("public/data/providers.json", "utf-8"));
const existingNames = new Set(providers.providers.map(p => p.name.toLowerCase()));

const newOnly = qualified.filter(e => !existingNames.has((e.raw_name || "").toLowerCase()));
console.log(`\nNew (not already in providers.json): ${newOnly.length}`);
newOnly.forEach((e, i) => {
  console.log(`  ${i + 1}. ${e.raw_name} | ${e.raw_city} | ${e.raw_website}`);
});
