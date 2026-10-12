export type Product = {
  id: string;
  title: string;
  seller: string;
  category: string;
  brand: string;
  price: number;
  image: string;
};

/** 10 sample products imported from the reference catalogue (images stored locally in /public/products). */
export const PRODUCTS: Product[] = [
  { id: "chrome-hearts-finds-973", title: "Chrome Hearts Finds (973)", seller: "Mook", category: "OTHER", brand: "Chrome Hearts", price: 21.11, image: "/products/p1.jpg" },
  { id: "nike-running-sneakers-370", title: "Nike Running Sneakers (370)", seller: "JMDY", category: "SNEAKERS", brand: "Nike", price: 22.72, image: "/products/p2.jpg" },
  { id: "cavempt-finds-41", title: "Cavempt Finds (41)", seller: "Akdingji", category: "OTHER", brand: "Cav Empt", price: 17.1, image: "/products/p3.jpg" },
  { id: "nike-airforce-1-312", title: "Nike Airforce 1 (312)", seller: "JMDY", category: "SNEAKERS", brand: "Nike", price: 34.74, image: "/products/p4.jpg" },
  { id: "hellstar-732", title: "HELLSTAR (732)", seller: "Chaosmade", category: "OTHER", brand: "Hellstar", price: 18.44, image: "/products/p5.jpg" },
  { id: "syna-37", title: "SYNA (37)", seller: "Chaosmade", category: "OTHER", brand: "Syna", price: 14.43, image: "/products/p6.jpg" },
  { id: "nike-airforce-1-96", title: "Nike Airforce 1 (96)", seller: "JMDY", category: "SNEAKERS", brand: "Nike", price: 29.4, image: "/products/p7.jpg" },
  { id: "hoka-sneakers-43", title: "HOKA SNEAKERS (43)", seller: "Yolo66", category: "SNEAKERS", brand: "Hoka", price: 20.04, image: "/products/p8.jpg" },
  { id: "supreme-finds-129", title: "Supreme Finds (129)", seller: "Mook", category: "OTHER", brand: "Supreme", price: 18.57, image: "/products/p9.jpg" },
  { id: "nike-kobe-413", title: "Nike Kobe (413)", seller: "Yolo66", category: "SNEAKERS", brand: "Nike", price: 54.79, image: "/products/p10.jpg" },
];

export const eur = (n: number) => `€ ${n.toFixed(2)}`;
