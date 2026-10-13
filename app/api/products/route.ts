import { NextResponse } from "next/server";
import { Product } from "@/lib/products";
import { formatDoppelfitLink, parseSourceUrl, cssbuyLink } from "@/lib/convert";
import {
  getAllProducts,
  readRawProducts,
  writeRawProducts,
  readDeletedIds,
  writeDeletedIds,
  updateProduct,
  deleteProduct,
} from "@/lib/product-store";

export async function GET() {
  try {
    const list = await getAllProducts();
    return NextResponse.json(list, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Errore lettura prodotti:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo della richiesta JSON non valido" }, { status: 400 });
  }

  const expectedPw = process.env.ADMIN_PASSWORD || "cambiami";
  if (body.password !== expectedPw) {
    return NextResponse.json({ error: "Password errata" }, { status: 401 });
  }

  let list = await readRawProducts();
  const deletedIds = await readDeletedIds();
  let deletedModified = false;

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
            u.searchParams.set(
              "promotionCode",
              process.env.CSSBUY_PROMOTION_CODE || "2ab90a34eeaa437b"
            );
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

      const id =
        item.id ||
        `${slug}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

      if (deletedIds.has(id)) {
        deletedIds.delete(id);
        deletedModified = true;
      }

      const p: Product = {
        id,
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
    await writeRawProducts(list);
    if (deletedModified) {
      await writeDeletedIds(deletedIds);
    }

    const totalActive = (await getAllProducts()).length;
    return NextResponse.json({ ok: true, count: imported.length, total: totalActive });
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

  const id = body.id || `${slug}-${Date.now().toString(36)}`;

  if (deletedIds.has(id)) {
    deletedIds.delete(id);
    await writeDeletedIds(deletedIds);
  }

  const product: Product = {
    id,
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
  await writeRawProducts(list);

  return NextResponse.json({ ok: true, product });
}

export async function PUT(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo della richiesta JSON non valido" }, { status: 400 });
  }

  const expectedPw = process.env.ADMIN_PASSWORD || "cambiami";
  if (body.password !== expectedPw) {
    return NextResponse.json({ error: "Password admin errata" }, { status: 401 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "ID prodotto mancante" }, { status: 400 });
  }

  const updated = await updateProduct(body.id, body);
  if (!updated) {
    return NextResponse.json({ error: "Prodotto non trovato per la modifica" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, product: updated });
}

export async function DELETE(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo della richiesta JSON non valido" }, { status: 400 });
  }

  const expectedPw = process.env.ADMIN_PASSWORD || "cambiami";
  if (body.password !== expectedPw) {
    return NextResponse.json({ error: "Password admin errata" }, { status: 401 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "ID prodotto mancante" }, { status: 400 });
  }

  const success = await deleteProduct(body.id);
  if (!success) {
    return NextResponse.json({ error: "Prodotto non trovato o già eliminato" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id: body.id, message: "Prodotto eliminato con successo" });
}
