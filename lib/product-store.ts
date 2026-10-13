import { promises as fs } from "fs";
import path from "path";
import { BASE_PRODUCTS, Product, RMB_TO_EUR, syncInMemoryProducts } from "./products";
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

  const deletedNormalized = new Set([...deletedIds].map((id) => String(id).trim().toLowerCase()));

  const extraIds = new Set(extra.map((p) => String(p.id).trim().toLowerCase()));
  const baseFiltered = BASE_PRODUCTS.filter((p) => !extraIds.has(String(p.id).trim().toLowerCase()));
  const combined = [...extra, ...baseFiltered];

  return combined.filter((p) => !deletedNormalized.has(String(p.id).trim().toLowerCase()));
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const clean = decodeURIComponent(id).trim().toLowerCase();
  const all = await getAllProducts();
  return all.find((p) => String(p.id).trim().toLowerCase() === clean);
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<Product | null> {
  const cleanId = decodeURIComponent(id).trim();
  const extra = await readRawProducts();
  const deletedIds = await readDeletedIds();

  // If was previously deleted, un-delete it
  if (deletedIds.has(cleanId) || deletedIds.has(id)) {
    deletedIds.delete(cleanId);
    deletedIds.delete(id);
    await writeDeletedIds(deletedIds);
  }

  const normTarget = cleanId.toLowerCase();
  const existingIndex = extra.findIndex((p) => String(p.id).trim().toLowerCase() === normTarget);
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

  if (updates.priceRmb !== undefined) {
    const r = parseFloat(String(updates.priceRmb).replace(",", "."));
    if (!isNaN(r) && r > 0) sanitizedUpdates.priceRmb = Math.round(r * 100) / 100;
  }

  if (sanitizedUpdates.price !== undefined && sanitizedUpdates.priceRmb === undefined) {
    sanitizedUpdates.priceRmb = Math.round(sanitizedUpdates.price * RMB_TO_EUR);
  } else if (sanitizedUpdates.priceRmb !== undefined && sanitizedUpdates.price === undefined) {
    sanitizedUpdates.price = parseFloat((sanitizedUpdates.priceRmb / RMB_TO_EUR).toFixed(2));
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
      id: baseItem.id, // Preserve id
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
    const baseP = BASE_PRODUCTS.find((p) => String(p.id).trim().toLowerCase() === normTarget);
    if (!baseP) {
      return null;
    }
    updatedProduct = {
      ...baseP,
      ...sanitizedUpdates,
      id: baseP.id,
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
  try {
    const all = await getAllProducts();
    syncInMemoryProducts(all);
  } catch {}
  return updatedProduct;
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (!id) return false;
  const rawId = String(id).trim();
  let cleanId = rawId;
  try {
    cleanId = decodeURIComponent(rawId).trim();
  } catch {}

  const targetIds = new Set<string>();
  for (const item of [rawId, cleanId]) {
    if (!item) continue;
    targetIds.add(item);
    targetIds.add(item.toLowerCase());
    try {
      const enc = encodeURIComponent(item);
      targetIds.add(enc);
      targetIds.add(enc.toLowerCase());
    } catch {}
  }

  const [extra, deletedIds] = await Promise.all([
    readRawProducts(),
    readDeletedIds(),
  ]);

  // Check if it was already deleted
  let alreadyDeleted = false;
  for (const tid of targetIds) {
    if (deletedIds.has(tid)) {
      alreadyDeleted = true;
      break;
    }
  }

  const matchFn = (p: Product) => {
    const pid = String(p.id || "").trim();
    let pidDecoded = pid;
    try {
      pidDecoded = decodeURIComponent(pid).trim();
    } catch {}
    return (
      targetIds.has(pid) ||
      targetIds.has(pid.toLowerCase()) ||
      targetIds.has(pidDecoded) ||
      targetIds.has(pidDecoded.toLowerCase())
    );
  };

  const wasInExtra = extra.some(matchFn);
  const wasInBase = BASE_PRODUCTS.some(matchFn);

  // If already deleted and not in extra, return false (already deleted)
  if (alreadyDeleted && !wasInExtra) {
    return false;
  }

  // If not found in extra or base, return false
  if (!wasInExtra && !wasInBase) {
    return false;
  }

  // Remove any matching items from extra
  const newExtra = extra.filter((p) => !matchFn(p));

  // Always register in deletedIds so it never resurfaces from BASE_PRODUCTS
  for (const tid of targetIds) {
    deletedIds.add(tid);
  }

  // Write both files
  await Promise.all([
    writeDeletedIds(deletedIds),
    writeRawProducts(newExtra),
  ]);

  try {
    const all = await getAllProducts();
    syncInMemoryProducts(all);
  } catch {}

  return true;
}
