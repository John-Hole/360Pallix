"use client";
import Link from "next/link";
import { TikTokIcon } from "@/components/TikTokIcon";
import { SiteFooter } from "@/components/SiteFooter";

export default function CommunityPage() {
  return (
    <main style={{ minHeight: "100dvh", background: "#000", color: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Top bar navigation */}
      <div className="sheet-bar">
        <div className="sheet-nav-grid">
          <div className="sheet-nav-left">
            <Link href="/" className="back">
              ← Home
            </Link>
          </div>
          <div className="sheet-nav-center">
            <Link
              href="/spreadsheet"
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
              }}
            >
              Spreadsheet
            </Link>
            <Link
              href="/sellers"
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
              }}
            >
              Best Seller (130+)
            </Link>
            <Link
              href="/guide"
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
              }}
            >
              Guida & Tutorial
            </Link>
            <Link
              href="/coupon"
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
              }}
            >
              Coupon & Sconti
            </Link>
            <Link
              href="/dogana"
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
              }}
            >
              Regole Dogana
            </Link>
          </div>
          <div className="sheet-nav-right">
            <a
              href="https://www.tiktok.com/@360pallix"
              target="_blank"
              rel="noopener noreferrer"
              className="sheet-social-pill"
              title="Segui @360pallix su TikTok"
            >
              <TikTokIcon size={13} />
              <span>TikTok @360pallix</span>
            </a>
          </div>
        </div>
      </div>

      <div className="wrap" style={{ maxWidth: 880, padding: "60px 20px 40px", textAlign: "center", flex: 1 }}>
        <div style={{ display: "inline-flex", gap: 8, marginBottom: 16 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "5px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.16)",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            CHAT & GRUPPI IN RISTRUTTURAZIONE
          </span>
        </div>

        <h1 className="dir-title" style={{ fontSize: "clamp(28px, 5vw, 44px)" }}>
          Community 360Pallix
        </h1>
        <p className="dir-sub" style={{ maxWidth: 640, margin: "16px auto 32px", fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,0.65)" }}>
          I gruppi di discussione Discord e Telegram sono momentaneamente sospesi per aggiornamento tecnico e moderazione.
          Nel frattempo, il nostro canale principale di comunicazione e video recensioni è <b>TikTok</b>.
        </p>

        {/* CANALE UFFICIALE ATTIVO: TIKTOK */}
        <div
          className="glass"
          style={{
            maxWidth: 720,
            margin: "0 auto 36px",
            padding: "clamp(24px, 5vw, 36px)",
            borderRadius: 28,
            textAlign: "left",
            border: "1px solid rgba(255, 255, 255, 0.16)",
            background: "radial-gradient(80% 80% at 20% 0%, rgba(255, 255, 255, 0.08), rgba(0,0,0,0.5))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <TikTokIcon size={24} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>TikTok Ufficiale</h3>
                  <span className="badge-verified">✓ CANALE ATTIVO</span>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                  @360pallix
                </div>
              </div>
            </div>

            <a
              href="https://www.tiktok.com/@360pallix"
              target="_blank"
              rel="noopener noreferrer"
              className="cta"
              style={{ marginTop: 0, height: 44, padding: "0 22px", fontSize: 13 }}
              title="Apri profilo TikTok @360pallix (nuova scheda)"
            >
              Segui su TikTok ↗
            </a>
          </div>

          <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.8)", margin: "20px 0 16px" }}>
            Unisciti al canale ufficiale per guardare i video di unboxing dei pacchi arrivati in Italia, i confronti di qualità sui batch Yupoo/Weidian, i consigli pratici sulle taglie e gli alert sui coupon per risparmiare con CSSBuy.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 12.5, color: "rgba(255,255,255,0.85)" }}>
              ✓ Video Haul & Unboxing in anteprima
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 12.5, color: "rgba(255,255,255,0.85)" }}>
              ✓ Quality Check (QC) reali prima della spedizione
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 12.5, color: "rgba(255,255,255,0.85)" }}>
              ✓ Guide veloci & aggiornamenti Tax-Free
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
          <Link className="cta ghost" href="/dogana" style={{ marginTop: 0 }}>
            Consulta le Regole Dogana UE →
          </Link>
          <Link className="cta ghost" href="/spreadsheet" style={{ marginTop: 0 }}>
            Esplora lo Spreadsheet →
          </Link>
          <Link className="cta ghost" href="/" style={{ marginTop: 0 }}>
            Torna alla Home
          </Link>
        </div>
      </div>

      <SiteFooter subtitle="Community & Social ufficiali 360Pallix." />
    </main>
  );
}
