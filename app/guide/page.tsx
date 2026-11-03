"use client";
import Link from "next/link";
import { useState } from "react";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "Cos'è un Agent e perché non posso comprare direttamente dai venditori cinesi?",
    a: "Piattaforme come Weidian, Taobao e 1688 sono mercati interni cinesi pensati solo per residenti in Cina: richiedono carte bancarie cinesi, indirizzo locale e non effettuano spedizioni all'estero. Un Agent come CSSBuy funge da intermediario ufficiale: compra il prodotto per tuo conto in Cina, lo riceve nel proprio magazzino, ti invia foto QC (Quality Check) dettagliate per verificare l'oggetto e poi lo impacchetta e lo spedisce in modo sicuro e tracciato a casa tua in Italia.",
  },
  {
    q: "Come scelgo la taglia giusta per abbigliamento e sneakers?",
    a: "Le taglie asiatiche vestono quasi sempre 1 o 2 misure più piccole rispetto a quelle europee (EU/IT). Non fidarti mai ciecamente di 'M' o 'L': cerca sempre la tabella misure (Size Chart) presente nell'annuncio del venditore, espressa in centimetri per Lunghezza (Length), Larghezza Petto (Chest/Bust) e Spalle (Shoulder). Per le scarpe, fai riferimento ai centimetri della soletta (CM/JP) anziché al numero EU.",
  },
  {
    q: "Cos'è il controllo qualità (QC) e cosa significano GL e RL?",
    a: "Quando l'articolo arriva al magazzino dell'agent, lo staff scatta 3 o più fotografie ad alta definizione (QC - Quality Check). A questo punto puoi valutare se il prodotto corrisponde alle tue aspettative: se è perfetto dai la 'Green Light' (GL) confermando che desideri tenerlo; se invece ha difetti visibili, colore sbagliato o taglia errata, dai la 'Red Light' (RL) richiedendo all'agent il reso gratuito o la sostituzione immediata al venditore. Una volta spedito a casa, il reso non è più possibile.",
  },
  {
    q: "Cos'è un 'Haul' e come risparmiare sulla spedizione internazionale?",
    a: "Un 'Haul' è un pacco cumulativo che racchiude diversi articoli acquistati anche da seller differenti (es. 2 paia di scarpe, 3 felpe e vari accessori). Spedire un solo capo costa proporzionalmente molto di più a causa della tariffa base fissa del primo chilo. Raggruppando da 3 a 7 kg in un unico Haul, il costo di spedizione per singolo chilo scende fino al 40-50%. CSSBuy conserva gratuitamente i tuoi articoli in magazzino fino a 180 giorni, dandoti tutto il tempo di completare il tuo carrello.",
  },
  {
    q: "Quale linea di spedizione devo scegliere per l'Italia?",
    a: "Per l'Italia e l'Unione Europea raccomandiamo esclusivamente linee Triangolate Tax-Free / Tariffless (come DHL Tariffless, CSS-FJ-DHL o linee equivalenti esenti da dazi). Con queste linee il pacco viaggia prima verso un hub doganale europeo (es. Germania, Olanda o Lussemburgo) dove viene sdoganato in automatico dall'agente logistico, e poi entra in Italia come spedizione comunitaria intra-UE, consegnata dal corriere locale (DHL o Poste Italiane) senza dazi né tasse alla porta.",
  },
  {
    q: "Come devo compilare la dichiarazione doganale (Declare Value)?",
    a: "Per le linee triangolate Tax-Free (Tariffless) verso l'Italia, la regola aurea della community è dichiarare un valore compreso tra 16.00$ e 21.00$ per l'intero pacco, inserendo sempre dei decimali casuali (ad esempio 18.37$ o 19.84$). In questo modo il valore rimane al di sotto della soglia imponibile e la dogana europea processa automaticamente il carico senza blocchi.",
  },
  {
    q: "Conviene aggiungere l'assicurazione sul pacco?",
    a: "Assolutamente sì. L'assicurazione su CSSBuy costa solo circa il 3% del valore complessivo (es. circa 4-6€ su un pacco da 150€) e garantisce il rimborso al 100% sia del valore della merce sia delle spese di spedizione in caso di smarrimento, danno grave o sequestro doganale. Ti assicura la massima serenità.",
  },
  {
    q: "Quanto tempo impiega la spedizione ad arrivare a casa mia?",
    a: "Con le linee aeree triangolate Tax-Free di DHL, il tempo medio di transito dalla partenza dal magazzino cinese alla consegna al tuo indirizzo in Italia è generalmente tra i 9 e i 15 giorni lavorativi. Riceverai un codice di tracciamento consultabile su 17track o direttamente sul sito ufficiale di DHL non appena il pacco sbarca in Europa.",
  },
  {
    q: "Quali metodi di pagamento posso usare su CSSBuy?",
    a: "Puoi ricaricare il tuo saldo o pagare direttamente tramite PayPal, Carte di Credito o Debito (Visa, Mastercard, Postepay, Revolut), Stripe, Wise o bonifico bancario. Per la massima protezione consigliamo sempre PayPal o carte virtuali usa e getta.",
  },
];

export default function GuidePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <main style={{ minHeight: "100dvh", background: "#000", color: "#fff", paddingBottom: 80 }}>
      {/* Top bar navigation */}
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
          </div>
        </div>
      </div>

      <div className="wrap" style={{ maxWidth: 1040, padding: "40px 20px 0" }}>
        {/* Header */}
        <div className="dir-header" style={{ marginTop: 20 }}>
          <div style={{ display: "inline-flex", gap: 8, marginBottom: 12 }}>
            <span className="badge-verified">GUIDA UFFICIALE 360PALLIX</span>
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
              AGGIORNATA 2026
            </span>
          </div>
          <h1 className="dir-title">
            Come Acquistare con <span className="dir-title-accent">CSSBuy</span>
          </h1>
          <p className="dir-subtitle" style={{ maxWidth: 680, margin: "0 auto" }}>
            La guida definitiva passo-passo per trovare i migliori prodotti, ordinare tramite agent cinese, verificare le foto QC
            in magazzino e spedire a casa tua in Italia con linee Tax-Free al 100% sicure e senza dogana.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 18 }}>
            <span className="badge">✓ 100% Tax-Free</span>
            <span className="badge">✓ QC Gratuiti al Magazzino</span>
            <span className="badge">✓ Rimborso Garantito se Difettoso</span>
            <span className="badge">✓ Consegna Diretta in Italia</span>
          </div>
        </div>

        {/* 5 Detailed Step Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 40 }}>
          {/* STEP 1 */}
          <div className="step-card" style={{ padding: "32px 28px" }}>
            <div className="step-card-header">
              <div className="step-num">1</div>
              <span className="step-tag">Fase 1 · Selezione & Ricerca</span>
            </div>
            <h2 className="step-title" style={{ fontSize: 22 }}>
              Scegli il Prodotto & Copia il Link Ufficiale
            </h2>
            <p className="step-desc">
              Esplora il catalogo dello <b>Spreadsheet 360Pallix</b> con migliaia di articoli selezionati con link diretti, oppure consulta
              la nostra <b>Directory Best Seller</b> (con oltre 130 venditori verificati su Yupoo, Weidian e Taobao).
            </p>
            <p className="step-desc" style={{ marginTop: 10 }}>
              Quando individui il capo o la scarpa che desideri, <b>copia il link dell’annuncio</b> (link Weidian, Taobao, 1688 o l’album Yupoo).
            </p>

            <div className="pro-tip-box" style={{ marginTop: 18 }}>
              <span style={{ fontSize: 18 }}>💡</span>
              <div>
                <div className="pro-tip-title">Pro Tip: Come ordinare da Yupoo</div>
                <div className="pro-tip-text">
                  Se il prodotto proviene da un catalogo Yupoo, incolla il link dell'album nella barra di ricerca di CSSBuy e utilizza la funzione
                  <b>"Expert Buy"</b>. Inserisci il nome del prodotto, il prezzo in Yuan (¥) e la taglia desiderata nelle note: l’agent contatterà
                  direttamente il venditore tramite WeChat per effettuare l’acquisto.
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="step-card" style={{ padding: "32px 28px" }}>
            <div className="step-card-header">
              <div className="step-num">2</div>
              <span className="step-tag">Fase 2 · Ordine & 1° Pagamento</span>
            </div>
            <h2 className="step-title" style={{ fontSize: 22 }}>
              Incolla su CSSBuy & Ordina al Magazzino
            </h2>
            <p className="step-desc">
              Accedi al sito ufficiale di <b>CSSBuy</b> e incolla il link del prodotto nella barra di ricerca in alto. La scheda prodotto verrà
              caricata automaticamente con le opzioni di selezione.
            </p>
            <p className="step-desc" style={{ marginTop: 10 }}>
              Seleziona la <b>taglia</b> e il <b>colore</b> corretto, quindi procedi al <b>1° Pagamento</b>: in questa fase paghi solo il costo
              dell’articolo più l'eventuale spedizione interna dal venditore al magazzino dell'agent in Cina (in genere circa 10¥, pari a circa 1,30€).
            </p>

            <div className="pro-tip-box" style={{ marginTop: 18 }}>
              <span style={{ fontSize: 18 }}>📏</span>
              <div>
                <div className="pro-tip-title">Attenzione alle Taglie (Size Chart)</div>
                <div className="pro-tip-text">
                  Le taglie asiatiche vestono spesso più strette di quelle italiane. Controlla sempre la tabella in centimetri del venditore
                  (lunghezza petto, spalle e vita). Per le sneakers, fai sempre riferimento alla misura in <b>CM della soletta interna</b>.
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="step-card" style={{ padding: "32px 28px" }}>
            <div className="step-card-header">
              <div className="step-num">3</div>
              <span className="step-tag">Fase 3 · Ispezione & QC (Green Light / Red Light)</span>
            </div>
            <h2 className="step-title" style={{ fontSize: 22 }}>
              Ricevi Foto QC in Magazzino & Controlla la Qualità
            </h2>
            <p className="step-desc">
              In 2-4 giorni lavorativi, l'articolo viene consegnato al magazzino di CSSBuy. Gli addetti del magazzino aprono il pacco,
              ispezionano il prodotto e caricano nella tua area personale <b>foto dettagliate ad alta risoluzione (QC)</b>.
            </p>

            {/* QC visual preview stack */}
            <div className="qc-stack-wrap">
              <div className="qc-stack-img p1">
                <img
                  src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=400&q=80"
                  alt="QC inspection angle 1"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="qc-stack-img p2">
                <img
                  src="https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80"
                  alt="QC inspection angle 2"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="qc-stack-img p3">
                <img
                  src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80"
                  alt="QC inspection angle 3"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <p className="step-desc" style={{ marginTop: 12 }}>
              Potrai verificare ogni dettaglio: cuciture, etichette, forma e loghi. Se l'articolo è conforme e soddisfacente, confermi con
              <b>Green Light (GL)</b>. Se riscontri difetti evidenti o una misura errata, premi <b>Red Light (RL)</b> e richiedi il reso o cambio
              immediato al seller prima che lasci la Cina!
            </p>
          </div>

          {/* STEP 4 */}
          <div className="step-card" style={{ padding: "32px 28px" }}>
            <div className="step-card-header">
              <div className="step-num">4</div>
              <span className="step-tag">Fase 4 · Consolidamento & Costruzione Haul</span>
            </div>
            <h2 className="step-title" style={{ fontSize: 22 }}>
              Crea il Tuo Haul & Risparmia il 40% sulla Spedizione
            </h2>
            <p className="step-desc">
              <b>Non spedire mai un singolo articolo alla volta!</b> La tariffa base del primo chilogrammo è sempre la più onerosa.
              CSSBuy ti garantisce <b>deposito gratuito in magazzino fino a 180 giorni</b>.
            </p>
            <p className="step-desc" style={{ marginTop: 10 }}>
              Attendi che arrivino più ordini e raggruppali in un unico pacco ("Haul") da 3 a 7 kg. In questo modo ottimizzi il costo di trasporto
              riducendo la spesa fino al 40-50% per singolo articolo.
            </p>

            <div className="pro-tip-box" style={{ marginTop: 18 }}>
              <span style={{ fontSize: 18 }}>📦</span>
              <div>
                <div className="pro-tip-title">Servizi Utili di Imballaggio</div>
                <div className="pro-tip-text">
                  Durante la preparazione del pacco, puoi richiedere:
                  <br />• <b>Drop Shoe Box (Rimozione scatole scarpe)</b>: riduce drasticamente il peso volumetrico e risparmia circa 10-15€ a paio.
                  <br />• <b>Corner Protection & Stretch Film</b>: protezioni angolari rigide e pellicola impermeabile antipioggia contro urti durante il trasporto.
                </div>
              </div>
            </div>
          </div>

          {/* STEP 5 */}
          <div className="step-card" style={{ padding: "32px 28px" }}>
            <div className="step-card-header">
              <div className="step-num">5</div>
              <span className="step-tag">Fase 5 · Spedizione Internazionale & Consegna</span>
            </div>
            <h2 className="step-title" style={{ fontSize: 22 }}>
              Spedizione Tax-Free Triangolata Direttamente a Casa Tua
            </h2>
            <p className="step-desc">
              Seleziona gli articoli dal magazzino, inserisci il tuo indirizzo di residenza in Italia e scegli il metodo di spedizione.
              Esegui il <b>2° Pagamento</b> relativo al trasporto internazionale.
            </p>
            <p className="step-desc" style={{ marginTop: 10 }}>
              <b>Quale corriere scegliere?</b> Scegli sempre una linea <b>Tax-Free Triangolata (Tariffless)</b>, come <b>DHL Tariffless</b>.
              Queste linee sdoganano automaticamente la merce all'interno dell'UE (Germania o Olanda) e poi recapitano il pacco a casa tua come
              spedizione intra-comunitaria esente da tasse doganali o visite del postino.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
                marginTop: 20,
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Dichiarazione Doganale</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                  Dichiara un valore tra <b>16$ e 21$</b> con decimali casuali (es. 18.73$) per l'intero pacco sulle linee Tax-Free.
                </div>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Assicurazione Pacco</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                  Aggiungi sempre l'assicurazione: costa solo il ~3% e protegge al 100% valore merce e spedizione.
                </div>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Tempi di Consegna</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                  Circa <b>9-14 giorni lavorativi</b> con tracciamento completo su 17track e DHL fino al tuo campanello.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Streetwear Glossary */}
        <div style={{ marginTop: 56 }}>
          <h2 className="faq-title">Glossario Rapido dello Streetwear & Reps</h2>
          <p className="faq-sub">I termini tecnici più usati per orientarti al meglio</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {[
              { t: "W2C (Where to Cop)", d: "Link o fonte per acquistare il prodotto cercato." },
              { t: "QC (Quality Check)", d: "Foto scattate in magazzino per controllare la qualità prima di spedire." },
              { t: "GL (Green Light)", d: "Approvazione del prodotto: autorizzi l'agent a conservarlo per la spedizione." },
              { t: "RL (Red Light)", d: "Rifiuto del prodotto: chiedi all'agent reso o cambio per difetto o taglia errata." },
              { t: "Haul", d: "Pacco cumulativo contenente più articoli spediti insieme per risparmiare." },
              { t: "Batch", d: "Lotto o fabbrica di produzione specifica (es. GX, LJR, PK per le scarpe)." },
              { t: "B&S (Bait & Switch)", d: "Truffa di venditori scorretti (evitata grazie ai nostri seller verificati)." },
              { t: "Tariffless / Tax-Free", d: "Spedizione triangolata europea esente da dazi doganali per l'Italia." },
            ].map((term) => (
              <div
                key={term.t}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{term.t}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{term.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="faq-wrap" style={{ marginTop: 56 }}>
          <h2 className="faq-title">Domande Frequenti (FAQ)</h2>
          <p className="faq-sub">Risposte chiare a tutti i dubbi comuni sull’acquisto tramite agent</p>

          <div className="faq-list">
            {FAQS.map((item, idx) => {
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

        {/* Bottom CTA Banner */}
        <div
          className="glass"
          style={{
            marginTop: 64,
            borderRadius: 28,
            padding: "40px 28px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            background: "radial-gradient(80% 80% at 50% 0%, rgba(255, 255, 255, 0.06), rgba(0,0,0,0.6))",
          }}
        >
          <span className="badge-verified">INIZIA ORA</span>
          <h3 style={{ fontSize: "clamp(24px, 4vw, 36px)", margin: "14px 0 10px", fontWeight: 800 }}>
          Tutto chiaro? Trova il tuo prossimo affare!
          </h3>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, maxWidth: 540, margin: "0 auto 24px" }}>
            Sfoglia migliaia di prodotti selezionati nello Spreadsheet di 360Pallix oppure esplora la directory dei 130+ Best Seller verificati.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            <Link href="/spreadsheet" className="cta">
              Apri lo Spreadsheet →
            </Link>
            <Link href="/sellers" className="cta ghost" style={{ marginTop: 0 }}>
              Esplora i Best Seller (130+) →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
