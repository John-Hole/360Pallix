import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "360Pallix",
  description: "360Pallix — spreadsheet, best seller, tutorial e coupon.",
  referrer: "no-referrer",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <meta name="referrer" content="no-referrer" />
      </head>
      <body>{children}</body>
    </html>
  );
}
