/**
 * =========================================================================
 * 360PALLIX - ESTRATTORE AUTOMATICO ORDINI / ACQUISTI CSSBUY (v2 - Aggiornato)
 * Supporta la nuova interfaccia CSSBuy (/shop/cate/order) basata su Vue 3
 * =========================================================================
 * 
 * ISTRUZIONI:
 * 1. Vai su https://www.cssbuy.com/shop/cate/order (la pagina aperta nel tuo screenshot)
 * 2. Premi F12 -> Console
 * 3. Incolla questo codice e premi INVIO
 * 4. Scaricherà in automatico 'cssbuy_prodotti.json' e copierà i dati negli appunti!
 * =========================================================================
 */

(() => {
  console.clear();
  console.log("🔍 [360Pallix] Avvio estrazione avanzata ordini CSSBuy...");

  const RMB_TO_EUR = 7.8;
  const USD_TO_EUR = 0.92;
  const products = [];
  const seenTitles = new Set();

  // -------------------------------------------------------------
  // STRATEGIA 1: Ispezione componenti reattivi Vue 3 / Nuxt
  // -------------------------------------------------------------
  try {
    const allEls = document.querySelectorAll("*");
    for (const el of allEls) {
      const comp = el.__vueParentComponent;
      if (!comp) continue;

      const candidates = [comp.setupState, comp.data, comp.ctx, comp.props];
      for (const scope of candidates) {
        if (!scope) continue;
        for (const key of Object.keys(scope)) {
          const val = scope[key];
          if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
            const sample = val[0];
            const isOrder =
              sample.goods_name ||
              sample.goods_title ||
              sample.goodsList ||
              sample.goods_list ||
              sample.order_goods ||
              sample.order_id ||
              sample.orderNo ||
              sample.items;

            if (isOrder) {
              console.log(`✨ [Vue 3] Trovata lista ordini in '${key}' (${val.length} elementi):`, val);

              val.forEach((order) => {
                const subItems =
                  order.goodsList ||
                  order.goods_list ||
                  order.items ||
                  order.order_goods ||
                  [order];

                subItems.forEach((item) => {
                  let title =
                    item.goods_name ||
                    item.goods_title ||
                    item.title ||
                    item.name ||
                    order.goods_name ||
                    order.order_goods_name ||
                    "";
                  title = (title || "").replace(/✎/g, "").replace(/\s+/g, " ").trim();
                  if (!title || title.length < 2 || seenTitles.has(title)) return;

                  let image =
                    item.goods_img ||
                    item.goods_pic ||
                    item.pic ||
                    item.image ||
                    item.img ||
                    order.goods_img ||
                    order.pic ||
                    "";
                  if (image.startsWith("//")) image = "https:" + image;

                  // Prezzo in EUR
                  let rawPrice =
                    item.goods_price ||
                    item.price ||
                    item.goods_price_rmb ||
                    order.order_price ||
                    order.price ||
                    0;
                  let price = parseFloat(String(rawPrice).replace(/[^\d.]/g, ""));
                  if (
                    item.currency === "RMB" ||
                    item.currency === "CNY" ||
                    price > 75
                  ) {
                    price = parseFloat((price / RMB_TO_EUR).toFixed(2));
                  } else if (item.currency === "USD") {
                    price = parseFloat((price * USD_TO_EUR).toFixed(2));
                  }
                  if (!price || isNaN(price)) price = 19.99;

                  // Link originale (Weidian, Taobao, 1688, CSSBuy)
                  let sourceUrl =
                    item.goods_url ||
                    item.url ||
                    item.source_url ||
                    item.item_url ||
                    order.goods_url ||
                    "";
                  if (!sourceUrl && (item.goods_id || item.item_id)) {
                    sourceUrl = `https://www.cssbuy.com/item-${item.goods_id || item.item_id}.html`;
                  }

                  seenTitles.add(title);
                  products.push({
                    title,
                    image,
                    price: price > 0 ? price : 19.99,
                    sourceUrl: sourceUrl || window.location.href,
                    seller: item.shop_name || item.seller || "CSSBuy Order",
                    brand: item.brand || "—",
                    category: "OTHER",
                  });
                });
              });
              break;
            }
          }
        }
        if (products.length > 0) break;
      }
      if (products.length > 0) break;
    }
  } catch (e) {
    console.warn("[360Pallix] Ispezione Vue completata con fallback:", e);
  }

  // -------------------------------------------------------------
  // STRATEGIA 2: Scansione visuale del DOM (funziona con qualsiasi layout)
  // -------------------------------------------------------------
  if (products.length === 0) {
    console.log("🔍 [DOM] Avvio scansione diretta elementi grafici...");

    // Cerca tutte le immagini prodotto (escludendo avatar, icone, logo)
    const imgs = Array.from(document.querySelectorAll("img")).filter((img) => {
      const src = img.src || img.getAttribute("data-src") || "";
      const rect = img.getBoundingClientRect();
      const hasSize =
        (rect.width >= 35 && rect.width <= 200) ||
        (img.width >= 35 && img.width <= 200);
      return (
        hasSize &&
        !src.includes("logo") &&
        !src.includes("avatar") &&
        !src.includes("icon") &&
        (src.includes("ali") ||
          src.includes("cssbuy") ||
          src.includes("weidian") ||
          src.includes("wdwd") ||
          src.includes("upload") ||
          src.includes("cdn") ||
          src.includes("img") ||
          src.includes("http"))
      );
    });

    console.log(`[DOM] Trovate ${imgs.length} miniature di prodotti.`);

    imgs.forEach((img, idx) => {
      // Risali al contenitore dell'ordine
      let card = img.parentElement;
      for (let i = 0; i < 7 && card && card !== document.body; i++) {
        if (
          card.innerText.includes("Total") ||
          card.innerText.includes("¥") ||
          card.innerText.includes("$") ||
          card.innerText.includes("ID:") ||
          card.innerText.includes("Submitted") ||
          card.innerText.includes("Shipped")
        ) {
          break;
        }
        card = card.parentElement;
      }
      if (!card) card = img.parentElement;

      // Estrai il titolo dal testo del card
      const lines = card.innerText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      let title = "";
      for (const line of lines) {
        if (
          line.includes("ID:") ||
          line.includes("202") ||
          line.includes("Total") ||
          line.startsWith("$") ||
          line.startsWith("¥") ||
          line.includes("kg") ||
          line === "Submitted" ||
          line.includes("Shipped") ||
          line === "Invalid" ||
          line === "Product Review" ||
          line === "Service Review" ||
          line === "Buy It Again" ||
          line === "Delete Order"
        ) {
          continue;
        }
        if (line.length >= 2 && line.length <= 120) {
          title = line.replace(/✎/g, "").trim();
          break;
        }
      }

      if (!title || seenTitles.has(title)) return;

      // Prezzo (cerca ¥ o $)
      let price = 0;
      const rmbMatch = card.innerText.match(/(?:￥|¥)\s*([\d.]+)/);
      const usdMatch = card.innerText.match(/\$\s*([\d.]+)/);
      const eurMatch = card.innerText.match(/€\s*([\d.]+)/);

      if (eurMatch) {
        price = parseFloat(eurMatch[1]);
      } else if (rmbMatch) {
        price = parseFloat((parseFloat(rmbMatch[1]) / RMB_TO_EUR).toFixed(2));
      } else if (usdMatch) {
        price = parseFloat((parseFloat(usdMatch[1]) * USD_TO_EUR).toFixed(2));
      } else {
        price = 19.99;
      }

      // Link (cerca <a> o attributi)
      const linkEl = card.querySelector(
        'a[href*="item"], a[href*="weidian"], a[href*="taobao"], a[href*="1688"], a[href*="detail"], a[href*="goods"], a[href]'
      );
      let sourceUrl = linkEl ? linkEl.href : "";

      let imageSrc = img.src || img.getAttribute("data-src") || "";
      if (imageSrc.startsWith("//")) imageSrc = "https:" + imageSrc;

      seenTitles.add(title);
      products.push({
        title,
        image: imageSrc,
        price: price > 0 ? price : 19.99,
        sourceUrl: sourceUrl || `https://www.cssbuy.com/shop/cate/order#${idx}`,
        seller: "CSSBuy Order",
        brand: "—",
        category: "OTHER",
      });
    });
  }

  // -------------------------------------------------------------
  // Categorizzazione automatica e Brand
  // -------------------------------------------------------------
  products.forEach((p) => {
    const l = p.title.toLowerCase();
    if (
      l.includes("shoe") ||
      l.includes("sneaker") ||
      l.includes("dunk") ||
      l.includes("jordan") ||
      l.includes("force") ||
      l.includes("air") ||
      l.includes("kobe") ||
      l.includes("yeezy") ||
      l.includes("bapesta") ||
      l.includes("runner") ||
      l.includes("hoka") ||
      l.includes("travis") ||
      l.includes("scarpe")
    ) {
      p.category = "SNEAKERS";
    } else if (
      l.includes("hoodie") ||
      l.includes("felpa") ||
      l.includes("sweater") ||
      l.includes("zip")
    ) {
      p.category = "HOODIE";
    } else if (
      l.includes("tee") ||
      l.includes("t-shirt") ||
      l.includes("maglia") ||
      l.includes("shirt")
    ) {
      p.category = "TSHIRT";
    } else if (
      l.includes("pant") ||
      l.includes("jeans") ||
      l.includes("short") ||
      l.includes("jogger") ||
      l.includes("trousers") ||
      l.includes("pantaloni")
    ) {
      p.category = "PANTS";
    } else if (
      l.includes("jacket") ||
      l.includes("puffer") ||
      l.includes("coat") ||
      l.includes("giacca") ||
      l.includes("windbreaker") ||
      l.includes("down") ||
      l.includes("vezere") ||
      l.includes("moncler")
    ) {
      p.category = "JACKET";
    } else if (
      l.includes("cap") ||
      l.includes("hat") ||
      l.includes("beanie") ||
      l.includes("bag") ||
      l.includes("belt") ||
      l.includes("wallet") ||
      l.includes("cintura") ||
      l.includes("socks") ||
      l.includes("calze")
    ) {
      p.category = "ACCESSORIES";
    }

    const brands = [
      "Nike",
      "Adidas",
      "Jordan",
      "Supreme",
      "Stussy",
      "Trapstar",
      "Hellstar",
      "Syna",
      "Bape",
      "Chrome Hearts",
      "Gallery Dept",
      "Balenciaga",
      "Prada",
      "Moncler",
      "Gucci",
      "Louis Vuitton",
      "Rick Owens",
      "Corteiz",
      "Stone Island",
      "Arc'teryx",
      "Ralph Lauren",
      "Sp5der",
    ];
    for (const b of brands) {
      if (l.includes(b.toLowerCase())) {
        p.brand = b;
        break;
      }
    }
    if (l.includes("vezere")) p.brand = "Moncler";
  });

  console.log(`🎉 [360Pallix] Estratti ${products.length} prodotti in totale:`, products);

  if (products.length === 0) {
    alert(
      "⚠️ Non è stato possibile trovare prodotti in questa vista.\n\nAssicurati che la pagina sia completamente caricata con le card dei prodotti visibili."
    );
    return;
  }

  const jsonStr = JSON.stringify(products, null, 2);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(jsonStr).catch(() => {});
  }

  const blob = new Blob([jsonStr], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `cssbuy_prodotti_${products.length}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  alert(
    `🎉 SUCCESSO!\n\nEstratti ${products.length} prodotti da CSSBuy!\n- Il file 'cssbuy_prodotti_${products.length}.json' è stato scaricato.\n- I dati sono stati copiati negli appunti (Ctrl+V).\n\nOra puoi incollarli nella chat o caricarli in /admin!`
  );
})();
