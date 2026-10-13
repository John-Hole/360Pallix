/**
 * =========================================================================
 * 360PALLIX - ESTRATTORE AUTOMATICO ORDINI / ACQUISTI CSSBUY
 * =========================================================================
 * 
 * ISTRUZIONI PER L'USO:
 * 1. Accedi a CSSBuy (https://www.cssbuy.com) con il tuo account.
 * 2. Vai nella pagina dei tuoi ordini:
 *    - "My Orders": https://www.cssbuy.com/user.php?mod=order (o /web/user/order)
 *    - oppure "My Warehouse": https://www.cssbuy.com/user.php?mod=warehouse
 * 3. Apri la Console degli sviluppatori del browser:
 *    - Tasto F12 (oppure tasto destro del mouse -> "Ispeziona" -> scheda "Console")
 * 4. Copia e incolla l'intero codice sottostante nella Console e premi INVIO.
 * 5. Il file "cssbuy_prodotti.json" verrà scaricato in automatico e i dati
 *    saranno copiati nei tuoi appunti (Ctrl+V)!
 * =========================================================================
 */

(() => {
  // Tasso di cambio indicativo RMB (Yuan) -> EUR (1 EUR ≈ 7.80 RMB)
  const RMB_TO_EUR_RATE = 7.8;
  const products = [];
  const seenUrls = new Set();

  // Seleziona elementi riga ordine in base alle varie versioni grafiche di CSSBuy
  const rows = document.querySelectorAll(
    "tr, .order-item, .goods-item, .order-table-item, .el-table__row, .order-list-box, .my-order-item"
  );

  rows.forEach((row) => {
    // 1. Cerca link prodotto (Weidian, Taobao, 1688, CSSBuy)
    const linkEl = row.querySelector(
      'a[href*="item"], a[href*="weidian"], a[href*="taobao"], a[href*="1688"], a[href*="detail"], a[href*="goods"]'
    );
    if (!linkEl) return;

    let sourceUrl = linkEl.getAttribute("href") || "";
    if (sourceUrl.startsWith("//")) sourceUrl = "https:" + sourceUrl;
    else if (sourceUrl.startsWith("/")) sourceUrl = "https://www.cssbuy.com" + sourceUrl;

    if (!sourceUrl || seenUrls.has(sourceUrl)) return;

    // 2. Titolo del prodotto
    let title = linkEl.getAttribute("title") || linkEl.innerText.trim();
    if (!title || title.length < 3) {
      const titleEl = row.querySelector(".title, .goods-name, .name, .desc, [class*='title'], [class*='name']");
      if (titleEl) title = titleEl.innerText.trim();
    }
    title = (title || "").replace(/\s+/g, " ").trim();
    if (!title || title.toLowerCase() === "detail" || title.toLowerCase() === "view") return;

    // 3. Immagine
    const imgEl = row.querySelector("img");
    let image = imgEl ? (imgEl.getAttribute("src") || imgEl.getAttribute("data-src") || "") : "";
    if (image.startsWith("//")) image = "https:" + image;
    if (image.includes("default") || image.includes("placeholder")) image = "";

    // 4. Prezzo (ricerca ¥, $, €, o numeri nella riga)
    let price = 0;
    const text = row.innerText;
    const rmbMatch = text.match(/(?:￥|¥)\s*([\d.]+)/) || text.match(/([\d.]+)\s*(?:元|RMB)/i);
    const eurMatch = text.match(/€\s*([\d.]+)/);
    const usdMatch = text.match(/\$\s*([\d.]+)/);

    if (eurMatch) {
      price = parseFloat(eurMatch[1]);
    } else if (rmbMatch) {
      const rmb = parseFloat(rmbMatch[1]);
      if (!isNaN(rmb)) price = parseFloat((rmb / RMB_TO_EUR_RATE).toFixed(2));
    } else if (usdMatch) {
      const usd = parseFloat(usdMatch[1]);
      if (!isNaN(usd)) price = parseFloat((usd * 0.92).toFixed(2));
    } else {
      // Fallback: cerca primo numero decimale plausibile
      const numMatch = text.match(/(\d+\.\d{2})/);
      if (numMatch) {
        const val = parseFloat(numMatch[1]);
        price = val > 80 ? parseFloat((val / RMB_TO_EUR_RATE).toFixed(2)) : val;
      }
    }

    if (!price || isNaN(price)) price = 19.99;

    // 5. Categoria stimata in base al titolo
    const lower = title.toLowerCase();
    let category = "OTHER";
    if (
      lower.includes("shoe") ||
      lower.includes("sneaker") ||
      lower.includes("dunk") ||
      lower.includes("jordan") ||
      lower.includes("force") ||
      lower.includes("air") ||
      lower.includes("kobe") ||
      lower.includes("yeezy") ||
      lower.includes("bapesta") ||
      lower.includes("runner") ||
      lower.includes("hoka") ||
      lower.includes("travis")
    ) {
      category = "SNEAKERS";
    } else if (lower.includes("hoodie") || lower.includes("felpa") || lower.includes("sweater") || lower.includes("zip")) {
      category = "HOODIE";
    } else if (lower.includes("tee") || lower.includes("t-shirt") || lower.includes("maglia") || lower.includes("shirt")) {
      category = "TSHIRT";
    } else if (lower.includes("pant") || lower.includes("jeans") || lower.includes("short") || lower.includes("jogger") || lower.includes("trousers")) {
      category = "PANTS";
    } else if (lower.includes("jacket") || lower.includes("puffer") || lower.includes("coat") || lower.includes("giacca") || lower.includes("windbreaker") || lower.includes("down")) {
      category = "JACKET";
    } else if (lower.includes("cap") || lower.includes("hat") || lower.includes("beanie") || lower.includes("bag") || lower.includes("belt") || lower.includes("wallet") || lower.includes("cintura") || lower.includes("calze") || lower.includes("socks")) {
      category = "ACCESSORIES";
    }

    // 6. Brand stimato
    let brand = "—";
    const brands = ["Nike", "Adidas", "Jordan", "Supreme", "Stussy", "Trapstar", "Hellstar", "Syna", "Bape", "Chrome Hearts", "Gallery Dept", "Balenciaga", "Prada", "Moncler", "Gucci", "Louis Vuitton", "Rick Owens", "Corteiz", "Stone Island", "Arc'teryx", "Ralph Lauren", "Sp5der"];
    for (const b of brands) {
      if (lower.includes(b.toLowerCase())) {
        brand = b;
        break;
      }
    }

    seenUrls.add(sourceUrl);
    products.push({
      title,
      image,
      price,
      category,
      brand,
      seller: "CSSBuy Order",
      sourceUrl,
    });
  });

  if (products.length === 0) {
    alert("⚠️ Nessun prodotto rilevato su questa schermata.\nAssicurati di essere nella pagina 'My Orders' o 'Warehouse' di CSSBuy con gli articoli visibili.");
    return;
  }

  const jsonStr = JSON.stringify(products, null, 2);

  // Copia negli appunti
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(jsonStr).then(() => {
      console.log("✅ Dati copiati negli appunti!");
    }).catch(() => {});
  }

  // Download automatico del file .json
  const blob = new Blob([jsonStr], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `cssbuy_prodotti_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  alert(`🎉 Estratti con successo ${products.length} prodotti!\n\n1. Il file 'cssbuy_prodotti.json' è stato scaricato.\n2. I dati sono stati anche COPIATI negli appunti.\n\nOra puoi incollarli nella chat o caricarli nel pannello /admin!`);
  console.log("Prodotti trovati:", products);
})();
