const fs = require("fs");
const path = require("path");

let rawData = null;
const brainPath1 = "/home/buco-py/.gemini/antigravity-cli/brain/f325dcc4-486e-4917-8e5e-d9c8400ddf2d/.system_generated/steps/20/content.md";
if (fs.existsSync(brainPath1)) {
  const content = fs.readFileSync(brainPath1, "utf8");
  const scripts = [...content.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
  if (scripts[13]) {
    const s13 = scripts[13][1];
    const parsed = eval(s13.replace(/^self\.__next_f\.push\(/, "").replace(/\)$/, ""));
    const str = parsed[1];
    const brandIdx = str.indexOf('{"brands":');
    let depth = 0;
    let endIdx = -1;
    for (let i = brandIdx; i < str.length; i++) {
      if (str[i] === "{") depth++;
      else if (str[i] === "}") {
        depth--;
        if (depth === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }
    rawData = JSON.parse(str.slice(brandIdx, endIdx));
  }
}

if (!rawData && fs.existsSync("data/sellers-directory.json")) {
  rawData = JSON.parse(fs.readFileSync("data/sellers-directory.json", "utf8"));
}

function resolveRef(val, root) {
  if (typeof val === "string" && val.startsWith("$d:props:")) {
    const p = val.slice("$d:props:".length).split(":");
    let cur = root;
    for (const key of p) {
      if (cur === undefined) break;
      cur = cur[key];
    }
    return cur;
  }
  return val;
}

function deepResolve(obj, root) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      let v = obj[i];
      if (typeof v === "string" && v.startsWith("$d:props:")) {
        obj[i] = resolveRef(v, root);
      }
      deepResolve(obj[i], root);
    }
  } else if (obj && typeof obj === "object") {
    for (const k of Object.keys(obj)) {
      let v = obj[k];
      if (typeof v === "string" && v.startsWith("$d:props:")) {
        obj[k] = resolveRef(v, root);
      }
      deepResolve(obj[k], root);
    }
  }
}

if (rawData) deepResolve(rawData, rawData);

// Load lixx sellers
let lixxSellers = [];
const brainPath2 = "/home/buco-py/.gemini/antigravity-cli/brain/f325dcc4-486e-4917-8e5e-d9c8400ddf2d/.system_generated/steps/36/content.md";
if (fs.existsSync(brainPath2)) {
  const lixxContent = fs.readFileSync(brainPath2, "utf8");
  const lixxMatch = lixxContent.match(/const EMBEDDED_SELLERS = (\[[\s\S]*?\]);/);
  if (lixxMatch) {
    lixxSellers = JSON.parse(lixxMatch[1]);
  }
}

function getBrandCategory(name) {
  const n = name.toLowerCase();
  if (
    [
      "shoes",
      "asics",
      "birkenstock",
      "brooks",
      "clarks",
      "converse",
      "crocs",
      "golden goose",
      "hoka",
      "jordan",
      "mihara yasuhiro",
      "new balance",
      "nike",
      "on",
      "onitsuka tiger",
      "salomon",
      "timberland",
      "ugg",
      "vans",
      "yeezy",
    ].includes(n)
  ) {
    return "Scarpe";
  }
  if (
    [
      "bags",
      "belts",
      "wallet",
      "accessories",
      "hats",
      "mask",
      "van cleef & arpels",
      "chrome hearts",
      "oakley",
    ].includes(n)
  ) {
    return "Accessori & Borse";
  }
  if (
    [
      "giubotti",
      "canada goose",
      "moncler",
      "moose knuckles",
      "the north face",
      "arc’teryx",
      "stone island",
      "c.p. company",
      "descente",
      "patagonia",
      "mammut",
    ].includes(n)
  ) {
    return "Giacche & Outerwear";
  }
  if (["elettronics"].includes(n)) {
    return "Elettronica & Tech";
  }
  if (["football"].includes(n)) {
    return "Sport & Football";
  }
  return "Abbigliamento & Streetwear";
}

function inferSellerCategory(name, brands, specialty) {
  const text = (name + " " + Array.from(brands).join(" ") + " " + (specialty || "")).toLowerCase();
  if (
    text.includes("bag") ||
    text.includes("luxury") ||
    text.includes("pelle") ||
    text.includes("bors") ||
    text.includes("scarlett") ||
    text.includes("wallet")
  ) {
    return "Borse & Pelletteria";
  }
  if (
    text.includes("shoe") ||
    text.includes("sneaker") ||
    text.includes("dunk") ||
    text.includes("jordan") ||
    text.includes("kick") ||
    text.includes("yolo") ||
    text.includes("wwtop") ||
    text.includes("qcxc") ||
    text.includes("wtg") ||
    text.includes("umkao")
  ) {
    return "Scarpe";
  }
  if (
    text.includes("goose") ||
    text.includes("nuptse") ||
    text.includes("giacc") ||
    text.includes("piumin") ||
    text.includes("jacket") ||
    text.includes("topgoosey") ||
    text.includes("husky") ||
    text.includes("moncler")
  ) {
    return "Giacche";
  }
  if (
    text.includes("tech") ||
    text.includes("elettron") ||
    text.includes("beschan") ||
    text.includes("airpod") ||
    text.includes("gadget")
  ) {
    return "Tech";
  }
  if (
    text.includes("jewel") ||
    text.includes("silver") ||
    text.includes("anell") ||
    text.includes("occhial") ||
    text.includes("jimi") ||
    text.includes("chromie") ||
    text.includes("socks") ||
    text.includes("calzin") ||
    text.includes("profum") ||
    text.includes("chez")
  ) {
    return "Accessori";
  }
  return "Abbigliamento";
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const sellersMap = new Map();

rawData.brands.forEach((b) => {
  const brandName = b.name.trim();
  (b.sellers || []).forEach((s) => {
    if (!s || typeof s !== "object" || !s.name) return;
    const key = norm(s.name);
    if (!sellersMap.has(key)) {
      sellersMap.set(key, {
        id: key,
        name: s.name.trim(),
        officialUrl: s.officialUrl || "",
        spreadsheetQuery: s.spreadsheetSeller || s.name.trim(),
        brands: new Set(s.brands || [brandName]),
        description: "",
        specialty: "",
        cover: b.cover || "",
        verified: true,
      });
    } else {
      const existing = sellersMap.get(key);
      if (!existing.officialUrl && s.officialUrl) existing.officialUrl = s.officialUrl;
      if (!existing.cover && b.cover) existing.cover = b.cover;
      (s.brands || []).forEach((br) => existing.brands.add(br));
      existing.brands.add(brandName);
    }
  });
});

// Explicit aliases for Lixx sellers mapping
const ALIASES = {
  yolo: "yolo66",
  huskyreps: "husky",
  sharkbreedermk: "sharkbreeder",
  scarlettluxury: "scarlett",
  yishanessentials: "yishan",
  firerep: "firerep",
};

lixxSellers.forEach((ls) => {
  const rawKey = norm(ls.nome);
  const targetKey = ALIASES[rawKey] || rawKey;
  let s = sellersMap.get(targetKey);

  if (s) {
    if (ls.descrizione) s.description = ls.descrizione;
    if (ls.doveEBravo) s.specialty = ls.doveEBravo;
    if (ls.link && (!s.officialUrl || s.officialUrl.length < 5)) s.officialUrl = ls.link;
    if (ls.img_url) s.cover = ls.img_url;
  } else {
    // New seller from Lixx (e.g. Goat Official)
    const initialBrands =
      rawKey === "goatofficial"
        ? ["Trapstar", "Corteiz", "Streetwear"]
        : [ls.ambito || "Streetwear"];
    sellersMap.set(targetKey, {
      id: targetKey,
      name: ls.nome.trim(),
      officialUrl: ls.link || "",
      spreadsheetQuery: ls.nome.trim(),
      brands: new Set(initialBrands),
      description: ls.descrizione || "",
      specialty: ls.doveEBravo || "",
      cover: ls.img_url || "https://i.pinimg.com/1200x/c2/ab/8a/c2ab8a51a9fd60d267e30ad8fdba91f3.jpg",
      verified: true,
    });
  }
});

// If Goat Official exists, also add to Trapstar and Corteiz in rawData.brands
if (sellersMap.has("goatofficial")) {
  const goat = sellersMap.get("goatofficial");
  ["Trapstar", "Corteiz"].forEach((bName) => {
    const brand = rawData.brands.find((b) => b.name.toLowerCase() === bName.toLowerCase());
    if (brand && Array.isArray(brand.sellers)) {
      if (!brand.sellers.some((s) => s.name.toLowerCase().includes("goat"))) {
        brand.sellers.push({
          name: "Goat Official",
          officialUrl: goat.officialUrl,
          spreadsheetSeller: "Goat Official",
        });
      }
    }
  });
}

// Finalize sellers array
const sellersList = Array.from(sellersMap.values())
  .map((s) => {
    const brandsArr = Array.from(s.brands).sort();
    const category = inferSellerCategory(s.name, brandsArr, s.specialty);
    const platform = s.officialUrl.includes("yupoo")
      ? "Yupoo"
      : s.officialUrl.includes("weidian")
      ? "Weidian"
      : s.officialUrl.includes("taobao")
      ? "Taobao"
      : "Direct Store";
    let desc = s.description;
    if (!desc) {
      if (category === "Scarpe")
        desc = `Venditore specializzato in sneakers e calzature (${brandsArr.slice(0, 3).join(", ") || "Nike, Jordan"}).`;
      else if (category === "Giacche")
        desc = `Produttore specializzato in giacche pesanti, piumini e outerwear di alta qualità.`;
      else if (category === "Borse & Pelletteria")
        desc = `Catalogo dedicato a borse, cinture e pelletteria rifinita nei minimi dettagli.`;
      else if (category === "Accessori")
        desc = `Specialista in accessori, gioielli e dettagli curati per completare ogni outfit.`;
      else desc = `Venditore affidabile per streetwear e abbigliamento di tendenza (${brandsArr.slice(0, 3).join(", ")}).`;
    }
    let spec = s.specialty;
    if (!spec) {
      spec = brandsArr.slice(0, 2).join(" & ") || category;
    }

    return {
      id: s.id,
      name: s.name,
      officialUrl: s.officialUrl,
      spreadsheetQuery: s.spreadsheetQuery,
      category,
      platform,
      brands: brandsArr,
      brandsCount: brandsArr.length,
      description: desc,
      specialty: spec,
      cover: s.cover,
      verified: true,
    };
  })
  .sort((a, b) => b.brandsCount - a.brandsCount || a.name.localeCompare(b.name));

// Finalize brands array
const brandsList = rawData.brands
  .map((b) => {
    const cat = getBrandCategory(b.name);
    const brandSellers = (b.sellers || [])
      .map((s) => ({
        name: s.name.trim(),
        officialUrl: s.officialUrl || "",
        spreadsheetQuery: s.spreadsheetSeller || s.name.trim(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (brandSellers.length === 0 && b.name.toLowerCase() === "wallet") {
      brandSellers.push(
        {
          name: "SCARLETT",
          officialUrl: "https://weidian.com/?userid=1655376466&spider_token=6c34",
          spreadsheetQuery: "SCARLETT",
        },
        {
          name: "Poshreps",
          officialUrl: "https://poshrep.x.yupoo.com/albums/",
          spreadsheetQuery: "POSHREP",
        }
      );
    }

    return {
      id: b.id || norm(b.name),
      name: b.name.trim(),
      cover: b.cover || "https://i.pinimg.com/1200x/c2/ab/8a/c2ab8a51a9fd60d267e30ad8fdba91f3.jpg",
      category: cat,
      sellersCount: brandSellers.length,
      sellers: brandSellers,
    };
  })
  .sort((a, b) => b.sellersCount - a.sellersCount || a.name.localeCompare(b.name));

const finalOutput = {
  totalBrands: brandsList.length,
  totalSellers: sellersList.length,
  brands: brandsList,
  sellers: sellersList,
};

fs.writeFileSync("data/sellers-directory.json", JSON.stringify(finalOutput, null, 2), "utf8");
console.log(`Successfully generated data/sellers-directory.json: ${brandsList.length} brands, ${sellersList.length} sellers.`);
