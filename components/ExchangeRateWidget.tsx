"use client";

import React, { useState } from "react";
import { RMB_TO_EUR, EXCHANGE_RATE_DATE } from "@/lib/products";

interface ExchangeRateWidgetProps {
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean;
  interactive?: boolean;
  defaultEur?: number;
}

/** Bandiera Unione Europea in cerchio SVG */
export const EuFlag = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    style={{ borderRadius: "50%", flexShrink: 0, display: "inline-block" }}
    aria-label="Bandiera Unione Europea"
  >
    <circle cx="50" cy="50" r="50" fill="#003399" />
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 30 * Math.PI) / 180;
      const cx = 50 + 32 * Math.sin(angle);
      const cy = 50 - 32 * Math.cos(angle);
      return (
        <polygon
          key={i}
          points="0,-4 1.2,-1.2 4,-1.2 1.8,0.5 2.6,3.4 0,1.7 -2.6,3.4 -1.8,0.5 -4,-1.2 -1.2,-1.2"
          transform={`translate(${cx}, ${cy}) scale(1.1)`}
          fill="#FFCC00"
        />
      );
    })}
  </svg>
);

/** Bandiera Cina in cerchio SVG */
export const ChinaFlag = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    style={{ borderRadius: "50%", flexShrink: 0, display: "inline-block" }}
    aria-label="Bandiera Cina"
  >
    <circle cx="50" cy="50" r="50" fill="#DE2910" />
    {/* Grande stella principale */}
    <polygon
      points="0,-16 4.7,-4.9 16,-4.9 7.4,2 10.7,13 0,6.8 -10.7,13 -7.4,2 -16,-4.9 -4.7,-4.9"
      transform="translate(32, 34) scale(0.9)"
      fill="#FFDE00"
    />
    {/* 4 stelline minori disposte ad arco */}
    {[
      { cx: 58, cy: 20, rot: -30 },
      { cx: 66, cy: 30, rot: 15 },
      { cx: 66, cy: 45, rot: 45 },
      { cx: 58, cy: 55, rot: 70 },
    ].map((s, idx) => (
      <polygon
        key={idx}
        points="0,-5 1.5,-1.5 5,-1.5 2.3,0.6 3.3,4.1 0,2.1 -3.3,4.1 -2.3,0.6 -5,-1.5 -1.5,-1.5"
        transform={`translate(${s.cx}, ${s.cy}) rotate(${s.rot}) scale(0.8)`}
        fill="#FFDE00"
      />
    ))}
  </svg>
);

/** Icona di switch / frecce orizzontali */
export const SwapIcon = ({ size = 12, color = "#ffffff" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 16V4m0 0L3 8m4-4l4 4" transform="rotate(90 12 12)" />
    <path d="M17 8v12m0 0l4-4m-4 4l-4-4" transform="rotate(90 12 12)" />
  </svg>
);

export default function ExchangeRateWidget({
  className = "",
  style,
  compact = false,
  interactive = true,
  defaultEur = 1.0,
}: ExchangeRateWidgetProps) {
  const [eurValue, setEurValue] = useState<number>(defaultEur);
  const [isCnyBase, setIsCnyBase] = useState<boolean>(false);
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>("1");

  const rate = RMB_TO_EUR; // 7.458
  const asOfDate = EXCHANGE_RATE_DATE; // 2026-10-13

  const calculatedCny = (eurValue * rate).toFixed(3);
  const calculatedEur = (parseFloat(customInput || "0") / rate).toFixed(2);

  const handleToggleDirection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCnyBase(!isCnyBase);
  };

  return (
    <div
      className={`exchange-rate-widget ${className}`}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        gap: compact ? 4 : 6,
        paddingTop: compact ? 4 : 8,
        borderTop: compact ? "none" : "1px dashed rgba(156, 163, 175, 0.4)",
        fontFamily: "var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        userSelect: "none",
        ...style,
      }}
    >
      {/* Intestazione: Exchange rate · As of 2026-10-13 */}
      {!compact && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 12,
            lineHeight: 1.2,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.85)",
              letterSpacing: "-0.01em",
            }}
          >
            Exchange rate
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "rgba(156, 163, 175, 0.9)",
              letterSpacing: "0.01em",
            }}
          >
            As of {asOfDate}
          </span>
        </div>
      )}

      {/* Pillola grafica fedele allo screenshot CSSBuy */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          position: "relative",
          filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.25))",
          cursor: interactive ? "pointer" : "default",
        }}
        onClick={() => interactive && setShowCalculator(!showCalculator)}
        title={interactive ? "Clicca per calcolatrice di cambio rapida" : undefined}
      >
        {/* Blocco Sinistro: EUR */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#f1f3f9",
            color: "#111827",
            padding: compact ? "4px 10px 4px 12px" : "6px 14px 6px 14px",
            borderTopLeftRadius: 9999,
            borderBottomLeftRadius: 9999,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            fontSize: compact ? 12.5 : 13.5,
            fontWeight: 600,
            lineHeight: 1,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          <span style={{ letterSpacing: "-0.02em" }}>€{defaultEur.toFixed(2)}</span>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 3.5 }}>
            <EuFlag size={compact ? 15 : 17} />
            <span
              style={{
                fontSize: compact ? 10.5 : 11.5,
                fontWeight: 600,
                color: "#374151",
              }}
            >
              EUR
            </span>
            <span style={{ fontSize: 9, color: "#6b7280", marginLeft: -1 }}>▾</span>
          </div>
        </div>

        {/* Bottone centrale con icona Swap sovrapposto */}
        <button
          type="button"
          onClick={handleToggleDirection}
          style={{
            width: compact ? 22 : 26,
            height: compact ? 22 : 26,
            borderRadius: "50%",
            background: "#1f242c",
            border: "2px solid #ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: compact ? -11 : -13,
            marginRight: compact ? -11 : -13,
            zIndex: 10,
            cursor: "pointer",
            padding: 0,
            boxShadow: "0 2px 5px rgba(0,0,0,0.35)",
            transition: "transform 0.2s ease, background-color 0.2s ease",
          }}
          title="Inverti valute"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1) rotate(180deg)";
            e.currentTarget.style.background = "#0f172a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1) rotate(0deg)";
            e.currentTarget.style.background = "#1f242c";
          }}
        >
          <SwapIcon size={compact ? 11 : 13} color="#ffffff" />
        </button>

        {/* Blocco Destro: CNY */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#fef9c3", // Giallino tenue fedele all'immagine
            color: "#111827",
            padding: compact ? "4px 12px 4px 10px" : "6px 14px 6px 14px",
            borderTopRightRadius: 9999,
            borderBottomRightRadius: 9999,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            fontSize: compact ? 12.5 : 13.5,
            fontWeight: 600,
            lineHeight: 1,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          <span style={{ letterSpacing: "-0.02em" }}>¥{rate.toFixed(3)}</span>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 3.5 }}>
            <ChinaFlag size={compact ? 15 : 17} />
            <span
              style={{
                fontSize: compact ? 10.5 : 11.5,
                fontWeight: 600,
                color: "#374151",
              }}
            >
              CNY
            </span>
          </div>
        </div>
      </div>

      {/* Micro-calcolatrice a scomparsa (opzionale e interattiva) */}
      {interactive && showCalculator && (
        <div
          style={{
            marginTop: 6,
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(17, 24, 39, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            zIndex: 30,
            fontSize: 12,
            color: "#f3f4f6",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            maxWidth: 260,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#9ca3af" }}>
            <span>Convertitore rapido CSSBuy:</span>
            <button
              onClick={() => setShowCalculator(false)}
              style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 14 }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="number"
              min="0"
              step="any"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Importo..."
              style={{
                width: 80,
                padding: "4px 6px",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(0,0,0,0.4)",
                color: "#fff",
                fontSize: 12,
              }}
            />
            <span style={{ fontWeight: 600 }}>€ EUR =</span>
            <span style={{ fontWeight: 700, color: "#86efac" }}>
              ¥ {((parseFloat(customInput || "0") || 0) * rate).toFixed(2)} CNY
            </span>
          </div>
          <div style={{ fontSize: 10, color: "#6b7280", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 4 }}>
            Tasso ufficiale applicato: 1 EUR = {rate} CNY
          </div>
        </div>
      )}
    </div>
  );
}
