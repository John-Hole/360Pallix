import { NextResponse } from "next/server";
import { getProductById, updateProduct, deleteProduct } from "@/lib/product-store";
import { formatDoppelfitLink } from "@/lib/convert";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ error: "Prodotto non trovato" }, { status: 404 });
  }
  return NextResponse.json(product, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function PUT(req: Request, context: RouteContext) {
  const { id } = await context.params;
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo della richiesta JSON non valido" }, { status: 400 });
  }

  const expectedPw = process.env.ADMIN_PASSWORD || "cambiami";
  const headerPw = req.headers.get("x-admin-password");
  const password = body.password || headerPw || "";

  if (password !== expectedPw) {
    return NextResponse.json({ error: "Password admin errata" }, { status: 401 });
  }

  const price = parseFloat(String(body.price).replace(",", "."));
  if (!body.title || !body.image || isNaN(price) || price <= 0) {
    return NextResponse.json(
      { error: "Titolo, immagine e prezzo valido (> 0) sono obbligatori" },
      { status: 400 }
    );
  }

  const updated = await updateProduct(id, {
    title: String(body.title).trim(),
    price,
    image: String(body.image).trim(),
    category: body.category || "OTHER",
    brand: body.brand !== undefined ? String(body.brand).trim() : "—",
    seller: body.seller !== undefined ? String(body.seller).trim() : "—",
    cssbuyUrl: body.cssbuyUrl !== undefined ? (String(body.cssbuyUrl).trim() || undefined) : undefined,
    doppelfitUrl: body.doppelfitUrl !== undefined ? (String(body.doppelfitUrl).trim() ? formatDoppelfitLink(body.doppelfitUrl) : undefined) : undefined,
  });

  if (!updated) {
    return NextResponse.json({ error: "Prodotto non trovato per la modifica" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, product: updated });
}

export async function DELETE(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const expectedPw = process.env.ADMIN_PASSWORD || "cambiami";

  let password = "";
  // Check password in header first
  const headerPw = req.headers.get("x-admin-password");
  if (headerPw) {
    password = headerPw;
  } else {
    // Check URL search params
    const { searchParams } = new URL(req.url);
    const paramPw = searchParams.get("password");
    if (paramPw) {
      password = paramPw;
    } else {
      // Check body
      try {
        const body = await req.json();
        password = body.password || "";
      } catch {
        password = "";
      }
    }
  }

  if (password !== expectedPw) {
    return NextResponse.json({ error: "Password admin errata" }, { status: 401 });
  }

  const success = await deleteProduct(id);
  if (!success) {
    return NextResponse.json({ error: "Prodotto non trovato o già eliminato" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id, message: "Prodotto eliminato con successo" });
}
