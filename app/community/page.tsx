"use client";
import Link from "next/link";

interface CommunityChannel {
  id: string;
  name: string;
  type: string;
  badge: string;
  desc: string;
  membersNote: string;
  features: string[];
  url: string;
}

const CHANNELS: CommunityChannel[] = [
  {
    id: "tg-channel",
    name: "Canale Telegram Ufficiale",
    type: "Telegram Broadcast",
    badge: "Drop & Notifiche",
    desc: "Il canale principale dove ricevere in tempo reale notifiche sui nuovi arrivi, coupon esclusivi a tempo limitato, sconti dei seller verificati e aggiornamenti sulle rotte doganali.",
    membersNote: "Notifiche istantanee e offerte esclusive",
    features: [
      "Avvisi immediati su cali prezzo e nuovi prodotti",
      "Coupon promozionali per spedizioni Tax-Free",
      "Report aggiornati sulle tempistiche di consegna",
    ],
    url: "https://t.me",
  },
  {
    id: "tg-group",
    name: "Gruppo Telegram Discussioni",
    type: "Telegram Chat",
    badge: "Chat & QC Libero",
    desc: "La community italiana attiva ogni giorno: chiedi pareri sulle foto di controllo qualità (QC) prima di spedire, confronta taglie e ricevi consigli da acquirenti esperti.",
    membersNote: "Supporto reciproco tra utenti e appassionati",
    features: [
      "Verifica Quality Check (GL / RL) in pochi minuti",
      "Consigli precisi su vestibilità e taglie asiatiche",
      "Condivisione foto e recensioni unboxing Haul",
    ],
    url: "https://t.me",
  },
  {
    id: "discord",
    name: "Server Discord 360Pallix",
    type: "Discord Server",
    badge: "Canali Dedicati",
    desc: "Spazio organizzato con stanze divise per categoria e brand (Sneakers, Abbigliamento, Accessori), bot per tracciare pacchi e area supporto.",
    membersNote: "Community strutturata e canali tematici",
    features: [
      "Stanze dedicate per brand e batch specifici",
      "Bot automatici per tracciamento spedizioni",
      "Ticket di assistenza per dubbi su pagamenti e dogana",
    ],
    url: "https://discord.com",
  },
];

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
              OFFICIAL HUB
            </span>
          </div>
          <h1 className="dir-title">Community 360Pallix</h1>
          <p className="dir-sub">
            Entra a far parte della community: richiedi Quality Check gratuiti, confrontati sulle taglie, scopri offerte esclusive e ricevi aiuto immediato per i tuoi ordini.
          </p>
        </div>

        {/* Channels Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 24, marginTop: 40 }}>
          {CHANNELS.map((ch) => (
            <div
              key={ch.id}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: 28,
                borderRadius: 24,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 18px 42px rgba(0,0,0,0.55)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      padding: "3px 10px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.16)",
                      color: "#fff",
                    }}
                  >
                    {ch.badge}
                  </span>
                  <span style={{ fontSize: 11.5, color: "#71717a", fontWeight: 500 }}>
                    {ch.type}
                  </span>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 700, marginTop: 16, marginBottom: 8, color: "#fff" }}>
                  {ch.name}
                </h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "#a1a1aa", marginBottom: 20 }}>
                  {ch.desc}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                  {ch.features.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "#d4d4d8" }}>
                      <span style={{ color: "#fff", fontWeight: 700 }}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <a
                  href={ch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    height: 48,
                    borderRadius: 999,
                    background: "#fff",
                    color: "#000",
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: "none",
                    boxShadow: "0 8px 24px rgba(255,255,255,0.15)",
                    transition: "transform 0.2s, background 0.2s",
                  }}
                >
                  Entra Ora ↗
                </a>
                <div style={{ textAlign: "center", fontSize: 11, color: "#71717a", marginTop: 10 }}>
                  {ch.membersNote}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Community Guidelines */}
        <div
          style={{
            marginTop: 56,
            padding: 32,
            borderRadius: 24,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Regole Fondamentali della Community</h2>
          <p style={{ fontSize: 14, color: "#a1a1aa", marginBottom: 24 }}>
            Per garantire un ambiente sicuro e piacevole per tutti i membri:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <div style={{ padding: 18, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>1. Rispetto Reciproco</div>
              <p style={{ fontSize: 12.5, color: "#a1a1aa", margin: 0, lineHeight: 1.5 }}>
                Tutti siamo stati principianti. Poni domande con educazione e rispetta le opinioni degli altri membri.
              </p>
            </div>

            <div style={{ padding: 18, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>2. Solo Seller Verificati</div>
              <p style={{ fontSize: 12.5, color: "#a1a1aa", margin: 0, lineHeight: 1.5 }}>
                Condividi solo store comprovati o presenti nella directory ufficiale per evitare truffe e venditori inaffidabili.
              </p>
            </div>

            <div style={{ padding: 18, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>3. Richieste QC con Foto</div>
              <p style={{ fontSize: 12.5, color: "#a1a1aa", margin: 0, lineHeight: 1.5 }}>
                Quando richiedi un Quality Check includi sempre le foto ricevute dall&apos;agent (linguetta, cuciture, suola) e il prezzo pagato.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ marginTop: 48, textAlign: "center", display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
          <Link className="cta" href="/spreadsheet">
            Esplora la Spreadsheet →
          </Link>
          <Link className="cta ghost" href="/sellers">
            Vedi tutti i Best Seller (130+) →
          </Link>
        </div>
      </div>
    </main>
  );
}
