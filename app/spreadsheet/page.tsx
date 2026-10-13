"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PRODUCTS, eur, rmb, RMB_TO_EUR, type Product } from "@/lib/products";
import ExchangeRateWidget from "@/components/ExchangeRateWidget";

const uniq = (k: keyof Product, items: Product[]) =>
  [...new Set(items.map((p) => String(p[k] || "")).filter((s) => s && s !== "-" && s !== "—"))].sort();

const PER_PAGE = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

export default function Spreadsheet() {
  const [allProducts, setAllProducts] = useState<Product[]>(PRODUCTS);
  const [q, setQ] = useState("");
  const [order, setOrder] = useState("");
  const [seller, setSeller] = useState("");
  const [brand, setBrand] = useState("");
  const [cat, setCat] = useState("");
  const [favs, setFavs] = useState<string[]>([]);
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [legal, setLegal] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  useEffect(() => {
    setFavs(JSON.parse(localStorage.getItem("pallix-favs") || "[]"));
    setLegal(!localStorage.getItem("pallix-legal"));

    fetch(`/api/products?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          setAllProducts(data);
        }
      })
      .catch(() => {});
  }, []);

  const toggleFav = (id: string) => {
    const n = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
    setFavs(n);
    localStorage.setItem("pallix-favs", JSON.stringify(n));
  };

  const list = useMemo(() => {
    let l = allProducts.filter(
      (p) =>
        (!q || `${p.title} ${p.seller} ${p.brand} ${p.category}`.toLowerCase().includes(q.toLowerCase())) &&
        (!seller || p.seller === seller) &&
        (!brand || p.brand === brand) &&
        (!cat || p.category === cat) &&
        (!onlyFavs || favs.includes(p.id))
    );
    if (order === "asc") {
      l = [...l].sort((a, b) => a.price - b.price);
    }
    if (order === "desc") {
      l = [...l].sort((a, b) => b.price - a.price);
    }
    return l;
  }, [allProducts, q, order, seller, brand, cat, onlyFavs, favs]);

  const pages = Math.max(1, Math.ceil(list.length / perPage));
  const cur = Math.min(page, pages);
  const visible = list.slice((cur - 1) * perPage, cur * perPage);
  const goPage = (n: number) => {
    setPage(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // back to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [q, order, seller, brand, cat, onlyFavs]);

  const reset = () => {
    setQ("");
    setOrder("");
    setSeller("");
    setBrand("");
    setCat("");
    setOnlyFavs(false);
    setPage(1);
  };

  return (
    <main>
      <div className="sheet-bar">
        <div className="sheet-row1">
          <Link href="/" className="back">
            ← Home
          </Link>
          <input
            className="search"
            placeholder="Cerca (brand, seller, categoria, titolo)..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="filters">
          <select
            className="sel"
            value={order}
            onChange={(e) => {
              setOrder(e.target.value);
            }}
          >
            <option value="">Ordina</option>
            <option value="asc">Prezzo ↑</option>
            <option value="desc">Prezzo ↓</option>
          </select>
          <select className="sel" value={seller} onChange={(e) => setSeller(e.target.value)}>
            <option value="">Seller: Tutti</option>
            {uniq("seller", allProducts).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select className="sel" value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">Brand: Tutti</option>
            {uniq("brand", allProducts).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select className="sel" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">Categoria: Tutte</option>
            {uniq("category", allProducts).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button className="reset" onClick={reset}>
            Reset
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "14px 0 4px" }}>
          <ExchangeRateWidget />
        </div>
        <div className="sheet-sub">
          <span className="stat">
            Totale: <b>{list.length}</b>
          </span>
          <span className="stat">
            Pag <b>{cur}</b>/{pages}
          </span>
          <span className="sp" />
          <label className="perpage">
            <span>Per pagina</span>
            <select
              className="sel sel-sm"
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              {PER_PAGE.map((n) => (
                <option key={n} value={n}>
                  {n.toLocaleString("it-IT")}
                </option>
              ))}
            </select>
          </label>
          <button className={`pillbtn ${onlyFavs ? "on" : ""}`} onClick={() => setOnlyFavs(!onlyFavs)}>
            ♡ Preferiti
          </button>
        </div>
      </div>

      <div className="grid">
        {visible.map((p, i) => (
          <Link key={p.id} href={`/item/${p.id}`} className="card" style={{ animationDelay: `${i * 40}ms` }}>
            <button
              className={`fav ${favs.includes(p.id) ? "on" : ""}`}
              aria-label="Preferiti"
              title="Aggiungi/Rimuovi dai preferiti"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFav(p.id);
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
                <path
                  d="M12 20.5s-7.5-4.6-9.8-9.1C.6 8 2 4.7 5.2 3.7 7.6 3 9.9 4 12 6.4 14.1 4 16.4 3 18.8 3.7c3.2 1 4.6 4.3 3 7.7-2.3 4.5-9.8 9.1-9.8 9.1z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="card-media">
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
              <div className="price">
                <span>{eur(p.price)}</span>
                <span className="price-rmb" title="Prezzo originale in Yuan (¥)">
                  {rmb(p.priceRmb ?? p.price * RMB_TO_EUR)}
                </span>
              </div>
            </div>
            <div className="card-body">
              <div className="card-title">{p.title}</div>
              <div className="card-meta">
                {p.seller && p.seller !== "—" && p.seller !== "-" ? `${p.seller} • ` : ""}
                {p.category}
              </div>
              <span className="buy">Pallix Buy</span>
            </div>
          </Link>
        ))}
        {!list.length && <div className="empty">Nessun risultato.</div>}
      </div>

      {pages > 1 && (
        <nav className="pager" aria-label="Paginazione">
          <button className="pager-btn" disabled={cur <= 1} onClick={() => goPage(cur - 1)} aria-label="Pagina precedente">
            ←
          </button>
          <span className="pager-info">
            Pag {cur}/{pages}
          </span>
          <button className="pager-btn" disabled={cur >= pages} onClick={() => goPage(cur + 1)} aria-label="Pagina successiva">
            →
          </button>
        </nav>
      )}

      {legal && (
        <div className="overlay">
          <div className="modal glass" role="dialog" aria-modal="true">
            <div className="modal-head">
              <div className="tg-ico">ⓘ</div>
              <div>
                <div className="eyebrow">Info</div>
                <h3>Avviso legale</h3>
                <p>Limitazione di responsabilità</p>
              </div>
            </div>
            <div className="modal-body">
              <p>
                Il presente sito web è fornito esclusivamente a scopo informativo e di aggregazione di risorse. Il sito{" "}
                <b>non vende alcun articolo</b>, <b>non fornisce servizi di acquisto</b>, <b>non opera come intermediario</b> e{" "}
                <b>non rappresenta</b> venditori, marketplace o agent di terze parti.
              </p>
              <p>
                Qualsiasi collegamento a servizi/contenuti di terzi è pubblicato <b>senza garanzia</b>. Eventuali operazioni
                avvengono <b>esclusivamente</b> tra l’utente e la terza parte. L’utente è l’unico responsabile di ogni
                valutazione e scelta.
              </p>
              <p>
                Proseguendo nella navigazione, l’utente dichiara di comprendere e accettare che ogni decisione di acquisto è
                assunta <b>in autonomia</b> e sotto la propria esclusiva responsabilità.
              </p>
            </div>
            <button
              className="ok"
              onClick={() => {
                localStorage.setItem("pallix-legal", "1");
                setLegal(false);
              }}
            >
              Ho compreso
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
