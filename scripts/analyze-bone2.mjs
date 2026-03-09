import { readFileSync } from "fs";
const d = JSON.parse(readFileSync("data/processed/classified.json", "utf-8"));

const boneOnly = d.filter(e => {
  const svcs = (e.classified_services || []).map(s => s.type || s);
  return svcs.includes("dexa_bone_density") && !svcs.includes("dexa_body_composition");
});

// Top 10 by score, show website_text length and service_page_text length
const sorted = [...boneOnly].sort((a, b) => (b.bone_density_score || 0) - (a.bone_density_score || 0));
console.log("Top 15 bone-only by score:");
sorted.slice(0, 15).forEach(e => {
  const wtLen = (e.website_text || "").length;
  const spLen = (e.service_page_text || "").length;
  console.log(`  score:${e.bone_density_score} | ${e.raw_name} | ${e.raw_city}, ${e.raw_country} | web:${e.raw_website ? "yes" : "no"} | phone:${e.raw_phone ? "yes" : "no"} | wt:${wtLen} | spt:${spLen} | addr:${e.raw_address || "none"}`);
});

// Without keyword filter - just score >= 7, coords, website, phone
const noKw = boneOnly.filter(e =>
  e.bone_density_score >= 7 &&
  e.raw_lat && e.raw_lng &&
  e.raw_website &&
  e.raw_phone
);
console.log(`\nWithout keyword filter (score>=7, coords, web, phone): ${noKw.length}`);
noKw.forEach((e, i) => {
  console.log(`  ${i + 1}. score:${e.bone_density_score} | ${e.raw_name} | ${e.raw_city}, ${e.raw_country} | ${e.raw_website}`);
});

// score >= 6
const s6 = boneOnly.filter(e =>
  e.bone_density_score >= 6 &&
  e.raw_lat && e.raw_lng &&
  e.raw_website &&
  e.raw_phone
);
console.log(`\nScore>=6, coords, web, phone: ${s6.length}`);
s6.slice(0, 10).forEach((e, i) => {
  console.log(`  ${i + 1}. score:${e.bone_density_score} | ${e.raw_name} | ${e.raw_city}, ${e.raw_country} | ${e.raw_website}`);
});

// score >= 4 with all fields
const s4 = boneOnly.filter(e =>
  e.bone_density_score >= 4 &&
  e.raw_lat && e.raw_lng &&
  e.raw_website &&
  e.raw_phone &&
  e.raw_address
);
console.log(`\nScore>=4, all fields (incl address): ${s4.length}`);
s4.slice(0, 10).forEach((e, i) => {
  console.log(`  ${i + 1}. score:${e.bone_density_score} | ${e.raw_name} | ${e.raw_city}, ${e.raw_country} | ${e.raw_website} | ${e.raw_address}`);
});
