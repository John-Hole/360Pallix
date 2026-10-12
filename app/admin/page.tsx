"use client";
import { useState } from "react";
import Link from "next/link";

const empty = {
  title: "",
  image: "",
  price: "",
  seller: "",
  brand: "",
  category: "OTHER",
  cssbuyUrl: "",
  doppelfitUrl: "",
};

export default function AdminPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState(empty);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [ready, setReady] = useState(false);

  const setField =
    (k: keyof typeof empty) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setF((prev) => ({ ...prev, [k]: e.target.value }));
    };

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const d = await r.json();
      if (!r.ok) {
        setMsg({ text: d.error || "Errore nella conversione del link", ok: false });
        return;
      }
      setF({
        ...empty,
        title: d.title || "",
        image: d.image || "",
        price: d.price || "",
        cssbuyUrl: d.cssbuyUrl || "",
        doppelfitUrl: d.doppelfitUrl || "",
      });
      setReady(true);
      setMsg({
        text: `Link riconosciuto (${d.platform.toUpperCase()})! Link affiliati CSSBuy e Doppelfit generati. Completa i campi mancanti e salva.`,
        ok: true,
      });
    } catch {
      setMsg({ text: "Impossibile contattare il server", ok: false });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!pw) {
      setMsg({ text: "Inserisci la password admin", ok: false });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, password: pw }),
      });
      const d = await r.json();
      if (!r.ok) {
        setMsg({ text: d.error || "Errore durante il salvataggio", ok: false });
        return;
      }
      setMsg({ text: `Prodotto "${d.product.title}" aggiunto con successo!`, ok: true });
      setUrl("");
      setF(empty);
      setReady(false);
    } catch {
      setMsg({ text: "Errore di connessione durante il salvataggio", ok: false });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0c", color: "#fff", padding: "40px 20px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, margin: 0, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Pannello Gestione Prodotti
          </h1>
          <Link
            href="/spreadsheet"
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              fontSize: 13,
            }}
          >
            ← Vai allo Spreadsheet
          </Link>
        </div>

        {/* BOX INSERIMENTO LINK */}
        <section
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20,
            padding: 24,
            marginBottom: 28,
            backdropFilter: "blur(12px)",
          }}
        >
          <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 12 }}>1. Incolla il link da convertire</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 0, marginBottom: 18 }}>
            Supporta link <strong>Weidian</strong>, <strong>Taobao</strong>, <strong>1688</strong>, o link
            <strong> CSSBuy</strong> (anche i link corti <code>cssb.uy/...</code>). Il tuo codice affiliato viene applicato automaticamente.
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

          {msg && (
            <div
              style={{
                marginTop: 18,
                padding: "12px 16px",
                borderRadius: 12,
                fontSize: 13.5,
                background: msg.ok ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
                border: `1px solid ${msg.ok ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                color: msg.ok ? "#4ade80" : "#f87171",
              }}
            >
              {msg.text}
            </div>
          )}
        </section>

        {/* BOX DETTAGLI PRODOTTO */}
        {ready && (
          <form
            onSubmit={handleSave}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              padding: 24,
              display: "grid",
              gap: 20,
              backdropFilter: "blur(12px)",
            }}
          >
            <h2 style={{ fontSize: 18, margin: 0 }}>2. Dettagli e Link Affiliati</h2>

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

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                  Prezzo in € * (es. 29.90)
                </label>
                <input
                  required
                  type="text"
                  value={f.price}
                  onChange={setField("price")}
                  placeholder="29.90"
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
                  <option value="SNEAKERS">SNEAKERS</option>
                  <option value="HOODIE">HOODIE</option>
                  <option value="TSHIRT">TSHIRT</option>
                  <option value="PANTS">PANTS</option>
                  <option value="JACKET">JACKET</option>
                  <option value="ACCESSORIES">ACCESSORIES</option>
                  <option value="OTHER">OTHER</option>
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
                  Seller
                </label>
                <input
                  type="text"
                  value={f.seller}
                  onChange={setField("seller")}
                  placeholder="es. Mook, Chaosmade, Yolo66..."
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                URL Immagine * (URL web o percorso es. /products/p1.jpg)
              </label>
              <input
                required
                type="text"
                value={f.image}
                onChange={setField("image")}
                placeholder="https://..."
                style={inputStyle}
              />
              {f.image && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 14 }}>
                  <img
                    src={f.image}
                    alt="Anteprima"
                    onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                    style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 12, border: "1px solid #333" }}
                  />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Anteprima immagine</span>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#4ade80", fontWeight: 600 }}>
                🛒 Link Affiliato CSSBuy (generato in automatico con il tuo codice)
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
                🔍 Link Doppelfit (generato in automatico)
              </label>
              <input
                type="text"
                value={f.doppelfitUrl}
                onChange={setField("doppelfitUrl")}
                style={{ ...inputStyle, borderColor: "rgba(99, 102, 241, 0.4)" }}
              />
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 18 }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                Password Admin *
              </label>
              <input
                required
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Inserisci la password di amministrazione"
                style={{ ...inputStyle, maxWidth: 320 }}
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
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.5)",
  color: "#fff",
  fontSize: 14,
  outline: "none",
};
