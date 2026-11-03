"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PRODUCTS, eur, rmb, RMB_TO_EUR, type Product } from "@/lib/products";
import { getTopVerifiedSellers, type SellerItem } from "@/lib/sellers";

const PILLS = [
  { label: "Spreadsheet", href: "/spreadsheet", x: "min(30vw, 380px)", y: "-18vh", d: "0s" },
  { label: "Coupon", href: "/coupon", x: "max(-30vw, -380px)", y: "-18vh", d: "-2s" },
  { label: "Tutorial", href: "/guide", x: "max(-26vw, -360px)", y: "21vh", d: "-4s" },
  { label: "Best Seller", href: "/sellers", x: "min(26vw, 360px)", y: "21vh", d: "-1s" },
  { label: "Regole Dogana UE", href: "/dogana", x: "0px", y: "-31vh", d: "-3s" },
];

const TUTORIAL_FAQS = [
  {
    q: "Come scelgo la taglia corretta per abbigliamento e sneakers?",
    a: "Le taglie cinesi vestono spesso 1 o 2 misure in meno rispetto a quelle europee (EU/IT). Controlla sempre la 'Size Chart' in centimetri presente nell'annuncio del venditore (petto, spalle e lunghezza totale). Per le scarpe, fai sempre riferimento ai centimetri (CM) della soletta interna.",
  },
  {
    q: "Come compilo la dichiarazione doganale per non pagare tasse?",
    a: "Per le linee triangolate Tax-Free / Tariffless (come DHL Tariffless) verso l'Italia, dichiara sempre un valore totale compreso tra 16.00$ e 21.00$ con decimali casuali (es. 18.42$). La merce viene sdoganata nell'UE senza alcun dazio o spesa aggiuntiva alla consegna.",
  },
  {
    q: "Conviene aggiungere l'assicurazione alla spedizione?",
    a: "Sì, assolutamente consigliata. L'assicurazione su CSSBuy costa solo circa il 3% del valore del pacco e ti protegge al 100% rimborsando sia il costo degli articoli che le spese di spedizione in caso di smarrimento o sequestro.",
  },
];

function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function Home() {
  const rail = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [productList, setProductList] = useState<Product[]>(PRODUCTS);
  const [topSellers] = useState<SellerItem[]>(() => getTopVerifiedSellers(6));
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  useReveal();

  useEffect(() => {
    fetch(`/api/products?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          setProductList(data);
        }
      })
      .catch(() => {});
  }, []);

  // subtle parallax of the pills following the pointer
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const x = (e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      el.style.setProperty("--px", `${x * 14}px`);
      el.style.setProperty("--py", `${y * 10}px`);
    };
    addEventListener("pointermove", move);
    return () => removeEventListener("pointermove", move);
  }, []);

  const scroll = (dir: number) => rail.current?.scrollBy({ left: dir * 300, behavior: "smooth" });

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <main>
      <section className="hero" ref={heroRef}>
        <div className="hero-wordmark">360Pallix</div>
        {PILLS.map((p) => (
          <div
            key={p.label}
            className="orbit orbit-pos"
            style={{
              ["--x" as string]: p.x,
              ["--y" as string]: p.y,
              ["--d" as string]: p.d,
              marginLeft: "var(--px,0)",
              marginTop: "var(--py,0)",
            }}
          >
            <Link className="hero-pill" href={p.href}>
              {p.label}
            </Link>
          </div>
        ))}
        <div className="scrollHint">Scroll ↓</div>
      </section>

      {/* SPREADSHEET SECTION */}
      <section className="section" id="spreadsheet">
        <div className="wrap">
          <h2 className="sec-title reveal">Spreadsheet</h2>
          <div className="reveal">
            <Link className="cta" href="/spreadsheet">
              Entra nella Spreadsheet →
            </Link>
          </div>
          <div className="rail reveal">
            <div className="rail-scroll" ref={rail}>
              <div className="rail-track">
                {productList.map((p) => (
                  <Link key={p.id} href={`/item/${p.id}`} className="rail-card">
                    <img
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      draggable={false}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.dataset.triedProxy && p.image?.startsWith("http")) {
                          target.dataset.triedProxy = "true";
                          target.src = `/api/image-proxy?url=${encodeURIComponent(p.image)}`;
                        } else {
                          target.src =
                            "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='370' fill='none'%3E%3Crect width='100%25' height='100%25' fill='%23111'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='14'%3EImmagine non disp.%3C/text%3E%3C/svg%3E";
                        }
                      }}
                    />
                    <div className="rail-meta">
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span className="badge">WEEKLY BEST</span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#ffffff",
                            background: "rgba(0,0,0,0.5)",
                            padding: "2px 8px",
                            borderRadius: 999,
                            border: "1px solid rgba(255,255,255,0.15)",
                            backdropFilter: "blur(4px)",
                          }}
                        >
                          {eur(p.price)}{" "}
                          <span style={{ fontSize: 9.5, color: "#a1a1aa", opacity: 0.85, fontWeight: 500 }}>
                            {rmb(p.priceRmb ?? p.price * RMB_TO_EUR)}
                          </span>
                        </span>
                      </div>
                      <div className="rail-title">{p.title}</div>
                      <div className="rail-sub">
                        {p.seller && p.seller !== "—" && p.seller !== "-" ? `${p.category} • ${p.seller}` : p.category}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="rail-nav">
              <button className="iconbtn" aria-label="Scorri a sinistra" onClick={() => scroll(-1)}>
                ‹
              </button>
              <button className="iconbtn" aria-label="Scorri a destra" onClick={() => scroll(1)}>
                ›
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* BEST SELLER SECTION */}
      <section className="section" id="best-seller">
        <div className="wrap">
          <div className="eyebrow reveal">Verified stores</div>
          <h2 className="sec-title reveal">Best Seller</h2>
          <p className="sec-sub reveal" style={{ maxWidth: 620 }}>
            Una selezione curata dei negozi e venditori indipendenti più affidabili su Yupoo, Weidian e Taobao, verificati dalla community.
          </p>

          <div className="sellers-grid reveal" style={{ marginTop: 32 }}>
            {topSellers.map((s) => (
              <div key={s.id} className="seller-dir-card">
                <div className="seller-card-top">
                  <img
                    src={s.cover}
                    alt={s.name}
                    className="seller-card-img"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (!target.dataset.triedProxy && s.cover?.startsWith("http")) {
                        target.dataset.triedProxy = "true";
                        target.src = `/api/image-proxy?url=${encodeURIComponent(s.cover)}`;
                      } else {
                        target.src =
                          "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' fill='none'%3E%3Crect width='100%25' height='100%25' fill='%23111'/%3E%3C/svg%3E";
                      }
                    }}
                  />
                  <div className="seller-card-badges">
                    <span className="badge-verified">✓ VERIFIED</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: "rgba(0,0,0,0.75)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        backdropFilter: "blur(6px)",
                        color: "#fff",
                      }}
                    >
                      {s.platform}
                    </span>
                  </div>
                </div>

                <div className="seller-card-body">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <h3 className="seller-card-name">{s.name}</h3>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.7)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.category}
                    </span>
                  </div>

                  <div className="seller-card-spec">
                    <span>★</span>
                    <span>{s.specialty}</span>
                  </div>

                  <p className="seller-card-desc">{s.description}</p>

                  <div className="seller-card-actions">
                    {s.officialUrl ? (
                      <a
                        href={s.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="seller-btn-store"
                      >
                        Sito store ↗
                      </a>
                    ) : (
                      <span className="seller-btn-store" style={{ opacity: 0.4 }}>
                        Store n.d.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="reveal" style={{ marginTop: 32, textAlign: "center" }}>
            <Link className="cta" href="/sellers">
              Esplora tutti i Seller (130+) →
            </Link>
          </div>
        </div>
      </section>

      {/* TUTORIAL / COME COMPRARE SECTION */}
      <section className="section" id="tutorial">
        <div className="wrap">
          <div className="eyebrow reveal">Guida all&apos;acquisto</div>
          <h2 className="sec-title reveal">Come Comprare con CSSBuy</h2>
          <p className="sec-sub reveal" style={{ maxWidth: 640 }}>
            Segui i 4 semplici passaggi per effettuare il tuo ordine in totale sicurezza, con foto di controllo qualità e spedizione senza dogana.
          </p>

          {/* 4 Steps Grid */}
          <div className="steps-grid steps-grid-4 reveal">
            {/* Step 1 */}
            <div className="step-card">
              <div className="step-card-header">
                <div className="step-num">1</div>
                <span className="step-tag">Fase 1</span>
              </div>
              <h3 className="step-title">Scegli il Prodotto</h3>
              <p className="step-desc">
                Cerca l&apos;articolo nello Spreadsheet di 360Pallix o seleziona uno dei 130+ Best Seller verificati su Yupoo/Weidian.
              </p>
              <div className="step-subnote">
                <span>✓</span> Link diretti e store verificati
              </div>
            </div>

            {/* Step 2 */}
            <div className="step-card">
              <div className="step-card-header">
                <div className="step-num">2</div>
                <span className="step-tag">Fase 2</span>
              </div>
              <h3 className="step-title">Incolla su CSSBuy</h3>
              <p className="step-desc">
                Incolla il link nella barra dell&apos;agent, seleziona taglia/colore e completa il 1° pagamento (costo merce + spedizione interna).
              </p>
              <div className="step-subnote">
                <span>✓</span> Pagamento sicuro con PayPal o carta
              </div>
            </div>

            {/* Step 3 */}
            <div className="step-card">
              <div className="step-card-header">
                <div className="step-num">3</div>
                <span className="step-tag">Fase 3</span>
              </div>
              <h3 className="step-title">Ricevi Foto QC</h3>
              <p className="step-desc">
                In 2-4 giorni il prodotto arriva al magazzino. Ricevi foto ad alta risoluzione: approvi (GL) o chiedi il reso gratuito (RL).
              </p>
              <div className="step-subnote">
                <span>✓</span> Controllo qualità garantito
              </div>
            </div>

            {/* Step 4 */}
            <div className="step-card">
              <div className="step-card-header">
                <div className="step-num">4</div>
                <span className="step-tag">Fase 4</span>
              </div>
              <h3 className="step-title">Spedizione Tax-Free</h3>
              <p className="step-desc">
                Raggruppa gli articoli in un Haul per risparmiare fino al 40%. Spedisci con linee triangolate Tax-Free esenti da dogana.
              </p>
              <div className="step-subnote">
                <span>✓</span> Zero tasse doganali alla consegna
              </div>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="faq-wrap reveal">
            <h3 className="faq-title" style={{ fontSize: 22 }}>
              Domande Frequenti (FAQ)
            </h3>
            <p className="faq-sub">I consigli fondamentali per ordinare senza pensieri</p>

            <div className="faq-list">
              {TUTORIAL_FAQS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className={`faq-item ${isOpen ? "open" : ""}`}>
                    <button
                      type="button"
                      className="faq-btn"
                      onClick={() => toggleFaq(idx)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <svg
                        className="faq-chevron"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="faq-answer">
                        <p>{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="reveal" style={{ marginTop: 32, textAlign: "center" }}>
            <Link className="cta" href="/guide">
              Leggi la Guida Completa (Step by Step) →
            </Link>
          </div>
        </div>
      </section>

      {/* COUPON SECTION */}
      <section className="section" id="coupon">
        <div className="wrap">
          <div className="eyebrow reveal">Savings</div>
          <h2 className="sec-title reveal">Coupon & Sconti</h2>
          <p className="sec-sub reveal" style={{ maxWidth: 640 }}>
            Pacchetti coupon fino a 50$, sconti esclusivi sulle spedizioni Tax-Free e codici promozionali per i tuoi ordini.
          </p>
          <div className="tiles reveal" style={{ marginTop: 24 }}>
            <div className="tile glass">
              <div className="eyebrow">Promo attive</div>
              <h3>Risparmia fino al 20% sulla spedizione</h3>
              <p className="sec-sub" style={{ marginTop: 6, marginBottom: 20 }}>
                Scopri tutti i coupon attivi e il bonus di benvenuto riservato ai nuovi utenti.
              </p>
              <Link className="cta" href="/coupon" style={{ marginTop: 0 }}>
                Scopri tutti i Coupon →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* DOGANA SECTION */}
      <section className="section" id="dogana">
        <div className="wrap">
          <div className="eyebrow reveal">Normativa Doganale UE · 1 Novembre</div>
          <h2 className="sec-title reveal">Regole Dogana UE</h2>
          <p className="sec-sub reveal" style={{ maxWidth: 640 }}>
            Tutto ciò che devi sapere sulla nuova handling fee europea di 2€, codice identificativo PID e la copertura al 100% garantita da CSSBuy sulle linee triangolate Tax-Free.
          </p>
          <div className="reveal" style={{ marginTop: 24 }}>
            <Link className="cta" href="/dogana">
              Leggi la Guida Doganale Completa →
            </Link>
          </div>
        </div>
      </section>

      <div className="foot">© {new Date().getFullYear()} 360Pallix · {eur(0).slice(0, 1)} sample catalog</div>
    </main>
  );
}
