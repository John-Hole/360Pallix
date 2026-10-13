import { NextResponse } from "next/server";
import { getProductById, updateProduct, deleteProduct } from "@/lib/product-store";
import { formatDoppelfitLink } from "@/lib/convert";
import { isAuthorized } from "@/lib/auth";

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

  if (!isAuthorized(req, body?.password)) {
    return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 });
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

  let bodyPassword = "";
  try {
    const body = await req.json();
    bodyPassword = body.password || "";
  } catch {}

  const { searchParams } = new URL(req.url);
  const paramPw = searchParams.get("password") || bodyPassword;

  if (!isAuthorized(req, paramPw)) {
    return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 });
  }

  const success = await deleteProduct(id);
  if (!success) {
    return NextResponse.json({ error: "Prodotto non trovato o già eliminato" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id, message: "Prodotto eliminato con successo" });
}
