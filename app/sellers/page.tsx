"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BRANDS, SELLERS, type BrandItem, type SellerItem } from "@/lib/sellers";

const BRAND_CATEGORIES = [
  "Tutti",
  "Scarpe",
  "Abbigliamento & Streetwear",
  "Giacche & Outerwear",
  "Accessori & Borse",
  "Sport & Football",
  "Elettronica & Tech",
];

const SELLER_CATEGORIES = [
  "Tutti",
  "Scarpe",
  "Abbigliamento",
  "Giacche",
  "Borse & Pelletteria",
  "Accessori",
  "Tech",
];

export default function SellersPage() {
  const [activeTab, setActiveTab] = useState<"brands" | "sellers">("brands");
  const [search, setSearch] = useState("");
  const [brandCategory, setBrandCategory] = useState("Tutti");
  const [sellerCategory, setSellerCategory] = useState("Tutti");

  // Filtered Brands
  const filteredBrands = useMemo(() => {
    const q = search.trim().toLowerCase();
    return BRANDS.filter((b) => {
      const matchCat = brandCategory === "Tutti" || b.category === brandCategory;
      const matchSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.sellers.some((s) => s.name.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [search, brandCategory]);

  // Filtered Sellers
  const filteredSellers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SELLERS.filter((s) => {
      const matchCat = sellerCategory === "Tutti" || s.category === sellerCategory;
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.specialty.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.brands.some((br) => br.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [search, sellerCategory]);

  const resetFilters = () => {
    setSearch("");
    setBrandCategory("Tutti");
    setSellerCategory("Tutti");
  };

  return (
    <main style={{ minHeight: "100dvh", background: "#000", color: "#fff", paddingBottom: 80 }}>
      {/* Top bar */}
      <div className="sheet-bar">
        <div className="sheet-row1">
          <Link href="/" className="back">
            ← Home
          </Link>
          <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 10 }}>
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
              Guida Acquisti
            </Link>
          </div>
        </div>
      </div>

      <div className="dir-page">
        {/* Header */}
        <div className="dir-header">
          <div style={{ display: "inline-flex", gap: 8, marginBottom: 12 }}>
            <span className="badge-verified">DIRECTORY VERIFICATA</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              STORE YUPOO & WEIDIAN
            </span>
          </div>

          <h1 className="dir-title">
            Best Seller & <span className="dir-title-accent">Brand Directory</span>
          </h1>

          <p className="dir-subtitle">
            Esplora i migliori venditori streetwear e reps verificati, organizzati per marchio o per negozio ufficiale.
            Visita i loro cataloghi e trova i singoli articoli nel nostro Spreadsheet.
          </p>

          <div className="dir-counts">
            <span>🏷️ <b>{BRANDS.length}</b> Brand Ufficiali</span>
            <span>•</span>
            <span>🏪 <b>{SELLERS.length}</b> Seller Verificati</span>
          </div>
        </div>

        {/* Tab Switcher: Per Brand / Per Seller */}
        <div className="dir-switcher-wrap">
          <div className="dir-switcher">
            <button
              type="button"
              className={`dir-switcher-btn ${activeTab === "brands" ? "active" : ""}`}
              onClick={() => setActiveTab("brands")}
            >
              <span>🏷️</span>
              <span>Per Brand ({BRANDS.length})</span>
            </button>
            <button
              type="button"
              className={`dir-switcher-btn ${activeTab === "sellers" ? "active" : ""}`}
              onClick={() => setActiveTab("sellers")}
            >
              <span>🏪</span>
              <span>Per Seller ({SELLERS.length})</span>
            </button>
          </div>
        </div>

        {/* Sticky Filter Bar: Real-time search + Categories */}
        <div className="dir-filter-bar">
          <div className="dir-search-wrap">
            <svg
              className="dir-search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="dir-search-input"
              placeholder={
                activeTab === "brands"
                  ? "Cerca brand (es. Nike, Trapstar, Chrome Hearts, Stussy)..."
                  : "Cerca seller (es. YOLO, WWTOP, Husky, Goat Official)..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(255,255,255,0.1)",
                  border: 0,
                  color: "#fff",
                  borderRadius: "50%",
                  width: 22,
                  height: 22,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 11,
                  cursor: "pointer",
                }}
                title="Cancella ricerca"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="dir-cat-pills">
            {activeTab === "brands"
              ? BRAND_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`dir-cat-pill ${brandCategory === cat ? "active" : ""}`}
                    onClick={() => setBrandCategory(cat)}
                  >
                    {cat}
                  </button>
                ))
              : SELLER_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`dir-cat-pill ${sellerCategory === cat ? "active" : ""}`}
                    onClick={() => setSellerCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
          </div>
        </div>

        {/* Content View: Brands or Sellers */}
        {activeTab === "brands" ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                Mostrando <b>{filteredBrands.length}</b> di {BRANDS.length} brand
              </span>
              {(search || brandCategory !== "Tutti") && (
                <button
                  type="button"
                  onClick={resetFilters}
                  style={{
                    background: "transparent",
                    border: 0,
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Resetta filtri ↺
                </button>
              )}
            </div>

            {filteredBrands.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 20px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 24,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
                <h3 style={{ fontSize: 18, margin: "0 0 6px" }}>Nessun brand trovato</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: "0 0 16px" }}>
                  Nessun marchio corrisponde a &quot;{search}&quot;. Prova a cercare un altro nome o seleziona un&apos;altra categoria.
                </p>
                <button type="button" className="cta" onClick={resetFilters}>
                  Resetta tutti i filtri
                </button>
              </div>
            ) : (
              <div className="brands-grid">
                {filteredBrands.map((brand) => (
                  <BrandCard key={brand.id} brand={brand} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                Mostrando <b>{filteredSellers.length}</b> di {SELLERS.length} seller verificati
              </span>
              {(search || sellerCategory !== "Tutti") && (
                <button
                  type="button"
                  onClick={resetFilters}
                  style={{
                    background: "transparent",
                    border: 0,
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Resetta filtri ↺
                </button>
              )}
            </div>

            {filteredSellers.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 20px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 24,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
                <h3 style={{ fontSize: 18, margin: "0 0 6px" }}>Nessun seller trovato</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: "0 0 16px" }}>
                  Nessun venditore corrisponde a &quot;{search}&quot;. Prova a verificare l&apos;ortografia o reimposta i filtri.
                </p>
                <button type="button" className="cta" onClick={resetFilters}>
                  Resetta tutti i filtri
                </button>
              </div>
            ) : (
              <div className="sellers-grid">
                {filteredSellers.map((seller) => (
                  <SellerCard key={seller.id} seller={seller} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function BrandCard({ brand }: { brand: BrandItem }) {
  return (
    <section className="brand-card">
      <div className="brand-cover-wrap">
        <img
          src={brand.cover}
          alt={brand.name}
          className="brand-cover-img"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (!target.dataset.triedProxy && brand.cover?.startsWith("http")) {
              target.dataset.triedProxy = "true";
              target.src = `/api/image-proxy?url=${encodeURIComponent(brand.cover)}`;
            } else {
              target.src =
                "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' fill='none'%3E%3Crect width='100%25' height='100%25' fill='%23111'/%3E%3C/svg%3E";
            }
          }}
        />
        <div className="brand-cover-overlay">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
            <div>
              <span className="brand-meta-tag">{brand.category}</span>
              <h2 className="brand-name">{brand.name}</h2>
              <span className="brand-sellers-count">
                {brand.sellersCount} {brand.sellersCount === 1 ? "seller verificato" : "seller verificati"}
              </span>
            </div>
            <Link
              href={`/spreadsheet?q=${encodeURIComponent(brand.name)}`}
              className="seller-btn-find"
              style={{
                height: 34,
                padding: "0 14px",
                fontSize: 11.5,
                flexShrink: 0,
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.35)",
              }}
              title={`Cerca tutti i prodotti ${brand.name} nello Spreadsheet`}
            >
              Spreadsheet →
            </Link>
          </div>
        </div>
      </div>

      <div className="brand-sellers-list">
        {brand.sellers.map((s) => (
          <div key={s.name} className="brand-seller-item">
            <div className="brand-seller-name" title={s.name}>
              {s.name}
            </div>
            <div className="brand-seller-btns">
              {s.officialUrl ? (
                <a
                  href={s.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brand-btn-shop"
                  title="Visita catalogo ufficiale"
                >
                  Sito store ↗
                </a>
              ) : (
                <span
                  className="brand-btn-shop"
                  style={{ opacity: 0.4, cursor: "default" }}
                >
                  Store n.d.
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SellerCard({ seller }: { seller: SellerItem }) {
  return (
    <div className="seller-dir-card">
      <div className="seller-card-top">
        <img
          src={seller.cover}
          alt={seller.name}
          className="seller-card-img"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (!target.dataset.triedProxy && seller.cover?.startsWith("http")) {
              target.dataset.triedProxy = "true";
              target.src = `/api/image-proxy?url=${encodeURIComponent(seller.cover)}`;
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
            {seller.platform}
          </span>
        </div>
      </div>

      <div className="seller-card-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <h2 className="seller-card-name">{seller.name}</h2>
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
            {seller.category}
          </span>
        </div>

        <div className="seller-card-spec">
          <span>★</span>
          <span>{seller.specialty}</span>
        </div>

        <p className="seller-card-desc">{seller.description}</p>

        {/* Brand tags handled */}
        {seller.brands.length > 0 && (
          <div className="seller-brands-tags">
            {seller.brands.slice(0, 4).map((b) => (
              <span key={b} className="seller-brand-tag">
                {b}
              </span>
            ))}
            {seller.brands.length > 4 && (
              <span
                className="seller-brand-tag"
                style={{ background: "rgba(255,255,255,0.08)", color: "#ffffff", borderColor: "rgba(255,255,255,0.18)" }}
              >
                +{seller.brands.length - 4} altri
              </span>
            )}
          </div>
        )}

        <div className="seller-card-actions">
          {seller.officialUrl ? (
            <a
              href={seller.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="seller-btn-store"
              title="Apri negozio ufficiale"
            >
              Sito store ↗
            </a>
          ) : (
            <span className="seller-btn-store" style={{ opacity: 0.4, cursor: "default" }}>
              Store n.d.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
