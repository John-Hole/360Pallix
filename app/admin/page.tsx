"use client";
import { useState } from "react";

const empty = { title: "", image: "", price: "", seller: "", brand: "", category: "OTHER", cssbuyUrl: "", doppelfitUrl: "" };

export default function Admin() {
  const [url, setUrl] = useState("");
  const [f, setF] = useState(empty);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [ready, setReady] = useState(false);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function convert() {
    setMsg("Conversione…");
    const r = await fetch("/api/convert", { method: "POST", body: JSON.stringify({ url }) });
    const d = await r.json();
    if (!r.ok) { setMsg(d.error); return; }
    setF({ ...empty, title: d.title, image: d.image, price: d.price, cssbuyUrl: d.cssbuyUrl, doppelfitUrl: d.doppelfitUrl });
    setReady(true);
    setMsg(d.cssbuyAffiliate ? "Link affiliato CSSBuy generato ✔. Completa i campi vuoti e salva." : `⚠ Link CSSBuy NON affiliato: ${d.cssbuyError}. Incolla tu il link cssb.uy oppure rinnova il token.`);
  }

  async function save() {
    const r = await fetch("/api/products", { method: "POST", body: JSON.stringify({ ...f, password: pw }) });
    const d = await r.json();
    if (!r.ok) { setMsg(d.error); return; }
    setMsg("Prodotto salvato ✔");
    setUrl(""); setF(empty); setReady(false);
  }

  const box: React.CSSProperties = { display: "block", width: "100%", padding: 10, margin: "6px 0 14px", borderRadius: 8, border: "1px solid #444", background: "#111", color: "#fff" };
  return (
    <main style={{ maxWidth: 640, margin: "40px auto", padding: 20 }}>
      <h1>Admin – Aggiungi prodotto</h1>
      <label>Link Weidian / Taobao / 1688</label>
      <input style={box} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://weidian.com/item.html?itemID=..." />
      <button onClick={convert} style={{ ...box, cursor: "pointer", width: "auto", padding: "10px 20px" }}>Converti</button>
      {msg && <p>{msg}</p>}
      {ready && (
        <>
          {(["title", "image", "price", "seller", "brand", "category", "cssbuyUrl", "doppelfitUrl"] as const).map((k) => (
            <div key={k}>
              <label>{k}</label>
              <input style={box} value={f[k]} onChange={set(k)} />
            </div>
          ))}
          <label>Password admin</label>
          <input style={box} type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <button onClick={save} style={{ ...box, cursor: "pointer", width: "auto", padding: "10px 20px" }}>Salva prodotto</button>
        </>
      )}
    </main>
  );
}
