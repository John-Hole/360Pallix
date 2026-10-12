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
  const path =
    p.platform === "weidian" ? `item-micro-${p.itemId}.html`
    : p.platform === "1688" ? `item-1688-${p.itemId}.html`
    : `item-${p.itemId}.html`;
  const ref = process.env.CSSBUY_REF || "";
  return `https://www.cssbuy.com/${path}${ref ? `?promotionCode=${encodeURIComponent(ref)}` : ""}`;
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
