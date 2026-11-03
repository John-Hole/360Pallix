"use client";
import Link from "next/link";

export default function CommunityPage() {
  return (
    <main style={{ minHeight: "100dvh", background: "#000", color: "#fff", paddingBottom: 80 }}>
      {/* Top bar navigation */}
      <div className="sheet-bar">
        <div className="sheet-row1">
          <Link href="/" className="back">
            ← Home
          </Link>
          <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
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
        </div>
      </div>

      <div className="wrap" style={{ maxWidth: 840, padding: "80px 20px 0", textAlign: "center" }}>
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
            CANALI MOMENTANEAMENTE SOSPESI
          </span>
        </div>

        <h1 className="dir-title" style={{ fontSize: "clamp(28px, 5vw, 44px)" }}>
          Community Temporaneamente Disabilitata
        </h1>
        <p className="dir-sub" style={{ maxWidth: 600, margin: "16px auto 32px", fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,0.65)" }}>
          I canali della community sono momentaneamente in fase di ristrutturazione e aggiornamento tecnico. Nel frattempo, consulta la nuova guida alle Regole Doganali UE dell&apos;1 Novembre per tutte le informazioni sulle spedizioni dalla Cina.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
          <Link className="cta" href="/dogana">
            Consulta le Regole Dogana UE →
          </Link>
          <Link className="cta ghost" href="/">
            Torna alla Home
          </Link>
        </div>
      </div>
    </main>
  );
}
