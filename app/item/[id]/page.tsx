import Link from "next/link";
import { notFound } from "next/navigation";
import { PRODUCTS, eur, rmb, RMB_TO_EUR } from "@/lib/products";
import { getProductById } from "@/lib/product-store";
import { getProductDoppelfitUrl } from "@/lib/convert";
import ItemImage from "./ItemImage";
import { TikTokIcon } from "@/components/TikTokIcon";
import { SiteFooter } from "@/components/SiteFooter";

export const dynamicParams = true;
export const revalidate = 0;

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

export default async function Item({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProductById(id);
  if (!p) notFound();

  const doppelUrl = getProductDoppelfitUrl(p);

  return (
    <main className="item">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Link href="/spreadsheet" className="back">
          ← Spreadsheet
        </Link>
        <a
          href="https://www.tiktok.com/@360pallix"
          target="_blank"
          rel="noopener noreferrer"
          className="sheet-social-pill"
          title="Segui @360pallix su TikTok"
        >
          <TikTokIcon size={13} />
          <span>TikTok @360pallix</span>
        </a>
      </div>
      <div className="item-grid">
        <div className="item-img">
          <ItemImage src={p.image} alt={p.title} />
        </div>
        <div className="item-info glass">
          <div className="eyebrow">{p.category}</div>
          <h1>{p.title}</h1>
          <div className="kv"><span>Prezzo</span><b>{eur(p.price)}</b></div>
          <div className="kv"><span>Prezzo originale</span><b style={{ color: "#a1a1aa" }}>{rmb(p.priceRmb ?? p.price * RMB_TO_EUR)}</b></div>
          {p.seller && p.seller !== "—" && p.seller !== "-" && (
            <div className="kv"><span>Seller</span><b>{p.seller}</b></div>
          )}
          <div className="kv"><span>Brand</span><b>{p.brand}</b></div>
          <div className="kv"><span>Categoria</span><b>{p.category}</b></div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
            {p.cssbuyUrl && (
              <a
                className="buy"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#000000",
                  background: "#ffffff",
                  borderColor: "#ffffff",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
                }}
                href={p.cssbuyUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
              >
                🛒 Compra su CSSBuy
              </a>
            )}
            {doppelUrl && (
              <a
                className="buy"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#ffffff",
                  background: "rgba(255, 255, 255, 0.08)",
                  borderColor: "rgba(255, 255, 255, 0.16)",
                  boxShadow: "none",
                }}
                href={doppelUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
              >
                🔍 Visualizza su Doppelfit
              </a>
            )}
            {!p.cssbuyUrl && !doppelUrl && (
              <span className="buy" style={{ display: "inline-block", textAlign: "center" }}>
                Pallix Buy
              </span>
            )}
          </div>
        </div>
      </div>

      <SiteFooter subtitle="Scheda prodotto · Sincronizzazione automatica 360Pallix." />
    </main>
  );
}
