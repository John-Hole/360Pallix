import Link from "next/link";
import { TikTokIcon } from "./TikTokIcon";

export function SiteFooter({
  subtitle = "Spreadsheet, best seller, tutorial & coupon CSSBuy.",
}: {
  subtitle?: string;
}) {
  return (
    <footer className="foot" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 56, paddingTop: 36, paddingBottom: 48 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 20px",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
            360Pallix
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
            {subtitle}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <Link href="/spreadsheet" style={{ color: "rgba(255,255,255,0.65)", fontSize: 12.5, textDecoration: "none" }}>
            Spreadsheet
          </Link>
          <Link href="/sellers" style={{ color: "rgba(255,255,255,0.65)", fontSize: 12.5, textDecoration: "none" }}>
            Best Seller
          </Link>
          <Link href="/guide" style={{ color: "rgba(255,255,255,0.65)", fontSize: 12.5, textDecoration: "none" }}>
            Guida
          </Link>
          <Link href="/coupon" style={{ color: "rgba(255,255,255,0.65)", fontSize: 12.5, textDecoration: "none" }}>
            Coupon
          </Link>
          <Link href="/dogana" style={{ color: "rgba(255,255,255,0.65)", fontSize: 12.5, textDecoration: "none" }}>
            Dogana UE
          </Link>
          <Link href="/community" style={{ color: "rgba(255,255,255,0.65)", fontSize: 12.5, textDecoration: "none" }}>
            Community
          </Link>
          <a
            href="https://www.tiktok.com/@360pallix"
            target="_blank"
            rel="noopener noreferrer"
            className="sheet-social-pill"
            title="Segui @360pallix su TikTok"
            style={{ fontSize: 12, padding: "5px 14px", height: "auto" }}
          >
            <TikTokIcon size={13} />
            <span>TikTok @360pallix ↗</span>
          </a>
        </div>
      </div>
      <div style={{ marginTop: 24, fontSize: 11.5, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
        © {new Date().getFullYear()} 360Pallix · Risorse, guide e cataloghi per acquisti sicuri con CSSBuy
      </div>
    </footer>
  );
}
