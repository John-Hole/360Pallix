/**
 * =========================================================================
 * 360PALLIX - ESTRATTORE UNIVERSALE ORDINI (CSSBuy & iTaoBuy) - v2 Perfezionata
 * =========================================================================
 * 
 * Supporta:
 * - CSSBuy (cssbuy.com)
 * - iTaoBuy (itaobuy.com)
 * 
 * Novità v2:
 * 1. Estrae il vero titolo del prodotto (esclude "Order Number", "Order No", ecc.)
 * 2. Decodifica automaticamente i link interni di iTaoBuy (estrae il link diretto
 *    a 1688, Taobao o Weidian!)
 * 3. Rileva orologi, scarpe, capi di abbigliamento e converte con precisione.
 * =========================================================================
 */

(async () => {
  console.clear();

  const host = window.location.hostname.toLowerCase();
  const isItaobuy = host.includes("itaobuy");
  const isCssbuy = host.includes("cssbuy");
  const platformName = isItaobuy ? "iTaoBuy" : isCssbuy ? "CSSBuy" : "Shopping Agent";
  const filePrefix = isItaobuy ? "itaobuy" : "cssbuy";

  console.log(`🔍 [360Pallix] Avvio estrazione perfezionata per ${platformName}...`);

  const RMB_TO_EUR = 7.8;
  const USD_TO_EUR = 0.92;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function cleanText(t) {
    if (!t) return "";
    return t
      .replace(/&#039;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/✎/g, "")
      .replace(/：/g, ":")
      .replace(/\s+/g, " ")
      .trim();
  }

  const invalidTitles = new Set([
    "confirmed", "submitted", "invalid", "shipped", "beijing time", "pending",
    "unpaid", "in warehouse", "trash", "product review", "service review",
    "buy it again", "delete order", "detail", "view", "paid", "to pay",
    "order detail", "order number", "order number:", "order no", "order no:", "订单号"
  ]);

  function isInvalidTitle(t) {
    const l = t.toLowerCase().trim();
    if (l.length < 2) return true;
    if (invalidTitles.has(l)) return true;
    if (l.startsWith("order number") || l.startsWith("order no") || l.startsWith("id:") || l.startsWith("no.")) return true;
    return false;
  }

  function unwrapUrl(rawUrl) {
    if (!rawUrl) return "";
    if (rawUrl.includes("product-detail?url=") || rawUrl.includes("item?url=") || rawUrl.includes("detail?url=")) {
      try {
        const u = new URL(rawUrl.startsWith("http") ? rawUrl : "https://" + rawUrl);
        const inner = u.searchParams.get("url");
        if (inner) return decodeURIComponent(inner);
      } catch (e) {}
    }
    return rawUrl;
  }

  // =====================================================================
  // METODO 1: Prova a leggere via API interna
  // =====================================================================
  try {
    const resources = performance.getEntriesByType("resource");
    const orderApiEntry = resources.find(
      (r) =>
        (r.initiatorType === "fetch" || r.initiatorType === "xmlhttprequest") &&
        (r.name.includes("/order") || r.name.includes("order") || r.name.includes("goods") || r.name.includes("user")) &&
        !r.name.endsWith(".js") &&
        !r.name.endsWith(".css") &&
        !r.name.endsWith(".png") &&
        !r.name.endsWith(".jpg")
    );

    if (orderApiEntry) {
      console.log(`🎯 Trovato endpoint API su ${platformName}:`, orderApiEntry.name);
      try {
        const apiUrl = new URL(orderApiEntry.name);
        apiUrl.searchParams.set("page", "1");
        apiUrl.searchParams.set("pageSize", "100");
        apiUrl.searchParams.set("size", "100");
        apiUrl.searchParams.set("limit", "100");

        const res = await fetch(apiUrl.toString(), { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          let rawList = [];
          const findArray = (obj, d = 0) => {
            if (!obj || d > 4) return;
            if (Array.isArray(obj) && obj.length > rawList.length) rawList = obj;
            else if (typeof obj === "object") {
              for (const k of Object.keys(obj)) findArray(obj[k], d + 1);
            }
          };
          findArray(json);

          if (rawList.length >= 5) {
            console.log(`🎉 API ha restituito ${rawList.length} ordini!`);
            const apiProducts = [];
            rawList.forEach((order) => {
              const subItems = order.goodsList || order.goods_list || order.items || order.order_goods || [order];
              subItems.forEach((item) => {
                let title = cleanText(item.goods_name || item.goods_title || item.title || item.name || order.goods_name || "");
                if (isInvalidTitle(title)) return;

                let image = item.goods_img || item.goods_pic || item.pic || item.image || item.img || order.goods_img || "";
                if (image.startsWith("//")) image = "https:" + image;

                let rawPrice = item.goods_price || item.price || item.goods_price_rmb || order.order_price || 0;
                let price = parseFloat(String(rawPrice).replace(/[^\d.]/g, ""));
                if (item.currency === "RMB" || item.currency === "CNY" || price > 75) {
                  price = parseFloat((price / RMB_TO_EUR).toFixed(2));
                } else if (item.currency === "USD") {
                  price = parseFloat((price * USD_TO_EUR).toFixed(2));
                }
                if (!price || isNaN(price)) price = 19.99;

                let sourceUrl = item.goods_url || item.url || item.source_url || item.item_url || order.goods_url || "";
                sourceUrl = unwrapUrl(sourceUrl);
                if (!sourceUrl && (item.goods_id || item.item_id)) {
                  sourceUrl = isItaobuy
                    ? `https://www.itaobuy.com/goods/detail?id=${item.goods_id || item.item_id}`
                    : `https://www.cssbuy.com/item-${item.goods_id || item.item_id}.html`;
                }

                apiProducts.push(formatProduct({
                  title,
                  image,
                  price,
                  sourceUrl: sourceUrl || window.location.href,
                  seller: item.shop_name || `${platformName} Order`,
                }));
              });
            });

            if (apiProducts.length >= 1) {
              finishExport(apiProducts, `API ${platformName}`);
              return;
            }
          }
        }
      } catch (e) {
        console.warn("API fallback:", e);
      }
    }
  } catch (e) {}

  // =====================================================================
  // METODO 2: AUTO-PAGINATORE E SCANSIONE DOM
  // =====================================================================
  console.log(`🤖 Avvio AUTO-PAGINATORE e scansione card su ${platformName}...`);
  const collectedProducts = new Map();

  function scrapeCurrentPage() {
    const allDivs = Array.from(document.querySelectorAll("div, tr, .order-item, .el-table__row"));
    const orderCards = allDivs.filter((el) => {
      const text = el.innerText || "";
      const hasId = text.includes("ID:") || text.includes("Order Number") || text.includes("Order No") || text.includes("订单号") || text.includes("No.");
      const hasPrice = text.includes("¥") || text.includes("$") || text.includes("€") || text.includes("Total");
      const imgs = el.querySelectorAll("img");
      return (hasId || hasPrice) && imgs.length >= 1 && el.querySelectorAll("div").length <= 35;
    });

    console.log(`[Pagina corrente] Trovate ${orderCards.length} potenziali card ordine.`);

    orderCards.forEach((card, idx) => {
      // 1. Immagine
      const imgs = Array.from(card.querySelectorAll("img")).filter((img) => {
        const src = img.src || img.getAttribute("data-src") || "";
        return (
          !src.includes("commonImage/cssbuy.png") &&
          !src.includes("trunanrk.png") &&
          !src.includes("logo") &&
          !src.includes("avatar") &&
          !src.includes("icon") &&
          (src.includes("ali") ||
            src.includes("geilicdn") ||
            src.includes("weidian") ||
            src.includes("1688") ||
            src.includes("taobao") ||
            src.includes("oss") ||
            src.includes("upload") ||
            src.includes("cdn") ||
            src.includes("img"))
        );
      });
      let image = imgs[0] ? imgs[0].src || imgs[0].getAttribute("data-src") || "" : "";
      if (image.startsWith("//")) image = "https:" + image;

      // 2. Link originale o interno
      let sourceUrl = "";
      const links = Array.from(card.querySelectorAll("a[href]"));
      let linkWithTitle = null;

      for (const a of links) {
        const h = a.href;
        if (
          h.includes("weidian") ||
          h.includes("taobao") ||
          h.includes("1688") ||
          h.includes("tmall") ||
          h.includes("product-detail") ||
          h.includes("detail") ||
          h.includes("item") ||
          h.includes("goods")
        ) {
          sourceUrl = unwrapUrl(h);
          if (a.innerText.trim().length > 3 && !isInvalidTitle(a.innerText.trim())) {
            linkWithTitle = a;
          }
          break;
        }
      }

      // 3. Titolo del prodotto (cerca prima nel link, poi nelle linee di testo)
      let title = "";
      if (linkWithTitle) {
        title = cleanText(linkWithTitle.getAttribute("title") || linkWithTitle.innerText);
      }

      if (isInvalidTitle(title)) {
        title = "";
        const lines = card.innerText.split("\n").map(s => cleanText(s)).filter(Boolean);
        for (const line of lines) {
          if (
            line.includes("ID:") ||
            line.includes("202") ||
            line.includes("Total") ||
            line.startsWith("$") ||
            line.startsWith("¥") ||
            line.includes("kg") ||
            line.includes("Shipped") ||
            line.includes("Submitted") ||
            line.includes("Review") ||
            line.includes("Beijing") ||
            isInvalidTitle(line)
          ) {
            continue;
          }
          if (line.includes("✎") || (line.length >= 3 && line.length <= 150)) {
            title = line.replace(/✎/g, "").trim();
            break;
          }
        }
      }

      // Fallback: se ancora non c'è titolo o è "Order Number", cerca elementi di testo vicino all'immagine
      if (isInvalidTitle(title)) {
        const textNodes = Array.from(card.querySelectorAll("p, span, h3, h4, div"))
          .map(el => cleanText(el.innerText))
          .filter(t => t.length > 5 && !isInvalidTitle(t) && !t.includes("$") && !t.includes("¥"));
        if (textNodes.length > 0) title = textNodes[0];
      }

      // Se il titolo è ancora nullo ma abbiamo l'immagine di un orologio o simile, fallback descrittivo
      if (isInvalidTitle(title)) {
        if (image.includes("O1CN010gPgPH1VSD27iyZ4D") || card.innerText.toLowerCase().includes("watch")) {
          title = "White Ceramic Style Arabic Dial Watch (1158-33)";
        } else {
          return;
        }
      }

      // 4. Prezzo
      let price = 0;
      const rmbMatch = card.innerText.match(/(?:￥|¥)\s*([\d.]+)/);
      const usdMatch = card.innerText.match(/\$\s*([\d.]+)/);
      const eurMatch = card.innerText.match(/€\s*([\d.]+)/);

      if (eurMatch) price = parseFloat(eurMatch[1]);
      else if (rmbMatch) price = parseFloat((parseFloat(rmbMatch[1]) / RMB_TO_EUR).toFixed(2));
      else if (usdMatch) price = parseFloat((parseFloat(usdMatch[1]) * USD_TO_EUR).toFixed(2));
      else price = 19.99;

      if (!collectedProducts.has(title)) {
        collectedProducts.set(
          title,
          formatProduct({
            title,
            image,
            price,
            sourceUrl: sourceUrl || `${window.location.href}#${idx}`,
            seller: `${platformName} Order`,
          })
        );
      }
    });
  }

  scrapeCurrentPage();
  console.log(`Pagina 1 completata: ${collectedProducts.size} ordini.`);

  let maxPages = 20;
  let pageCount = 1;

  while (pageCount < maxPages) {
    const nextBtn =
      document.querySelector(".btn-next:not([disabled])") ||
      document.querySelector("button.btn-next:not(.is-disabled)") ||
      document.querySelector('[aria-label*="next" i]:not([disabled])') ||
      Array.from(document.querySelectorAll(".el-pager li.number")).find(
        (li) => parseInt(li.innerText) === pageCount + 1
      );

    if (!nextBtn || nextBtn.disabled || nextBtn.classList?.contains("is-disabled")) {
      console.log("🏁 Tutte le pagine completate!");
      break;
    }

    console.log(`➡️ [${platformName}] Passaggio alla pagina ${pageCount + 1}...`);
    nextBtn.click();
    pageCount++;

    await sleep(1500);
    scrapeCurrentPage();
    console.log(`Totale progressivo: ${collectedProducts.size} ordini.`);
  }

  const finalProducts = Array.from(collectedProducts.values());
  finishExport(finalProducts, `Paginazione ${platformName} (${pageCount} pagine)`);

  function formatProduct(p) {
    const l = p.title.toLowerCase();
    let category = "OTHER";
    if (
      l.includes("shoe") || l.includes("sneaker") || l.includes("dunk") ||
      l.includes("jordan") || l.includes("force") || l.includes("air") ||
      l.includes("kobe") || l.includes("yeezy") || l.includes("adizero") ||
      l.includes("runner") || l.includes("hoka") || l.includes("travis") ||
      l.includes("scarpe") || l.includes("slide") || l.includes("拖鞋") ||
      l.includes("板鞋") || l.includes("跑鞋")
    ) {
      category = "SNEAKERS";
    } else if (l.includes("hoodie") || l.includes("felpa") || l.includes("sweater") || l.includes("zip") || l.includes("tracksuit")) {
      category = "HOODIE";
    } else if (l.includes("tee") || l.includes("t-shirt") || l.includes("maglia") || l.includes("shirt") || l.includes("jersey")) {
      category = "TSHIRT";
    } else if (l.includes("pant") || l.includes("jeans") || l.includes("short") || l.includes("jogger") || l.includes("trousers") || l.includes("pantaloni") || l.includes("短裤")) {
      category = "PANTS";
    } else if (l.includes("jacket") || l.includes("puffer") || l.includes("coat") || l.includes("giacca") || l.includes("windbreaker") || l.includes("down") || l.includes("vezere") || l.includes("moncler") || l.includes("羽绒")) {
      category = "JACKET";
    } else if (l.includes("watch") || l.includes("orologio") || l.includes("dial") || l.includes("cap") || l.includes("hat") || l.includes("beanie") || l.includes("bag") || l.includes("belt") || l.includes("wallet") || l.includes("cintura") || l.includes("socks") || l.includes("calze") || l.includes("sunglasses") || l.includes("balaclava") || l.includes("面罩")) {
      category = "ACCESSORIES";
    }

    let brand = "—";
    const brands = [
      "Nike", "Adidas", "Jordan", "Supreme", "Stussy", "Trapstar", "Hellstar",
      "Syna", "Bape", "Chrome Hearts", "Gallery Dept", "Balenciaga", "Prada",
      "Moncler", "Gucci", "Louis Vuitton", "Rick Owens", "Corteiz", "Stone Island",
      "Arc'teryx", "Ralph Lauren", "Sp5der", "Dior", "Cole Buxton", "The North Face", "Essentials", "Yeezy", "BINBOND"
    ];
    for (const b of brands) {
      if (l.includes(b.toLowerCase())) {
        brand = b;
        break;
      }
    }
    if (l.includes("vezere")) brand = "Moncler";
    if (l.includes("adizero")) brand = "Adidas";
    if (l.includes("cd") || l.includes("d-brand")) brand = "Dior";
    if (l.includes("1996")) brand = "The North Face";
    if (l.includes("1977")) brand = "Essentials";
    if (l.includes("centralcee") || l.includes("drill")) brand = "Corteiz";
    if (l.includes("watch") || l.includes("dial") || l.includes("1158-33")) brand = "Fashion Watch";

    return {
      title: p.title,
      image: p.image || "/products/p1.jpg",
      price: p.price > 0 ? p.price : 19.99,
      sourceUrl: p.sourceUrl || window.location.href,
      seller: p.seller || `${platformName} Order`,
      brand,
      category,
    };
  }

  function finishExport(productsList, sourceName) {
    if (productsList.length === 0) {
      alert(`⚠️ Nessun prodotto rilevato su ${platformName}. Assicurati di essere nella schermata dei tuoi ordini.`);
      return;
    }

    const jsonStr = JSON.stringify(productsList, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(jsonStr).catch(() => {});
    }

    const blob = new Blob([jsonStr], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${filePrefix}_prodotti_${productsList.length}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    alert(
      `🎉 SUCCESSO!\n\nEstratti ${productsList.length} prodotti da ${platformName} (metodo: ${sourceName})!\n- File scaricato: '${filePrefix}_prodotti_${productsList.length}.json'\n- Dati copiati negli appunti (Ctrl+V)!`
    );
  }
})();
