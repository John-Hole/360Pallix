import { NextResponse } from "next/server";
import { parseSourceUrl, cssbuyLink, doppelfitLink, formatDoppelfitLink, scrapeInfo } from "@/lib/convert";

export async function POST(req: Request) {
  const { url } = await req.json();
  const rawUrl = String(url || "").trim();

  // Se l'utente ha inserito direttamente un link Doppelfit
  if (rawUrl.includes("doppel.fit")) {
    const formattedDoppel = formatDoppelfitLink(rawUrl);
    return NextResponse.json({
      platform: "doppelfit",
      itemId: "",
      sourceUrl: rawUrl,
      cssbuyUrl: "",
      cssbuyAffiliate: false,
      doppelfitUrl: formattedDoppel,
      title: "",
      image: "",
      price: "",
    });
  }

  const parsed = await parseSourceUrl(rawUrl);
  if (!parsed) {
    return NextResponse.json(
      { error: "Link non riconosciuto. Inserisci un link valido di Weidian, Taobao, 1688, CSSBuy o cssb.uy." },
      { status: 400 }
    );
  }

  const info = await scrapeInfo(parsed.sourceUrl);
  const cssbuyUrl = cssbuyLink(parsed);
  const doppelfitUrl = doppelfitLink(parsed);

  return NextResponse.json({
    platform: parsed.platform,
    itemId: parsed.itemId,
    sourceUrl: parsed.sourceUrl,
    cssbuyUrl,
    cssbuyAffiliate: true,
    doppelfitUrl,
    ...info,
  });
}
