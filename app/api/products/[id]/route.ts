import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getProductById, updateProduct, deleteProduct } from "@/lib/product-store";
import { formatDoppelfitLink } from "@/lib/convert";
import { isAuthorized } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const cleanId = decodeURIComponent(id).trim();
  const product = await getProductById(cleanId);
  if (!product) {
    return NextResponse.json({ error: "Prodotto non trovato" }, { status: 404 });
  }
  return NextResponse.json(product, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function PUT(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const cleanId = decodeURIComponent(id).trim();
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

  const updated = await updateProduct(cleanId, {
    title: String(body.title).trim(),
    price,
    priceRmb: body.priceRmb !== undefined ? parseFloat(String(body.priceRmb).replace(",", ".")) : undefined,
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

  try {
    revalidatePath("/", "layout");
    revalidatePath("/spreadsheet");
    revalidatePath("/admin");
    revalidatePath(`/item/${cleanId}`);
  } catch {}

  return NextResponse.json({ ok: true, product: updated });
}

export async function DELETE(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const cleanId = decodeURIComponent(id).trim();

  let bodyPassword = "";
  let bodyId = "";
  try {
    const text = await req.text();
    if (text) {
      const body = JSON.parse(text);
      bodyPassword = body?.password || "";
      bodyId = body?.id || "";
    }
  } catch {}

  const { searchParams } = new URL(req.url);
  const paramPw = searchParams.get("password") || bodyPassword;
  const targetId = cleanId || searchParams.get("id") || bodyId;

  if (!isAuthorized(req, paramPw)) {
    return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 });
  }

  if (!targetId) {
    return NextResponse.json({ error: "ID prodotto mancante" }, { status: 400 });
  }

  const success = await deleteProduct(targetId);
  if (!success) {
    return NextResponse.json({ error: "Prodotto non trovato o già eliminato" }, { status: 404 });
  }

  try {
    revalidatePath("/", "layout");
    revalidatePath("/spreadsheet");
    revalidatePath("/admin");
    revalidatePath(`/item/${cleanId}`);
  } catch {}

  return NextResponse.json({ ok: true, id: cleanId, message: "Prodotto eliminato con successo" });
}
