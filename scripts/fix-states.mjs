/**
 * Fix state fields and missing postal codes
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const jsonPath = join(__dirname, "..", "public", "data", "providers.json");
const data = JSON.parse(readFileSync(jsonPath, "utf-8"));

// Correct state mappings: city → Bundesland/Kanton
const stateMap = {
  // AT
  Amstetten: "Niederösterreich",
  "Baden bei Wien": "Niederösterreich",
  Deutschlandsberg: "Steiermark",
  Graz: "Steiermark",
  Kössen: "Tirol",
  Linz: "Oberösterreich",
  Schladming: "Steiermark",
  Wien: "Wien",
  // CH
  Zürich: "Zürich",
  Adliswil: "Zürich",
  // DE
  Augsburg: "Bayern",
  Bayreuth: "Bayern",
  Berlin: "Berlin",
  Bremen: "Bremen",
  Celle: "Niedersachsen",
  Düsseldorf: "Nordrhein-Westfalen",
  Freiburg: "Baden-Württemberg",
  Fulda: "Hessen",
  Gießen: "Hessen",
  Gotha: "Thüringen",
  Hamburg: "Hamburg",
  Hannover: "Niedersachsen",
  Heikendorf: "Schleswig-Holstein",
  "Ingelheim am Rhein": "Rheinland-Pfalz",
  Jena: "Thüringen",
  Karlsruhe: "Baden-Württemberg",
  Kiel: "Schleswig-Holstein",
  Klipphausen: "Sachsen",
  Köln: "Nordrhein-Westfalen",
  "Leinfelden-Echterdingen": "Baden-Württemberg",
  Mainz: "Rheinland-Pfalz",
  München: "Bayern",
  Nürnberg: "Bayern",
  Oldenburg: "Niedersachsen",
  Scheeßel: "Niedersachsen",
  "St. Ingbert": "Saarland",
  Westerland: "Schleswig-Holstein",
  Worms: "Rheinland-Pfalz",
};

// Missing postal codes
const plzMap = {
  "Mein Direktlabor - Labor Bayreuth": "95444",
  "Labor Berlin - Charité Vivantes GmbH": "13353",
  "MDI Limbach Berlin GmbH": "13086",
  "Labor Dr. Heidrich & Kollegen MVZ GmbH": "22767",
  "MVZ Medizinisches Labor Hannover GmbH": "30169",
  "Mein Direktlabor - Labor Kiel": "24226",
  "Mein Direktlabor - Labor Klipphausen": "01665",
  "Labor Dr. Quade & Kollegen": "50937",
  "Mein Direktlabor - Labor Köln": "50670",
  "MVZ GANZIMMUN GmbH - Arztpraxis": "55116",
};

// Missing streets
const streetMap = {
  "Labor Dr. Quade & Kollegen": "Militärringstraße 61",
};

// Missing addresses for entries that have no street
const addressMap = {
  "Mein Direktlabor - Labor Bayreuth": { street: "Schulstraße 17", postalCode: "95444", city: "Bayreuth" },
  "Labor Berlin - Charité Vivantes GmbH": { street: "Sylter Str. 2", postalCode: "13353", city: "Berlin" },
  "MDI Limbach Berlin GmbH": { street: "Aroser Allee 68-72", postalCode: "13086", city: "Berlin" },
  "Labor Dr. Heidrich & Kollegen MVZ GmbH": { street: "Stresemannstraße 20", postalCode: "22767", city: "Hamburg" },
  "MVZ Medizinisches Labor Hannover GmbH": { street: "Scharnhorststr. 1", postalCode: "30169", city: "Hannover" },
  "Mein Direktlabor - Labor Kiel": { street: "Dorfstr. 4", postalCode: "24226", city: "Heikendorf" },
  "Mein Direktlabor - Labor Köln": { street: "Dasselstr. 75", postalCode: "50670", city: "Köln" },
  "MVZ GANZIMMUN GmbH - Arztpraxis": { street: "Hans-Böckler-Str. 109", postalCode: "55116", city: "Mainz" },
};

let stateFixed = 0;
let plzFixed = 0;
let streetFixed = 0;

data.providers.forEach((p) => {
  // Fix states
  const correctState = stateMap[p.address.city];
  if (correctState && p.address.state !== correctState) {
    p.address.state = correctState;
    stateFixed++;
  }

  // Fix missing PLZ
  if (!p.address.postalCode || p.address.postalCode === "") {
    const plz = plzMap[p.name];
    if (plz) {
      p.address.postalCode = plz;
      plzFixed++;
    }
  }

  // Fix missing streets
  if (!p.address.street || p.address.street === "") {
    const street = streetMap[p.name];
    if (street) {
      p.address.street = street;
      streetFixed++;
    }
  }

  // Fix full address entries
  const addrFix = addressMap[p.name];
  if (addrFix) {
    if (!p.address.street || p.address.street === "") p.address.street = addrFix.street;
    if (!p.address.postalCode || p.address.postalCode === "") p.address.postalCode = addrFix.postalCode;
  }
});

console.log(`States fixed: ${stateFixed}`);
console.log(`PLZ fixed: ${plzFixed}`);
console.log(`Streets fixed: ${streetFixed}`);

writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
console.log("Done.");

// Verify
const remaining = data.providers.filter(p => !p.address.postalCode || p.address.postalCode === "");
if (remaining.length) {
  console.log("\nStill missing PLZ:");
  remaining.forEach(p => console.log(`  ${p.name} | ${p.address.city}`));
}
const badStates = data.providers.filter(p => p.address.state === p.address.city && p.address.city !== "Wien" && p.address.city !== "Berlin" && p.address.city !== "Hamburg" && p.address.city !== "Bremen");
if (badStates.length) {
  console.log("\nStill state=city:");
  badStates.forEach(p => console.log(`  ${p.name} | city: ${p.address.city} | state: ${p.address.state}`));
}
