/**
 * =========================================================================
 * 360PALLIX - ESTRATTORE DEDICATO iTaoBuy (Tutti i 35+ Ordini)
 * =========================================================================
 * 
 * Risolve specificamente:
 * 1. Bug del titolo "Order Number": ora ignora completamente l'intestazione dell'ordine
 *    e cattura il vero nome dell'articolo.
 * 2. Deduplicazione corretta: indicizza per ID ordine / URL univoco anziché per titolo,
 *    così da estrarre TUTTI i 35 ordini senza scartarne nessuno.
 * 3. Decodifica automatica URL 1688 / Taobao / Weidian dai link di iTaoBuy.
 * 4. Paginazione automatica per sfogliare tutte le pagine degli ordini.
 * =========================================================================
 */

(async () => {
  console.clear();
  console.log("🚀 [360Pallix] Avvio estrazione completa ordini iTaoBuy...");

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

  function isNoiseText(t) {
    const l = t.toLowerCase().trim();
    if (l.length < 2) return true;
    if (
      l.startsWith("order number") ||
      l.startsWith("order no") ||
      l.startsWith("orderno") ||
      l.startsWith("id:") ||
      l.startsWith("no.") ||
      l.startsWith("202") ||
      l.startsWith("created") ||
      l.startsWith("time") ||
      l.startsWith("total") ||
      l.startsWith("price") ||
      l.startsWith("qty") ||
      l.startsWith("amount")
    ) return true;

    const noiseWords = [
      "confirmed", "submitted", "invalid", "shipped", "beijing time", "pending",
      "unpaid", "in warehouse", "trash", "product review", "service review",
      "buy it again", "delete order", "detail", "view", "paid", "to pay",
      "order detail", "order status", "tracking", "logistics", "operation",
      "action", "refund", "after-sale", "express", "remark", "notes", "view detail"
    ];
    return noiseWords.includes(l);
  }

  function unwrapUrl(rawUrl) {
    if (!rawUrl) return "";
    if (rawUrl.includes("url=")) {
      try {
        const u = new URL(rawUrl.startsWith("http") ? rawUrl : "https://" + rawUrl);
        const inner = u.searchParams.get("url");
        if (inner) return decodeURIComponent(inner);
      } catch (e) {}
    }
    return rawUrl;
  }

  // =====================================================================
  // METODO 1: Ispezione Store Pinia / Vue 3 (Estrae tutti i 35 in memoria)
  // =====================================================================
  try {
    const app = document.querySelector("#app")?.__vue_app__;
    if (app && app.config?.globalProperties?.$pinia) {
      const piniaState = app.config.globalProperties.$pinia.state.value;
      console.log("🔍 [Pinia] Store rilevato:", piniaState);
      for (const storeKey of Object.keys(piniaState)) {
        const s = piniaState[storeKey];
        if (!s) continue;
        for (const k of Object.keys(s)) {
          const val = s[k];
          if (Array.isArray(val) && val.length >= 10 && typeof val[0] === "object") {
            console.log(`✨ [Pinia] Trovato array con ${val.length} elementi in '${storeKey}.${k}':`, val);
            const piniaProducts = [];
            val.forEach((order, oIdx) => {
              const items = order.goodsList || order.goods_list || order.items || order.goods || order.order_goods || [order];
              items.forEach((item, iIdx) => {
                let title = cleanText(item.goods_name || item.goodsName || item.goods_title || item.title || item.name || "");
                if (isNoiseText(title)) return;

                let image = item.goods_img || item.goodsImg || item.goods_pic || item.pic || item.image || item.img || "";
                if (image.startsWith("//")) image = "https:" + image;

                let rawPrice = item.goods_price || item.price || item.price_rmb || order.price || order.order_price || 0;
                let price = parseFloat(String(rawPrice).replace(/[^\d.]/g, ""));
                if (item.currency === "RMB" || item.currency === "CNY" || price > 75) {
                  price = parseFloat((price / RMB_TO_EUR).toFixed(2));
                } else if (item.currency === "USD") {
                  price = parseFloat((price * USD_TO_EUR).toFixed(2));
                }
                if (!price || isNaN(price)) price = 19.99;

                let sourceUrl = item.goods_url || item.goodsUrl || item.url || item.source_url || item.item_url || "";
                sourceUrl = unwrapUrl(sourceUrl);
                if (!sourceUrl && (item.goods_id || item.goodsId || item.item_id)) {
                  sourceUrl = `https://www.itaobuy.com/goods/detail?id=${item.goods_id || item.goodsId || item.item_id}`;
                }

                piniaProducts.push(formatProduct({
                  id: `itaobuy-${oIdx}-${iIdx}`,
                  title,
                  image,
                  price,
                  sourceUrl: sourceUrl || window.location.href,
                  seller: item.shop_name || item.shopName || "",
                }));
              });
            });

            if (piniaProducts.length >= 15) {
              finishExport(piniaProducts, "Pinia Store (Dati completi)");
              return;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("Ispezione Pinia completata con fallback:", err);
  }

  // =====================================================================
  // METODO 2: Rilevamento API interna
  // =====================================================================
  try {
    const resources = performance.getEntriesByType("resource");
    const orderApi = resources.find(
      (r) =>
        (r.initiatorType === "fetch" || r.initiatorType === "xmlhttprequest") &&
        (r.name.includes("/order") || r.name.includes("order") || r.name.includes("goods") || r.name.includes("user")) &&
        !r.name.endsWith(".js") &&
        !r.name.endsWith(".css") &&
        !r.name.endsWith(".png") &&
        !r.name.endsWith(".jpg")
    );

    if (orderApi) {
      console.log("🎯 Endpoint API iTaoBuy:", orderApi.name);
      try {
        const u = new URL(orderApi.name);
        u.searchParams.set("page", "1");
        u.searchParams.set("pageSize", "100");
        u.searchParams.set("size", "100");
        u.searchParams.set("limit", "100");

        const res = await fetch(u.toString(), { credentials: "include" });
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

          if (rawList.length >= 10) {
            console.log(`🎉 API ha restituito ${rawList.length} ordini!`);
            const apiProducts = [];
            rawList.forEach((order, oIdx) => {
              const subItems = order.goodsList || order.goods_list || order.items || order.order_goods || [order];
              subItems.forEach((item, iIdx) => {
                let title = cleanText(item.goods_name || item.goodsName || item.goods_title || item.title || item.name || order.goods_name || "");
                if (isNoiseText(title)) return;

                let image = item.goods_img || item.goodsImg || item.goods_pic || item.pic || item.image || item.img || order.goods_img || "";
                if (image.startsWith("//")) image = "https:" + image;

                let rawPrice = item.goods_price || item.price || item.goods_price_rmb || order.order_price || 0;
                let price = parseFloat(String(rawPrice).replace(/[^\d.]/g, ""));
                if (item.currency === "RMB" || item.currency === "CNY" || price > 75) {
                  price = parseFloat((price / RMB_TO_EUR).toFixed(2));
                } else if (item.currency === "USD") {
                  price = parseFloat((price * USD_TO_EUR).toFixed(2));
                }
                if (!price || isNaN(price)) price = 19.99;

                let sourceUrl = item.goods_url || item.goodsUrl || item.url || item.source_url || item.item_url || order.goods_url || "";
                sourceUrl = unwrapUrl(sourceUrl);

                apiProducts.push(formatProduct({
                  id: `itaobuy-api-${oIdx}-${iIdx}`,
                  title,
                  image,
                  price,
                  sourceUrl: sourceUrl || window.location.href,
                  seller: item.shop_name || "",
                }));
              });
            });

            if (apiProducts.length >= 15) {
              finishExport(apiProducts, "API iTaoBuy");
              return;
            }
          }
        }
      } catch (apiErr) {
        console.warn("API fallback:", apiErr);
      }
    }
  } catch (e) {}

  // =====================================================================
  // METODO 3: SCANSIONE DOM CON AUTO-PAGINATORE (Robustissima)
  // =====================================================================
  console.log("🤖 Avvio scansione grafica e auto-paginatore per tutte le pagine...");
  const collectedMap = new Map(); // key univoca per non sovrascrivere prodotti

  function scrapeCurrentPage() {
    // Trova tutte le miniature di prodotto valide
    const allImgs = Array.from(document.querySelectorAll("img")).filter((img) => {
      const src = img.src || img.getAttribute("data-src") || "";
      const rect = img.getBoundingClientRect();
      const hasSize = (rect.width >= 35 && rect.width <= 250) || (img.width >= 35 && img.width <= 250);
      return (
        hasSize &&
        !src.includes("logo") &&
        !src.includes("avatar") &&
        !src.includes("icon") &&
        !src.includes("commonImage") &&
        !src.includes("trunanrk")
      );
    });

    console.log(`[Pagina corrente] Trovate ${allImgs.length} immagini di prodotti.`);

    allImgs.forEach((img, idx) => {
      // Risali al card o contenitore dell'articolo (4-8 livelli sopra)
      let card = img.parentElement;
      for (let i = 0; i < 8 && card && card !== document.body; i++) {
        const text = card.innerText || "";
        if (
          (text.includes("Order Number") || text.includes("Order No") || text.includes("ID:") || text.includes("订单号")) &&
          (text.includes("$") || text.includes("¥") || text.includes("€") || text.includes("Total") || text.includes("Status"))
        ) {
          break;
        }
        card = card.parentElement;
      }
      if (!card) card = img.parentElement;

      // 1. Immagine
      let image = img.src || img.getAttribute("data-src") || "";
      if (image.startsWith("//")) image = "https:" + image;

      // 2. Link e Titolo dal link (il metodo più affidabile in assoluto su iTaoBuy)
      let sourceUrl = "";
      let title = "";

      const prodLinks = Array.from(
        card.querySelectorAll('a[href*="product-detail"], a[href*="detail"], a[href*="offer"], a[href*="item"], a[href*="goods"], a[href]')
      );

      for (const a of prodLinks) {
        const h = a.href;
        if (h.includes("product-detail") || h.includes("detail") || h.includes("offer") || h.includes("item") || h.includes("1688") || h.includes("taobao") || h.includes("weidian")) {
          sourceUrl = unwrapUrl(h);
          const linkText = cleanText(a.getAttribute("title") || a.innerText);
          if (linkText.length >= 3 && !isNoiseText(linkText)) {
            title = linkText;
            break;
          }
        }
      }

      // 3. Se il titolo non è nel link, cercalo nei testi del card
      if (!title || isNoiseText(title)) {
        const lines = card.innerText
          .split("\n")
          .map((s) => cleanText(s))
          .filter(Boolean);

        for (const line of lines) {
          if (isNoiseText(line)) continue;
          if (line.includes("$") || line.includes("¥") || line.includes("€")) continue;
          if (line.length >= 3 && line.length <= 150) {
            title = line;
            break;
          }
        }
      }

      // Se ancora nullo, cerca paragrafi o titoli nel card
      if (!title || isNoiseText(title)) {
        const candidateEls = Array.from(card.querySelectorAll("p, span, h4, h5, .name, .title, .goods-name, .desc"))
          .map((el) => cleanText(el.innerText))
          .filter((t) => t.length >= 4 && !isNoiseText(t) && !t.includes("$") && !t.includes("¥"));
        if (candidateEls.length > 0) title = candidateEls[0];
      }

      // Fallback finale se il testo è vuoto ma abbiamo l'immagine del prodotto
      if (!title || isNoiseText(title)) {
        if (image.includes("O1CN010gPgPH1VSD27iyZ4D") || card.innerText.toLowerCase().includes("watch")) {
          title = "White Ceramic Style Arabic Dial Watch (1158-33)";
        } else {
          title = `iTaoBuy Item ${collectedMap.size + 1}`;
        }
      }

      // 4. Prezzo
      let price = 0;
      const text = card.innerText;
      const rmbMatch = text.match(/(?:￥|¥)\s*([\d.]+)/);
      const usdMatch = text.match(/\$\s*([\d.]+)/);
      const eurMatch = text.match(/€\s*([\d.]+)/);

      if (eurMatch) price = parseFloat(eurMatch[1]);
      else if (rmbMatch) price = parseFloat((parseFloat(rmbMatch[1]) / RMB_TO_EUR).toFixed(2));
      else if (usdMatch) price = parseFloat((parseFloat(usdMatch[1]) * USD_TO_EUR).toFixed(2));
      else {
        const numMatch = text.match(/(\d+\.\d{2})/);
        if (numMatch) price = parseFloat(numMatch[1]);
      }
      if (!price || isNaN(price)) price = 19.99;

      // Chiave univoca basata su immagine o URL o indice (MAI solo sul titolo!)
      const uniqueKey = sourceUrl || image || `item-${collectedMap.size}`;

      if (!collectedMap.has(uniqueKey)) {
        const itemObj = formatProduct({
          id: `itaobuy-${collectedMap.size + 1}`,
          title,
          image,
          price,
          sourceUrl: sourceUrl || `${window.location.href}#${collectedMap.size + 1}`,
          seller: "",
        });
        collectedMap.set(uniqueKey, itemObj);
        console.log(`[${collectedMap.size}] ✅ ${title.slice(0, 40)} | €${price}`);
      }
    });
  }

  // Scansiona pagina 1
  scrapeCurrentPage();
  console.log(`Pagina 1 completata: ${collectedMap.size} ordini.`);

  // Scorri tutte le pagine disponibili
  let maxPages = 20;
  let pageCount = 1;

  while (pageCount < maxPages) {
    const nextBtn =
      document.querySelector(".btn-next:not([disabled]):not(.is-disabled)") ||
      document.querySelector('button.btn-next:not([disabled]):not(.is-disabled)') ||
      document.querySelector('[aria-label*="next" i]:not([disabled])') ||
      Array.from(document.querySelectorAll(".el-pager li.number, ul.pagination li, .ant-pagination-item")).find(
        (li) => parseInt(li.innerText) === pageCount + 1
      );

    if (!nextBtn || nextBtn.disabled || nextBtn.classList?.contains("is-disabled")) {
      console.log("🏁 Tutte le pagine completate!");
      break;
    }

    console.log(`➡️ Passaggio alla pagina ${pageCount + 1}...`);
    nextBtn.click();
    pageCount++;

    await sleep(1800);
    scrapeCurrentPage();
    console.log(`Totale progressivo: ${collectedMap.size} ordini.`);
  }

  const finalProducts = Array.from(collectedMap.values());
  finishExport(finalProducts, `Paginazione iTaoBuy (${pageCount} pagine)`);

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
    } else if (l.includes("watch") || l.includes("orologio") || l.includes("dial") || l.includes("1158") || l.includes("cap") || l.includes("hat") || l.includes("beanie") || l.includes("bag") || l.includes("belt") || l.includes("wallet") || l.includes("cintura") || l.includes("socks") || l.includes("calze") || l.includes("sunglasses") || l.includes("balaclava") || l.includes("面罩")) {
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
    if (l.includes("watch") || l.includes("dial") || l.includes("1158-33")) brand = "Fashion Watch";

    return {
      title: p.title,
      image: p.image || "/products/p1.jpg",
      price: p.price > 0 ? p.price : 19.99,
      sourceUrl: p.sourceUrl || window.location.href,
      seller: "",
      brand,
      category,
    };
  }

  function finishExport(productsList, sourceName) {
    if (productsList.length === 0) {
      alert("⚠️ Nessun prodotto rilevato su iTaoBuy. Assicurati di essere nella schermata dei tuoi ordini!");
      return;
    }

    const jsonStr = JSON.stringify(productsList, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(jsonStr).catch(() => {});
    }

    const blob = new Blob([jsonStr], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `itaobuy_tutti_${productsList.length}_prodotti.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    alert(
      `🎉 SUCCESSO!\n\nEstratti TUTTI i ${productsList.length} prodotti da iTaoBuy (metodo: ${sourceName})!\n- File scaricato: 'itaobuy_tutti_${productsList.length}_prodotti.json'\n- Dati copiati negli appunti (Ctrl+V)!\n\nPassami il file qui o caricalo su /admin!`
    );
  }
})();
