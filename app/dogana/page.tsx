"use client";
import Link from "next/link";
import { useState } from "react";
import { TikTokIcon } from "@/components/TikTokIcon";
import { SiteFooter } from "@/components/SiteFooter";

interface FaqItem {
  q: string;
  a: string;
}

const DOGANA_FAQS: FaqItem[] = [
  {
    q: "Devo pagare una tassa di 2€ quando il corriere mi consegna il pacco a casa?",
    a: "No, assolutamente no se hai scelto una linea triangolata Tax-Free (Tariffless, come DHL Tariffless). CSSBuy gestisce e copre direttamente all'origine tutti i costi doganali previsti dalla normativa europea, inclusa la nuova tassa di gestione (handling fee) di 2€ per riga. Il corriere in Italia non ti chiederà alcun pagamento alla consegna.",
  },
  {
    q: "Il mio pacco è fermo da diversi giorni con stato 'Customs Clearance'. È stato sequestrato?",
    a: "No, non c'è alcun motivo di ritenere che il pacco sia stato sequestrato. A cavallo del 1° Novembre si è verificato un ingorgo doganale straordinario dovuto a tre fattori concomitanti: l'ondata di spedizioni anticipate prima dell'avvio della norma, i test tecnici dei sistemi informatici doganali UE e l'inizio del picco stagionale natalizio. Si tratta solo di un ritardo fisiologico di smistamento.",
  },
  {
    q: "Devo modificare il modo in cui compilo la dichiarazione del pacco su CSSBuy?",
    a: "No. CSSBuy adegua automaticamente tutti i requisiti tecnici previsti dalle nuove regole europee sul Product Identification (PID). Puoi continuare a dichiarare il tuo pacco esattamente come facevi prima, inserendo 1 o 2 righe descrittive standard con importo compreso tra 16.00$ e 21.00$ e decimali casuali (es. 18.73$).",
  },
  {
    q: "Come devo compilare la dichiarazione doganale del mio pacco?",
    a: "Continua a compilare la dichiarazione esattamente come hai sempre fatto: seleziona 1 o 2 righe merceologiche standard (es. t-shirt o scarpe) e inserisci un valore complessivo compreso tra 16.00$ e 21.00$ con decimali casuali (es. 18.73$). CSSBuy applica automaticamente tutti i parametri di conformità richiesti per il transito doganale europeo.",
  },
  {
    q: "Quanto può incidere al massimo la nuova tassa di 2€?",
    a: "La tassa europea ammonta a 2,00€ per ciascuna riga di dichiarazione (declaration line). Poiché il sistema di spedizione di CSSBuy consente al massimo 2 righe di dichiarazione per pacco, il costo massimo teorico applicabile dalla dogana è di soli 4,00€. Sulle linee Tax-Free, questo importo viene comunque assorbito da CSSBuy.",
  },
  {
    q: "Cosa succede se in futuro la handling fee dovesse essere prepagata al momento dell'ordine?",
    a: "Se in futuro le compagnie di logistica dovessero richiedere il pagamento anticipato anziché l'assorbimento, CSSBuy integrerà la quota (massimo 4€ complessivi) direttamente nel preventivo di spedizione alla sottomissione del pacco. In nessun caso sulle linee triangolate ti verrà richiesta una somma alla consegna, né il pacco potrà subire un doppio addebito.",
  },
  {
    q: "Cosa succede se invece ho spedito con corrieri postali tradizionali (EMS, SAL, China Post)?",
    a: "Per i servizi postali tradizionali o corrieri espressi non triangolati, la copertura doganale di CSSBuy non è applicabile. Eventuali dazi, IVA o diritti di gestione postale sono sempre stati e rimangono a carico del destinatario al momento della consegna in Italia. Per questo motivo sconsigliamo fortemente i servizi postali generici e raccomandiamo sempre linee triangolate Tax-Free.",
  },
  {
    q: "La tassa di 3€ di luglio 2026 e quella di 2€ di novembre 2026 si cumulano?",
    a: "La riforma europea ha introdotto a luglio 2026 un dazio forfettario di 3€ sulle merci di modesto valore, a cui dal 1° novembre si aggiunge la handling fee di 2€ per riga per finanziare i controlli. Entrambe le misure sono pienamente gestite dalle catene logistiche integrate di CSSBuy per le rotte comunitarie triangolate.",
  },
  {
    q: "Cosa c'è di vero nei video allarmistici che parlano di blocco totale delle importazioni dalla Cina?",
    a: "Nulla di concreto. Si tratta di disinformazione e sensazionalismo diffusi sui social per generare visualizzazioni o indurre ad acquisti compulsivi ('panic buying'). I flussi commerciali tra Cina ed Europa continuano regolarmente e gli agenti logistici professionisti adeguano i protocolli in piena conformità con le direttive comunitarie.",
  },
  {
    q: "Conviene continuare a ordinare normalmente o è preferibile attendere?",
    a: "Puoi continuare a ordinare in assoluta tranquillità. Ti suggeriamo di pianificare con qualche giorno di anticipo i regali di Natale e di selezionare sempre l'opzione di assicurazione della spedizione (che costa solo il 3% circa del valore complessivo) per viaggiare protetto al 100% contro ogni eventuale imprevisto.",
  },
];

export default function DoganaPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <main style={{ minHeight: "100dvh", background: "#000", color: "#fff", paddingBottom: 80 }}>
      {/* Top bar navigation (100% mathematically centered) */}
      <div className="sheet-bar">
        <div className="sheet-nav-grid">
          <div className="sheet-nav-left">
            <Link href="/" className="back">
              ← Home
            </Link>
          </div>
          <div className="sheet-nav-center">
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
              Guida & Tutorial
            </Link>
            <Link
              href="/coupon"
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
              Coupon & Sconti
            </Link>
          </div>
          <div className="sheet-nav-right">
            <a
              href="https://www.tiktok.com/@360pallix"
              target="_blank"
              rel="noopener noreferrer"
              className="sheet-social-pill"
              title="Segui @360pallix su TikTok"
            >
              <TikTokIcon size={13} />
              <span>TikTok @360pallix</span>
            </a>
          </div>
        </div>
      </div>

      <div className="wrap" style={{ maxWidth: 1040, padding: "40px 20px 0" }}>
        {/* Header Section */}
        <div className="dir-header" style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <span className="badge-verified">NORMATIVA DOGANALE UE · 1 NOVEMBRE 2026</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.16)",
                color: "rgba(255,255,255,0.85)",
                letterSpacing: "0.06em",
              }}
            >
              COPERTURA CSSBUY ATTIVA
            </span>
          </div>

          <h1 className="dir-title">Nuove Regole Dogana UE · 1 Novembre</h1>
          <p className="dir-desc" style={{ maxWidth: 820 }}>
            Tutto ciò che devi sapere sull'entrata in vigore delle nuove normative doganali dell'Unione Europea per i pacchi provenienti dalla Cina: tassa di gestione da 2€, codice PID, copertura integrale di CSSBuy e spiegazione trasparente dei rallentamenti doganali.
          </p>

          <div
            style={{
              marginTop: 18,
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 16px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              fontSize: 12,
              color: "rgba(255,255,255,0.65)",
            }}
          >
            <span>📅 Aggiornato: Novembre 2026</span>
            <span>•</span>
            <span>⚖️ Fonte: Riforma Codice Doganale UE (UCC) & Note Ufficiali CSSBuy</span>
          </div>
        </div>

        {/* In Sintesi - Long Story Short Box */}
        <div
          style={{
            marginTop: 32,
            padding: "24px 28px",
            borderRadius: 20,
            background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 14px 40px rgba(0,0,0,0.45)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#fff" }}>
              In Sintesi · Long Story Short
            </span>
          </div>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "rgba(255,255,255,0.85)", margin: "0 0 16px" }}>
            CSSBuy gestisce direttamente tutti i requisiti introdotti dalla riforma doganale europea dell&apos;1 Novembre 2026. Puoi continuare a spedire ed effettuare i tuoi ordini in totale serenità senza dover cambiare abitudini:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <span>✓</span>
              <span><strong>Handling Fee coperta:</strong> La tassa di 2€ a riga è assorbita da CSSBuy sulle rotte Tax-Free triangolate.</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span>✓</span>
              <span><strong>Impatto max 4€:</strong> Con il limite CSSBuy di 2 righe, l&apos;esborso doganale non supera mai 4€ per pacco.</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span>✓</span>
              <span><strong>Zero modifiche dichiarazione:</strong> Continua a dichiarare normalmente tra 16$ e 21$ come hai sempre fatto; CSSBuy applica automaticamente i parametri di conformità.</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span>✓</span>
              <span><strong>Ritardi ≠ Sequestri:</strong> I pacchi fermi sono dovuti alla congestione d&apos;avvio e al traffico natalizio.</span>
            </div>
          </div>
        </div>

        {/* 6 Key Highlights Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginTop: 36,
          }}
        >
          <div className="tile glass" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>Norma UE</div>
            <h3 style={{ fontSize: 18, margin: "6px 0 8px", fontWeight: 700 }}>Handling Fee da 2€</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, margin: 0 }}>
              La Commissione Europea ha introdotto una tassa di gestione di 2,00€ per riga di dichiarazione (declaration line) sulle merci extra-UE per finanziare i controlli di sicurezza.
            </p>
          </div>

          <div className="tile glass" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>Garanzia CSSBuy</div>
            <h3 style={{ fontSize: 18, margin: "6px 0 8px", fontWeight: 700 }}>Copertura al 100% Tax-Free</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, margin: 0 }}>
              Per tutte le linee di spedizione triangolate Tax-Free / Tariffless, CSSBuy gestisce e copre interamente i costi doganali. Nessun costo a sorpresa per te.
            </p>
          </div>

          <div className="tile glass" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>Impatto Massimo</div>
            <h3 style={{ fontSize: 18, margin: "6px 0 8px", fontWeight: 700 }}>Max 4€ per Spedizione</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, margin: 0 }}>
              CSSBuy limita a 2 il numero di righe di dichiarazione per pacco. Pertanto l&apos;importo teorico applicabile dalla dogana è al massimo di 4,00€, assorbito dal servizio.
            </p>
          </div>

          <div className="tile glass" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>Dichiarazione</div>
            <h3 style={{ fontSize: 18, margin: "6px 0 8px", fontWeight: 700 }}>Nuovo Codice PID Gestito</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, margin: 0 }}>
              I nuovi requisiti di identificazione del prodotto (PID) sono implementati nei sistemi tecnici di CSSBuy. Tu puoi continuare a dichiarare normalmente.
            </p>
          </div>

          <div className="tile glass" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>Stato Dogana</div>
            <h3 style={{ fontSize: 18, margin: "6px 0 8px", fontWeight: 700 }}>Ritardi ≠ Sequestri</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, margin: 0 }}>
              I pacchi fermi in sdoganamento non sono sequestrati. Si tratta di un normale collo di bottiglia logistico dovuto all&apos;avvio delle norme e al traffico natalizio.
            </p>
          </div>

          <div className="tile glass" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>Fact-Checking</div>
            <h3 style={{ fontSize: 18, margin: "6px 0 8px", fontWeight: 700 }}>Niente Allarmismi Social</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, margin: 0 }}>
              Diffida dai video su TikTok o Instagram che parlano di stop delle spedizioni o rincari insostenibili: per chi usa linee triangolate l&apos;impatto pratico è nullo.
            </p>
          </div>
        </div>

        {/* Deep Dive Section 1 */}
        <div style={{ marginTop: 56 }}>
          <div
            style={{
              padding: "32px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 24,
            }}
          >
            <div className="eyebrow">Quadro Regolatorio</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "8px 0 16px" }}>
              1. Cosa cambia dal 1° Novembre 2026: La Riforma Doganale UE
            </h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", margin: "0 0 16px" }}>
              A partire dal <strong>1° Novembre 2026</strong>, l&apos;Unione Europea ha reso operativa una nuova disposizione doganale nell&apos;ambito della più ampia riforma del <em>Codice Doganale dell&apos;Unione (Union Customs Code - UCC)</em>. La misura risponde alla necessità degli organi comunitari di far fronte all&apos;enorme afflusso quotidiano di piccoli colli e-commerce provenienti da paesi terzi (inclusa la Cina) e di reperire risorse per rafforzare i controlli su sicurezza dei prodotti, conformità e rispetto delle norme UE.
            </p>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", margin: "0 0 16px" }}>
              Le due novità principali sono:
            </p>
            <ul style={{ paddingLeft: 20, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.75)" }}>
              <li>
                <strong>Handling fee di 2,00€ per riga di dichiarazione:</strong> Una tariffa fissa di gestione amministrativa e controllo calcolata per ogni singola categoria merceologica indicata nella dichiarazione doganale del pacco.
              </li>
              <li>
                <strong>Requisiti di Product Identification (PID):</strong> L&apos;introduzione di parametri più stringenti di catalogazione tecnica e identificazione digitale per migliorare la tracciabilità delle merci importate.
              </li>
              <li>
                <strong>Cumulo con la tariffa di Luglio 2026:</strong> Questa misura si aggiunge al dazio di 3,00€ introdotto il 1° Luglio 2026 per le spedizioni sotto i 150€, portando la base normativa a un nuovo standard di verifica.
              </li>
            </ul>

            <div className="pro-tip-box" style={{ marginTop: 20 }}>
              <div style={{ fontSize: 20 }}>🛡️</div>
              <div>
                <div className="pro-tip-title">La Posizione e Copertura Ufficiale di CSSBuy</div>
                <div className="pro-tip-text">
                  Per tutte le spedizioni effettuate tramite <strong>linee triangolate Tax-Free (Tariffless)</strong> che passano attraverso gli hub doganali dell&apos;Unione Europea (es. Germania, Olanda, Lussemburgo), <strong>CSSBuy si fa carico direttamente di tutte le spese doganali e dell&apos;handling fee associata</strong>. L&apos;acquirente non deve compiere alcuna azione né sostenere spese impreviste.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deep Dive Section 2: Declaration & PID */}
        <div style={{ marginTop: 32 }}>
          <div
            style={{
              padding: "32px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 24,
            }}
          >
            <div className="eyebrow">Operatività Pratica</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "8px 0 16px" }}>
              2. Come Gestire la Dichiarazione: Righe e Codici PID
            </h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", margin: "0 0 16px" }}>
              Una delle preoccupazioni più diffuse tra gli acquirenti è capire se sia necessario modificare le abitudini di compilazione della dichiarazione doganale su CSSBuy:
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 16,
                margin: "20px 0",
              }}
            >
              <div style={{ padding: 18, borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
                  Hai bisogno di cambiare qualcosa?
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                  <strong>No.</strong> CSSBuy gestisce a livello centrale tutti gli adeguamenti telematici e informatici richiesti dai nuovi regolamenti sul Product Identification (PID). La tua procedura utente resta del tutto invariata.
                </div>
              </div>

              <div style={{ padding: 18, borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
                  Limite Righe di Dichiarazione
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                  CSSBuy permette di utilizzare al massimo <strong>2 declaration lines</strong> per ciascun pacco. Poiché la tassa UE è di 2€ a riga, l&apos;esborso doganale complessivo massimo è di <strong>4,00€</strong>, interamente gestito dall&apos;agente logistico.
                </div>
              </div>

              <div style={{ padding: 18, borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
                  Nessuna Doppia Tassazione
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                  I pacchi che viaggiano su linee triangolate vengono sdoganati nell&apos;hub d&apos;ingresso dell&apos;UE. Una volta entrati nel circuito comunitario, non possono subire un secondo addebito alla frontiera italiana.
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "16px 20px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontSize: 13,
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.85)",
              }}
            >
              💡 <strong>Regola aurea di dichiarazione per l&apos;Italia:</strong> Per le linee triangolate Tax-Free (DHL Tariffless), continua a dichiarare un totale compreso tra <strong>16.00$ e 21.00$</strong> per l&apos;intero pacco, inserendo sempre decimali casuali (es. <em>18.42$</em> o <em>19.38$</em>) e 1-2 categorie generiche (es. <em>Casual clothes</em> o <em>Shoes</em>).
            </div>

            <div
              style={{
                marginTop: 16,
                padding: "16px 20px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 20 }}>🛡️</span>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.8)" }}>
                <strong style={{ color: "#fff" }}>Garanzia di Conformità:</strong> CSSBuy applica automaticamente i protocolli di conformità richiesti dalle autorità doganali europee (inclusi i codici identificativi di prodotto PID). Non è richiesta alcuna azione manuale complessa da parte tua: puoi ordinare e spedire con la consueta semplicità.
              </div>
            </div>
          </div>
        </div>

        {/* Deep Dive Section 3: Customs backlog */}
        <div style={{ marginTop: 32 }}>
          <div
            style={{
              padding: "32px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 24,
            }}
          >
            <div className="eyebrow">Tracciamento & Logistica</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "8px 0 16px" }}>
              3. Pacchi Fermi e Rallentamenti in Dogana: La Verità
            </h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", margin: "0 0 16px" }}>
              A ridosso del mese di Novembre si è registrato un aumento delle spedizioni che presentano una sosta prolungata nello stato di <em>&ldquo;Customs clearance&rdquo;</em> o <em>&ldquo;In attesa di sdoganamento&rdquo;</em> negli hub aeroportuali europei.
            </p>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", margin: "0 0 16px" }}>
              <strong>Smentiamo categoricamente le voci di sequestri o confische:</strong> i colli non sono stati bloccati o sequestrati per violazioni legali. I ritardi sono il risultato di una temporanea congestione doganale determinata da tre fattori ben precisi:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "20px 0" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", minWidth: 28 }}>01</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>Corsa globale alle spedizioni pre-1° Novembre</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
                    Migliaia di acquirenti e operatori in tutto il mondo hanno concentrato i propri invii nell&apos;ultima settimana di ottobre per anticipare l&apos;entrata in vigore delle nuove disposizioni, saturando la capacità ricettiva dei terminal cargo.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", minWidth: 28 }}>02</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>Adeguamento e collaudo dei sistemi informatici UE</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
                    I funzionari doganali europei stanno collaudando e tarando le nuove piattaforme di registrazione per il Product Identification e i moduli di fatturazione automatizzata, rallentando temporaneamente i tempi medi di rilascio dei lotti.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", minWidth: 28 }}>03</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>Inizio del picco stagionale natalizio e Single&apos;s Day</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
                    Come ogni anno a novembre, il volume del commercio mondiale subisce un&apos;impennata vertiginosa in vista del Single&apos;s Day (11.11), del Black Friday e dello shopping natalizio, incrementando fisiologicamente le code di smistamento.
                  </div>
                </div>
              </div>
            </div>

            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.7)", margin: "16px 0 0" }}>
              Consigliamo di mantenere la calma e consentire alle autorità doganali il tempo materiale necessario per smaltire il carico di lavoro arretrato. Il pacco riprenderà il transito non appena superata la fase di rilascio.
            </p>
          </div>
        </div>

        {/* Deep Dive Section 4: Debunking Panic Buying */}
        <div style={{ marginTop: 32 }}>
          <div
            style={{
              padding: "32px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 24,
            }}
          >
            <div className="eyebrow">Trasparenza & Informazione</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "8px 0 16px" }}>
              4. Fact-Checking: Influencer, Fake News e &ldquo;Panic Buying&rdquo;
            </h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", margin: "0 0 16px" }}>
              Nelle ultime settimane diversi creatori di contenuti e canali social hanno diffuso notizie allarmistiche ed esagerate, paventando imminenti &ldquo;blocchi doganali di massa&rdquo; o &ldquo;fine delle importazioni dalla Cina&rdquo;. Questa narrazione distorta ha il solo scopo di catturare clic ed engagement, alimentando una corsa agli acquisti compulsivi del tutto ingiustificata.
            </p>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", margin: "0 0 16px" }}>
              La realtà dei fatti, confermata dai dati operativi e dalla logistica di CSSBuy, è diametralmente opposta:
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 16,
                margin: "20px 0",
              }}
            >
              <div style={{ padding: 18, borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>❌ Falsa Narrazione</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                  &ldquo;La dogana europea bloccherà tutti i pacchi cinesi e chiederà centinaia di euro di tasse a chiunque ordini vestiti o scarpe.&rdquo;
                </div>
              </div>
              <div style={{ padding: 18, borderRadius: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.16)" }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>✅ Realtà Operativa</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                  La nuova misura prevede una tariffa fissa di soli 2€ a riga merceologica, gestita e assorbita all&apos;origine per le linee Tax-Free da CSSBuy. L&apos;impatto per il cliente finale è praticamente nullo.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deep Dive Section 5: Practical Advice for Italian Buyers */}
        <div style={{ marginTop: 32 }}>
          <div
            style={{
              padding: "32px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 24,
            }}
          >
            <div className="eyebrow">Consigli Pratici</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "8px 0 16px" }}>
              5. Guida alla Spedizione Sicura verso l&apos;Italia
            </h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", margin: "0 0 16px" }}>
              Per garantire che i tuoi ordini arrivino a destinazione in Italia senza il minimo intoppo burocratico o spesa imprevista, segui scrupolosamente questa checklist operativa:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, margin: "20px 0" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#fff", color: "#000", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>
                  1
                </span>
                <div>
                  <strong style={{ color: "#fff", fontSize: 14 }}>Seleziona sempre linee Triangolate Tax-Free / Tariffless:</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                    Utilizza opzioni come DHL Tariffless Line-M, Line-B o CSS-FJ-DHL. Queste rotte sdoganano le merci in modo centralizzato nei Paesi Bassi o in Germania, prima di immetterle come trasporto intra-comunitario privo di dazi alla consegna.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#fff", color: "#000", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>
                  2
                </span>
                <div>
                  <strong style={{ color: "#fff", fontSize: 14 }}>Evita Poste tradizionali ed Express non triangolati:</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                    China Post, EMS, SAL o spedizioni aeree postali standard atterrano direttamente alle dogane di Milano Malpensa o Roma Fiumicino, dove l&apos;IVA, i dazi e i costi di gestione postale ricadono al 100% sulle tasche del destinatario.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#fff", color: "#000", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>
                  3
                </span>
                <div>
                  <strong style={{ color: "#fff", fontSize: 14 }}>Dichiara con criterio e decimali:</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                    Mantieni il valore dichiarato complessivo del pacco compreso tra 16.00$ e 21.00$ (es. 18.23$) sfruttando 1 o al massimo 2 categorie generiche, in perfetta armonia con i limiti di CSSBuy.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#fff", color: "#000", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>
                  4
                </span>
                <div>
                  <strong style={{ color: "#fff", fontSize: 14 }}>Aggiungi sempre l&apos;assicurazione completa:</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                    Con una spesa irrisoria (circa il 3% del valore del pacco, es. 4-5€), l&apos;assicurazione garantisce il rimborso al 100% di merce e costi di spedizione per qualsiasi contrattempo, furto, danno o prolungata mancata consegna.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="faq-wrap" style={{ marginTop: 56 }}>
          <div className="eyebrow" style={{ textAlign: "center", marginBottom: 6 }}>Risposte Rapide</div>
          <h2 className="faq-title">Domande Frequenti sulla Dogana</h2>
          <p className="faq-sub">I chiarimenti più richiesti per ordinare dalla Cina in totale sicurezza.</p>

          <div className="faq-list">
            {DOGANA_FAQS.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className={`faq-item ${isOpen ? "open" : ""}`}>
                  <button
                    className="faq-btn"
                    onClick={() => toggleFaq(i)}
                    aria-expanded={isOpen}
                    type="button"
                  >
                    <span>{f.q}</span>
                    <svg
                      className="faq-chevron"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="faq-answer">
                      <p>{f.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Footer Banner */}
        <div
          style={{
            marginTop: 56,
            padding: "36px 24px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 24,
            textAlign: "center",
          }}
        >
          <div className="eyebrow">Pronto a Spedire?</div>
          <h3 style={{ fontSize: 24, fontWeight: 800, margin: "8px 0 12px" }}>
            Trova i Migliori Prodotti e Venditori Verificati
          </h3>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", maxWidth: 600, margin: "0 auto 24px" }}>
            Sfoglia il catalogo completo nello Spreadsheet o consulta l&apos;elenco ufficiale dei seller affidabili.
          </p>
          <div style={{ display: "inline-flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Link className="cta" href="/spreadsheet" style={{ marginTop: 0 }}>
              Apri Spreadsheet →
            </Link>
            <Link className="cta ghost" href="/sellers" style={{ marginTop: 0 }}>
              Consulta i Seller Verificati
            </Link>
          </div>
        </div>
      </div>

      <SiteFooter subtitle="Informativa Normativa Doganale UE 1 Novembre 2026." />
    </main>
  );
}
