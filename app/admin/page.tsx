"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { eur, rmb, RMB_TO_EUR, type Product } from "@/lib/products";

const CATEGORIES = [
  "SNEAKERS",
  "HOODIE",
  "TSHIRT",
  "PANTS",
  "JACKET",
  "ACCESSORIES",
  "OTHER",
] as const;

const PER_PAGE_OPTIONS = [10, 20, 50, 100, 250, 500];

const emptyProductForm = {
  title: "",
  image: "",
  price: "",
  priceRmb: "",
  seller: "",
  brand: "",
  category: "OTHER",
  cssbuyUrl: "",
  doppelfitUrl: "",
};

type Toast = {
  id: string;
  type: "success" | "error" | "info";
  message: string;
};

const normalizeId = (id: string) => {
  try {
    let s = String(id).trim();
    while (s.includes("%")) {
      const decoded = decodeURIComponent(s).trim();
      if (decoded === s) break;
      s = decoded;
    }
    return s.toLowerCase().trim();
  } catch {
    return String(id).trim().toLowerCase();
  }
};

export default function AdminPage() {
  // Navigation Tab State
  const [tab, setTab] = useState<"catalog" | "insert">("catalog");

  // Toast Feedback State
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth setup on mount
  useEffect(() => {
    try {
      document.cookie = "pallix_admin_auth=authenticated_360pallix; path=/; max-age=31536000; SameSite=Lax";
    } catch {}
    fetch("/api/auth", { method: "POST", credentials: "include" }).catch(() => {});
  }, []);

  // ----------------------------------------------------
  // CATALOG MANAGEMENT STATE
  // ----------------------------------------------------
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOrder, setFilterOrder] = useState("");
  const [filterSeller, setFilterSeller] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Read saved view mode on mount
  useEffect(() => {
    try {
      const savedView = localStorage.getItem("pallix-admin-view");
      if (savedView === "list" || savedView === "grid") {
        setViewMode(savedView);
      }
    } catch {}
  }, []);

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<typeof emptyProductForm>(emptyProductForm);
  const [editLoading, setEditLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Delete Modal State
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Backdrop drag guard
  const editBackdropMouseDownRef = useRef(false);
  const deleteBackdropMouseDownRef = useRef(false);

  useEffect(() => {
    const onMouseUp = () => {
      editBackdropMouseDownRef.current = false;
      deleteBackdropMouseDownRef.current = false;
    };
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, []);

  // Close modals on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingProduct) closeEditModal();
        if (deletingProduct) setDeletingProduct(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editingProduct, deletingProduct]);

  // Image Upload handler (supports both edit modal and insert form)
  const handleUploadImage = async (file: File, target: "edit" | "insert") => {
    if (!file.type.startsWith("image/")) {
      addToast("error", "Seleziona un file immagine valido (JPG, PNG, WEBP, GIF)");
      return;
    }
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-admin-auth": "1" },
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        addToast("error", data.error || "Errore durante il caricamento dell'immagine");
        return;
      }
      if (target === "edit") {
        setEditForm((prev) => ({ ...prev, image: data.url }));
      } else {
        setInsertForm((prev) => ({ ...prev, image: data.url }));
      }
      addToast("success", "Foto caricata con successo dal computer!");
    } catch {
      addToast("error", "Errore di connessione durante l'upload dell'immagine");
    } finally {
      setUploadingImg(false);
    }
  };

  // Fetch Products
  const loadProducts = async () => {
    setCatalogLoading(true);
    try {
      const res = await fetch(`/api/products?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data);
        }
      } else {
        addToast("error", "Impossibile caricare i prodotti dal server");
      }
    } catch {
      addToast("error", "Errore di connessione durante il recupero dei prodotti");
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Dynamic filter lists
  const uniqueBrands = useMemo(() => {
    return [...new Set(products.map((p) => p.brand).filter((b) => b && b !== "—" && b !== "-"))].sort();
  }, [products]);

  const uniqueSellers = useMemo(() => {
    return [...new Set(products.map((p) => p.seller).filter((s) => s && s !== "—" && s !== "-"))].sort();
  }, [products]);

  // Filtered and sorted catalog
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const fullText = `${p.title} ${p.brand} ${p.seller} ${p.category} ${p.id}`.toLowerCase();
        if (!fullText.includes(q)) return false;
      }
      if (filterSeller && p.seller !== filterSeller) return false;
      if (filterBrand && p.brand !== filterBrand) return false;
      if (filterCategory && p.category !== filterCategory) return false;
      return true;
    });

    if (filterOrder === "asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (filterOrder === "desc") {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (filterOrder === "title") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [products, searchQuery, filterOrder, filterSeller, filterBrand, filterCategory]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
  const curPage = Math.min(page, totalPages);
  const visibleProducts = useMemo(() => {
    const start = (curPage - 1) * perPage;
    return filteredProducts.slice(start, start + perPage);
  }, [filteredProducts, curPage, perPage]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterOrder, filterSeller, filterBrand, filterCategory]);

  const resetFilters = () => {
    setSearchQuery("");
    setFilterOrder("");
    setFilterSeller("");
    setFilterBrand("");
    setFilterCategory("");
    setPage(1);
  };

  const goPage = (n: number) => {
    setPage(n);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  // Open Edit Modal
  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    const rmbVal = p.priceRmb ?? (p.price ? Math.round(p.price * RMB_TO_EUR) : "");
    setEditForm({
      title: p.title || "",
      image: p.image || "",
      price: String(p.price || ""),
      priceRmb: rmbVal ? String(rmbVal) : "",
      seller: p.seller || "",
      brand: p.brand || "",
      category: p.category || "OTHER",
      cssbuyUrl: p.cssbuyUrl || "",
      doppelfitUrl: p.doppelfitUrl || "",
    });
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setEditForm(emptyProductForm);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const price = parseFloat(String(editForm.price).replace(",", "."));
    if (!editForm.title.trim() || !editForm.image.trim() || isNaN(price) || price <= 0) {
      addToast("error", "Titolo, immagine e prezzo valido (> 0) sono obbligatori");
      return;
    }

    const priceRmb = editForm.priceRmb
      ? parseFloat(String(editForm.priceRmb).replace(",", "."))
      : Math.round(price * RMB_TO_EUR);

    setEditLoading(true);
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(editingProduct.id)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": "1",
        },
        credentials: "include",
        body: JSON.stringify({
          ...editForm,
          title: editForm.title.trim(),
          image: editForm.image.trim(),
          brand: editForm.brand.trim() || "—",
          seller: editForm.seller.trim(),
          price,
          priceRmb: !isNaN(priceRmb) && priceRmb > 0 ? priceRmb : Math.round(price * RMB_TO_EUR),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        addToast("error", data.error || "Errore durante il salvataggio delle modifiche");
        return;
      }

      addToast("success", `Prodotto "${data.product.title}" modificato con successo!`);
      // Update local state immediately
      setProducts((prev) =>
        prev.map((item) => (item.id === editingProduct.id ? data.product : item))
      );
      closeEditModal();
    } catch {
      addToast("error", "Errore di connessione durante l'aggiornamento");
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    const targetId = deletingProduct.id;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(targetId)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": "1",
        },
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        addToast("error", data.error || "Errore durante l'eliminazione del prodotto");
        return;
      }

      addToast("success", "Prodotto eliminato con successo!");
      // Update local state immediately
      setProducts((prev) =>
        prev.filter((p) => p.id !== targetId && normalizeId(p.id) !== normalizeId(targetId))
      );
      setDeletingProduct(null);
    } catch {
      addToast("error", "Errore di connessione durante l'eliminazione");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ----------------------------------------------------
  // INSERT PRODUCT STATE
  // ----------------------------------------------------
  const [convertUrl, setConvertUrl] = useState("");
  const [convertLoading, setConvertLoading] = useState(false);
  const [insertSaving, setInsertSaving] = useState(false);
  const [insertForm, setInsertForm] = useState(emptyProductForm);

  const setInsertField =
    (k: keyof typeof emptyProductForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setInsertForm((prev) => ({ ...prev, [k]: e.target.value }));
    };

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    if (!convertUrl.trim()) return;
    setConvertLoading(true);
    try {
      const r = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: convertUrl.trim() }),
      });
      const d = await r.json();
      if (!r.ok) {
        addToast("error", d.error || "Errore nella conversione del link");
        return;
      }
      const pNum = parseFloat(String(d.price || "").replace(",", "."));
      const rmbVal = d.priceRmb
        ? String(d.priceRmb)
        : !isNaN(pNum) && pNum > 0
        ? String(Math.round(pNum * RMB_TO_EUR))
        : "";

      setInsertForm({
        ...emptyProductForm,
        title: d.title || "",
        image: d.image || "",
        price: d.price || "",
        priceRmb: rmbVal,
        cssbuyUrl: d.cssbuyUrl || "",
        doppelfitUrl: d.doppelfitUrl || "",
        category: "OTHER",
        brand: "",
        seller: "",
      });

      addToast(
        "success",
        `Link riconosciuto (${d.platform?.toUpperCase() || "OK"})! Campi e link affiliati compilati automaticamente.`
      );
    } catch {
      addToast("error", "Impossibile contattare il server per la conversione");
    } finally {
      setConvertLoading(false);
    }
  }

  async function handleSaveInsert(e: React.FormEvent) {
    e.preventDefault();
    const price = parseFloat(String(insertForm.price).replace(",", "."));
    if (!insertForm.title.trim() || !insertForm.image.trim() || isNaN(price) || price <= 0) {
      addToast("error", "Titolo, immagine e prezzo valido (> 0) sono obbligatori");
      return;
    }

    setInsertSaving(true);
    try {
      const r = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": "1",
        },
        credentials: "include",
        body: JSON.stringify(insertForm),
      });
      const d = await r.json();
      if (!r.ok) {
        addToast("error", d.error || "Errore durante il salvataggio del prodotto");
        return;
      }

      addToast("success", `Prodotto "${d.product.title}" aggiunto con successo al catalogo!`);
      // Update local catalog state immediately
      setProducts((prev) => [d.product, ...prev]);
      // Reset form
      setConvertUrl("");
      setInsertForm(emptyProductForm);
      // Switch back to catalog tab to see new product
      setTab("catalog");
    } catch {
      addToast("error", "Errore di connessione durante il salvataggio");
    } finally {
      setInsertSaving(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#08080a",
        color: "#fff",
        position: "relative",
      }}
    >
      {/* Background atmosphere */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(60% 40% at 50% 0%, rgba(185, 130, 255, 0.08), transparent 70%), radial-gradient(40% 30% at 80% 90%, rgba(140, 255, 210, 0.05), transparent 70%)",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* HEADER / NAVIGATION */}
        <header
          style={{
            maxWidth: 1700,
            margin: "0 auto",
            padding: "24px 20px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1
                style={{
                  fontSize: "clamp(22px, 3.5vw, 28px)",
                  margin: 0,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  background: "linear-gradient(135deg, #fff 40%, rgba(255,255,255,0.65))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Pannello Amministrazione
              </h1>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "rgba(185,130,255,0.15)",
                  border: "1px solid rgba(185,130,255,0.3)",
                  color: "#d8b4fe",
                }}
              >
                360PALLIX
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              Gestisci il catalogo prodotti, modifica foto e dettagli, crea link affiliati CSSBuy & Doppelfit.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(34, 197, 94, 0.12)",
                border: "1px solid rgba(34, 197, 94, 0.35)",
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                color: "#4ade80",
              }}
              title="Sessione locale autenticata automaticamente"
            >
              <span
                style={{
                  display: "inline-block",
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 10px #22c55e",
                }}
              />
              <span>Admin Autenticato</span>
            </div>

            <Link
              href="/spreadsheet"
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
                fontSize: 13,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s",
              }}
            >
              📊 Spreadsheet
            </Link>

            <Link
              href="/"
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
                fontSize: 13,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s",
              }}
            >
              ← Home
            </Link>
          </div>
        </header>

        {/* 1. SELETTORE NAVIGAZIONE SUPERIORE (TAB SWITCHER) */}
        <div className="admin-tabs-bar" style={{ marginTop: 20 }}>
          <button
            type="button"
            className={`admin-tab-btn ${tab === "catalog" ? "active" : ""}`}
            onClick={() => setTab("catalog")}
          >
            <span>📦 Gestione Prodotti</span>
            <span className="admin-tab-badge">{products.length}</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${tab === "insert" ? "active" : ""}`}
            onClick={() => setTab("insert")}
          >
            <span>➕ Inserimento Prodotto</span>
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* 2. VISTA "GESTIONE PRODOTTI": UI UNIFORMATA ALLA SPREADSHEET     */}
        {/* ---------------------------------------------------------------- */}
        {tab === "catalog" && (
          <div>
            {/* BARRA DEI FILTRI E RICERCA (.sheet-bar) */}
            <div className="sheet-bar">
              <div className="sheet-row1">
                <button
                  type="button"
                  className="back"
                  onClick={loadProducts}
                  disabled={catalogLoading}
                  title="Ricarica prodotti dal database"
                  style={{ cursor: "pointer" }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      marginRight: 6,
                      animation: catalogLoading ? "spin 0.8s linear infinite" : "none",
                    }}
                  >
                    🔄
                  </span>
                  Ricarica
                </button>

                <input
                  className="search"
                  placeholder="Cerca (brand, seller, categoria, titolo, ID)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                <button
                  type="button"
                  className="back"
                  onClick={() => setTab("insert")}
                  style={{
                    background: "linear-gradient(135deg, #b982ff, #8cffd2)",
                    color: "#0a0a0c",
                    fontWeight: 700,
                    border: 0,
                    cursor: "pointer",
                  }}
                  title="Aggiungi un nuovo prodotto"
                >
                  ➕ Nuovo
                </button>
              </div>

              {/* DROPDOWN FILTRI (.filters) */}
              <div className="filters">
                <select
                  className="sel"
                  value={filterOrder}
                  onChange={(e) => setFilterOrder(e.target.value)}
                >
                  <option value="">Ordina</option>
                  <option value="asc">Prezzo ↑</option>
                  <option value="desc">Prezzo ↓</option>
                  <option value="title">Titolo A-Z</option>
                </select>

                <select
                  className="sel"
                  value={filterSeller}
                  onChange={(e) => setFilterSeller(e.target.value)}
                >
                  <option value="">Seller: Tutti</option>
                  {uniqueSellers.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  className="sel"
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                >
                  <option value="">Brand: Tutti</option>
                  {uniqueBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                <select
                  className="sel"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">Categoria: Tutte</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <button type="button" className="reset" onClick={resetFilters}>
                  Reset
                </button>
              </div>

              {/* BARRA STATISTICHE (.sheet-sub) */}
              <div className="sheet-sub">
                <span className="stat">
                  Totale: <b>{filteredProducts.length}</b>
                </span>
                <span className="stat">
                  Pagina <b>{curPage}</b>/{totalPages}
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
                    {PER_PAGE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n.toLocaleString("it-IT")}
                      </option>
                    ))}
                  </select>
                </label>

                {/* SWITCHER VISTA GRIGLIA / LISTA */}
                <div className="view-switcher" title="Modalità di visualizzazione">
                  <button
                    type="button"
                    className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                    onClick={() => {
                      setViewMode("grid");
                      try {
                        localStorage.setItem("pallix-admin-view", "grid");
                      } catch {}
                    }}
                    title="Vista a griglia (card)"
                  >
                    <span>⊞</span>
                    <span>Griglia</span>
                  </button>
                  <button
                    type="button"
                    className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                    onClick={() => {
                      setViewMode("list");
                      try {
                        localStorage.setItem("pallix-admin-view", "list");
                      } catch {}
                    }}
                    title="Vista a lista (tabella)"
                  >
                    <span>☰</span>
                    <span>Lista</span>
                  </button>
                </div>
              </div>
            </div>

            {/* VISTA CATALOGO: LISTA (TABELLA) OPPURE GRIGLIA (CARD) */}
            {viewMode === "list" ? (
              <div className="table-wrap">
                <table className="sheet-table">
                  <thead>
                    <tr>
                      <th style={{ width: 70 }}>Foto</th>
                      <th>Titolo & ID</th>
                      <th style={{ width: 140 }}>Categoria</th>
                      <th style={{ width: 140 }}>Brand & Seller</th>
                      <th style={{ width: 130 }}>Prezzo</th>
                      <th style={{ width: 160 }}>Affiliazioni</th>
                      <th style={{ width: 180, textAlign: "right" }}>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.map((p) => (
                      <tr key={p.id} className="sheet-table-row">
                        <td>
                          <div className="table-thumb">
                            <img
                              src={p.image}
                              alt={p.title}
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='none'%3E%3Crect width='100%25' height='100%25' fill='%23111'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='10'%3EN/D%3C/text%3E%3C/svg%3E";
                              }}
                            />
                          </div>
                        </td>
                        <td>
                          <Link
                            href={`/item/${encodeURIComponent(p.id)}`}
                            target="_blank"
                            className="table-title-link"
                            title="Apri scheda prodotto in una nuova scheda"
                            style={{ display: "inline-block" }}
                          >
                            <div className="table-title">{p.title}</div>
                          </Link>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace", marginTop: 4 }}>
                            {p.id}
                          </div>
                        </td>
                        <td>
                          <span className="table-cat">{p.category}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                            {p.brand && p.brand !== "—" ? p.brand : "—"}
                          </div>
                          <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                            {p.seller && p.seller !== "—" && p.seller !== "-" ? `👤 ${p.seller}` : "—"}
                          </div>
                        </td>
                        <td>
                          <div className="table-price">{eur(p.price)}</div>
                          <div className="table-price-rmb">
                            ¥ {p.priceRmb ?? Math.round(p.price * RMB_TO_EUR)}
                          </div>
                        </td>
                        <td>
                          <div className="table-aff">
                            {p.cssbuyUrl ? (
                              <a
                                href={p.cssbuyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="table-aff-link table-aff-cssbuy"
                                title="Apri link affiliato CSSBuy"
                              >
                                CSSBuy ↗
                              </a>
                            ) : (
                              <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)" }}>—</span>
                            )}
                            {p.doppelfitUrl && (
                              <a
                                href={p.doppelfitUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="table-aff-link table-aff-doppel"
                                title="Apri link Doppelfit"
                              >
                                Doppelfit ↗
                              </a>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="table-actions" style={{ justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="admin-btn admin-btn-edit"
                              onClick={() => openEditModal(p)}
                              title="Modifica dati del prodotto"
                            >
                              ✏️ Modifica
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn-del"
                              onClick={() => setDeletingProduct(p)}
                              title="Elimina questo prodotto"
                            >
                              🗑️ Elimina
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredProducts.length && !catalogLoading && (
                  <div className="empty">Nessun prodotto trovato per i criteri selezionati.</div>
                )}
              </div>
            ) : (
              /* GRIGLIA PRODOTTI (.grid e .card) */
              <div className="grid">
                {visibleProducts.map((p, i) => (
                  <div
                    key={p.id}
                    className="card"
                    style={{ animationDelay: `${(i % 24) * 30}ms` }}
                  >
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

                      <Link
                        href={`/item/${encodeURIComponent(p.id)}`}
                        target="_blank"
                        className="admin-card-view"
                        title="Visualizza scheda prodotto in nuova scheda"
                      >
                        ↗
                      </Link>
                    </div>

                    <div className="card-body">
                      <div className="card-title" title={p.title}>
                        {p.title}
                      </div>
                      <div className="card-meta">
                        {p.seller && p.seller !== "—" && p.seller !== "-" ? `${p.seller} • ` : ""}
                        {p.category}
                        {p.brand && p.brand !== "—" ? ` • ${p.brand}` : ""}
                      </div>

                      {/* AZIONI AMMINISTRATIVE INTEGRATE SU OGNI CARD */}
                      <div className="admin-actions">
                        <button
                          type="button"
                          className="admin-btn admin-btn-edit"
                          onClick={() => openEditModal(p)}
                          title="Modifica dati del prodotto"
                        >
                          ✏️ Modifica
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-del"
                          onClick={() => setDeletingProduct(p)}
                          title="Elimina questo prodotto"
                        >
                          🗑️ Elimina
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {!filteredProducts.length && !catalogLoading && (
                  <div className="empty">Nessun prodotto trovato per i criteri selezionati.</div>
                )}
              </div>
            )}

            {/* PAGINAZIONE (.pager) */}
            {totalPages > 1 && (
              <nav className="pager" aria-label="Paginazione">
                <button
                  type="button"
                  className="pager-btn"
                  disabled={curPage <= 1}
                  onClick={() => goPage(curPage - 1)}
                  aria-label="Pagina precedente"
                >
                  ←
                </button>
                <span className="pager-info">
                  Pagina {curPage}/{totalPages}
                </span>
                <button
                  type="button"
                  className="pager-btn"
                  disabled={curPage >= totalPages}
                  onClick={() => goPage(curPage + 1)}
                  aria-label="Pagina successiva"
                >
                  →
                </button>
              </nav>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* 3. VISTA "INSERIMENTO PRODOTTO": FORM PULITO E DEDICATO          */}
        {/* ---------------------------------------------------------------- */}
        {tab === "insert" && (
          <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 20px 80px" }}>
            {/* BOX AUTOCONVERSIONE LINK */}
            <section
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 24,
                padding: 26,
                marginBottom: 24,
                backdropFilter: "blur(14px)",
              }}
            >
              <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 8, fontWeight: 700 }}>
                🔗 1. Autoconversione Link (Opzionale)
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 0, marginBottom: 18 }}>
                Incolla un link da <strong>Taobao</strong>, <strong>Weidian</strong>, <strong>1688</strong>,{" "}
                <strong>CSSBuy</strong> (anche <code>cssb.uy/...</code>) o <strong>Doppelfit</strong>. Verranno estratti titolo, immagine, prezzi e generati in automatico i link affiliati.
              </p>

              <form onSubmit={handleConvert} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  type="text"
                  value={convertUrl}
                  onChange={(e) => setConvertUrl(e.target.value)}
                  placeholder="https://weidian.com/item.html?itemID=... oppure https://cssb.uy/..."
                  style={{
                    flex: "1 1 320px",
                    background: "rgba(0,0,0,0.6)",
                    border: "1px solid rgba(255,255,255,0.16)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    color: "#fff",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={convertLoading}
                  style={{
                    padding: "12px 24px",
                    borderRadius: 12,
                    background: "linear-gradient(90deg, #3b82f6, #1d4ed8)",
                    border: 0,
                    color: "#fff",
                    fontWeight: 600,
                    cursor: convertLoading ? "wait" : "pointer",
                    opacity: convertLoading ? 0.7 : 1,
                  }}
                >
                  {convertLoading ? "Conversione..." : "Converti Link"}
                </button>
              </form>
            </section>

            {/* FORM COMPLETO CAMPI PRODOTTO */}
            <form
              onSubmit={handleSaveInsert}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 24,
                padding: 26,
                display: "grid",
                gap: 20,
                backdropFilter: "blur(14px)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>📦 2. Dettagli del Prodotto</h2>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>* Campi obbligatori</span>
              </div>

              {/* Titolo */}
              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                  Titolo Prodotto *
                </label>
                <input
                  required
                  type="text"
                  value={insertForm.title}
                  onChange={setInsertField("title")}
                  placeholder="es. Nike Air Force 1 Low '07 Triple White"
                  style={inputStyle}
                />
              </div>

              {/* Immagine con anteprima e upload da PC */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                  <label style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                    URL Immagine / Foto *
                  </label>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#38bdf8",
                      cursor: uploadingImg ? "wait" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      borderRadius: 8,
                      background: "rgba(56, 189, 248, 0.12)",
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                      fontWeight: 600,
                    }}
                    title="Scegli una foto dal computer da caricare su /api/upload"
                  >
                    {uploadingImg ? (
                      <>
                        <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>🔄</span>
                        <span>Caricamento in corso...</span>
                      </>
                    ) : (
                      <>
                        <span>📁</span>
                        <span>Carica foto dal PC</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImg}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadImage(file, "insert");
                      }}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
                <input
                  required
                  type="text"
                  value={insertForm.image}
                  onChange={setInsertField("image")}
                  placeholder="https://... oppure /uploads/... oppure /products/p1.jpg"
                  style={inputStyle}
                />

                {insertForm.image && (
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 14 }}>
                    <img
                      src={insertForm.image}
                      alt="Anteprima foto"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='none'%3E%3Crect width='100%25' height='100%25' fill='%23222'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23777' font-size='10'%3EAnteprima%3C/text%3E%3C/svg%3E";
                      }}
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.2)",
                      }}
                    />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                      Anteprima immagine caricata
                    </span>
                  </div>
                )}
              </div>

              {/* Prezzi (EUR & RMB) calcolati automaticamente */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                    Prezzo in € (EUR) *
                  </label>
                  <input
                    required
                    type="text"
                    value={insertForm.price}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = parseFloat(val.replace(",", "."));
                      setInsertForm((prev) => ({
                        ...prev,
                        price: val,
                        priceRmb: !isNaN(num) && num > 0 ? String(Math.round(num * RMB_TO_EUR)) : prev.priceRmb,
                      }));
                    }}
                    placeholder="es. 29.90"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                    Prezzo originale in ¥ (CNY / RMB)
                  </label>
                  <input
                    type="text"
                    value={insertForm.priceRmb}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = parseFloat(val.replace(",", "."));
                      setInsertForm((prev) => ({
                        ...prev,
                        priceRmb: val,
                        price: !isNaN(num) && num > 0 ? (num / RMB_TO_EUR).toFixed(2) : prev.price,
                      }));
                    }}
                    placeholder="es. 223"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                    Categoria
                  </label>
                  <select
                    value={insertForm.category}
                    onChange={setInsertField("category")}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Brand & Seller */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                    Brand
                  </label>
                  <input
                    type="text"
                    value={insertForm.brand}
                    onChange={setInsertField("brand")}
                    placeholder="es. Nike, Supreme, Hellstar..."
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                    Seller <span style={{ opacity: 0.6 }}>(opzionale)</span>
                  </label>
                  <input
                    type="text"
                    value={insertForm.seller}
                    onChange={setInsertField("seller")}
                    placeholder="es. YOLO66, Chaosmade, Mook..."
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Link CSSBuy & Doppelfit */}
              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#4ade80", fontWeight: 600 }}>
                  🛒 Link Affiliato CSSBuy
                </label>
                <input
                  type="text"
                  value={insertForm.cssbuyUrl}
                  onChange={setInsertField("cssbuyUrl")}
                  placeholder="https://www.cssbuy.com/shop/goodsDetail?promotionCode=..."
                  style={{ ...inputStyle, borderColor: "rgba(34, 197, 94, 0.4)" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#818cf8", fontWeight: 600 }}>
                  🔍 Link o ID Doppelfit (referral ?ref=PPnCbrec garantito)
                </label>
                <input
                  type="text"
                  value={insertForm.doppelfitUrl}
                  onChange={setInsertField("doppelfitUrl")}
                  placeholder="https://doppel.fit/x5sUY8JQ oppure lascia vuoto"
                  style={{ ...inputStyle, borderColor: "rgba(99, 102, 241, 0.4)" }}
                />
              </div>

              <button
                type="submit"
                disabled={insertSaving}
                style={{
                  marginTop: 8,
                  padding: "14px 28px",
                  borderRadius: 14,
                  background: "linear-gradient(90deg, #16a34a, #15803d)",
                  border: 0,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: insertSaving ? "wait" : "pointer",
                  boxShadow: "0 10px 30px rgba(22, 163, 74, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {insertSaving ? "Salvataggio nel catalogo..." : "💾 Salva Prodotto nel Catalogo"}
              </button>
            </form>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* MODAL MODIFICA PRODOTTO                                          */}
        {/* ---------------------------------------------------------------- */}
        {editingProduct && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 300,
              display: "grid",
              placeItems: "center",
              padding: "16px",
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(10px)",
              animation: "fadeIn 0.2s ease-out",
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                editBackdropMouseDownRef.current = true;
              }
            }}
            onClick={(e) => {
              if (editBackdropMouseDownRef.current && e.target === e.currentTarget) {
                closeEditModal();
              }
              editBackdropMouseDownRef.current = false;
            }}
          >
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                editBackdropMouseDownRef.current = false;
              }}
              style={{
                width: "min(680px, 100%)",
                maxHeight: "calc(100vh - 40px)",
                overflowY: "auto",
                borderRadius: 24,
                padding: "28px 24px",
                background: "rgba(18, 18, 22, 0.95)",
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 30px 90px rgba(0,0,0,0.8)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: 16,
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  marginBottom: 20,
                }}
              >
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>
                    ✏️ Modifica Dettagli Prodotto
                  </h3>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>
                    ID: {editingProduct.id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={closeEditModal}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    color: "#fff",
                    borderRadius: "50%",
                    width: 36,
                    height: 36,
                    cursor: "pointer",
                    fontSize: 14,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEdit} style={{ display: "grid", gap: 18 }}>
                {/* Immagine con anteprima e upload PC */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                    <label style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                      URL Immagine / Foto *
                    </label>
                    <label
                      style={{
                        fontSize: 12,
                        color: "#38bdf8",
                        cursor: uploadingImg ? "wait" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 10px",
                        borderRadius: 8,
                        background: "rgba(56, 189, 248, 0.12)",
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        fontWeight: 600,
                      }}
                      title="Scegli una foto dal computer da caricare"
                    >
                      {uploadingImg ? (
                        <>
                          <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>🔄</span>
                          <span>Caricamento in corso...</span>
                        </>
                      ) : (
                        <>
                          <span>📁</span>
                          <span>Carica foto dal PC</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImg}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadImage(file, "edit");
                        }}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 14,
                        overflow: "hidden",
                        background: "rgba(0,0,0,0.5)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        flexShrink: 0,
                        position: "relative",
                      }}
                    >
                      <img
                        src={editForm.image}
                        alt="Anteprima foto"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='none'%3E%3Crect width='100%25' height='100%25' fill='%23222'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23777' font-size='10'%3EAnteprima%3C/text%3E%3C/svg%3E";
                        }}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <input
                        required
                        type="text"
                        value={editForm.image}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, image: e.target.value }))}
                        placeholder="https://... oppure /uploads/..."
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                {/* Titolo */}
                <div>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                    Titolo Prodotto *
                  </label>
                  <input
                    required
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Titolo descrittivo"
                    style={inputStyle}
                  />
                </div>

                {/* Prezzi & Categoria */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                      Prezzo in € (EUR) *
                    </label>
                    <input
                      required
                      type="text"
                      value={editForm.price}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = parseFloat(val.replace(",", "."));
                        setEditForm((prev) => ({
                          ...prev,
                          price: val,
                          priceRmb: !isNaN(num) && num > 0 ? String(Math.round(num * RMB_TO_EUR)) : prev.priceRmb,
                        }));
                      }}
                      placeholder="es. 24.50"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                      Prezzo originale in ¥ (CNY / RMB)
                    </label>
                    <input
                      type="text"
                      value={editForm.priceRmb}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = parseFloat(val.replace(",", "."));
                        setEditForm((prev) => ({
                          ...prev,
                          priceRmb: val,
                          price: !isNaN(num) && num > 0 ? (num / RMB_TO_EUR).toFixed(2) : prev.price,
                        }));
                      }}
                      placeholder="es. 190"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                      Categoria
                    </label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Brand & Seller */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                      Brand
                    </label>
                    <input
                      type="text"
                      value={editForm.brand}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, brand: e.target.value }))}
                      placeholder="es. Nike, Supreme, Hellstar..."
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                      Seller <span style={{ opacity: 0.6 }}>(opzionale)</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.seller}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, seller: e.target.value }))}
                      placeholder="es. YOLO66, JMDY, Mook..."
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* CSSBuy URL */}
                <div>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#4ade80", fontWeight: 600 }}>
                    🛒 Link Affiliato CSSBuy
                  </label>
                  <input
                    type="text"
                    value={editForm.cssbuyUrl}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, cssbuyUrl: e.target.value }))}
                    placeholder="https://www.cssbuy.com/shop/goodsDetail?promotionCode=..."
                    style={{ ...inputStyle, borderColor: "rgba(34, 197, 94, 0.4)" }}
                  />
                </div>

                {/* Doppelfit URL */}
                <div>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#818cf8", fontWeight: 600 }}>
                    🔍 Link o ID Doppelfit
                  </label>
                  <input
                    type="text"
                    value={editForm.doppelfitUrl}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, doppelfitUrl: e.target.value }))}
                    placeholder="https://doppel.fit/... oppure ID item"
                    style={{ ...inputStyle, borderColor: "rgba(99, 102, 241, 0.4)" }}
                  />
                </div>

                {/* Modal Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      color: "#fff",
                      fontSize: 13.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Annulla
                  </button>

                  <button
                    type="submit"
                    disabled={editLoading}
                    style={{
                      padding: "10px 24px",
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                      border: 0,
                      color: "#fff",
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: editLoading ? "wait" : "pointer",
                      boxShadow: "0 8px 24px rgba(139, 92, 246, 0.35)",
                    }}
                  >
                    {editLoading ? "Salvataggio..." : "💾 Salva Modifiche"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* MODAL CONFERMA ELIMINAZIONE PRODOTTO                             */}
        {/* ---------------------------------------------------------------- */}
        {deletingProduct && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 350,
              display: "grid",
              placeItems: "center",
              padding: "16px",
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(10px)",
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                deleteBackdropMouseDownRef.current = true;
              }
            }}
            onClick={(e) => {
              if (deleteBackdropMouseDownRef.current && e.target === e.currentTarget) {
                setDeletingProduct(null);
              }
              deleteBackdropMouseDownRef.current = false;
            }}
          >
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                deleteBackdropMouseDownRef.current = false;
              }}
              style={{
                width: "min(500px, 100%)",
                borderRadius: 24,
                padding: "26px",
                background: "rgba(22, 18, 20, 0.96)",
                border: "1px solid rgba(239, 68, 68, 0.35)",
                boxShadow: "0 30px 90px rgba(0,0,0,0.85)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.35)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 22,
                  }}
                >
                  ⚠️
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f87171" }}>
                    Conferma Eliminazione
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>
                    L&apos;operazione è irreversibile e rimuoverà il prodotto dal catalogo.
                  </p>
                </div>
              </div>

              {/* Product preview */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  padding: "12px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  marginBottom: 18,
                }}
              >
                <img
                  src={deletingProduct.image}
                  alt={deletingProduct.title}
                  style={{ width: 54, height: 54, borderRadius: 10, objectFit: "cover" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {deletingProduct.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                    {eur(deletingProduct.price)} • {deletingProduct.category}
                  </div>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleDeleteProduct();
                }}
              >
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setDeletingProduct(null)}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      color: "#fff",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={deleteLoading}
                    style={{
                      padding: "9px 20px",
                      borderRadius: 12,
                      background: "linear-gradient(90deg, #ef4444, #dc2626)",
                      border: 0,
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: deleteLoading ? "wait" : "pointer",
                      boxShadow: "0 6px 20px rgba(239, 68, 68, 0.4)",
                    }}
                  >
                    {deleteLoading ? "Eliminazione..." : "🗑️ Elimina Prodotto"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* FLOATING TOAST NOTIFICATIONS                                     */}
        {/* ---------------------------------------------------------------- */}
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 400,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            maxWidth: 380,
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              style={{
                padding: "12px 16px",
                borderRadius: 14,
                fontSize: 13.5,
                lineHeight: 1.4,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                background:
                  t.type === "success"
                    ? "rgba(16, 185, 129, 0.95)"
                    : t.type === "error"
                    ? "rgba(239, 68, 68, 0.95)"
                    : "rgba(59, 130, 246, 0.95)",
                color: "#fff",
                boxShadow: "0 14px 40px rgba(0,0,0,0.6)",
                border: "1px solid rgba(255,255,255,0.2)",
                animation: "toastSlide 0.25s ease-out",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>{t.type === "success" ? "✅" : t.type === "error" ? "⚠️" : "ℹ️"}</span>
                <span>{t.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "#fff",
                  fontSize: 14,
                  cursor: "pointer",
                  padding: 2,
                  opacity: 0.8,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.5)",
  color: "#fff",
  fontSize: 13.5,
  outline: "none",
  boxSizing: "border-box",
};
