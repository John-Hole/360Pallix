import { NextResponse } from "next/server";
import { parseSourceUrl, cssbuyLink, cssbuyShortLink, doppelfitLink, scrapeInfo } from "@/lib/convert";

export async function POST(req: Request) {
  const { url } = await req.json();
  const parsed = parseSourceUrl(String(url || ""));
  if (!parsed) return NextResponse.json({ error: "Link non riconosciuto (Weidian, Taobao, 1688)" }, { status: 400 });
  const [info, short] = await Promise.all([scrapeInfo(parsed.sourceUrl), cssbuyShortLink(parsed.sourceUrl)]);
  return NextResponse.json({
    platform: parsed.platform,
    itemId: parsed.itemId,
    sourceUrl: parsed.sourceUrl,
    // Link affiliato corto se disponibile, altrimenti link prodotto semplice (senza affiliazione)
    cssbuyUrl: short.url ?? cssbuyLink(parsed),
    cssbuyAffiliate: !!short.url,
    cssbuyError: short.error,
    doppelfitUrl: doppelfitLink(parsed),
    ...info,
  });
}
