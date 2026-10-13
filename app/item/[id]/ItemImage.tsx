"use client";

import { useState } from "react";

const FALLBACK_SVG =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='500' fill='none'%3E%3Crect width='100%25' height='100%25' fill='%23111'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='16'%3EImmagine non disp.%3C/text%3E%3C/svg%3E";

export default function ItemImage({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_SVG);

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={() => {
        if (imgSrc !== FALLBACK_SVG) {
          setImgSrc(FALLBACK_SVG);
        }
      }}
    />
  );
}
