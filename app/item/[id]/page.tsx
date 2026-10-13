import Link from "next/link";
import { notFound } from "next/navigation";
import { PRODUCTS, eur } from "@/lib/products";
import { getProductById } from "@/lib/product-store";

export const dynamicParams = true;
export const revalidate = 0;

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

export default async function Item({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProductById(id);
  if (!p) notFound();

  return (
    <main className="item">
      <Link href="/spreadsheet" className="back">← Spreadsheet</Link>
      <div className="item-grid">
        <div className="item-img">
          <img
            src={p.image}
            alt={p.title}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='500' fill='none'%3E%3Crect width='100%25' height='100%25' fill='%23111'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='16'%3EImmagine non disp.%3C/text%3E%3C/svg%3E";
            }}
          />
        </div>
        <div className="item-info glass">
          <div className="eyebrow">{p.category}</div>
          <h1>{p.title}</h1>
          <div className="kv"><span>Prezzo</span><b>{eur(p.price)}</b></div>
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
                  background: "linear-gradient(90deg, #16a34a, #15803d)",
                  borderColor: "rgba(34, 197, 94, 0.4)",
                  boxShadow: "0 8px 24px rgba(22, 163, 74, 0.35)",
                }}
                href={p.cssbuyUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
              >
                🛒 Compra su CSSBuy
              </a>
            )}
            {p.doppelfitUrl && (
              <a
                className="buy"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: "12px 20px",
                  fontSize: 14,
                  background: "linear-gradient(90deg, #6366f1, #4f46e5)",
                  borderColor: "rgba(99, 102, 241, 0.4)",
                  boxShadow: "0 8px 24px rgba(79, 70, 229, 0.35)",
                }}
                href={p.doppelfitUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
              >
                🔍 Visualizza su Doppelfit
              </a>
            )}
            {!p.cssbuyUrl && !p.doppelfitUrl && (
              <span className="buy" style={{ display: "inline-block", textAlign: "center" }}>
                Pallix Buy
              </span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
