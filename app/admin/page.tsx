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

const EXTRACTOR_SCRIPT = `(() => {
  const RMB_TO_EUR_RATE = 7.8;
  const products = [];
  const seenUrls = new Set();
  const rows = document.querySelectorAll("tr, .order-item, .goods-item, .order-table-item, .el-table__row, .order-list-box, .my-order-item");

  rows.forEach((row) => {
    const linkEl = row.querySelector('a[href*="item"], a[href*="weidian"], a[href*="taobao"], a[href*="1688"], a[href*="detail"], a[href*="goods"]');
    if (!linkEl) return;

    let sourceUrl = linkEl.getAttribute("href") || "";
    if (sourceUrl.startsWith("//")) sourceUrl = "https:" + sourceUrl;
    else if (sourceUrl.startsWith("/")) sourceUrl = "https://www.cssbuy.com" + sourceUrl;
    if (!sourceUrl || seenUrls.has(sourceUrl)) return;

    let title = linkEl.getAttribute("title") || linkEl.innerText.trim();
    if (!title || title.length < 3) {
      const titleEl = row.querySelector(".title, .goods-name, .name, .desc, [class*='title'], [class*='name']");
      if (titleEl) title = titleEl.innerText.trim();
    }
    title = (title || "").replace(/\\s+/g, " ").trim();
    if (!title || title.toLowerCase() === "detail" || title.toLowerCase() === "view") return;

    const imgEl = row.querySelector("img");
    let image = imgEl ? (imgEl.getAttribute("src") || imgEl.getAttribute("data-src") || "") : "";
    if (image.startsWith("//")) image = "https:" + image;
    if (image.includes("default") || image.includes("placeholder")) image = "";

    let price = 0;
    const text = row.innerText;
    const rmbMatch = text.match(/(?:￥|¥)\\s*([\\d.]+)/) || text.match(/([\\d.]+)\\s*(?:元|RMB)/i);
    const eurMatch = text.match(/€\\s*([\\d.]+)/);
    const usdMatch = text.match(/\\$\\s*([\\d.]+)/);

    if (eurMatch) price = parseFloat(eurMatch[1]);
    else if (rmbMatch) price = parseFloat((parseFloat(rmbMatch[1]) / RMB_TO_EUR_RATE).toFixed(2));
    else if (usdMatch) price = parseFloat((parseFloat(usdMatch[1]) * 0.92).toFixed(2));
    else {
      const numMatch = text.match(/(\\d+\\.\\d{2})/);
      if (numMatch) {
        const val = parseFloat(numMatch[1]);
        price = val > 80 ? parseFloat((val / RMB_TO_EUR_RATE).toFixed(2)) : val;
      }
    }
    if (!price || isNaN(price)) price = 19.99;

    const lower = title.toLowerCase();
    let category = "OTHER";
    if (lower.includes("shoe") || lower.includes("sneaker") || lower.includes("dunk") || lower.includes("jordan") || lower.includes("force") || lower.includes("air") || lower.includes("kobe") || lower.includes("yeezy") || lower.includes("bapesta") || lower.includes("runner") || lower.includes("hoka") || lower.includes("travis")) {
      category = "SNEAKERS";
    } else if (lower.includes("hoodie") || lower.includes("felpa") || lower.includes("sweater") || lower.includes("zip")) {
      category = "HOODIE";
    } else if (lower.includes("tee") || lower.includes("t-shirt") || lower.includes("maglia") || lower.includes("shirt")) {
      category = "TSHIRT";
    } else if (lower.includes("pant") || lower.includes("jeans") || lower.includes("short") || lower.includes("jogger") || lower.includes("trousers")) {
      category = "PANTS";
    } else if (lower.includes("jacket") || lower.includes("puffer") || lower.includes("coat") || lower.includes("giacca") || lower.includes("windbreaker") || lower.includes("down")) {
      category = "JACKET";
    } else if (lower.includes("cap") || lower.includes("hat") || lower.includes("beanie") || lower.includes("bag") || lower.includes("belt") || lower.includes("wallet") || lower.includes("cintura") || lower.includes("calze") || lower.includes("socks")) {
      category = "ACCESSORIES";
    }

    let brand = "—";
    const brands = ["Nike", "Adidas", "Jordan", "Supreme", "Stussy", "Trapstar", "Hellstar", "Syna", "Bape", "Chrome Hearts", "Gallery Dept", "Balenciaga", "Prada", "Moncler", "Gucci", "Louis Vuitton", "Rick Owens", "Corteiz", "Stone Island", "Arc'teryx", "Ralph Lauren", "Sp5der"];
    for (const b of brands) {
      if (lower.includes(b.toLowerCase())) {
        brand = b;
        break;
      }
    }

    seenUrls.add(sourceUrl);
    products.push({ title, image, price, category, brand, seller: "CSSBuy Order", sourceUrl });
  });

  if (products.length === 0) {
    alert("⚠️ Nessun prodotto rilevato. Assicurati di essere nella schermata 'My Orders' o 'Warehouse' di CSSBuy!");
    return;
  }

  const jsonStr = JSON.stringify(products, null, 2);
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(jsonStr);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cssbuy_prodotti.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  alert("🎉 Estratti " + products.length + " prodotti! JSON scaricato e copiato negli appunti!");
})();`;

export default function AdminPage() {
  const [tab, setTab] = useState<"single" | "batch">("single");

  // Single mode state
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState(empty);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [ready, setReady] = useState(false);

  // Batch mode state
  const [batchJson, setBatchJson] = useState("");
  const [batchPw, setBatchPw] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchMsg, setBatchMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

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

  async function handleBatchImport(e: React.FormEvent) {
    e.preventDefault();
    if (!batchPw) {
      setBatchMsg({ text: "Inserisci la password admin", ok: false });
      return;
    }
    if (!batchJson.trim()) {
      setBatchMsg({ text: "Incolla il contenuto JSON dei prodotti", ok: false });
      return;
    }

    let parsedProducts: any[] = [];
    try {
      parsedProducts = JSON.parse(batchJson);
      if (!Array.isArray(parsedProducts)) {
        setBatchMsg({ text: "Il JSON deve contenere un array di prodotti [...]", ok: false });
        return;
      }
    } catch {
      setBatchMsg({ text: "Formato JSON non valido. Assicurati di copiare il JSON completo.", ok: false });
      return;
    }

    setBatchLoading(true);
    setBatchMsg(null);

    try {
      const r = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: parsedProducts, password: batchPw }),
      });
      const d = await r.json();
      if (!r.ok) {
        setBatchMsg({ text: d.error || "Errore durante l'importazione", ok: false });
        return;
      }
      setBatchMsg({
        text: `🎉 Importati con successo ${d.count} prodotti su un totale di ${d.total} nel catalogo!`,
        ok: true,
      });
      setBatchJson("");
    } catch {
      setBatchMsg({ text: "Errore di rete durante l'importazione", ok: false });
    } finally {
      setBatchLoading(false);
    }
  }

  function copyScript() {
    navigator.clipboard.writeText(EXTRACTOR_SCRIPT).then(() => {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 3000);
    });
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) setBatchJson(text);
    };
    reader.readAsText(file);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0c", color: "#fff", padding: "40px 20px" }}>
      <div style={{ maxWidth: 840, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
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

        {/* TABS SELECTOR */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 28,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            paddingBottom: 12,
          }}
        >
          <button
            type="button"
            onClick={() => setTab("single")}
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              background: tab === "single" ? "linear-gradient(90deg, #3b82f6, #1d4ed8)" : "rgba(255,255,255,0.05)",
              border: 0,
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            ➕ Inserimento Singolo
          </button>
          <button
            type="button"
            onClick={() => setTab("batch")}
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              background: tab === "batch" ? "linear-gradient(90deg, #10b981, #059669)" : "rgba(255,255,255,0.05)",
              border: 0,
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            ⚡ Importazione Massiva CSSBuy
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.2)",
              }}
            >
              Nuovo
            </span>
          </button>
        </div>

        {tab === "batch" ? (
          <div>
            {/* BOX ISTRUZIONI E SCRIPT ESTRATTORE */}
            <section
              style={{
                background: "rgba(16, 185, 129, 0.06)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                borderRadius: 20,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 10, color: "#34d399" }}>
                Come importare tutti i tuoi acquisti da CSSBuy in 30 secondi:
              </h2>
              <ol style={{ fontSize: 13.5, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, margin: 0, paddingLeft: 20 }}>
                <li>
                  Accedi al tuo account su <strong>CSSBuy</strong> e apri la pagina <strong>My Orders</strong> (<code>https://www.cssbuy.com/user.php?mod=order</code>) o <strong>Warehouse</strong>.
                </li>
                <li>
                  Premi <strong>F12</strong> (o tasto destro -&gt; Ispeziona) e vai nella scheda <strong>Console</strong>.
                </li>
                <li>
                  Clicca qui sotto per copiare lo script estrattore, incollalo nella Console di CSSBuy e premi <strong>Invio</strong>.
                </li>
                <li>
                  Lo script scarica il file <code>cssbuy_prodotti.json</code> e copia i dati negli appunti.
                </li>
                <li>
                  Incolla il JSON qui sotto (o carica il file), inserisci la password admin e clicca <strong>Importa</strong>!
                </li>
              </ol>

              <button
                type="button"
                onClick={copyScript}
                style={{
                  marginTop: 18,
                  padding: "10px 20px",
                  borderRadius: 10,
                  background: copiedScript ? "#059669" : "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {copiedScript ? "✅ Script Copiato negli Appunti!" : "📋 Copia Script Estrattore per Console"}
              </button>
            </section>

            {/* FORM DI IMPORTAZIONE MASSIVA */}
            <form
              onSubmit={handleBatchImport}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20,
                padding: 24,
                display: "grid",
                gap: 20,
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                    Incolla qui il JSON dei prodotti (oppure carica il file .json scaricato):
                  </label>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#38bdf8",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    📁 Sfoglia file .json
                    <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: "none" }} />
                  </label>
                </div>
                <textarea
                  rows={10}
                  value={batchJson}
                  onChange={(e) => setBatchJson(e.target.value)}
                  placeholder='[\n  {\n    "title": "Nike Dunk Low Retro",\n    "image": "https://...",\n    "price": 28.50,\n    "sourceUrl": "https://weidian.com/item.html?itemID=..."\n  }\n]'
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 12,
                    background: "rgba(0,0,0,0.6)",
                    border: "1px solid rgba(255,255,255,0.16)",
                    color: "#fff",
                    fontFamily: "monospace",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>
                  Password Admin *
                </label>
                <input
                  required
                  type="password"
                  value={batchPw}
                  onChange={(e) => setBatchPw(e.target.value)}
                  placeholder="Inserisci la password admin"
                  style={{ ...inputStyle, maxWidth: 320 }}
                />
              </div>

              {batchMsg && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    fontSize: 13.5,
                    background: batchMsg.ok ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
                    border: `1px solid ${batchMsg.ok ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                    color: batchMsg.ok ? "#4ade80" : "#f87171",
                  }}
                >
                  {batchMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={batchLoading}
                style={{
                  padding: "14px 28px",
                  borderRadius: 14,
                  background: "linear-gradient(90deg, #10b981, #059669)",
                  border: 0,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: batchLoading ? "wait" : "pointer",
                  boxShadow: "0 10px 30px rgba(16, 185, 129, 0.35)",
                }}
              >
                {batchLoading ? "Importazione e conversione in corso..." : "⚡ Importa Tutti i Prodotti nel Database"}
              </button>
            </form>
          </div>
        ) : (
          <div>
            {/* BOX INSERIMENTO LINK SINGOLO */}
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

            {/* BOX DETTAGLI PRODOTTO SINGOLO */}
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
                    🔍 Link o ID Doppelfit (il tuo referral ref=PPnCbrec viene applicato in automatico)
                  </label>
                  <input
                    type="text"
                    value={f.doppelfitUrl}
                    onChange={setField("doppelfitUrl")}
                    placeholder="es. https://doppel.fit/x5sUY8JQ oppure https://doppel.fit/item/5YYUD... oppure lascia vuoto"
                    style={{ ...inputStyle, borderColor: "rgba(99, 102, 241, 0.4)" }}
                  />
                  <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", marginTop: 4, display: "block" }}>
                    Puoi incollare il link breve di condivisione di Doppelfit o l&apos;URL completo: il tuo codice referral <code>?ref=PPnCbrec</code> viene garantito e aggiunto da solo.
                  </span>
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
