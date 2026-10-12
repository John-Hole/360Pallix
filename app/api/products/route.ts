import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { BASE_PRODUCTS, Product } from "@/lib/products";
import { formatDoppelfitLink } from "@/lib/convert";

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
  const price = parseFloat(String(body.price).replace(",", "."));
  if (!body.title || !body.image || isNaN(price)) {
    return NextResponse.json({ error: "Titolo, immagine e prezzo valido sono obbligatori" }, { status: 400 });
  }

  let list: Product[] = [];
  try {
    const raw = await fs.readFile(FILE, "utf8");
    list = JSON.parse(raw);
  } catch {
    list = [];
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
