const assert = require("assert");
const fs = require("fs");

console.log("🧪 Test Suite: Sellers Directory & Guide Validation");

// Test 1: data/sellers-directory.json exists and is valid
const data = JSON.parse(fs.readFileSync("data/sellers-directory.json", "utf8"));
assert(Array.isArray(data.brands), "brands must be an array");
assert(Array.isArray(data.sellers), "sellers must be an array");
assert(data.brands.length >= 130, `Expected >= 130 brands, got ${data.brands.length}`);
assert(data.sellers.length >= 130, `Expected >= 130 sellers, got ${data.sellers.length}`);
console.log(`  ✅ Dati directory validi: ${data.brands.length} brand e ${data.sellers.length} seller.`);

// Test 2: Check sellers fields
for (const s of data.sellers) {
  assert(s.id, `Seller missing id: ${JSON.stringify(s)}`);
  assert(s.name, `Seller missing name: ${JSON.stringify(s)}`);
  assert(s.officialUrl, `Seller missing officialUrl: ${s.name}`);
  assert(Array.isArray(s.brands), `Seller brands must be array: ${s.name}`);
  assert(s.category, `Seller missing category: ${s.name}`);
  assert(s.specialty, `Seller missing specialty: ${s.name}`);
}
console.log("  ✅ Tutti i seller hanno campi obbligatori (id, name, officialUrl, brands, category, specialty).");

// Test 3: Check brands fields
for (const b of data.brands) {
  assert(b.id, `Brand missing id: ${JSON.stringify(b)}`);
  assert(b.name, `Brand missing name: ${JSON.stringify(b)}`);
  assert(b.cover, `Brand missing cover: ${b.name}`);
  assert(Array.isArray(b.sellers), `Brand sellers must be array: ${b.name}`);
}
console.log("  ✅ Tutti i brand hanno campi obbligatori (id, name, cover, sellers).");

// Test 4: Check key sellers exist
const keySellers = ["yolo66", "wwtop", "husky", "goatofficial", "topgoosey", "scarlett"];
for (const ks of keySellers) {
  const found = data.sellers.find((s) => s.id === ks);
  assert(found, `Key seller ${ks} must exist`);
  assert(found.verified, `Key seller ${ks} must be verified`);
}
console.log("  ✅ Seller chiave (YOLO, WWTOP, Husky, Goat Official, TopGoosey, Scarlett) presenti e verificati.");

// Test 5: Verify guide page and sellers page exist
assert(fs.existsSync("app/guide/page.tsx"), "app/guide/page.tsx must exist");
assert(fs.existsSync("app/sellers/page.tsx"), "app/sellers/page.tsx must exist");
console.log("  ✅ Pagine dedicate /guide e /sellers presenti nel filesystem.");

console.log("🎉 TUTTI I TEST DELLA DIRECTORY E GUIDA SUPERATI CON SUCCESSO!");
