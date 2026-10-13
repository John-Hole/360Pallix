"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { eur, rmb, type Product } from "@/lib/products";

const CATEGORIES = [
  "SNEAKERS",
  "HOODIE",
  "TSHIRT",
  "PANTS",
  "JACKET",
  "ACCESSORIES",
  "OTHER",
] as const;

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

export default function AdminPage() {
  const [tab, setTab] = useState<"catalog" | "single">("catalog");

  // Toast feedback state
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

  // Generate local auth cookie session on mount
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
  const [catalogSearch, setCatalogSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterSeller, setFilterSeller] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "title">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(24);

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<typeof emptyProductForm>(emptyProductForm);
  const [editLoading, setEditLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Delete Modal State
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Prevent backdrop click dismiss on drag selection (when selecting text and releasing outside)
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

  // Close modals on Escape key
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

  // Image Upload handler
  const handleUploadImage = async (file: File, target: "edit" | "single") => {
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
        headers: {
          "x-admin-auth": "1",
        },
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
        setF((prev) => ({ ...prev, image: data.url }));
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
      const res = await fetch("/api/products", { cache: "no-store" });
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

  // Unique lists for filters
  const uniqueBrands = useMemo(() => {
    return [...new Set(products.map((p) => p.brand).filter((b) => b && b !== "—"))].sort();
  }, [products]);

  const uniqueSellers = useMemo(() => {
    return [...new Set(products.map((p) => p.seller).filter((s) => s && s !== "—" && s !== "-"))].sort();
  }, [products]);

  // Filtered & sorted product list
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      if (catalogSearch) {
        const term = catalogSearch.toLowerCase();
        const fullText = `${p.title} ${p.brand} ${p.seller} ${p.category} ${p.id}`.toLowerCase();
        if (!fullText.includes(term)) return false;
      }
      if (filterCategory && p.category !== filterCategory) return false;
      if (filterBrand && p.brand !== filterBrand) return false;
      if (filterSeller && p.seller !== filterSeller) return false;
      return true;
    });

    if (sortBy === "price-asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === "title") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    // "newest" preserves original array order
    return list;
  }, [products, catalogSearch, filterCategory, filterBrand, filterSeller, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (activePage - 1) * perPage;
    return filteredProducts.slice(start, start + perPage);
  }, [filteredProducts, activePage, perPage]);

  const resetFilters = () => {
    setCatalogSearch("");
    setFilterCategory("");
    setFilterBrand("");
    setFilterSeller("");
    setSortBy("newest");
    setCurrentPage(1);
  };

  // Open Edit Modal
  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    const rmbVal = p.priceRmb ?? (p.price ? Math.round(p.price * 7.8) : "");
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

    const priceRmb = editForm.priceRmb ? parseFloat(String(editForm.priceRmb).replace(",", ".")) : Math.round(price * 7.8);

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
          brand: editForm.brand.trim(),
          seller: editForm.seller.trim(),
          price,
          priceRmb: !isNaN(priceRmb) && priceRmb > 0 ? priceRmb : Math.round(price * 7.8),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        addToast("error", data.error || "Errore durante il salvataggio");
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

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(deletingProduct.id)}`, {
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

      addToast("success", `Prodotto eliminato con successo!`);
      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      setDeletingProduct(null);
    } catch {
      addToast("error", "Errore di connessione durante l'eliminazione");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ----------------------------------------------------
  // SINGLE PRODUCT INSERTION STATE
  // ----------------------------------------------------
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState(emptyProductForm);
  const [ready, setReady] = useState(false);

  const setField =
    (k: keyof typeof emptyProductForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setF((prev) => ({ ...prev, [k]: e.target.value }));
    };

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    try {
      const r = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const d = await r.json();
      if (!r.ok) {
        addToast("error", d.error || "Errore nella conversione del link");
        return;
      }
      const pNum = parseFloat(String(d.price || "").replace(",", "."));
      const rmbVal = !isNaN(pNum) && pNum > 0 ? String(Math.round(pNum * 7.8)) : "";
      setF({
        ...emptyProductForm,
        title: d.title || "",
        image: d.image || "",
        price: d.price || "",
        priceRmb: rmbVal,
        cssbuyUrl: d.cssbuyUrl || "",
        doppelfitUrl: d.doppelfitUrl || "",
      });
      setReady(true);
      addToast(
        "success",
        `Link riconosciuto (${d.platform.toUpperCase()})! Link affiliati CSSBuy e Doppelfit generati.`
      );
    } catch {
      addToast("error", "Impossibile contattare il server per la conversione");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSingle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": "1",
        },
        credentials: "include",
        body: JSON.stringify(f),
      });
      const d = await r.json();
      if (!r.ok) {
        addToast("error", d.error || "Errore durante il salvataggio");
        return;
      }
      addToast("success", `Prodotto "${d.product.title}" aggiunto con successo al catalogo!`);
      setUrl("");
      setF(emptyProductForm);
      setReady(false);
      // Reload products list and switch to catalog tab
      loadProducts();
      setTab("catalog");
    } catch {
      addToast("error", "Errore di connessione durante il salvataggio");
    } finally {
      setSaving(false);
    }
  }


  // Category badge colors
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "SNEAKERS":
        return { bg: "rgba(56, 189, 248, 0.15)", border: "rgba(56, 189, 248, 0.35)", color: "#38bdf8" };
      case "HOODIE":
        return { bg: "rgba(167, 139, 250, 0.15)", border: "rgba(167, 139, 250, 0.35)", color: "#a78bfa" };
      case "TSHIRT":
        return { bg: "rgba(52, 211, 153, 0.15)", border: "rgba(52, 211, 153, 0.35)", color: "#34d399" };
      case "PANTS":
        return { bg: "rgba(251, 191, 36, 0.15)", border: "rgba(251, 191, 36, 0.35)", color: "#fbbf24" };
      case "JACKET":
        return { bg: "rgba(244, 114, 182, 0.15)", border: "rgba(244, 114, 182, 0.35)", color: "#f472b6" };
      case "ACCESSORIES":
        return { bg: "rgba(251, 146, 60, 0.15)", border: "rgba(251, 146, 60, 0.35)", color: "#fb923c" };
      default:
        return { bg: "rgba(148, 163, 184, 0.15)", border: "rgba(148, 163, 184, 0.35)", color: "#94a3b8" };
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#08080a",
        color: "#fff",
        padding: "32px 20px 80px",
        position: "relative",
      }}
    >
      {/* Background radial atmosphere */}
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

      <div style={{ maxWidth: 1400, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* TOP BAR / NAVIGATION */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 24,
            paddingBottom: 20,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1
                style={{
                  fontSize: "clamp(24px, 4vw, 32px)",
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
            {/* Admin Session Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(34, 197, 94, 0.12)",
                border: "1px solid rgba(34, 197, 94, 0.35)",
                borderRadius: 999,
                padding: "6px 14px",
                backdropFilter: "blur(12px)",
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
        </div>

        {/* TABS SELECTOR */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 28,
            flexWrap: "wrap",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            paddingBottom: 14,
          }}
        >
          <button
            type="button"
            onClick={() => setTab("catalog")}
            style={{
              padding: "10px 22px",
              borderRadius: 14,
              background:
                tab === "catalog"
                  ? "linear-gradient(135deg, #8b5cf6, #6366f1)"
                  : "rgba(255,255,255,0.05)",
              border: `1px solid ${tab === "catalog" ? "rgba(139, 92, 246, 0.5)" : "rgba(255,255,255,0.1)"}`,
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: tab === "catalog" ? "0 8px 24px rgba(139, 92, 246, 0.3)" : "none",
              transition: "all 0.2s",
            }}
          >
            <span>📦 Modifica Catalogo</span>
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 999,
                background: tab === "catalog" ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.12)",
                fontWeight: 700,
              }}
            >
              {products.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab("single")}
            style={{
              padding: "10px 20px",
              borderRadius: 14,
              background:
                tab === "single"
                  ? "linear-gradient(90deg, #3b82f6, #1d4ed8)"
                  : "rgba(255,255,255,0.05)",
              border: `1px solid ${tab === "single" ? "rgba(59, 130, 246, 0.5)" : "rgba(255,255,255,0.1)"}`,
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: tab === "single" ? "0 8px 24px rgba(59, 130, 246, 0.3)" : "none",
              transition: "all 0.2s",
            }}
          >
            ➕ Inserimento Singolo
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* TAB 1: CATALOG MANAGEMENT (GRID + MODIFICA + ELIMINA)           */}
        {/* ---------------------------------------------------------------- */}
        {tab === "catalog" && (
          <div>
            {/* SEARCH & FILTERS BAR */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20,
                padding: "20px 22px",
                marginBottom: 24,
                backdropFilter: "blur(16px)",
                display: "grid",
                gap: 16,
              }}
            >
              {/* Row 1: Search and Primary Actions */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative", flex: "1 1 320px" }}>
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => {
                      setCatalogSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="🔍 Cerca per titolo, brand, seller, categoria o ID..."
                    style={{
                      ...inputStyle,
                      paddingLeft: 38,
                      background: "rgba(0,0,0,0.6)",
                      borderColor: catalogSearch ? "rgba(139, 92, 246, 0.5)" : "rgba(255,255,255,0.14)",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      opacity: 0.5,
                      pointerEvents: "none",
                      fontSize: 14,
                    }}
                  >
                    🔍
                  </span>
                  {catalogSearch && (
                    <button
                      type="button"
                      onClick={() => setCatalogSearch("")}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: 0,
                        color: "rgba(255,255,255,0.5)",
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={loadProducts}
                  disabled={catalogLoading}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: catalogLoading ? "wait" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                  title="Ricarica prodotti dal database"
                >
                  <span
                    style={{
                      display: "inline-block",
                      animation: catalogLoading ? "spin 0.8s linear infinite" : "none",
                    }}
                  >
                    🔄
                  </span>
                  Ricarica
                </button>

                <button
                  type="button"
                  onClick={() => setTab("single")}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #b982ff, #8cffd2)",
                    border: 0,
                    color: "#0a0a0c",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 6px 20px rgba(185, 130, 255, 0.25)",
                  }}
                >
                  ➕ Nuovo Prodotto
                </button>
              </div>

              {/* Row 2: Select Filters */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  paddingTop: 14,
                }}
              >
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ ...filterSelectStyle, minWidth: 140 }}
                >
                  <option value="">Categoria: Tutte</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={filterBrand}
                  onChange={(e) => {
                    setFilterBrand(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ ...filterSelectStyle, minWidth: 130 }}
                >
                  <option value="">Brand: Tutti</option>
                  {uniqueBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                <select
                  value={filterSeller}
                  onChange={(e) => {
                    setFilterSeller(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ ...filterSelectStyle, minWidth: 130 }}
                >
                  <option value="">Seller: Tutti</option>
                  {uniqueSellers.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  style={{ ...filterSelectStyle, minWidth: 150 }}
                >
                  <option value="newest">Ordina: Più recenti</option>
                  <option value="price-asc">Prezzo: Crescente ↑</option>
                  <option value="price-desc">Prezzo: Decrescente ↓</option>
                  <option value="title">Titolo: Alfabetico (A-Z)</option>
                </select>

                {(catalogSearch || filterCategory || filterBrand || filterSeller || sortBy !== "newest") && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.6)",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Reset Filtri ✕
                  </button>
                )}

                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                    Mostrati <strong style={{ color: "#fff" }}>{filteredProducts.length}</strong> su{" "}
                    <strong>{products.length}</strong> prodotti
                  </span>

                  <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    <span>Per pagina:</span>
                    <select
                      value={perPage}
                      onChange={(e) => {
                        setPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 8,
                        background: "rgba(0,0,0,0.6)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        color: "#fff",
                        fontSize: 12,
                      }}
                    >
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                      <option value={96}>96</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            {/* PRODUCTS GRID */}
            {catalogLoading && products.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 20px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔄</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Caricamento catalogo in corso...</div>
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 20px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>Nessun prodotto trovato</h3>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                  Nessun elemento corrisponde ai filtri selezionati. Prova a resettare la ricerca.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  style={{
                    marginTop: 18,
                    padding: "8px 18px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Resetta Filtri
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 18,
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  marginBottom: 32,
                }}
              >
                {paginatedProducts.map((p) => {
                  const catStyle = getCategoryColor(p.category);
                  return (
                    <div
                      key={p.id}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 22,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        transition: "all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                        e.currentTarget.style.transform = "translateY(-3px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {/* CARD MEDIA */}
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          aspectRatio: "4 / 3",
                          background: "rgba(0,0,0,0.5)",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={p.image}
                          alt={p.title}
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='none'%3E%3Crect width='100%25' height='100%25' fill='%23111'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='12'%3EImmagine non disp.%3C/text%3E%3C/svg%3E";
                          }}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />

                        {/* Price badge */}
                        <div
                          style={{
                            position: "absolute",
                            left: 12,
                            top: 12,
                            padding: "4px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            background: "rgba(0,0,0,0.65)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            backdropFilter: "blur(8px)",
                            color: "#4ade80",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <span>{eur(p.price)}</span>
                          <span style={{ fontSize: 10, color: "#86efac", opacity: 0.85, fontWeight: 500 }}>
                            ¥ {p.priceRmb ?? Math.round(p.price * 7.8)}
                          </span>
                        </div>

                        {/* Category badge */}
                        <div
                          style={{
                            position: "absolute",
                            right: 12,
                            top: 12,
                            padding: "3px 9px",
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            background: catStyle.bg,
                            border: `1px solid ${catStyle.border}`,
                            color: catStyle.color,
                            backdropFilter: "blur(8px)",
                          }}
                        >
                          {p.category}
                        </div>

                        {/* Quick View Link */}
                        <Link
                          href={`/item/${p.id}`}
                          target="_blank"
                          title="Apri scheda prodotto"
                          style={{
                            position: "absolute",
                            right: 12,
                            bottom: 12,
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.7)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 13,
                            color: "#fff",
                            backdropFilter: "blur(6px)",
                            transition: "transform 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        >
                          ↗
                        </Link>
                      </div>

                      {/* CARD BODY */}
                      <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1 }}>
                        <h3
                          style={{
                            margin: "0 0 8px",
                            fontSize: 14,
                            fontWeight: 600,
                            lineHeight: 1.35,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            minHeight: 38,
                          }}
                          title={p.title}
                        >
                          {p.title}
                        </h3>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 11.5,
                            color: "rgba(255,255,255,0.55)",
                            marginBottom: 12,
                            flexWrap: "wrap",
                          }}
                        >
                          <span>🏷️ {p.brand || "—"}</span>
                          <span>•</span>
                          <span>👤 {p.seller || "—"}</span>
                        </div>

                        {/* Affiliation Status Badges (Clickable) */}
                        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                          {p.cssbuyUrl ? (
                            <a
                              href={p.cssbuyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Apri link affiliato CSSBuy in nuova scheda"
                              style={{
                                fontSize: 10.5,
                                padding: "2px 8px",
                                borderRadius: 999,
                                background: "rgba(34, 197, 94, 0.14)",
                                border: "1px solid rgba(34, 197, 94, 0.35)",
                                color: "#4ade80",
                                fontWeight: 700,
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                transition: "all 0.2s",
                              }}
                            >
                              <span>🛒 CSSBuy</span>
                              <span style={{ fontSize: 9 }}>↗</span>
                            </a>
                          ) : (
                            <span
                              style={{
                                fontSize: 10.5,
                                padding: "2px 8px",
                                borderRadius: 999,
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "rgba(255,255,255,0.35)",
                                fontWeight: 600,
                              }}
                            >
                              🛒 CSSBuy —
                            </span>
                          )}

                          {p.doppelfitUrl ? (
                            <a
                              href={p.doppelfitUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Apri link Doppelfit in nuova scheda"
                              style={{
                                fontSize: 10.5,
                                padding: "2px 8px",
                                borderRadius: 999,
                                background: "rgba(99, 102, 241, 0.14)",
                                border: "1px solid rgba(99, 102, 241, 0.35)",
                                color: "#a5b4fc",
                                fontWeight: 700,
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                transition: "all 0.2s",
                              }}
                            >
                              <span>🔍 Doppelfit</span>
                              <span style={{ fontSize: 9 }}>↗</span>
                            </a>
                          ) : (
                            <span
                              style={{
                                fontSize: 10.5,
                                padding: "2px 8px",
                                borderRadius: 999,
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "rgba(255,255,255,0.35)",
                                fontWeight: 600,
                              }}
                            >
                              🔍 Doppelfit —
                            </span>
                          )}
                        </div>

                        {/* ACTIONS FOOTER */}
                        <div
                          style={{
                            marginTop: "auto",
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 8,
                            paddingTop: 12,
                            borderTop: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            style={{
                              padding: "8px 12px",
                              borderRadius: 10,
                              background: "rgba(59, 130, 246, 0.15)",
                              border: "1px solid rgba(59, 130, 246, 0.35)",
                              color: "#60a5fa",
                              fontSize: 12.5,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(59, 130, 246, 0.25)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(59, 130, 246, 0.15)";
                            }}
                          >
                            ✏️ Modifica
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingProduct(p)}
                            style={{
                              padding: "8px 12px",
                              borderRadius: 10,
                              background: "rgba(239, 68, 68, 0.12)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              color: "#f87171",
                              fontSize: 12.5,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(239, 68, 68, 0.22)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
                            }}
                          >
                            🗑️ Elimina
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <nav
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  marginTop: 28,
                  padding: "16px 0",
                }}
              >
                <button
                  type="button"
                  disabled={activePage <= 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 120, behavior: "smooth" });
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    color: "#fff",
                    fontSize: 13,
                    cursor: activePage <= 1 ? "not-allowed" : "pointer",
                    opacity: activePage <= 1 ? 0.35 : 1,
                  }}
                >
                  ← Precedente
                </button>

                <div
                  style={{
                    padding: "6px 16px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontSize: 12.5,
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  Pagina <strong style={{ color: "#fff" }}>{activePage}</strong> di {totalPages}
                </div>

                <button
                  type="button"
                  disabled={activePage >= totalPages}
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 120, behavior: "smooth" });
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    color: "#fff",
                    fontSize: 13,
                    cursor: activePage >= totalPages ? "not-allowed" : "pointer",
                    opacity: activePage >= totalPages ? 0.35 : 1,
                  }}
                >
                  Successiva →
                </button>
              </nav>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* TAB 2: SINGLE PRODUCT INSERTION                                 */}
        {/* ---------------------------------------------------------------- */}
        {tab === "single" && (
          <div style={{ maxWidth: 840, margin: "0 auto" }}>
            <section
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 24,
                padding: 26,
                marginBottom: 28,
                backdropFilter: "blur(14px)",
              }}
            >
              <h2 style={{ fontSize: 19, marginTop: 0, marginBottom: 10, fontWeight: 700 }}>
                1. Incolla il link del prodotto da convertire
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 0, marginBottom: 18 }}>
                Supporta link <strong>Weidian</strong>, <strong>Taobao</strong>, <strong>1688</strong> o link
                <strong> CSSBuy</strong> (anche i link brevi <code>cssb.uy/...</code>). Il tuo promotion code
                affiliato viene applicato in automatico.
              </p>

              <form onSubmit={handleConvert} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
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
                  disabled={loading}
                  style={{
                    padding: "12px 24px",
                    borderRadius: 12,
                    background: "linear-gradient(90deg, #3b82f6, #1d4ed8)",
                    border: 0,
                    color: "#fff",
                    fontWeight: 600,
                    cursor: loading ? "wait" : "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? "Conversione..." : "Converti Link"}
                </button>
              </form>
            </section>

            {ready && (
              <form
                onSubmit={handleSaveSingle}
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
                  <h2 style={{ fontSize: 19, margin: 0, fontWeight: 700 }}>2. Dettagli e Link Affiliati</h2>
                  <span style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>Link convertito con successo ✓</span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                    Titolo Prodotto *
                  </label>
                  <input
                    required
                    type="text"
                    value={f.title}
                    onChange={setField("title")}
                    placeholder="es. Nike Dunk Low Retro Black White"
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                      Prezzo in € (EUR) *
                    </label>
                    <input
                      required
                      type="text"
                      value={f.price}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = parseFloat(val.replace(",", "."));
                        setF((prev) => ({
                          ...prev,
                          price: val,
                          priceRmb: !isNaN(num) && num > 0 ? String(Math.round(num * 7.8)) : prev.priceRmb,
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
                      value={f.priceRmb}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = parseFloat(val.replace(",", "."));
                        setF((prev) => ({
                          ...prev,
                          priceRmb: val,
                          price: !isNaN(num) && num > 0 ? (num / 7.8).toFixed(2) : prev.price,
                        }));
                      }}
                      placeholder="es. 233"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                      Categoria
                    </label>
                    <select
                      value={f.category}
                      onChange={setField("category")}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                      Brand
                    </label>
                    <input
                      type="text"
                      value={f.brand}
                      onChange={setField("brand")}
                      placeholder="es. Nike, Supreme, Trapstar..."
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                      Seller <span style={{ opacity: 0.6, fontWeight: 400 }}>(opzionale)</span>
                    </label>
                    <input
                      type="text"
                      value={f.seller}
                      onChange={setField("seller")}
                      placeholder="es. Mook, Chaosmade, Yolo66... (oppure lascia vuoto)"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                    <label style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                      URL Immagine * (URL web o percorso es. /products/p1.jpg)
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
                      title="Scegli una foto dal tuo computer da caricare"
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
                          if (file) handleUploadImage(file, "single");
                        }}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                  <input
                    required
                    type="text"
                    value={f.image}
                    onChange={setField("image")}
                    placeholder="https://... oppure /uploads/..."
                    style={inputStyle}
                  />
                  {f.image && (
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 14 }}>
                      <img
                        src={f.image}
                        alt="Anteprima"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='none'%3E%3Crect width='100%25' height='100%25' fill='%23222'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23777' font-size='10'%3EAnteprima%3C/text%3E%3C/svg%3E";
                        }}
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: "cover",
                          borderRadius: 14,
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}
                      />
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Anteprima immagine</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#4ade80", fontWeight: 600 }}>
                    🛒 Link Affiliato CSSBuy (generato in automatico)
                  </label>
                  <input
                    type="text"
                    value={f.cssbuyUrl}
                    onChange={setField("cssbuyUrl")}
                    style={{ ...inputStyle, borderColor: "rgba(34, 197, 94, 0.4)" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#818cf8", fontWeight: 600 }}>
                    🔍 Link o ID Doppelfit (referral ?ref=PPnCbrec garantito)
                  </label>
                  <input
                    type="text"
                    value={f.doppelfitUrl}
                    onChange={setField("doppelfitUrl")}
                    placeholder="es. https://doppel.fit/x5sUY8JQ oppure lascia vuoto"
                    style={{ ...inputStyle, borderColor: "rgba(99, 102, 241, 0.4)" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    marginTop: 8,
                    padding: "14px 28px",
                    borderRadius: 14,
                    background: "linear-gradient(90deg, #16a34a, #15803d)",
                    border: 0,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: saving ? "wait" : "pointer",
                    boxShadow: "0 10px 30px rgba(22, 163, 74, 0.35)",
                  }}
                >
                  {saving ? "Salvataggio in corso..." : "Salva Prodotto nel Database"}
                </button>
              </form>
            )}
          </div>
        )}



        {/* ---------------------------------------------------------------- */}
        {/* EDIT PRODUCT MODAL                                               */}
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
                {/* Image Section with Live Preview + Direct PC Upload */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                    <label style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                      URL Immagine / Foto Prodotto *
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
                      title="Scegli una foto dal tuo computer da caricare"
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
                        width: 90,
                        height: 90,
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
                            "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90' fill='none'%3E%3Crect width='100%25' height='100%25' fill='%23222'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23777' font-size='10'%3EAnteprima%3C/text%3E%3C/svg%3E";
                        }}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      {uploadingImg && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(0,0,0,0.65)",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <span style={{ fontSize: 22, display: "inline-block", animation: "spin 0.8s linear infinite" }}>🔄</span>
                        </div>
                      )}
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
                      <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", marginTop: 6, display: "block" }}>
                        Incolla un URL web diretto oppure clicca &quot;📁 Carica foto dal PC&quot; per salvare una foto dal computer.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Title */}
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

                {/* Price, Original Price & Category */}
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
                          priceRmb: !isNaN(num) && num > 0 ? String(Math.round(num * 7.8)) : prev.priceRmb,
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
                          price: !isNaN(num) && num > 0 ? (num / 7.8).toFixed(2) : prev.price,
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
                      Seller / Negozio <span style={{ opacity: 0.6, fontWeight: 400 }}>(opzionale)</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.seller}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, seller: e.target.value }))}
                      placeholder="es. YOLO66, JMDY, Mook... (oppure lascia vuoto)"
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
                  <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", marginTop: 4, display: "block" }}>
                    Link con codice promozionale che porta all&apos;acquisto tramite CSSBuy.
                  </span>
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
                  <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", marginTop: 4, display: "block" }}>
                    Il parametro referral <code>?ref=PPnCbrec</code> viene formattato automaticamente al salvataggio.
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
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
        {/* DELETE CONFIRMATION MODAL                                        */}
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
                    L&apos;operazione è irreversibile e rimuoverà il prodotto.
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

const filterSelectStyle: React.CSSProperties = {
  height: 38,
  padding: "0 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.6)",
  color: "#fff",
  fontSize: 12.5,
  outline: "none",
  cursor: "pointer",
};
