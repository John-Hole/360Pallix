import fs from "fs";
import path from "path";
import {
  parseSourceUrl,
  parseCssbuyUrl,
  cssbuyLink,
  doppelfitLink,
  formatDoppelfitLink,
  getProductDoppelfitUrl,
} from "../lib/convert.ts";

const PORT = (process.env.PORT || "3000").trim();
const BASE_URL = `http://localhost:${PORT}`;

async function runDoppelfitTests() {
  console.log("🚀 [VERIFY-DOPPELFIT] Inizio suite di test approfondita per i link Doppelfit...\n");

  // 1. Test unitari sulle utility in lib/convert.ts
  console.log("--- 1. Test Unitari Convertitore ---");
  
  // doppelfitLink
  const dlWeidian = doppelfitLink({ platform: "weidian", itemId: "123456", sourceUrl: "" });
  if (dlWeidian !== "https://doppel.fit/item/weidian/123456?ref=PPnCbrec") {
    throw new Error(`doppelfitLink Weidian errato: ${dlWeidian}`);
  }

  const dl1688 = doppelfitLink({ platform: "1688", itemId: "7891011", sourceUrl: "" });
  if (dl1688 !== "https://doppel.fit/item/1688/7891011?ref=PPnCbrec") {
    throw new Error(`doppelfitLink 1688 errato: ${dl1688}`);
  }

  const dlTaobao = doppelfitLink({ platform: "taobao", itemId: "998877", sourceUrl: "" });
  if (dlTaobao !== "https://doppel.fit/item/taobao/998877?ref=PPnCbrec") {
    throw new Error(`doppelfitLink Taobao errato: ${dlTaobao}`);
  }
  console.log("✅ doppelfitLink genera i link /item/{platform}/{id}?ref=PPnCbrec per tutte le piattaforme.");

  // parseCssbuyUrl
  const pCss = parseCssbuyUrl("https://www.cssbuy.com/shop/goodsDetail?promotionCode=2ab&item-micro-7176276843.html&id=7176276843&type=weidian");
  if (!pCss || pCss.platform !== "weidian" || pCss.itemId !== "7176276843") {
    throw new Error(`parseCssbuyUrl fallito su Weidian: ${JSON.stringify(pCss)}`);
  }
  console.log("✅ parseCssbuyUrl estrae correttamente piattaforma e ID da URL CSSBuy.");

  // formatDoppelfitLink con vari formati
  const fShort = formatDoppelfitLink("x5sUY8JQ");
  if (fShort !== "https://doppel.fit/item/x5sUY8JQ?ref=PPnCbrec") {
    throw new Error(`formatDoppelfitLink short ID fallito: ${fShort}`);
  }

  const fSlash = formatDoppelfitLink("weidian/7176276843");
  if (fSlash !== "https://doppel.fit/item/weidian/7176276843?ref=PPnCbrec") {
    throw new Error(`formatDoppelfitLink platform/id fallito: ${fSlash}`);
  }

  const fCss = formatDoppelfitLink("https://www.cssbuy.com/shop/goodsDetail?promotionCode=2ab&item-1688-895947505115.html&id=895947505115&type=1688");
  if (fCss !== "https://doppel.fit/item/1688/895947505115?ref=PPnCbrec") {
    throw new Error(`formatDoppelfitLink da CSSBuy fallito: ${fCss}`);
  }

  const fFull = formatDoppelfitLink("https://doppel.fit/item/taobao/648802284203");
  if (fFull !== "https://doppel.fit/item/taobao/648802284203?ref=PPnCbrec") {
    throw new Error(`formatDoppelfitLink aggiunta ref fallito: ${fFull}`);
  }
  console.log("✅ formatDoppelfitLink supporta short code, platform/id, CSSBuy URL e aggiunta referral.");

  // getProductDoppelfitUrl
  const prodExplicit = { doppelfitUrl: "https://doppel.fit/item/weidian/111?ref=PPnCbrec" };
  if (getProductDoppelfitUrl(prodExplicit) !== "https://doppel.fit/item/weidian/111?ref=PPnCbrec") {
    throw new Error("getProductDoppelfitUrl esplicito fallito");
  }

  const prodOldHomepage = {
    cssbuyUrl: "https://www.cssbuy.com/shop/goodsDetail?item-1688-895947505115.html&id=895947505115&type=1688",
    doppelfitUrl: "https://doppel.fit/?ref=PPnCbrec",
  };
  if (getProductDoppelfitUrl(prodOldHomepage) !== "https://doppel.fit/item/1688/895947505115?ref=PPnCbrec") {
    throw new Error(`getProductDoppelfitUrl fallback da homepage fallito: ${getProductDoppelfitUrl(prodOldHomepage)}`);
  }
  console.log("✅ getProductDoppelfitUrl corregge i vecchi link alla sola homepage sostituendoli con la scheda specifica dell'articolo.");

  // parseSourceUrl con Doppelfit
  const parsedDoppel = await parseSourceUrl("https://doppel.fit/item/weidian/7176276843?ref=PPnCbrec");
  if (!parsedDoppel || parsedDoppel.platform !== "weidian" || parsedDoppel.itemId !== "7176276843") {
    throw new Error(`parseSourceUrl su Doppelfit fallito: ${JSON.stringify(parsedDoppel)}`);
  }
  console.log("✅ parseSourceUrl riconosce e converte anche i link Doppelfit.");

  // 2. Test integrazione database data/products.json
  console.log("\n--- 2. Verifica Database (data/products.json) ---");
  const rawDb = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "products.json"), "utf8"));
  console.log(`Verifica di ${rawDb.length} prodotti nel catalogo...`);
  for (const p of rawDb) {
    if (!p.doppelfitUrl) {
      throw new Error(`Prodotto ${p.id} non ha doppelfitUrl!`);
    }
    if (p.doppelfitUrl === "https://doppel.fit/?ref=PPnCbrec" || p.doppelfitUrl === "https://doppel.fit") {
      throw new Error(`Prodotto ${p.id} ha ancora il vecchio link generico alla homepage: ${p.doppelfitUrl}`);
    }
    if (!p.doppelfitUrl.startsWith("https://doppel.fit/item/")) {
      throw new Error(`Prodotto ${p.id} ha un link Doppelfit malformato: ${p.doppelfitUrl}`);
    }
    if (!p.doppelfitUrl.includes("ref=PPnCbrec")) {
      throw new Error(`Prodotto ${p.id} non ha il referral PPnCbrec: ${p.doppelfitUrl}`);
    }
  }
  console.log(`✅ Tutti i ${rawDb.length} prodotti in data/products.json hanno un link valido alla scheda /item/{platform}/{id}?ref=PPnCbrec.`);

  // 3. Test API /api/convert via HTTP
  console.log("\n--- 3. Test API Live (/api/convert) ---");
  const testUrls = [
    { type: "Weidian", u: "https://weidian.com/item.html?itemID=7312607074" },
    { type: "Taobao", u: "https://item.taobao.com/item.htm?id=1040635422570" },
    { type: "1688", u: "https://detail.1688.com/offer/903683288896.html" },
    { type: "Doppelfit", u: "https://doppel.fit/item/weidian/7312607074?ref=PPnCbrec" },
  ];
  for (const t of testUrls) {
    const res = await fetch(`${BASE_URL}/api/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: t.u }),
    });
    if (!res.ok) throw new Error(`/api/convert failed for ${t.type}: ${res.status}`);
    const data = await res.json();
    if (!data.cssbuyUrl || !data.cssbuyUrl.includes("promotionCode=2ab90a34eeaa437b")) {
      throw new Error(`Manca link CSSBuy affiliato per ${t.type}`);
    }
    if (!data.doppelfitUrl || !data.doppelfitUrl.startsWith("https://doppel.fit/item/") || !data.doppelfitUrl.includes("ref=PPnCbrec")) {
      throw new Error(`Manca link Doppelfit articolo valido per ${t.type}: ${data.doppelfitUrl}`);
    }
    console.log(`✅ Convertitore per ${t.type}:`);
    console.log(`   CSSBuy:    ${data.cssbuyUrl}`);
    console.log(`   Doppelfit: ${data.doppelfitUrl}`);
  }

  // 4. Test Pagina Articolo Server Component
  console.log("\n--- 4. Test Render Pagina Prodotto (/item/[id]) ---");
  const sampleProduct = rawDb[0];
  const resItem = await fetch(`${BASE_URL}/item/${sampleProduct.id}`);
  if (!resItem.ok) throw new Error(`Fetch /item/${sampleProduct.id} fallito: ${resItem.status}`);
  const html = await resItem.text();
  if (!html.includes(sampleProduct.doppelfitUrl)) {
    throw new Error(`La pagina articolo non contiene il link esatto a Doppelfit: ${sampleProduct.doppelfitUrl}`);
  }
  if (!html.includes("Visualizza su Doppelfit")) {
    throw new Error("Il pulsante 'Visualizza su Doppelfit' non è presente nella pagina articolo");
  }
  console.log(`✅ Scheda '${sampleProduct.id}' renderizza correttamente il pulsante 'Visualizza su Doppelfit' con link '${sampleProduct.doppelfitUrl}'.`);

  console.log("\n🎉 TUTTI I TEST VERIFICA DOPPELFIT SUPERATI CON SUCCESSO AL 100%!");
}

runDoppelfitTests().catch((err) => {
  console.error("❌ Test fallito:", err);
  process.exit(1);
});
