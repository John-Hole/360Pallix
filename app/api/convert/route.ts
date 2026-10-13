import { NextResponse } from "next/server";
import { parseSourceUrl, cssbuyLink, doppelfitLink, formatDoppelfitLink, scrapeInfo } from "@/lib/convert";

export async function POST(req: Request) {
  const { url } = await req.json();
  const rawUrl = String(url || "").trim();

  const parsed = await parseSourceUrl(rawUrl);
  if (!parsed) {
    // Se l'utente ha inserito un link generico Doppelfit non collegabile direttamente a un itemId
    if (rawUrl.includes("doppel.fit") || rawUrl.includes("doppelfit.gg")) {
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

    return NextResponse.json(
      { error: "Link non riconosciuto. Inserisci un link valido di Weidian, Taobao, 1688, CSSBuy, cssb.uy o Doppelfit." },
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
