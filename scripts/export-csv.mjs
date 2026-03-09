import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dirname, "..", "public", "data", "providers.json"), "utf-8"));
const BOM = "\uFEFF";
const h = ["id","name","categories","street","postalCode","city","state","country","phone","website","bookingUrl","price","currency","verified","selfPay"];
const lines = [h.join(";")];
for (const p of data.providers) {
  const price = p.services[0]?.price?.amount != null ? p.services[0].price.amount : "";
  const cur = p.services[0]?.price?.currency || "";
  const row = [p.id,p.name,p.categories.join(","),p.address.street||"",p.address.postalCode||"",p.address.city||"",p.address.state||"",p.address.country||"",p.contact.phone||"",p.contact.website||"",p.contact.bookingUrl||"",price,cur,p.verified?"ja":"nein",p.selfPay?"ja":"nein"].map(v=>'"'+String(v).replace(/"/g,'""')+'"');
  lines.push(row.join(";"));
}
writeFileSync(join(__dirname, "..", "data", "processed", "provider_review.csv"), BOM + lines.join("\n") + "\n", "utf-8");
console.log("CSV updated");
