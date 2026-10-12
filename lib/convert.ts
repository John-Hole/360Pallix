export type Platform = "weidian" | "taobao" | "1688";

export type Parsed = { platform: Platform; itemId: string; sourceUrl: string };

/** Riconosce Weidian / Taobao(Tmall) / 1688 e ne estrae l'ID prodotto. */
export function parseSourceUrl(raw: string): Parsed | null {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  const h = u.hostname.toLowerCase();
  if (h.includes("weidian.com") || h.includes("koudai.com")) {
    const id = u.searchParams.get("itemID") || u.searchParams.get("itemId");
    return id ? { platform: "weidian", itemId: id, sourceUrl: raw.trim() } : null;
  }
  if (h.includes("taobao.com") || h.includes("tmall.com")) {
    const id = u.searchParams.get("id");
    return id ? { platform: "taobao", itemId: id, sourceUrl: raw.trim() } : null;
  }
  if (h.includes("1688.com")) {
    const m = u.pathname.match(/offer\/(\d+)/);
    return m ? { platform: "1688", itemId: m[1], sourceUrl: raw.trim() } : null;
  }
  return null;
}

/** Link prodotto CSSBuy con codice affiliato. */
export function cssbuyLink(p: Parsed): string {
  // Formato reale della pagina prodotto CSSBuy (visto dallo screenshot). type: micro = Weidian.
  const type = p.platform === "weidian" ? "micro" : p.platform;
  return `https://www.cssbuy.com/shop/goodsDetail?id=${p.itemId}&type=${type}`;
}

/** Genera il link affiliato corto (cssb.uy/...) chiamando l'API del Creator Center con la tua sessione. */
export async function cssbuyShortLink(sourceUrl: string): Promise<{ url?: string; error?: string }> {
  const token = process.env.CSSBUY_TOKEN;
  if (!token) return { error: "CSSBUY_TOKEN mancante in .env.local" };
  try {
    const r = await fetch("https://www.cssbuy.com/api/v3/user/goods/shortLink", {
      method: "POST",
      headers: {
        "content-type": "application/json;charset=UTF-8",
        accept: "application/json, text/plain, */*",
        authorization: `Bearer ${token}`,
        origin: "https://www.cssbuy.com",
        referer: "https://www.cssbuy.com/shop/affiliate",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        ...(process.env.CSSBUY_COOKIE ? { cookie: process.env.CSSBUY_COOKIE } : {}),
        ...(process.env.CSSBUY_DEVICE_ID ? { "device-id": process.env.CSSBUY_DEVICE_ID } : {}),
      },
      body: JSON.stringify({ goodsUrl: sourceUrl }),
      signal: AbortSignal.timeout(10000),
    });
    const d = await r.json();
    if (d.code === 0 && d.data) return { url: d.data };
    return { error: d.msg || `Risposta CSSBuy ${r.status} (token scaduto?)` };
  } catch (e) {
    return { error: "Errore chiamata CSSBuy: " + (e as Error).message };
  }
}

/** Link Doppelfit: usa il template in .env (segnaposto {url} = link sorgente codificato, {id} = ID). */
export function doppelfitLink(p: Parsed): string {
  const tpl = process.env.DOPPELFIT_URL_TEMPLATE || "https://www.doppelfit.com/?url={url}";
  return tpl.replace("{url}", encodeURIComponent(p.sourceUrl)).replace("{id}", p.itemId);
}

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const meta = (html: string, prop: string) => {
  const m =
    html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`, "i")) ||
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`, "i"));
  return m ? decode(m[1]) : "";
};

/** Tentativo best-effort di leggere titolo/immagine/prezzo. Se fallisce restituisce campi vuoti. */
export async function scrapeInfo(url: string) {
  const out = { title: "", image: "", price: "" };
  try {
    const r = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36" },
      signal: AbortSignal.timeout(8000),
    });
    const html = await r.text();
    out.title = meta(html, "og:title") || (html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "");
    out.image = meta(html, "og:image");
    out.price = meta(html, "product:price:amount") || meta(html, "og:price:amount");
  } catch { /* lascia vuoto */ }
  return out;
}
