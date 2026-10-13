import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"]);

export async function POST(req: Request) {
  try {
    const expectedPw = process.env.ADMIN_PASSWORD || "cambiami";
    const headerPw = req.headers.get("x-admin-password");

    const formData = await req.formData();
    const password = (formData.get("password") as string) || headerPw || "";

    if (password !== expectedPw) {
      return NextResponse.json({ error: "Password admin non valida" }, { status: 401 });
    }

    const file = formData.get("file") as File | null;
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Nessun file immagine valido fornito" }, { status: 400 });
    }

    const originalName = file.name || "upload.jpg";
    let ext = path.extname(originalName).toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      ext = ".jpg";
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "L'immagine supera il limite di 10MB" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeStem = path
      .basename(originalName, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 30);
    const filename = `${safeStem || "photo"}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    await fs.writeFile(filepath, buffer);

    return NextResponse.json({ ok: true, url: `/uploads/${filename}` });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Errore durante il caricamento: " + (err?.message || "sconosciuto") },
      { status: 500 }
    );
  }
}
