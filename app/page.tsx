"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PRODUCTS, eur, type Product } from "@/lib/products";

const PILLS = [
  { label: "Spreadsheet", href: "/spreadsheet", x: "min(26vw, 380px)", y: "-24vh", d: "0s" },
  { label: "Coupon", href: "/#coupon", x: "max(-30vw, -420px)", y: "-18vh", d: "-2s" },
  { label: "Tutorial", href: "/#tutorial", x: "max(-26vw, -380px)", y: "20vh", d: "-4s" },
  { label: "Best Seller", href: "/#best-seller", x: "min(30vw, 420px)", y: "18vh", d: "-1s" },
];

const Plane = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
    <path d="M21 3 3 10.5l6.5 2.5L12 20l3-5.5L21 3Z" />
  </svg>
);

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
  useReveal();

  useEffect(() => {
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
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

  return (
    <main>
      <section className="hero" ref={heroRef}>
        <div className="hero-wordmark">360Pallix</div>
        {PILLS.map((p) => (
          <div key={p.label} className="orbit orbit-pos" style={{ ["--x" as string]: p.x, ["--y" as string]: p.y, ["--d" as string]: p.d, marginLeft: "var(--px,0)", marginTop: "var(--py,0)" }}>
            <Link className="hero-pill" href={p.href}>{p.label}</Link>
          </div>
        ))}
        <div className="scrollHint">Scroll ↓</div>
      </section>

      <section className="section" id="spreadsheet">
        <div className="wrap">
          <h2 className="sec-title reveal">Spreadsheet</h2>
          <div className="reveal"><Link className="cta" href="/spreadsheet">Entra nella Spreadsheet →</Link></div>
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
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='370' fill='none'%3E%3Crect width='100%25' height='100%25' fill='%23111'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='14'%3EImmagine non disp.%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    <div className="rail-meta">
                      <span className="badge">WEEKLY BEST</span>
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
              <button className="iconbtn" aria-label="Scorri a sinistra" onClick={() => scroll(-1)}>‹</button>
              <button className="iconbtn" aria-label="Scorri a destra" onClick={() => scroll(1)}>›</button>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="best-seller">
        <div className="wrap">
          <div className="eyebrow reveal">Best sellers</div>
          <h2 className="sec-title reveal">Sellers</h2>
          <div className="reveal"><Link className="cta ghost" href="/spreadsheet">Entra nella sezione →</Link></div>
        </div>
      </section>

      <section className="section" id="tutorial">
        <div className="wrap">
          <div className="eyebrow reveal">Guide</div>
          <h2 className="sec-title reveal">Tutorial</h2>
          <div className="reveal"><Link className="cta ghost" href="/#tutorial">Vai ai Tutorial →</Link></div>
        </div>
      </section>

      <section className="section" id="coupon">
        <div className="wrap">
          <div className="eyebrow reveal">Savings</div>
          <h2 className="sec-title reveal">Coupon</h2>
          <div className="tiles reveal">
            <div className="tile glass">
              <div className="eyebrow">Coming soon</div>
              <h3>Stiamo completando la sezione.</h3>
              <Link className="cta ghost" href="/#coupon" style={{ marginTop: 0 }}>Apri i Coupon →</Link>
              <p className="sec-sub">In arrivo a breve.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="community">
        <div className="wrap">
          <div className="eyebrow reveal">Community</div>
          <h2 className="sec-title reveal">Community</h2>
          <p className="sec-sub reveal">Il link alla community sarà disponibile a breve.</p>
        </div>
      </section>

      <div className="foot">© {new Date().getFullYear()} 360Pallix · {eur(0).slice(0, 1)} sample catalog</div>
    </main>
  );
}


