import { promises as fs } from "fs";
import path from "path";
import { BASE_PRODUCTS, Product } from "./products";
import { formatDoppelfitLink } from "./convert";

const FILE = path.join(process.cwd(), "data", "products.json");
const DELETED_FILE = path.join(process.cwd(), "data", "deleted_ids.json");

export function isGarbageSeller(seller?: string): boolean {
  if (!seller) return false;
  const s = seller.trim();
  if (/^BBB[a-zA-Z0-9_\-]+$/i.test(s)) return true;
  if (/^tb\d+$/i.test(s)) return true;
  if (/^[a-zA-Z0-9_\-]{20,}$/.test(s)) return true;
  if (/cssbuy|itaobuy|taobuy|\bcsb\b|\btaby\b|itaby/i.test(s)) return true;
  if (/verified\s*order|order/i.test(s)) return true;
  return false;
}

export function sanitizeSeller(seller?: string): string {
  if (!seller) return "";
  const s = seller.trim();
  if (s === "—" || s === "-" || isGarbageSeller(s)) return "";
  return s;
}

export async function readDeletedIds(): Promise<Set<string>> {
  try {
    const raw = await fs.readFile(DELETED_FILE, "utf8");
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export async function writeDeletedIds(ids: Set<string>): Promise<void> {
  await fs.writeFile(DELETED_FILE, JSON.stringify([...ids], null, 2), "utf8");
}

export async function readRawProducts(): Promise<Product[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeRawProducts(list: Product[]): Promise<void> {
  await fs.writeFile(FILE, JSON.stringify(list, null, 2), "utf8");
}

/**
 * Returns all active products: custom products from data/products.json + BASE_PRODUCTS,
 * deduplicated by ID and excluding any deleted product IDs.
 */
export async function getAllProducts(): Promise<Product[]> {
  const [extra, deletedIds] = await Promise.all([
    readRawProducts(),
    readDeletedIds(),
  ]);

  const extraIds = new Set(extra.map((p) => p.id));
  const baseFiltered = BASE_PRODUCTS.filter((p) => !extraIds.has(p.id));
  const combined = [...extra, ...baseFiltered];

  return combined.filter((p) => !deletedIds.has(p.id));
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const all = await getAllProducts();
  return all.find((p) => p.id === id);
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<Product | null> {
  const extra = await readRawProducts();
  const deletedIds = await readDeletedIds();

  // If was previously deleted, un-delete it
  if (deletedIds.has(id)) {
    deletedIds.delete(id);
    await writeDeletedIds(deletedIds);
  }

  const existingIndex = extra.findIndex((p) => p.id === id);
  let updatedProduct: Product;

  // Strict whitelisting of allowed Product fields — NEVER allow password or arbitrary fields
  const sanitizedUpdates: Partial<Product> = {};

  if (updates.title !== undefined) sanitizedUpdates.title = String(updates.title).trim();
  if (updates.image !== undefined) sanitizedUpdates.image = String(updates.image).trim();
  if (updates.category !== undefined) sanitizedUpdates.category = String(updates.category).trim();
  if (updates.brand !== undefined) sanitizedUpdates.brand = String(updates.brand).trim() || "—";
  if (updates.seller !== undefined) sanitizedUpdates.seller = sanitizeSeller(String(updates.seller));

  if (updates.price !== undefined) {
    const p = parseFloat(String(updates.price).replace(",", "."));
    if (!isNaN(p) && p > 0) sanitizedUpdates.price = p;
  }

  if (updates.cssbuyUrl !== undefined) {
    const u = String(updates.cssbuyUrl).trim();
    sanitizedUpdates.cssbuyUrl = u ? u : undefined;
  }

  if (updates.doppelfitUrl !== undefined) {
    const u = String(updates.doppelfitUrl).trim();
    sanitizedUpdates.doppelfitUrl = u ? formatDoppelfitLink(u) : undefined;
  }

  if (existingIndex !== -1) {
    const baseItem = extra[existingIndex];
    updatedProduct = {
      ...baseItem,
      ...sanitizedUpdates,
      id, // Preserve id
    };
    if (sanitizedUpdates.cssbuyUrl === undefined && updates.cssbuyUrl !== undefined) {
      delete updatedProduct.cssbuyUrl;
    }
    if (sanitizedUpdates.doppelfitUrl === undefined && updates.doppelfitUrl !== undefined) {
      delete updatedProduct.doppelfitUrl;
    }
    extra[existingIndex] = updatedProduct;
  } else {
    // Check if it was in BASE_PRODUCTS
    const baseP = BASE_PRODUCTS.find((p) => p.id === id);
    if (!baseP) {
      return null;
    }
    updatedProduct = {
      ...baseP,
      ...sanitizedUpdates,
      id,
    };
    if (sanitizedUpdates.cssbuyUrl === undefined && updates.cssbuyUrl !== undefined) {
      delete updatedProduct.cssbuyUrl;
    }
    if (sanitizedUpdates.doppelfitUrl === undefined && updates.doppelfitUrl !== undefined) {
      delete updatedProduct.doppelfitUrl;
    }
    extra.unshift(updatedProduct);
  }

  await writeRawProducts(extra);
  return updatedProduct;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const extra = await readRawProducts();
  const deletedIds = await readDeletedIds();

  // If already marked as deleted, it cannot be deleted again
  if (deletedIds.has(id)) {
    return false;
  }

  const newExtra = extra.filter((p) => p.id !== id);
  const existedInExtra = newExtra.length !== extra.length;
  const existedInBase = BASE_PRODUCTS.some((p) => p.id === id);

  if (!existedInExtra && !existedInBase) {
    return false;
  }

  if (existedInExtra) {
    await writeRawProducts(newExtra);
  }

  // Always mark in deletedIds so it never resurfaces from BASE_PRODUCTS
  deletedIds.add(id);
  await writeDeletedIds(deletedIds);

  return true;
}
