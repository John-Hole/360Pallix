"use client";
import Link from "next/link";
import { useState } from "react";
import { TikTokIcon } from "@/components/TikTokIcon";
import { SiteFooter } from "@/components/SiteFooter";

interface CouponItem {
  id: string;
  code: string;
  discount: string;
  minSpend?: string;
  title: string;
  desc: string;
  tag: string;
  url: string;
}

const COUPONS: CouponItem[] = [
  {
    id: "welcome-50",
    code: "CSSWELCOME",
    discount: "50$ BONUS",
    title: "Pacchetto Coupon Benvenuto CSSBuy",
    desc: "Nuovo utente? Registrati tramite il link per ricevere automaticamente nel tuo account un carnet di coupon da 50$ (circa 350 RMB) spendibili sulle spedizioni internazionali.",
    tag: "Nuovi Utenti",
    url: "https://www.cssbuy.com",
  },
  {
    id: "pallix-taxfree",
    code: "360PALLIX",
    discount: "10% OFF",
    title: "Sconto Linee Triangolate DHL Tariffless",
    desc: "Valido su tutte le linee aeree Tax-Free senza dogana verso l'Italia (DHL Tariffless / CSS-FJ-DHL). Inserisci il codice al momento del submit del pacco.",
    tag: "Spedizione Italia",
    url: "https://www.cssbuy.com",
  },
  {
    id: "haul-heavy",
    code: "CSSBIGHAUL",
    discount: "15% OFF",
    minSpend: "Pacchi > 5kg",
    title: "Sconto Haul Cumulativi Grandi Volumi",
    desc: "Ottimizzato per haul di grandi dimensioni (da 5kg a 10kg). Riduci sensibilmente la tariffa volumetrica del corriere raggruppando più ordini.",
    tag: "Maxi Haul",
    url: "https://www.cssbuy.com",
  },
  {
    id: "vip-tier",
    code: "VIPPOINTS",
    discount: "FINO A -30%",
    title: "Sconti a Vita con Livelli VIP CSSBuy",
    desc: "Ogni spedizione e acquisto completato accumula punti fedeltà. Raggiungendo i livelli Silver, Gold e Platinum ottieni tariffe di spedizione scontate a vita in automatico.",
    tag: "Fedeltà VIP",
    url: "https://www.cssbuy.com",
  },
];

export default function CouponPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2200);
    }).catch(() => {});
  };

  return (
    <main style={{ minHeight: "100dvh", background: "#000", color: "#fff", paddingBottom: 80 }}>
      {/* Top bar navigation (100% mathematically centered) */}
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

      <div className="wrap" style={{ maxWidth: 1040, padding: "40px 20px 0" }}>
        {/* Header */}
        <div className="dir-header" style={{ marginTop: 20 }}>
          <div style={{ display: "inline-flex", gap: 8, marginBottom: 12 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.16)",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              SAVINGS & PROMO
            </span>
          </div>
          <h1 className="dir-title">Coupon & Sconti CSSBuy</h1>
          <p className="dir-sub">
            Tutti i coupon attivi, i codici promozionali per le spedizioni verso l&apos;Italia e i bonus di benvenuto verificati per risparmiare sui tuoi ordini.
          </p>
        </div>

        {/* Quick highlight bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginTop: 32,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              borderRadius: 16,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "#a1a1aa" }}>
              Bonus Benvenuto
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: "#fff" }}>50$ Pacchetto</div>
            <div style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>Accreditato ai nuovi iscritti</div>
          </div>

          <div
            style={{
              padding: "20px 24px",
              borderRadius: 16,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "#a1a1aa" }}>
              Linee Triangolate
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: "#fff" }}>Tax-Free 100%</div>
            <div style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>Zero dogana per l&apos;Italia</div>
          </div>

          <div
            style={{
              padding: "20px 24px",
              borderRadius: 16,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "#a1a1aa" }}>
              Risparmio Medio Haul
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: "#fff" }}>Fino a -40%</div>
            <div style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>Raggruppando più articoli</div>
          </div>
        </div>

        {/* Coupon Grid */}
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Codici Coupon Attivi</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          {COUPONS.map((c) => {
            const isCopied = copiedCode === c.code;
            return (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: 24,
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 18px 42px rgba(0,0,0,0.55)",
                  backdropFilter: "blur(12px)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        padding: "3px 10px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.16)",
                        color: "#fff",
                      }}
                    >
                      {c.tag}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        letterSpacing: "0.04em",
                        padding: "3px 10px",
                        borderRadius: 6,
                        background: "#fff",
                        color: "#000",
                      }}
                    >
                      {c.discount}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 14, marginBottom: 8, color: "#fff" }}>
                    {c.title}
                  </h3>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: "#a1a1aa", margin: 0 }}>
                    {c.desc}
                  </p>
                </div>

                <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 14px",
                        borderRadius: 10,
                        background: "rgba(0,0,0,0.6)",
                        border: "1px dashed rgba(255,255,255,0.25)",
                        fontFamily: "monospace",
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        color: "#fff",
                      }}
                    >
                      <span>{c.code}</span>
                      <button
                        type="button"
                        onClick={() => copyCode(c.code)}
                        style={{
                          background: isCopied ? "#fff" : "rgba(255,255,255,0.12)",
                          color: isCopied ? "#000" : "#fff",
                          border: "none",
                          borderRadius: 6,
                          padding: "4px 10px",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {isCopied ? "Copiato! ✓" : "Copia"}
                      </button>
                    </div>

                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "10px 16px",
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.12)",
                        border: "1px solid rgba(255,255,255,0.22)",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        transition: "all 0.2s",
                      }}
                    >
                      Usa ↗
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* How to Redeem */}
        <div
          style={{
            marginTop: 56,
            padding: 32,
            borderRadius: 24,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Come Riscattare i Coupon su CSSBuy</h2>
          <p style={{ fontSize: 14, color: "#a1a1aa", marginBottom: 28, maxWidth: 640 }}>
            Segui questi 3 passaggi per applicare lo sconto al tuo ordine o alla spedizione internazionale:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            <div style={{ padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#71717a" }}>PASSO 1</div>
              <h4 style={{ fontSize: 16, fontWeight: 700, marginTop: 6, marginBottom: 8 }}>Copia il Codice</h4>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: "#a1a1aa", margin: 0 }}>
                Clicca su &quot;Copia&quot; su uno dei coupon attivi in questa pagina o registrati per ricevere il carnet da 50$.
              </p>
            </div>

            <div style={{ padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#71717a" }}>PASSO 2</div>
              <h4 style={{ fontSize: 16, fontWeight: 700, marginTop: 6, marginBottom: 8 }}>Incolla su CSSBuy</h4>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: "#a1a1aa", margin: 0 }}>
                Accedi alla sezione <em>My CSSBuy &gt; My Coupons</em> e inserisci il codice nel campo riscatta per attivarlo.
              </p>
            </div>

            <div style={{ padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#71717a" }}>PASSO 3</div>
              <h4 style={{ fontSize: 16, fontWeight: 700, marginTop: 6, marginBottom: 8 }}>Applica alla Spedizione</h4>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: "#a1a1aa", margin: 0 }}>
                Durante la fase di invio del pacco (Submit Parcel), seleziona il coupon dal menu a tendina per scalare l&apos;importo.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ marginTop: 48, textAlign: "center", display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
          <Link className="cta" href="/guide">
            Leggi la Guida all&apos;Acquisto →
          </Link>
          <Link className="cta ghost" href="/spreadsheet">
            Vai alla Spreadsheet →
          </Link>
        </div>
      </div>

      <SiteFooter subtitle="Coupon esclusivi, pacchetti sconto e promozioni per CSSBuy." />
    </main>
  );
}
