import { readFileSync, writeFileSync } from "fs";
const path = "public/data/providers.json";
const d = JSON.parse(readFileSync(path, "utf-8"));

// German area codes: 2-5 digits after +49. Major cities have short codes.
const de2 = ["30","40","69","89"]; // Berlin, Hamburg, Frankfurt, München
const de3 = ["201","202","203","208","209","211","212","221","228","231","234","241",
  "251","261","271","281","291","341","345","351","361","365","371","375","381","385",
  "391","395","421","431","441","451","461","471","481","511","521","531","541","551",
  "561","571","581","611","621","631","641","651","661","671","681","711","721","731",
  "741","751","761","771","781","791","821","831","841","851","861","871","881","891",
  "901","906","911","921","931","941","951","961","971","981","991"];
const de4 = ["2151","2161","2171","2191","2202","2203","2204","2241","2251","2261",
  "2302","2303","2304","2305","2306","2307","2331","2332","2333","2336","2351","2361",
  "2365","2371","2381","2382","2383","2389","2403","2404","2405","3520","3521","3522",
  "3523","3588","4043","4054","4076","4053","4097","4040","4263","4651","5141","5371",
  "6131","6132","6241","6721","6861","6894","7243","7472","9113","9447"];

function formatDE(raw) {
  const digits = raw.slice(3); // after +49
  // Try 2-digit area codes first
  for (const ac of de2) {
    if (digits.startsWith(ac)) {
      return `+49 ${ac} ${digits.slice(ac.length)}`;
    }
  }
  // Try 4-digit
  for (const ac of de4) {
    if (digits.startsWith(ac)) {
      return `+49 ${ac} ${digits.slice(ac.length)}`;
    }
  }
  // Try 3-digit
  for (const ac of de3) {
    if (digits.startsWith(ac)) {
      return `+49 ${ac} ${digits.slice(ac.length)}`;
    }
  }
  // Fallback: guess 4-digit area code
  if (digits.length >= 8) {
    return `+49 ${digits.slice(0, 4)} ${digits.slice(4)}`;
  }
  return `+49 ${digits}`;
}

function formatAT(raw) {
  const digits = raw.slice(3); // after +43
  // Wien = 1, Graz = 316, Linz = 732, etc.
  if (digits.startsWith("1")) return `+43 1 ${digits.slice(1)}`;
  // 4-digit area codes
  const at4 = ["5375","7472","2252","3462","3687","7323"];
  for (const ac of at4) {
    if (digits.startsWith(ac)) return `+43 ${ac} ${digits.slice(ac.length)}`;
  }
  // 3-digit area codes
  const at3 = ["316","512","662","732","463","352","676","660","664","680","699"];
  for (const ac of at3) {
    if (digits.startsWith(ac)) return `+43 ${ac} ${digits.slice(ac.length)}`;
  }
  // Fallback: 4-digit
  if (digits.length >= 8) return `+43 ${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `+43 ${digits}`;
}

function formatCH(raw) {
  const digits = raw.slice(3); // after +41
  // Swiss: 2-digit area code (21-91) or mobile (76-79)
  return `+41 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`.replace(/\s+$/, "");
}

let fixed = 0;
d.providers.forEach(p => {
  const ph = p.contact.phone;
  if (!ph || ph.includes(" ")) return;

  let formatted;
  if (ph.startsWith("+49")) formatted = formatDE(ph);
  else if (ph.startsWith("+43")) formatted = formatAT(ph);
  else if (ph.startsWith("+41")) formatted = formatCH(ph);
  else return;

  if (formatted !== ph) {
    console.log(`  ${ph} → ${formatted}`);
    p.contact.phone = formatted;
    fixed++;
  }
});

writeFileSync(path, JSON.stringify(d, null, 2) + "\n");
console.log(`\nFixed ${fixed} phone numbers`);
