import extra from "../data/products.json";
import deletedIds from "../data/deleted_ids.json";

export type Product = {
  id: string;
  title: string;
  seller: string;
  category: string;
  brand: string;
  price: number;
  priceRmb?: number;
  image: string;
  cssbuyUrl?: string;
  doppelfitUrl?: string;
};

export const RMB_TO_EUR = 7.8;

/** 10 sample products imported from the reference catalogue (images stored locally in /public/products). */
export const BASE_PRODUCTS: Product[] = [
  { id: "chrome-hearts-finds-973", title: "Chrome Hearts Finds (973)", seller: "", category: "OTHER", brand: "Chrome Hearts", price: 21.11, priceRmb: 165, image: "/products/p1.jpg" },
  { id: "nike-running-sneakers-370", title: "Nike Running Sneakers (370)", seller: "", category: "SNEAKERS", brand: "Nike", price: 22.72, priceRmb: 177, image: "/products/p2.jpg" },
  { id: "cavempt-finds-41", title: "Cavempt Finds (41)", seller: "", category: "OTHER", brand: "Cav Empt", price: 17.1, priceRmb: 133, image: "/products/p3.jpg" },
  { id: "nike-airforce-1-312", title: "Nike Airforce 1 (312)", seller: "", category: "SNEAKERS", brand: "Nike", price: 34.74, priceRmb: 271, image: "/products/p4.jpg" },
  { id: "hellstar-732", title: "HELLSTAR (732)", seller: "", category: "OTHER", brand: "Hellstar", price: 18.44, priceRmb: 144, image: "/products/p5.jpg" },
  { id: "syna-37", title: "SYNA (37)", seller: "", category: "OTHER", brand: "Syna", price: 14.43, priceRmb: 113, image: "/products/p6.jpg" },
  { id: "nike-airforce-1-96", title: "Nike Airforce 1 (96)", seller: "", category: "SNEAKERS", brand: "Nike", price: 29.4, priceRmb: 229, image: "/products/p7.jpg" },
  { id: "hoka-sneakers-43", title: "HOKA SNEAKERS (43)", seller: "YOLO66", category: "SNEAKERS", brand: "Hoka", price: 20.04, priceRmb: 156, image: "/products/p8.jpg" },
  { id: "supreme-finds-129", title: "Supreme Finds (129)", seller: "", category: "OTHER", brand: "Supreme", price: 18.57, priceRmb: 145, image: "/products/p9.jpg" },
  { id: "nike-kobe-413", title: "Nike Kobe (413)", seller: "YOLO66", category: "SNEAKERS", brand: "Nike", price: 54.79, priceRmb: 427, image: "/products/p10.jpg" },
];

const deletedSet = new Set(Array.isArray(deletedIds) ? (deletedIds as string[]) : []);
const extraIds = new Set((extra as Product[]).map((p) => p.id));
export const PRODUCTS: Product[] = [
  ...(extra as Product[]),
  ...BASE_PRODUCTS.filter((p) => !extraIds.has(p.id)),
].filter((p) => !deletedSet.has(p.id));

export const eur = (n?: number | null) => {
  if (n === undefined || n === null || isNaN(n) || n <= 0) return "€ —";
  return `€ ${n.toFixed(2)}`;
};

export const rmb = (n?: number | null) => {
  if (n === undefined || n === null || isNaN(n) || n <= 0) return "¥ —";
  return n % 1 === 0 ? `¥ ${n}` : `¥ ${n.toFixed(2)}`;
};
