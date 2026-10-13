import { NextResponse } from "next/server";
import { Product } from "@/lib/products";
import { formatDoppelfitLink, parseSourceUrl, cssbuyLink, doppelfitLink, parseCssbuyUrl } from "@/lib/convert";
import {
  getAllProducts,
  readRawProducts,
  writeRawProducts,
  readDeletedIds,
  writeDeletedIds,
  updateProduct,
  deleteProduct,
  sanitizeSeller,
} from "@/lib/product-store";
import { isAuthorized } from "@/lib/auth";

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

  if (!isAuthorized(req, body?.password)) {
    return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 });
  }

  let list = await readRawProducts();
  const deletedIds = await readDeletedIds();
  let deletedModified = false;

  // Supporto importazione massiva (batch import)
  if (Array.isArray(body.products)) {
    const imported: Product[] = [];
    for (const item of body.products) {
      const price = parseFloat(String(item.price).replace(",", "."));
      if (!item.title || isNaN(price) || price <= 0) continue;

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
        title: String(item.title).trim(),
        seller: sanitizeSeller(item.seller || item.shop_name),
        category: item.category || "OTHER",
        brand: item.brand ? String(item.brand).trim() : "—",
        price,
        image: item.image || "/products/p1.jpg",
        cssbuyUrl: cssbuyUrl ? String(cssbuyUrl).trim() : undefined,
        doppelfitUrl: item.doppelfitUrl
          ? formatDoppelfitLink(String(item.doppelfitUrl).trim())
          : cssbuyUrl && parseCssbuyUrl(cssbuyUrl)
          ? doppelfitLink(parseCssbuyUrl(cssbuyUrl)!)
          : undefined,
      };
      imported.push(p);
    }

    if (imported.length === 0) {
      return NextResponse.json({ error: "Nessun prodotto valido trovato nella lista" }, { status: 400 });
    }

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
  if (!body.title || !body.image || isNaN(price) || price <= 0) {
    return NextResponse.json({ error: "Titolo, immagine e prezzo valido (> 0) sono obbligatori" }, { status: 400 });
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
    title: String(body.title).trim(),
    seller: sanitizeSeller(body.seller),
    category: body.category || "OTHER",
    brand: body.brand ? String(body.brand).trim() : "—",
    price,
    image: String(body.image).trim(),
    cssbuyUrl: body.cssbuyUrl ? String(body.cssbuyUrl).trim() : undefined,
    doppelfitUrl: body.doppelfitUrl
      ? formatDoppelfitLink(String(body.doppelfitUrl).trim())
      : body.cssbuyUrl && parseCssbuyUrl(body.cssbuyUrl)
      ? doppelfitLink(parseCssbuyUrl(body.cssbuyUrl)!)
      : undefined,
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

  if (!isAuthorized(req, body?.password)) {
    return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "ID prodotto mancante" }, { status: 400 });
  }

  const updates: Partial<Product> = {};
  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.image !== undefined) updates.image = String(body.image).trim();
  if (body.category !== undefined) updates.category = String(body.category).trim();
  if (body.brand !== undefined) updates.brand = String(body.brand).trim();
  if (body.seller !== undefined) updates.seller = String(body.seller).trim();
  if (body.price !== undefined) {
    const p = parseFloat(String(body.price).replace(",", "."));
    if (isNaN(p) || p <= 0) {
      return NextResponse.json({ error: "Prezzo valido (> 0) obbligatorio" }, { status: 400 });
    }
    updates.price = p;
  }
  if (body.cssbuyUrl !== undefined) {
    const u = String(body.cssbuyUrl).trim();
    updates.cssbuyUrl = u || undefined;
  }
  if (body.doppelfitUrl !== undefined) {
    const u = String(body.doppelfitUrl).trim();
    updates.doppelfitUrl = u ? formatDoppelfitLink(u) : undefined;
  }

  const updated = await updateProduct(body.id, updates);
  if (!updated) {
    return NextResponse.json({ error: "Prodotto non trovato per la modifica" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, product: updated });
}

export async function DELETE(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // Body might be empty
  }

  const { searchParams } = new URL(req.url);
  const paramPw = searchParams.get("password") || body.password;

  if (!isAuthorized(req, paramPw)) {
    return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 });
  }

  const id = body.id || searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID prodotto mancante" }, { status: 400 });
  }

  const success = await deleteProduct(id);
  if (!success) {
    return NextResponse.json({ error: "Prodotto non trovato o già eliminato" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id, message: "Prodotto eliminato con successo" });
}
