import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "products.json");

export async function POST(req: Request) {
  const body = await req.json();
  if (body.password !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "Password errata" }, { status: 401 });
  const price = parseFloat(String(body.price).replace(",", "."));
  if (!body.title || !body.image || isNaN(price)) return NextResponse.json({ error: "Titolo, immagine e prezzo sono obbligatori" }, { status: 400 });

  const list = JSON.parse(await fs.readFile(FILE, "utf8"));
  const slug = String(body.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const product = {
    id: `${slug}-${Date.now().toString(36)}`,
    title: body.title,
    seller: body.seller || "—",
    category: body.category || "OTHER",
    brand: body.brand || "—",
    price,
    image: body.image,
    cssbuyUrl: body.cssbuyUrl,
    doppelfitUrl: body.doppelfitUrl,
  };
  list.unshift(product);
  await fs.writeFile(FILE, JSON.stringify(list, null, 2));
  return NextResponse.json({ ok: true, product });
}
