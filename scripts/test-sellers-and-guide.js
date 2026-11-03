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
  assert(b.sellers.length > 0, `Brand ${b.name} must have at least 1 seller (got 0)`);
  assert(b.sellersCount > 0, `Brand ${b.name} sellersCount must be > 0`);
}
console.log("  ✅ Tutti i brand hanno campi obbligatori e almeno un seller verificato.");

// Test 4: Check key sellers exist and have correct categories
const keySellers = ["yolo66", "wwtop", "husky", "goatofficial", "topgoosey", "scarlett"];
for (const ks of keySellers) {
  const found = data.sellers.find((s) => s.id === ks);
  assert(found, `Key seller ${ks} must exist`);
  assert(found.verified, `Key seller ${ks} must be verified`);
}
const scarlett = data.sellers.find((s) => s.id === "scarlett");
assert.strictEqual(scarlett.category, "Borse & Pelletteria", "Scarlett category must be 'Borse & Pelletteria'");
console.log("  ✅ Seller chiave (YOLO, WWTOP, Husky, Goat Official, TopGoosey, Scarlett) presenti e categorie verificate.");

// Test 5: Verify guide page and sellers page exist
assert(fs.existsSync("app/guide/page.tsx"), "app/guide/page.tsx must exist");
assert(fs.existsSync("app/sellers/page.tsx"), "app/sellers/page.tsx must exist");
console.log("  ✅ Pagine dedicate /guide e /sellers presenti nel filesystem.");

// Test 6: Verify Spreadsheet search matching logic against products.json
const products = JSON.parse(fs.readFileSync("data/products.json", "utf8"));
function matchProduct(p, q) {
  const qTrim = q.trim().toLowerCase();
  const qNorm = qTrim.replace(/[^a-z0-9]/g, "");
  const qTokens = qTrim ? qTrim.split(/\s+/).filter(Boolean) : [];
  const title = (p.title || "").toLowerCase();
  const sellerStr = (p.seller || "").toLowerCase();
  const brandStr = (p.brand || "").toLowerCase();
  const catStr = (p.category || "").toLowerCase();
  const haystack = `${title} ${sellerStr} ${brandStr} ${catStr}`;
  const haystackNorm = haystack.replace(/[^a-z0-9]/g, "");

  const directMatch = haystack.includes(qTrim);
  const tokensMatch = qTokens.length > 1 && qTokens.every((token) => haystack.includes(token));
  const normMatch = qNorm.length >= 3 && haystackNorm.includes(qNorm);
  const sellerTokens = sellerStr.split(/\s+/).filter(Boolean);
  const sellerMatch =
    sellerTokens.length > 0 && qNorm.length >= 3 && sellerTokens.every((t) => qNorm.includes(t));

  return directMatch || tokensMatch || normMatch || sellerMatch;
}

const testQueries = ["Nike", "Ralph Lauren", "Corteiz", "YOLO", "Jersey Aaaa", "AAAAJersey", "CND ISLAND"];
for (const query of testQueries) {
  const matched = products.filter((p) => matchProduct(p, query));
  assert(matched.length > 0, `Search query "${query}" should match at least one product, matched ${matched.length}`);
}
console.log("  ✅ Simulazione ricerca Spreadsheet: query per brand e seller chiave producono risultati accurati.");

console.log("🎉 TUTTI I TEST DELLA DIRECTORY E GUIDA SUPERATI CON SUCCESSO!");
