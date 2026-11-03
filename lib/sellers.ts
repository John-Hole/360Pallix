import sellersJson from "@/data/sellers-directory.json";

export interface BrandSellerRef {
  name: string;
  officialUrl: string;
  spreadsheetQuery: string;
}

export interface BrandItem {
  id: string;
  name: string;
  cover: string;
  category: string;
  sellersCount: number;
  sellers: BrandSellerRef[];
}

export interface SellerItem {
  id: string;
  name: string;
  officialUrl: string;
  spreadsheetQuery: string;
  category: string;
  platform: string;
  brands: string[];
  brandsCount: number;
  description: string;
  specialty: string;
  cover: string;
  verified: boolean;
}

export interface SellersDirectory {
  totalBrands: number;
  totalSellers: number;
  brands: BrandItem[];
  sellers: SellerItem[];
}

export const SELLERS_DATA = sellersJson as SellersDirectory;
export const BRANDS: BrandItem[] = SELLERS_DATA.brands;
export const SELLERS: SellerItem[] = SELLERS_DATA.sellers;

export function getTopVerifiedSellers(limit = 8): SellerItem[] {
  // Curate top iconic sellers first, then fill with highest brands count
  const priority = [
    "yolo66",
    "wwtop",
    "husky",
    "goatofficial",
    "topgoosey",
    "scarlett",
    "sharkbreeder",
    "aaaajersey",
    "victoriareps",
    "firerep",
    "158sir",
    "cnmade",
    "chaosmade",
    "cndisland",
  ];

  const map = new Map(SELLERS.map((s) => [s.id, s]));
  const picked: SellerItem[] = [];

  for (const id of priority) {
    const s = map.get(id);
    if (s && !picked.includes(s)) {
      picked.push(s);
      if (picked.length >= limit) break;
    }
  }

  if (picked.length < limit) {
    for (const s of SELLERS) {
      if (!picked.includes(s)) {
        picked.push(s);
        if (picked.length >= limit) break;
      }
    }
  }

  return picked;
}
