import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { BASE_PRODUCTS, Product } from "@/lib/products";
import { formatDoppelfitLink, parseSourceUrl, cssbuyLink } from "@/lib/convert";

const FILE = path.join(process.cwd(), "data", "products.json");

export async function GET() {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const extra = JSON.parse(raw) as Product[];
    return NextResponse.json([...extra, ...BASE_PRODUCTS], {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json(BASE_PRODUCTS);
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  if (body.password !== (process.env.ADMIN_PASSWORD || "cambiami")) {
    return NextResponse.json({ error: "Password errata" }, { status: 401 });
  }

  let list: Product[] = [];
  try {
    const raw = await fs.readFile(FILE, "utf8");
    list = JSON.parse(raw);
  } catch {
    list = [];
  }

  // Supporto importazione massiva (batch import)
  if (Array.isArray(body.products)) {
    const imported: Product[] = [];
    for (const item of body.products) {
      const price = parseFloat(String(item.price).replace(",", "."));
      if (!item.title || isNaN(price)) continue;

      let cssbuyUrl = item.cssbuyUrl;
      if (!cssbuyUrl && item.sourceUrl) {
        try {
          const parsed = await parseSourceUrl(item.sourceUrl);
          if (parsed) {
            cssbuyUrl = cssbuyLink(parsed);
          } else if (item.sourceUrl.includes("cssbuy.com")) {
            const u = new URL(item.sourceUrl);
            u.searchParams.set("promotionCode", process.env.CSSBUY_PROMOTION_CODE || "2ab90a34eeaa437b");
            cssbuyUrl = u.toString();
          }
        } catch {
          cssbuyUrl = item.sourceUrl;
        }
      }

      const slug = String(item.title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 36);

      const p: Product = {
        id: item.id || `${slug}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        title: item.title,
        seller: item.seller || "—",
        category: item.category || "OTHER",
        brand: item.brand || "—",
        price,
        image: item.image || "/products/p1.jpg",
        cssbuyUrl: cssbuyUrl || undefined,
        doppelfitUrl: item.doppelfitUrl ? formatDoppelfitLink(item.doppelfitUrl) : undefined,
      };
      imported.push(p);
    }

    if (imported.length === 0) {
      return NextResponse.json({ error: "Nessun prodotto valido trovato nella lista" }, { status: 400 });
    }

    // Aggiungi in testa alla lista
    list = [...imported, ...list];
    await fs.writeFile(FILE, JSON.stringify(list, null, 2), "utf8");

    return NextResponse.json({ ok: true, count: imported.length, total: list.length });
  }

  // Inserimento singolo standard
  const price = parseFloat(String(body.price).replace(",", "."));
  if (!body.title || !body.image || isNaN(price)) {
    return NextResponse.json({ error: "Titolo, immagine e prezzo valido sono obbligatori" }, { status: 400 });
  }

  const slug = String(body.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const product: Product = {
    id: `${slug}-${Date.now().toString(36)}`,
    title: body.title,
    seller: body.seller || "—",
    category: body.category || "OTHER",
    brand: body.brand || "—",
    price,
    image: body.image,
    cssbuyUrl: body.cssbuyUrl || undefined,
    doppelfitUrl: body.doppelfitUrl ? formatDoppelfitLink(body.doppelfitUrl) : undefined,
  };

  list.unshift(product);
  await fs.writeFile(FILE, JSON.stringify(list, null, 2), "utf8");

  return NextResponse.json({ ok: true, product });
}
