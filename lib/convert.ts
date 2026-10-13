export type Platform = "weidian" | "taobao" | "1688";

export type Parsed = { platform: Platform; itemId: string; sourceUrl: string };

/**
 * Risolve e analizza il link fornito. Supporta:
 * - Weidian (weidian.com / koudai.com)
 * - Taobao / Tmall (taobao.com / tmall.com)
 * - 1688 (1688.com)
 * - CSSBuy (cssbuy.com)
 * - Link corti CSSBuy (cssb.uy)
 */
export async function parseSourceUrl(raw: string): Promise<Parsed | null> {
  let uStr = raw.trim();
  if (!uStr) return null;

  // Se è un link corto cssb.uy, risolve il redirect 302
  if (uStr.includes("cssb.uy/")) {
    try {
      const res = await fetch(uStr, { redirect: "manual" });
      const loc = res.headers.get("location");
      if (loc) uStr = loc;
    } catch {
      // fallback
    }
  }

  let u: URL;
  try {
    u = new URL(uStr);
  } catch {
    return null;
  }
  const h = u.hostname.toLowerCase();

  // Se è già un link CSSBuy, estraiamo l'ID e la piattaforma d'origine
  if (h.includes("cssbuy.com")) {
    const id = u.searchParams.get("id");
    const type = u.searchParams.get("type");
    let platform: Platform = "weidian";

    if (type === "taobao") platform = "taobao";
    else if (type === "1688") platform = "1688";
    else if (type === "micro" || type === "weidian") platform = "weidian";
    else if (uStr.includes("item-micro-")) platform = "weidian";
    else if (uStr.includes("item-1688-")) platform = "1688";

    const finalId = id || uStr.match(/item-(?:micro-|1688-)?(\d+)/)?.[1];
    if (finalId) {
      const sourceUrl =
        platform === "weidian"
          ? `https://weidian.com/item.html?itemID=${finalId}`
          : platform === "1688"
          ? `https://detail.1688.com/offer/${finalId}.html`
          : `https://item.taobao.com/item.htm?id=${finalId}`;
      return { platform, itemId: finalId, sourceUrl };
    }
  }

  // iTaoBuy (itaobuy.com)
  if (h.includes("itaobuy.com")) {
    const id = u.searchParams.get("id") || u.searchParams.get("goods_id") || u.searchParams.get("itemId");
    const type = u.searchParams.get("type") || u.searchParams.get("channel");
    let platform: Platform = "weidian";

    if (type === "taobao" || type === "tb") platform = "taobao";
    else if (type === "1688" || type === "ali") platform = "1688";
    else if (type === "weidian" || type === "wd") platform = "weidian";

    const finalId = id || uStr.match(/(?:goods|item|detail|offer)[/-](\d+)/)?.[1];
    if (finalId) {
      const sourceUrl =
        platform === "weidian"
          ? `https://weidian.com/item.html?itemID=${finalId}`
          : platform === "1688"
          ? `https://detail.1688.com/offer/${finalId}.html`
          : `https://item.taobao.com/item.htm?id=${finalId}`;
      return { platform, itemId: finalId, sourceUrl };
    }
  }

  // Weidian
  if (h.includes("weidian.com") || h.includes("koudai.com")) {
    const id = u.searchParams.get("itemID") || u.searchParams.get("itemId");
    return id ? { platform: "weidian", itemId: id, sourceUrl: uStr } : null;
  }

  // Taobao / Tmall
  if (h.includes("taobao.com") || h.includes("tmall.com")) {
    const id = u.searchParams.get("id");
    return id ? { platform: "taobao", itemId: id, sourceUrl: uStr } : null;
  }

  // 1688
  if (h.includes("1688.com")) {
    const m = u.pathname.match(/offer\/(\d+)/);
    return m ? { platform: "1688", itemId: m[1], sourceUrl: uStr } : null;
  }

  return null;
}

/**
 * Link prodotto CSSBuy con codice affiliato permanente (promotionCode).
 * Formato ufficiale identico a quello dei link verificati generati da CSSBuy.
 */
export function cssbuyLink(p: Parsed): string {
  const ref = process.env.CSSBUY_PROMOTION_CODE || process.env.CSSBUY_REF || "2ab90a34eeaa437b";
  const type = p.platform === "weidian" ? "weidian" : p.platform;
  const prefix = p.platform === "weidian" ? "micro" : p.platform === "1688" ? "1688" : "taobao";
  return `https://www.cssbuy.com/shop/goodsDetail?promotionCode=${encodeURIComponent(ref)}&item-${prefix}-${p.itemId}.html&id=${p.itemId}&type=${type}`;
}

/**
 * Assicura che un link o ID Doppelfit contenga sempre il codice referral verificato (PPnCbrec).
 */
export function formatDoppelfitLink(input: string): string {
  const raw = (input || "").trim();
  if (!raw) return "";
  const ref = process.env.DOPPELFIT_REF || "PPnCbrec";

  // Se è solo l'ID o lo slug dell'item (es. 5YYUD0ImPn3a4GStPWbkyA oppure x5sUY8JQ)
  if (/^[a-zA-Z0-9_-]{4,36}$/.test(raw) && !raw.includes(".")) {
    return `https://doppel.fit/item/${raw}?ref=${encodeURIComponent(ref)}`;
  }

  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (u.hostname.includes("doppel.fit")) {
      u.searchParams.set("ref", ref);
      return u.toString();
    }
  } catch {
    // fallback
  }
  return raw;
}

/** Link Doppelfit di fallback configurabile */
export function doppelfitLink(p: Parsed): string {
  const ref = process.env.DOPPELFIT_REF || "PPnCbrec";
  return `https://doppel.fit/?ref=${encodeURIComponent(ref)}`;
}

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const meta = (html: string, prop: string) => {
  const m =
    html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`, "i")) ||
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`, "i"));
  return m ? decode(m[1]) : "";
};

/** Tentativo best-effort di leggere titolo/immagine/prezzo. */
export async function scrapeInfo(url: string) {
  const out = { title: "", image: "", price: "" };
  try {
    const r = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36" },
      signal: AbortSignal.timeout(6000),
    });
    const html = await r.text();
    out.title = meta(html, "og:title") || (html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "");
    if (out.title.includes("商品详情") || out.title.includes("weidian")) {
      out.title = "";
    }
    out.image = meta(html, "og:image");
    out.price = meta(html, "product:price:amount") || meta(html, "og:price:amount");
  } catch {
    // Lascia vuoto se non reperibile
  }
  return out;
}
