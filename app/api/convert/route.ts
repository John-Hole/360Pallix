import { NextResponse } from "next/server";
import { parseSourceUrl, cssbuyLink, doppelfitLink, scrapeInfo } from "@/lib/convert";

export async function POST(req: Request) {
  const { url } = await req.json();
  const parsed = parseSourceUrl(String(url || ""));
  if (!parsed) return NextResponse.json({ error: "Link non riconosciuto (Weidian, Taobao, 1688)" }, { status: 400 });
  const info = await scrapeInfo(parsed.sourceUrl);
  return NextResponse.json({
    platform: parsed.platform,
    itemId: parsed.itemId,
    sourceUrl: parsed.sourceUrl,
    cssbuyUrl: cssbuyLink(parsed),
    doppelfitUrl: doppelfitLink(parsed),
    ...info,
  });
}
