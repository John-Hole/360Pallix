import Link from "next/link";
import { notFound } from "next/navigation";
import { PRODUCTS, eur } from "@/lib/products";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

export default async function Item({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) notFound();
  return (
    <main className="item">
      <Link href="/spreadsheet" className="back">← Spreadsheet</Link>
      <div className="item-grid">
        <div className="item-img"><img src={p.image} alt={p.title} /></div>
        <div className="item-info glass">
          <div className="eyebrow">{p.category}</div>
          <h1>{p.title}</h1>
          <div className="kv"><span>Prezzo</span><b>{eur(p.price)}</b></div>
          <div className="kv"><span>Seller</span><b>{p.seller}</b></div>
          <div className="kv"><span>Brand</span><b>{p.brand}</b></div>
          <div className="kv"><span>Categoria</span><b>{p.category}</b></div>
          <span className="buy" style={{ marginTop: 20 }}>Pallix Buy</span>
        </div>
      </div>
    </main>
  );
}
