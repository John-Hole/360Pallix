/**
 * =========================================================================
 * 360PALLIX - ESTRATTORE AUTOMATICO COMPLETO TUTTI I 75 ORDINI CSSBUY (v3)
 * =========================================================================
 * 
 * Novità di questa versione:
 * 1. Prova a chiamare direttamente l'API interna di CSSBuy per scaricare tutti
 *    i 75 ordini in 1 secondo con i veri link originali Weidian/Taobao/1688.
 * 2. Se l'API richiede parametri speciali, attiva l'AUTO-PAGINATORE:
 *    naviga automaticamente le pagine (1, 2, 3... fino a 8), raccoglie
 *    tutti gli ordini di ogni pagina e genera il file finale con tutti i 75 prodotti!
 * =========================================================================
 */

(async () => {
  console.clear();
  console.log("🚀 [360Pallix] Avvio estrazione completa di TUTTI i 75 ordini CSSBuy...");

  const RMB_TO_EUR = 7.8;
  const USD_TO_EUR = 0.92;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // =====================================================================
  // METODO 1: Rilevamento API ordini e fetch di tutte le pagine
  // =====================================================================
  try {
    const resources = performance.getEntriesByType("resource");
    const orderApiEntry = resources.find(
      (r) =>
        (r.initiatorType === "fetch" || r.initiatorType === "xmlhttprequest") &&
        (r.name.includes("/order") || r.name.includes("order") || r.name.includes("goods")) &&
        !r.name.endsWith(".js") &&
        !r.name.endsWith(".css") &&
        !r.name.endsWith(".png") &&
        !r.name.endsWith(".jpg")
    );

    if (orderApiEntry) {
      console.log("🎯 Trovato endpoint API ordini:", orderApiEntry.name);
      const apiUrl = new URL(orderApiEntry.name);

      // Prova a richiedere tutti i 75 ordini con pageSize elevato
      apiUrl.searchParams.set("page", "1");
      apiUrl.searchParams.set("pageSize", "100");
      apiUrl.searchParams.set("size", "100");
      apiUrl.searchParams.set("limit", "100");

      try {
        const res = await fetch(apiUrl.toString(), { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          console.log("📦 Risposta API ricevuta:", json);

          // Cerca l'array dei dati all'interno del JSON
          let rawList = [];
          const findArray = (obj, d = 0) => {
            if (!obj || d > 4) return;
            if (Array.isArray(obj) && obj.length > rawList.length) rawList = obj;
            else if (typeof obj === "object") {
              for (const k of Object.keys(obj)) findArray(obj[k], d + 1);
            }
          };
          findArray(json);

          if (rawList.length >= 20) {
            console.log(`🎉 API ha restituito ${rawList.length} ordini! Formattazione in corso...`);
            const allProducts = [];
            rawList.forEach((order) => {
              const subItems = order.goodsList || order.goods_list || order.items || order.order_goods || [order];
              subItems.forEach((item) => {
                let title = item.goods_name || item.goods_title || item.title || item.name || order.goods_name || "";
                title = title.replace(/✎/g, "").replace(/\s+/g, " ").trim();
                if (!title || title.length < 2) return;

                let image = item.goods_img || item.goods_pic || item.pic || item.image || item.img || order.goods_img || "";
                if (image.startsWith("//")) image = "https:" + image;

                let rawPrice = item.goods_price || item.price || item.goods_price_rmb || order.order_price || 0;
                let price = parseFloat(String(rawPrice).replace(/[^\d.]/g, ""));
                if (item.currency === "RMB" || item.currency === "CNY" || price > 70) {
                  price = parseFloat((price / RMB_TO_EUR).toFixed(2));
                } else if (item.currency === "USD") {
                  price = parseFloat((price * USD_TO_EUR).toFixed(2));
                }
                if (!price || isNaN(price)) price = 19.99;

                let sourceUrl = item.goods_url || item.url || item.source_url || item.item_url || order.goods_url || "";
                if (!sourceUrl && (item.goods_id || item.item_id)) {
                  sourceUrl = `https://www.cssbuy.com/item-${item.goods_id || item.item_id}.html`;
                }

                allProducts.push(formatProduct({ title, image, price, sourceUrl, seller: item.shop_name || "CSSBuy" }));
              });
            });

            if (allProducts.length >= 20) {
              finishExport(allProducts, "API");
              return;
            }
          }
        }
      } catch (apiErr) {
        console.warn("Chiamata API fallita, passo all'auto-paginatore:", apiErr);
      }
    }
  } catch (e) {
    console.warn("Rilevamento API non riuscito:", e);
  }

  // =====================================================================
  // METODO 2: AUTO-PAGINATORE (Naviga tutte le pagine e raccoglie tutti i 75 ordini)
  // =====================================================================
  console.log("🤖 Avvio AUTO-PAGINATORE per scorrere tutte le pagine di CSSBuy...");

  const collectedProducts = new Map(); // key: title o orderId

  function scrapeCurrentPage() {
    // Trova tutte le card di ordine (blocchi contenenti ID: e Total)
    const allDivs = Array.from(document.querySelectorAll("div"));
    const orderCards = allDivs.filter((el) => {
      const text = el.innerText || "";
      return (
        text.includes("ID:") &&
        (text.includes("Total") || text.includes("¥") || text.includes("$")) &&
        el.querySelectorAll("img").length >= 1 &&
        el.querySelectorAll("div").length <= 25 &&
        el.children.length >= 2
      );
    });

    console.log(`[Pagina corrente] Trovate ${orderCards.length} card ordine.`);

    orderCards.forEach((card) => {
      // 1. Immagine reale del prodotto
      const imgs = Array.from(card.querySelectorAll("img")).filter((img) => {
        const src = img.src || img.getAttribute("data-src") || "";
        return (
          !src.includes("commonImage/cssbuy.png") &&
          !src.includes("trunanrk.png") &&
          !src.includes("logo") &&
          !src.includes("avatar")
        );
      });
      let image = imgs[0] ? imgs[0].src || imgs[0].getAttribute("data-src") || "" : "";
      if (image.startsWith("//")) image = "https:" + image;

      // 2. Titolo (testo con il simbolo ✎ o prima riga significativa)
      let title = "";
      const lines = card.innerText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

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
          line.includes("Beijing")
        ) {
          continue;
        }
        if (line.includes("✎") || (line.length >= 4 && line.length <= 150)) {
          title = line.replace(/✎/g, "").trim();
          break;
        }
      }
      if (!title) return;

      // 3. Prezzo
      let price = 0;
      const rmbMatch = card.innerText.match(/(?:￥|¥)\s*([\d.]+)/);
      const usdMatch = card.innerText.match(/\$\s*([\d.]+)/);
      const eurMatch = card.innerText.match(/€\s*([\d.]+)/);

      if (eurMatch) price = parseFloat(eurMatch[1]);
      else if (rmbMatch) price = parseFloat((parseFloat(rmbMatch[1]) / RMB_TO_EUR).toFixed(2));
      else if (usdMatch) price = parseFloat((parseFloat(usdMatch[1]) * USD_TO_EUR).toFixed(2));
      else price = 19.99;

      // 4. Link sorgente
      let sourceUrl = "";
      const links = Array.from(card.querySelectorAll("a[href]"));
      for (const a of links) {
        if (
          a.href.includes("weidian") ||
          a.href.includes("taobao") ||
          a.href.includes("1688") ||
          a.href.includes("item") ||
          a.href.includes("detail")
        ) {
          sourceUrl = a.href;
          break;
        }
      }

      // Se non c'è link nel card, controlla se c'è un ID ordine
      const idMatch = card.innerText.match(/ID:\s*([A-Za-z0-9*]+)/);
      const orderId = idMatch ? idMatch[1] : title;

      if (!collectedProducts.has(title)) {
        collectedProducts.set(
          title,
          formatProduct({
            title,
            image,
            price,
            sourceUrl: sourceUrl || `https://www.cssbuy.com/shop/cate/order#${orderId}`,
            seller: "CSSBuy Order",
          })
        );
      }
    });
  }

  // Esegui scansione pagina iniziale
  scrapeCurrentPage();
  console.log(`Raccolti finora: ${collectedProducts.size} ordini.`);

  // Trova e naviga le pagine successive
  let maxPages = 15;
  let pageCount = 1;

  while (pageCount < maxPages) {
    // Trova il pulsante 'Avanti' o il numero di pagina successivo
    const nextBtn =
      document.querySelector(".btn-next:not([disabled])") ||
      document.querySelector("button.btn-next:not(.is-disabled)") ||
      Array.from(document.querySelectorAll(".el-pager li.number")).find(
        (li) => parseInt(li.innerText) === pageCount + 1
      );

    if (!nextBtn || nextBtn.disabled || nextBtn.classList?.contains("is-disabled")) {
      console.log("🏁 Raggiunta l'ultima pagina disponibile o nessun altro pulsante 'Avanti'.");
      break;
    }

    console.log(`➡️ Passaggio alla pagina ${pageCount + 1}...`);
    nextBtn.click();
    pageCount++;

    // Attendi caricamento (1.5 secondi)
    await sleep(1500);
    scrapeCurrentPage();
    console.log(`Totale progressivo: ${collectedProducts.size} ordini.`);
  }

  const finalProducts = Array.from(collectedProducts.values());
  finishExport(finalProducts, `Paginazione (${pageCount} pagine scansionate)`);

  // =====================================================================
  // Funzioni di supporto formattazione ed esportazione
  // =====================================================================
  function formatProduct(p) {
    const l = p.title.toLowerCase();
    let category = "OTHER";
    if (
      l.includes("shoe") ||
      l.includes("sneaker") ||
      l.includes("dunk") ||
      l.includes("jordan") ||
      l.includes("force") ||
      l.includes("air") ||
      l.includes("kobe") ||
      l.includes("yeezy") ||
      l.includes("adizero") ||
      l.includes("runner") ||
      l.includes("hoka") ||
      l.includes("travis") ||
      l.includes("scarpe")
    ) {
      category = "SNEAKERS";
    } else if (l.includes("hoodie") || l.includes("felpa") || l.includes("sweater") || l.includes("zip")) {
      category = "HOODIE";
    } else if (l.includes("tee") || l.includes("t-shirt") || l.includes("maglia") || l.includes("shirt")) {
      category = "TSHIRT";
    } else if (l.includes("pant") || l.includes("jeans") || l.includes("short") || l.includes("jogger") || l.includes("trousers") || l.includes("pantaloni")) {
      category = "PANTS";
    } else if (l.includes("jacket") || l.includes("puffer") || l.includes("coat") || l.includes("giacca") || l.includes("windbreaker") || l.includes("down") || l.includes("vezere") || l.includes("moncler")) {
      category = "JACKET";
    } else if (l.includes("cap") || l.includes("hat") || l.includes("beanie") || l.includes("bag") || l.includes("belt") || l.includes("wallet") || l.includes("cintura") || l.includes("socks") || l.includes("calze")) {
      category = "ACCESSORIES";
    }

    let brand = "—";
    const brands = ["Nike", "Adidas", "Jordan", "Supreme", "Stussy", "Trapstar", "Hellstar", "Syna", "Bape", "Chrome Hearts", "Gallery Dept", "Balenciaga", "Prada", "Moncler", "Gucci", "Louis Vuitton", "Rick Owens", "Corteiz", "Stone Island", "Arc'teryx", "Ralph Lauren", "Sp5der", "Dior"];
    for (const b of brands) {
      if (l.includes(b.toLowerCase())) {
        brand = b;
        break;
      }
    }
    if (l.includes("vezere")) brand = "Moncler";
    if (l.includes("adizero")) brand = "Adidas";
    if (l.includes("cd") || l.includes("d-brand")) brand = "Dior";

    return {
      title: p.title,
      image: p.image || "/products/p1.jpg",
      price: p.price > 0 ? p.price : 19.99,
      sourceUrl: p.sourceUrl || "https://www.cssbuy.com",
      seller: p.seller || "CSSBuy Order",
      brand,
      category,
    };
  }

  function finishExport(productsList, sourceName) {
    if (productsList.length === 0) {
      alert("⚠️ Nessun prodotto rilevato. Assicurati che gli ordini siano visibili a schermo!");
      return;
    }

    const jsonStr = JSON.stringify(productsList, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(jsonStr).catch(() => {});
    }

    const blob = new Blob([jsonStr], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cssbuy_tutti_${productsList.length}_prodotti.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    alert(
      `🎉 SUCCESSO!\n\nEstratti TUTTI i ${productsList.length} prodotti da CSSBuy (metodo: ${sourceName})!\n- Scaricato 'cssbuy_tutti_${productsList.length}_prodotti.json'\n- Copiato negli appunti (Ctrl+V)!\n\nIncolla qui in chat o carica su /admin!`
    );
  }
})();
