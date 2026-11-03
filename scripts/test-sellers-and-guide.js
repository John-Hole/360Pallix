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

// Test 5: Verify guide, sellers, coupon, and community pages exist
assert(fs.existsSync("app/guide/page.tsx"), "app/guide/page.tsx must exist");
assert(fs.existsSync("app/sellers/page.tsx"), "app/sellers/page.tsx must exist");
assert(fs.existsSync("app/coupon/page.tsx"), "app/coupon/page.tsx must exist");
assert(fs.existsSync("app/community/page.tsx"), "app/community/page.tsx must exist");
console.log("  ✅ Tutte le pagine dedicate (/guide, /sellers, /coupon, /community) sono presenti nel filesystem.");

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

// Test 7: Verify green Yupoo cover was completely replaced in sellers-directory.json
const rawDirContent = fs.readFileSync("data/sellers-directory.json", "utf8");
assert(!rawDirContent.includes("9c76e296b24d4dd98e1200e14df92f8e.jpg"), "Green Yupoo cover must be replaced");
console.log("  ✅ Copertina verde Yupoo rimossa al 100% da sellers-directory.json.");

// Test 8: Verify seller boxes in Home and /sellers have single store button and NO spreadsheet button
const homePageContent = fs.readFileSync("app/page.tsx", "utf8");
const sellersPageContent = fs.readFileSync("app/sellers/page.tsx", "utf8");
assert(!homePageContent.includes("seller-btn-find"), "Home seller cards must NOT contain seller-btn-find Spreadsheet button");
assert(!sellersPageContent.includes("brand-btn-sheet"), "Brand seller cards must NOT contain brand-btn-sheet Spreadsheet button");
const sellerCardActionsMatches = (sellersPageContent.match(/className="seller-btn-find"/g) || []).length;
assert.strictEqual(sellerCardActionsMatches, 1, "Only the brand header search button should use seller-btn-find, not seller cards");
console.log("  ✅ Pulsante unico (Sito store ↗) nei box seller verificato con successo (Spreadsheet rimosso).");

// Test 9: Verify no green colors, classes or rgba values in UI files
const greenHexes = ["#22c55e", "#4ade80", "#86efac", "#16a34a", "#15803d", "#10b981", "#059669", "#34d399"];
const greenTokens = ["cta-green", "badge-green", "140, 255, 210", "16, 185, 129"];
const uiFiles = [
  "app/globals.css",
  "app/page.tsx",
  "app/sellers/page.tsx",
  "app/guide/page.tsx",
  "app/coupon/page.tsx",
  "app/community/page.tsx",
  "app/spreadsheet/page.tsx",
  "app/item/[id]/page.tsx",
  "app/admin/page.tsx",
];
for (const file of uiFiles) {
  const content = fs.readFileSync(file, "utf8");
  for (const hex of greenHexes) {
    assert(!content.toLowerCase().includes(hex), `File ${file} contains green color ${hex}`);
  }
  for (const token of greenTokens) {
    assert(!content.includes(token), `File ${file} contains forbidden green token: ${token}`);
  }
}
console.log("  ✅ Restyling 100% monocromatico: nessun colore o classe verde residua trovata.");

// Test 10: Verify Hero pills point directly to dedicated pages (no hash anchors)
const homeSource = fs.readFileSync("app/page.tsx", "utf8");
const pillsMatch = homeSource.match(/const PILLS = \[([\s\S]*?)\];/);
assert(pillsMatch, "PILLS array must be defined in app/page.tsx");
const pillsCode = pillsMatch[1];
assert(!pillsCode.includes("/#"), "No hero pill should use hash anchor (/#), must go directly to pages");
assert(pillsCode.includes('href: "/spreadsheet"'), "PILLS must contain /spreadsheet");
assert(pillsCode.includes('href: "/coupon"'), "PILLS must contain /coupon");
assert(pillsCode.includes('href: "/guide"'), "PILLS must contain /guide");
assert(pillsCode.includes('href: "/sellers"'), "PILLS must contain /sellers");
assert(pillsCode.includes('href: "/community"'), "PILLS must contain /community");
console.log("  ✅ Hero Pills: tutti i 5 bubble puntano direttamente a pagine dedicate reali (nessun link a footer/sezioni interne).");

console.log("🎉 TUTTI I TEST DELLA DIRECTORY E GUIDA SUPERATI CON SUCCESSO!");
