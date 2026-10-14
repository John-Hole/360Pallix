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

export function normalizeProductId(id: string): string {
  if (!id) return "";
  let s = String(id).trim();
  try {
    while (s.includes("%")) {
      const decoded = decodeURIComponent(s).trim();
      if (decoded === s) break;
      s = decoded;
    }
  } catch {}
  return s.toLowerCase().trim();
}

export async function readDeletedIds(): Promise<Set<string>> {
  try {
    const raw = await fs.readFile(DELETED_FILE, "utf8");
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr.map(normalizeProductId).filter(Boolean) : []);
  } catch {
    return new Set();
  }
}

export async function writeDeletedIds(ids: Set<string>): Promise<void> {
  const normList = [...new Set([...ids].map(normalizeProductId).filter(Boolean))].sort();
  await fs.writeFile(DELETED_FILE, JSON.stringify(normList, null, 2), "utf8");
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

  const deletedNormalized = new Set([...deletedIds].map(normalizeProductId));
  const extraIds = new Set(extra.map((p) => normalizeProductId(p.id)));
  const baseFiltered = BASE_PRODUCTS.filter((p) => !extraIds.has(normalizeProductId(p.id)));
  const combined = [...extra, ...baseFiltered];

  return combined.filter((p) => !deletedNormalized.has(normalizeProductId(p.id)));
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const clean = normalizeProductId(id);
  const all = await getAllProducts();
  return all.find((p) => normalizeProductId(p.id) === clean);
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<Product | null> {
  const normTarget = normalizeProductId(id);
  if (!normTarget) return null;

  const extra = await readRawProducts();
  const deletedIds = await readDeletedIds();

  // If was previously deleted, un-delete it
  if (deletedIds.has(normTarget)) {
    deletedIds.delete(normTarget);
    await writeDeletedIds(deletedIds);
  }

  const existingIndex = extra.findIndex((p) => normalizeProductId(p.id) === normTarget);
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
    const baseP = BASE_PRODUCTS.find((p) => normalizeProductId(p.id) === normTarget);
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
  const normTarget = normalizeProductId(id);
  if (!normTarget) return false;

  const [extra, deletedIds] = await Promise.all([
    readRawProducts(),
    readDeletedIds(),
  ]);

  const matchId = (target: string, candidate: string) => {
    if (!target || !candidate) return false;
    const t = String(target).trim().toLowerCase();
    const c = String(candidate).trim().toLowerCase();
    if (t === c) return true;
    if (normalizeProductId(t) === normalizeProductId(c)) return true;
    return false;
  };

  // Physically remove from extra (data/products.json)
  const initialExtraCount = extra.length;
  const newExtra = extra.filter((p) => !matchId(normTarget, p.id) && !matchId(id, p.id));
  const removedFromExtra = newExtra.length < initialExtraCount;
  const existsInBase = BASE_PRODUCTS.some((p) => matchId(normTarget, p.id) || matchId(id, p.id));
  const alreadyDeleted = deletedIds.has(normTarget);

  // If item wasn't in extra, wasn't in base, and already deleted, return true directly
  // Ensure normalized ID is added to deletedIds
  deletedIds.add(normTarget);
  const rawClean = String(id).trim().toLowerCase();
  if (rawClean) {
    deletedIds.add(rawClean);
  }

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
